import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { BusinessScenarioItem } from '@cms/types'
import { BusinessScenario } from './entities/business-scenario.entity'

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

@Injectable()
export class ScenarioService {
  constructor(
    @InjectRepository(BusinessScenario)
    private readonly scenarioRepo: Repository<BusinessScenario>
  ) {}

  private toItem(entity: BusinessScenario): BusinessScenarioItem {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    }
  }

  async list(): Promise<BusinessScenarioItem[]> {
    const rows = await this.scenarioRepo.find({ order: { createdAt: 'DESC' } })
    return rows.map(row => this.toItem(row))
  }

  /** 场景是否存在；供提交审核与登记写入复用 */
  async ensureExists(id: string): Promise<BusinessScenario> {
    const row = await this.scenarioRepo.findOne({ where: { id } })
    if (!row) {
      throw new NotFoundException('业务场景不存在或已被移除，请重新选择')
    }
    return row
  }

  async create(name: unknown, description: unknown): Promise<BusinessScenarioItem> {
    const cleanName = toText(name)
    if (!cleanName) {
      throw new BadRequestException('场景名称不能为空')
    }
    if (cleanName.length > 80) {
      throw new BadRequestException('场景名称不能超过 80 字')
    }
    const saved = await this.scenarioRepo.save(
      this.scenarioRepo.create({
        name: cleanName,
        description: toText(description).slice(0, 300)
      })
    )
    return this.toItem(saved)
  }

  async update(id: string, name: unknown, description: unknown): Promise<BusinessScenarioItem> {
    const row = await this.scenarioRepo.findOne({ where: { id } })
    if (!row) {
      throw new NotFoundException('业务场景不存在')
    }
    const cleanName = toText(name)
    if (!cleanName) {
      throw new BadRequestException('场景名称不能为空')
    }
    if (cleanName.length > 80) {
      throw new BadRequestException('场景名称不能超过 80 字')
    }
    // 名称可改；业务关联用 ID，改名不影响既有记录归属
    row.name = cleanName
    row.description = toText(description).slice(0, 300)
    const saved = await this.scenarioRepo.save(row)
    return this.toItem(saved)
  }
}
