import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, isAbsolute, join, relative, resolve } from 'path'
import { resolveUploadDir } from '../../upload/storage/local-storage.adapter'

/** 服务端按文件头确认的 MIME，不信任客户端 multipart 声明 */
const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  {
    mime: 'image/jpeg',
    ext: '.jpg',
    test: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  },
  {
    mime: 'image/png',
    ext: '.png',
    test: b => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  }
]

/**
 * 私有图片存储：目录与公开上传目录同级，独立于 StorageAdapter。
 *
 * 本期只支持本地私有目录（不接入私有 S3）；不注册静态资源路由，
 * 文件只能经鉴权接口按附件 ID 读取。
 */
@Injectable()
export class PrivateStorageService implements OnModuleInit {
  private readonly logger = new Logger(PrivateStorageService.name)
  private readonly rootDir: string
  private readonly publicUploadDir: string

  constructor(configService: ConfigService) {
    this.publicUploadDir = resolve(resolveUploadDir(configService))
    this.rootDir = resolve(dirname(this.publicUploadDir), 'ticket-exception-private')
  }

  /** 启动时校验私有目录绝不位于公开上传目录内 */
  onModuleInit(): void {
    if (isAbsolute(this.publicUploadDir) && isAbsolute(this.rootDir)) {
      const rel = relative(this.publicUploadDir, this.rootDir)
      const insidePublic = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
      if (insidePublic) {
        throw new Error(
          `私有材料目录不能位于公开上传目录内：${this.rootDir} ⊂ ${this.publicUploadDir}`
        )
      }
    }
    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir, { recursive: true })
    }
    this.logger.log(`私有材料目录：${this.rootDir}`)
  }

  /** 按文件头识别类型并落盘；类型不符直接拒绝 */
  save(buffer: Buffer): { storageName: string; mimeType: string } {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('文件内容为空')
    }
    const signature = SIGNATURES.find(item => item.test(buffer))
    if (!signature) {
      throw new BadRequestException('文件内容不是 JPG/PNG 图片')
    }
    const storageName = `${randomUUID()}${signature.ext}`
    writeFileSync(join(this.rootDir, storageName), buffer)
    return { storageName, mimeType: signature.mime }
  }

  /** 按服务端文件名读取；拒绝任何路径穿越 */
  read(storageName: string): { buffer: Buffer; mimeType: string } {
    if (!/^[a-f0-9-]{36}\.(jpg|png)$/.test(storageName)) {
      throw new BadRequestException('附件标识不合法')
    }
    const filePath = resolve(this.rootDir, storageName)
    const rel = relative(this.rootDir, filePath)
    if (rel.startsWith('..') || !existsSync(filePath)) {
      throw new NotFoundException('附件文件不存在')
    }
    const ext = storageName.slice(-4) === '.png' ? 'image/png' : 'image/jpeg'
    return { buffer: readFileSync(filePath), mimeType: ext }
  }

  /** 删除单个文件（元数据写入失败时清理本次新增） */
  remove(storageName: string): { removed: boolean } {
    const filePath = resolve(this.rootDir, storageName)
    const rel = relative(this.rootDir, filePath)
    if (rel.startsWith('..') || !existsSync(filePath)) {
      return { removed: false }
    }
    try {
      unlinkSync(filePath)
      return { removed: true }
    } catch (error: unknown) {
      // 清理失败要可定位：内部日志保留原错误，但不掩盖业务错误
      this.logger.error(
        `私有材料清理失败 storage=${storageName} dir=${this.rootDir}`,
        error instanceof Error ? error.stack : String(error)
      )
      return { removed: false }
    }
  }
}
