import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import type { BusinessScenarioItem } from '@cms/types'
import { Roles } from '../../common/decorators/roles.decorator'
import { ScenarioService } from './scenario.service'

@Controller('atlas-cms')
export class ScenarioController {
  constructor(private readonly scenarioService: ScenarioService) {}

  @Get('getBusinessScenarioList')
  @Roles('admin', 'editor', 'viewer')
  async getBusinessScenarioList(): Promise<BusinessScenarioItem[]> {
    return this.scenarioService.list()
  }

  @Post('createBusinessScenario')
  @Roles('admin', 'editor')
  async createBusinessScenario(
    @Body() body: { name?: string; description?: string }
  ): Promise<BusinessScenarioItem> {
    return this.scenarioService.create(body?.name, body?.description)
  }

  @Put('updateBusinessScenario/:id')
  @Roles('admin', 'editor')
  async updateBusinessScenario(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string }
  ): Promise<BusinessScenarioItem> {
    return this.scenarioService.update(id, body?.name, body?.description)
  }
}
