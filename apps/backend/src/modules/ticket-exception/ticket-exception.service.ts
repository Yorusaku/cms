import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm'
import {
  TICKET_ATTACHMENT_MAX_COUNT,
  TICKET_ATTACHMENT_MAX_SIZE_BYTES,
  isScenarioUuid,
  readPageScenarioBinding,
  readTicketExceptionFormConfig,
  validateTicketExceptionFormConfig,
  validateTicketFormValues,
  type TicketExceptionAttachment,
  type TicketExceptionAttachmentUploadResult,
  type TicketExceptionDetail,
  type TicketExceptionWorkbenchSummary,
  type TicketExceptionEventItem,
  type TicketExceptionFormConfig,
  type TicketExceptionItem,
  type TicketExceptionListResult,
  type TicketFieldSnapshot
} from '@cms/types'
import type { IPageSchemaV2 } from '@cms/types'
import { Page } from '../page/entities/page.entity'
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy'
import { TicketException, type TicketExceptionStatus } from './entities/ticket-exception.entity'
import {
  TicketExceptionEvent,
  type TicketExceptionAction
} from './entities/ticket-exception-event.entity'
import { TicketExceptionAttachment as TicketExceptionAttachmentEntity } from './entities/ticket-exception-attachment.entity'
import { PrivateStorageService } from './storage/private-storage.service'
import { ScenarioService } from '../scenario/scenario.service'
import { NotificationService } from '../notification/notification.service'
import type {
  CreateTicketExceptionDto,
  GetTicketExceptionListDto,
  ProcessTicketExceptionDto,
  SupplementTicketExceptionDto
} from './dto/ticket-exception.dto'

type TicketFormDefinition = TicketExceptionFormConfig

/** 跨端共享的响应结构：这里只做再导出，避免 CMS/CRS 从后端私有文件取类型 */
export type {
  TicketExceptionAttachment,
  TicketExceptionAttachmentUploadResult,
  TicketExceptionWorkbenchSummary,
  TicketExceptionDetail,
  TicketExceptionEventItem,
  TicketExceptionItem,
  TicketExceptionListResult,
  TicketFieldSnapshot
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/** 固定业务字段：所有票据异常表单都有 */
const FIXED_FIELDS: TicketFieldSnapshot['fixedFields'] = [
  { key: 'ticketNo', label: '票据编号', type: 'text', required: true },
  { key: 'exceptionType', label: '异常类型', type: 'text', required: true },
  { key: 'description', label: '问题说明', type: 'text', required: true }
]

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

@Injectable()
export class TicketExceptionService {
  constructor(
    @InjectRepository(TicketException)
    private readonly ticketRepo: Repository<TicketException>,
    @InjectRepository(TicketExceptionEvent)
    private readonly eventRepo: Repository<TicketExceptionEvent>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(TicketExceptionAttachmentEntity)
    private readonly attachmentRepo: Repository<TicketExceptionAttachmentEntity>,
    private readonly privateStorage: PrivateStorageService,
    private readonly scenarioService: ScenarioService,
    private readonly notificationService: NotificationService
  ) {}

  /* ── 创建 ─────────────────────────────────────────────── */

  async create(
    dto: CreateTicketExceptionDto,
    user: AuthenticatedUser
  ): Promise<{ id: number; duplicated: boolean }> {
    // 先按幂等键查：同一提交人重试直接返回原记录，不重复写历史。
    // 这一步必须在发布快照校验之前——页面改版或下线后，重试仍应拿到原记录。
    const existing = await this.findExisting(dto.requestId, user.username)
    if (existing) {
      return { id: existing.id, duplicated: true }
    }

    const { page, component, definition, scenarioId } = await this.resolvePublishedForm(dto, user)

    const exceptionType = toText(dto.exceptionType)
    if (!definition.allowedExceptionTypes.includes(exceptionType)) {
      throw new BadRequestException(
        `异常类型不在允许范围内：${definition.allowedExceptionTypes.join('、')}`
      )
    }

    const extraFields = this.readExtraValues(dto.extraFields, definition)

    const snapshot: TicketFieldSnapshot = {
      businessCategory: definition.businessCategory,
      fixedFields: FIXED_FIELDS,
      extraFields: definition.extraFields
    }

    try {
      // 主记录与首条历史必须同事务：事件写失败时主记录也要回滚，
      // 否则会出现「有记录但无创建历史」的半截数据。
      const saved = await this.dataSource.transaction(async manager => {
        const entity = manager.getRepository(TicketException).create({
          requestId: dto.requestId,
          // 场景归属来自服务端发布快照，创建请求不接受客户端指定
          businessScenarioId: scenarioId,
          ticketNo: toText(dto.ticketNo),
          businessCategory: definition.businessCategory,
          exceptionType,
          description: toText(dto.description),
          extraFields: Object.keys(extraFields).length > 0 ? extraFields : null,
          fieldSnapshot: snapshot,
          status: 'pending',
          submitterUserId: user.id ?? null,
          submitterUsername: user.username,
          pageId: page.id,
          componentId: component.id,
          publishedVersionId: dto.publishedVersionId
        })
        const created = await manager.getRepository(TicketException).save(entity)

        await manager.getRepository(TicketExceptionEvent).save(
          manager.getRepository(TicketExceptionEvent).create({
            exceptionId: created.id,
            action: 'created',
            operatorUserId: user.id ?? null,
            operatorUsername: user.username,
            note: dto.description,
            payload: null
          })
        )

        return created
      })

      return { id: saved.id, duplicated: false }
    } catch (error: unknown) {
      // 并发重复提交撞唯一索引：事务已回滚，读回同一提交人的已有记录。
      // 只处理这一个约束，其他数据库错误照常抛出。
      if (this.isDuplicateRequestError(error)) {
        const duplicated = await this.findExisting(dto.requestId, user.username)
        if (duplicated) {
          return { id: duplicated.id, duplicated: true }
        }
      }
      throw error
    }
  }

  private async findExisting(requestId: string, username: string): Promise<TicketException | null> {
    return this.ticketRepo.findOne({
      where: { requestId, submitterUsername: username }
    })
  }

  /** 只匹配 (request_id, submitter_username) 唯一索引，其他错误不吞 */
  private isDuplicateRequestError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false
    }
    const driverError = error.driverError as { code?: string; constraint?: string } | undefined
    if (driverError?.code !== '23505') {
      return false
    }
    if (!driverError.constraint) {
      // 没有约束名时退化为按消息判断，仍以唯一索引名为准
      return /uq_ticket_exceptions_request_submitter/.test(error.message)
    }
    return driverError.constraint === 'uq_ticket_exceptions_request_submitter'
  }

  /**
   * 从「当前有效的发布快照」读取表单与字段定义，不信任客户端上传的定义。
   *
   * 判定口径与公开页一致：页面未删除、isAbled=1、存在发布快照且版本匹配。
   * 不要求 status === published —— 已发布页面保存草稿后 status 会变，
   * 但旧快照仍在线，异常登记照常可用。
   */
  private async resolvePublishedForm(
    dto: CreateTicketExceptionDto,
    user: AuthenticatedUser
  ): Promise<{
    page: Page
    component: { id: string; type: string; props: Record<string, unknown> }
    definition: TicketFormDefinition
    scenarioId: string | null
  }> {
    const page = await this.pageRepo.findOne({
      where: { id: dto.pageId, isDeleted: false }
    })
    if (!page) {
      throw new NotFoundException('页面不存在，请刷新后重新提交')
    }
    if (page.isAbled !== 1 || !page.publishedSchema) {
      throw new ConflictException('页面已下线或未发布，请刷新后重新提交')
    }
    if (!page.publishedVersionId || page.publishedVersionId !== dto.publishedVersionId) {
      throw new ConflictException('页面已更新发布版本，请刷新后重新提交')
    }

    const schema = page.publishedSchema as unknown as IPageSchemaV2 | null
    const component = schema?.componentMap?.[dto.componentId]
    if (!component) {
      throw new ConflictException('表单组件不存在或已移除，请刷新后重新提交')
    }
    if (component.type !== 'TicketExceptionForm') {
      throw new BadRequestException('该组件不是票据异常登记表单')
    }
    // 只认发布快照里从根节点可达的组件：孤立的 componentMap 条目不算页面内容
    if (!this.isReachable(schema, dto.componentId)) {
      throw new ConflictException('表单组件未挂载到页面，请刷新后重新提交')
    }

    const props = isPlainObject(component.props) ? component.props : {}
    const definition = this.readFormDefinition(props)

    // 场景绑定从发布快照读取（业务关联用 ID，改名不影响归属）；
    // 旧快照未绑定时仍允许登记，新记录保持未归属
    let scenarioId: string | null = null
    const binding = readPageScenarioBinding({ pageConfig: schema.pageConfig })
    if (binding) {
      if (!isScenarioUuid(binding)) {
        throw new ConflictException('页面绑定的业务场景无效，请重新发布')
      }
      // 登记时验证场景存在，伪造的绑定被拒绝
      await this.scenarioService.ensureExists(binding)
      scenarioId = binding
    }

    if (!user || !user.username) {
      throw new ForbiddenException('请先登录后再提交')
    }

    return {
      page,
      component: {
        id: String(component.id ?? dto.componentId),
        type: component.type,
        props
      },
      definition,
      scenarioId
    }
  }

  /** 从根节点遍历，判断组件是否真的挂在页面上 */
  private isReachable(schema: IPageSchemaV2 | null, componentId: string): boolean {
    const componentMap = schema?.componentMap ?? {}
    const visited = new Set<string>()
    const queue = Array.isArray(schema?.rootIds) ? [...schema.rootIds] : []

    while (queue.length > 0) {
      const id = queue.shift() as string
      if (visited.has(id)) {
        continue
      }
      visited.add(id)
      if (id === componentId) {
        return true
      }
      const children = componentMap[id]?.children
      if (Array.isArray(children)) {
        queue.push(...children)
      }
    }
    return false
  }

  /**
   * 读取表单配置：与编辑器、发布检查共用同一份规则（`@cms/types`）。
   * 配置非法时明确报错，不静默丢弃字段或替换类型。
   */
  private readFormDefinition(props: Record<string, unknown>): TicketFormDefinition {
    const config = readTicketExceptionFormConfig(props)
    const issues = validateTicketExceptionFormConfig(config)
    if (issues.length > 0) {
      throw new BadRequestException(`表单配置不完整，暂时无法登记：${issues.join('；')}`)
    }
    return config
  }

  /**
   * 读取并校验扩展字段值。
   *
   * 未知 key、类型不符、下拉越界、日期格式错误都直接拒绝；
   * `partial=true` 用于「补充」：只校验本次带来的字段，空值视为未提供，
   * 不会用空字符串清掉已有内容。
   */
  private readExtraValues(
    input: Record<string, unknown> | undefined,
    definition: TicketFormDefinition,
    options: { partial?: boolean } = {}
  ): Record<string, string> {
    const values = isPlainObject(input) ? input : {}
    const issues = validateTicketFormValues(definition, values, options)
    if (issues.length > 0) {
      throw new BadRequestException(issues.join('；'))
    }

    const result: Record<string, string> = {}
    definition.extraFields.forEach(field => {
      const raw = values[field.key]
      if (typeof raw !== 'string') {
        return
      }
      const text = raw.trim()
      if (text) {
        result[field.key] = text
      }
    })
    return result
  }

  /* ── 查询 ─────────────────────────────────────────────── */

  async getList(
    dto: GetTicketExceptionListDto,
    user?: AuthenticatedUser
  ): Promise<TicketExceptionListResult> {
    // 场景筛选与「仅未归属」语义互斥：交集为空集，直接报错避免误解
    if (dto.scenarioId && dto.unassignedOnly) {
      throw new BadRequestException('scenarioId 与 unassignedOnly 不能同时提供')
    }
    const pageNum = dto.pageNum && dto.pageNum > 0 ? dto.pageNum : 1
    const pageSize = Math.min(
      dto.pageSize && dto.pageSize > 0 ? dto.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )

    const query = this.ticketRepo.createQueryBuilder('ticket')
    if (dto.ticketNo) {
      query.andWhere('ticket.ticket_no ILIKE :ticketNo', {
        ticketNo: `%${dto.ticketNo}%`
      })
    }
    if (dto.exceptionType) {
      query.andWhere('ticket.exception_type = :exceptionType', {
        exceptionType: dto.exceptionType
      })
    }
    if (dto.status) {
      query.andWhere('ticket.status = :status', { status: dto.status })
    }
    // 「我的」过滤只认鉴权身份，客户端传的 submitter 不能冒充别人
    const submitter = dto.onlyMine ? user?.username : dto.submitter
    if (submitter) {
      query.andWhere('ticket.submitter_username = :submitter', {
        submitter
      })
    }
    // 场景筛选是业务查询条件，不新增场景级访问授权
    if (dto.scenarioId) {
      query.andWhere('ticket.business_scenario_id = :scenarioId', {
        scenarioId: dto.scenarioId
      })
    }
    if (dto.pageId) {
      query.andWhere('ticket.page_id = :pageId', { pageId: dto.pageId })
    }
    if (dto.unassignedOnly) {
      query.andWhere('ticket.business_scenario_id IS NULL')
    }
    // 场景筛选是业务查询条件，不新增场景级访问授权
    if (dto.scenarioId) {
      query.andWhere('ticket.business_scenario_id = :scenarioId', {
        scenarioId: dto.scenarioId
      })
    }
    if (dto.pageId) {
      query.andWhere('ticket.page_id = :pageId', { pageId: dto.pageId })
    }
    if (dto.unassignedOnly) {
      query.andWhere('ticket.business_scenario_id IS NULL')
    }

    query
      .orderBy('ticket.created_at', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)

    const [rows, total] = await query.getManyAndCount()

    return {
      items: rows.map(row => this.toItem(row)),
      total,
      pageNum,
      pageSize
    }
  }

  async getDetail(id: number, user: AuthenticatedUser): Promise<TicketExceptionDetail> {
    const record = await this.ticketRepo.findOne({ where: { id } })
    if (!record) {
      throw new NotFoundException('异常记录不存在')
    }
    // viewer 也能看列表与详情；补充权限在 supplement 中单独校验
    if (!user?.username) {
      throw new ForbiddenException('请先登录')
    }

    const events = await this.eventRepo.find({
      where: { exceptionId: id },
      order: { createdAt: 'ASC', id: 'ASC' }
    })
    const attachments = await this.attachmentRepo.find({
      where: { exceptionId: id },
      order: { createdAt: 'ASC', id: 'ASC' }
    })

    return {
      ...this.toItem(record),
      extraFields: isPlainObject(record.extraFields) ? record.extraFields : {},
      fieldSnapshot: (record.fieldSnapshot as TicketFieldSnapshot) ?? {
        businessCategory: record.businessCategory,
        fixedFields: FIXED_FIELDS,
        extraFields: []
      },
      pageId: record.pageId,
      componentId: record.componentId,
      publishedVersionId: record.publishedVersionId,
      events: events.map(event => ({
        id: event.id,
        action: event.action,
        operatorUsername: event.operatorUsername,
        note: event.note,
        payload: isPlainObject(event.payload) ? event.payload : null,
        createdAt: event.createdAt.toISOString()
      })),
      attachments: attachments.map(item => this.toAttachmentItem(item))
    }
  }

  /**
   * 工作台摘要：待办来自业务状态，不维护另一套完成状态。
   * 「我的」身份由鉴权解析；场景筛选沿用同一条件（业务查询条件，不做场景级授权）。
   */
  async getWorkbenchSummary(
    dto: { scenarioId?: string },
    user?: AuthenticatedUser
  ): Promise<TicketExceptionWorkbenchSummary> {
    const scenarioWhere = dto.scenarioId ? { businessScenarioId: dto.scenarioId } : {}
    const canProcess = Boolean(user) && ['admin', 'editor'].includes(user?.role ?? '')

    const pendingCount = canProcess
      ? await this.ticketRepo.count({
          where: { status: 'pending', ...scenarioWhere }
        })
      : null
    const mineNeedsSupplementCount = user
      ? await this.ticketRepo.count({
          where: {
            status: 'needs_supplement',
            submitterUsername: user.username,
            ...scenarioWhere
          }
        })
      : 0
    const mineSubmittedCount = user
      ? await this.ticketRepo.count({
          where: { submitterUsername: user.username, ...scenarioWhere }
        })
      : 0

    return {
      pendingCount,
      mineNeedsSupplementCount,
      mineSubmittedCount,
      unreadCount: user ? await this.notificationService.unreadCount(user.id, dto.scenarioId) : 0
    }
  }

  /* ── 私有图片材料 ─────────────────────────────────────── */

  private toAttachmentItem(item: TicketExceptionAttachmentEntity): TicketExceptionAttachment {
    return {
      id: item.id,
      originalName: item.originalName,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      uploadedByUsername: item.uploadedByUsername,
      createdAt: item.createdAt.toISOString()
    }
  }

  /** 附件列表（公开摘要，不含磁盘路径） */
  async listAttachments(exceptionId: number): Promise<TicketExceptionAttachment[]> {
    const rows = await this.attachmentRepo.find({
      where: { exceptionId },
      order: { createdAt: 'ASC', id: 'ASC' }
    })
    return rows.map(item => this.toAttachmentItem(item))
  }

  /**
   * 上传材料图片。
   *
   * multipart 层先挡大小与扩展名；这里再按文件头确认真实类型，
   * 文件落盘后在事务内锁定记录重查状态 / 提交人 / 数量，元数据与
   * 材料新增事件一起写入；事务失败删除本次文件，不影响旧材料。
   */
  async uploadAttachment(
    exceptionId: number,
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser
  ): Promise<TicketExceptionAttachmentUploadResult> {
    if (!file) {
      throw new BadRequestException('未提供文件')
    }
    if (file.size <= 0) {
      throw new BadRequestException('文件内容为空')
    }
    if (file.size > TICKET_ATTACHMENT_MAX_SIZE_BYTES) {
      throw new BadRequestException('图片大小不能超过 5MB')
    }
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      throw new BadRequestException('仅支持 JPG/JPEG/PNG 格式')
    }

    // 文件写入（服务端按文件头确认 MIME，不信任 multipart 声明）
    const stored = this.privateStorage.save(file.buffer)

    try {
      const attachmentId = await this.dataSource.transaction(async manager => {
        const record = await manager
          .getRepository(TicketException)
          .createQueryBuilder('ticket')
          .setLock('pessimistic_write')
          .where('ticket.id = :id', { id: exceptionId })
          .getOne()
        if (!record) {
          throw new NotFoundException('异常记录不存在')
        }
        // 上传仅限原提交人，且记录未解决（与状态机一致）
        if (record.submitterUsername !== user.username) {
          throw new ForbiddenException('只有原提交人可以上传材料')
        }
        if (record.status === 'resolved') {
          throw new ConflictException('该记录已解决，不能继续上传材料')
        }
        const count = await manager
          .getRepository(TicketExceptionAttachmentEntity)
          .count({ where: { exceptionId } })
        if (count >= TICKET_ATTACHMENT_MAX_COUNT) {
          throw new BadRequestException(`材料最多 ${TICKET_ATTACHMENT_MAX_COUNT} 张`)
        }

        const saved = await manager.getRepository(TicketExceptionAttachmentEntity).save(
          manager.getRepository(TicketExceptionAttachmentEntity).create({
            exceptionId,
            storageName: stored.storageName,
            // multer 按 latin1 解码 multipart filename，中文需要转回 UTF-8
            originalName: Buffer.from(file.originalname, 'latin1').toString('utf8').slice(0, 200),
            mimeType: stored.mimeType,
            sizeBytes: file.size,
            uploadedByUserId: user.id ?? null,
            uploadedByUsername: user.username
          })
        )

        // 材料新增只记录历史，不改变异常状态
        await manager.getRepository(TicketExceptionEvent).save(
          manager.getRepository(TicketExceptionEvent).create({
            exceptionId,
            action: 'material_added',
            operatorUserId: user.id ?? null,
            operatorUsername: user.username,
            note: file.originalname.slice(0, 200),
            payload: {
              attachmentId: saved.id,
              mimeType: stored.mimeType,
              sizeBytes: file.size
            }
          })
        )

        return saved.id
      })

      const attachments = await this.listAttachments(exceptionId)
      const created = attachments.find(item => item.id === attachmentId)
      if (!created) {
        throw new Error('attachment metadata missing after upload')
      }
      return { attachment: created, attachments }
    } catch (error: unknown) {
      // 元数据或事件写入失败：清理本次新增文件；清理失败由存储服务记录内部日志
      this.privateStorage.remove(stored.storageName)
      throw error
    }
  }

  /** 读取附件文件：按附件 ID 鉴权后从私有目录取 */
  async readAttachment(
    attachmentId: number
  ): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    const item = await this.attachmentRepo.findOne({
      where: { id: attachmentId }
    })
    if (!item) {
      throw new NotFoundException('附件不存在')
    }
    const file = this.privateStorage.read(item.storageName)
    return {
      buffer: file.buffer,
      mimeType: file.mimeType,
      originalName: item.originalName
    }
  }

  /* ── 处理 ─────────────────────────────────────────────── */

  /** 要求补充 / 解决：admin、editor，且仅 pending 状态可处理 */
  async process(
    dto: ProcessTicketExceptionDto,
    user: AuthenticatedUser
  ): Promise<TicketExceptionDetail> {
    await this.dataSource.transaction(async manager => {
      const record = await this.lockRecord(manager, dto.id)

      if (record.status !== 'pending') {
        throw new ConflictException(
          record.status === 'needs_supplement'
            ? '等待提交人补充后才能继续处理'
            : '该记录已解决，本期不支持重新打开'
        )
      }

      const nextStatus: TicketExceptionStatus =
        dto.action === 'request_supplement' ? 'needs_supplement' : 'resolved'
      const action: TicketExceptionAction =
        dto.action === 'request_supplement' ? 'supplement_requested' : 'resolved'

      record.status = nextStatus
      await manager.getRepository(TicketException).save(record)

      const savedEvent = await manager.getRepository(TicketExceptionEvent).save(
        manager.getRepository(TicketExceptionEvent).create({
          exceptionId: record.id,
          action,
          operatorUserId: user.id ?? null,
          operatorUsername: user.username,
          note: dto.note.trim(),
          payload: null
        })
      )

      // 要求补充 / 解决成功后提醒原提交人；与状态、事件同一事务
      await this.notificationService.createForEventIn(manager, {
        sourceEventId: savedEvent.id,
        exceptionId: record.id,
        type: action,
        scenarioId: record.businessScenarioId,
        submitterUserId: record.submitterUserId,
        submitterUsername: record.submitterUsername
      })
    })

    return this.getDetail(dto.id, user)
  }

  /** 提交补充：仅原提交人、仅 needs_supplement；补充内容进历史，不覆盖原提交 */
  async supplement(
    dto: SupplementTicketExceptionDto,
    user: AuthenticatedUser
  ): Promise<TicketExceptionDetail> {
    await this.dataSource.transaction(async manager => {
      const record = await this.lockRecord(manager, dto.id)

      if (record.submitterUsername !== user.username) {
        throw new ForbiddenException('只有原提交人可以补充该记录')
      }
      if (record.status === 'resolved') {
        throw new ConflictException('该记录已解决，不能补充')
      }
      if (record.status !== 'needs_supplement') {
        throw new ConflictException('该记录当前不需要补充')
      }

      const snapshot = record.fieldSnapshot as TicketFieldSnapshot | null
      const definition: TicketFormDefinition = {
        businessCategory: snapshot?.businessCategory ?? record.businessCategory,
        allowedExceptionTypes: [],
        extraFields: snapshot?.extraFields ?? []
      }
      const extraValues = this.readExtraValues(dto.extraFields, definition, {
        partial: true
      })

      // 增量合并：只更新本次提交的字段，保留原值
      if (Object.keys(extraValues).length > 0) {
        record.extraFields = {
          ...(isPlainObject(record.extraFields) ? record.extraFields : {}),
          ...extraValues
        }
      }
      record.status = 'pending'
      await manager.getRepository(TicketException).save(record)

      await manager.getRepository(TicketExceptionEvent).save(
        manager.getRepository(TicketExceptionEvent).create({
          exceptionId: record.id,
          action: 'supplemented',
          operatorUserId: user.id ?? null,
          operatorUsername: user.username,
          note: dto.note.trim(),
          payload: Object.keys(extraValues).length > 0 ? extraValues : null
        })
      )
    })

    return this.getDetail(dto.id, user)
  }

  private async lockRecord(manager: EntityManager, id: number): Promise<TicketException> {
    const record = await manager
      .getRepository(TicketException)
      .createQueryBuilder('ticket')
      .setLock('pessimistic_write')
      .where('ticket.id = :id', { id })
      .getOne()
    if (!record) {
      throw new NotFoundException('异常记录不存在')
    }
    return record
  }

  private toItem(record: TicketException): TicketExceptionItem {
    return {
      id: record.id,
      businessScenarioId: record.businessScenarioId ?? null,
      ticketNo: record.ticketNo,
      businessCategory: record.businessCategory,
      exceptionType: record.exceptionType,
      description: record.description,
      status: record.status,
      submitterUsername: record.submitterUsername,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    }
  }
}
