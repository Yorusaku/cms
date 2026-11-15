import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BusinessScenario } from './entities/business-scenario.entity'
import { ScenarioController } from './scenario.controller'
import { ScenarioService } from './scenario.service'

@Module({
  imports: [TypeOrmModule.forFeature([BusinessScenario])],
  controllers: [ScenarioController],
  providers: [ScenarioService],
  exports: [ScenarioService]
})
export class ScenarioModule {}
