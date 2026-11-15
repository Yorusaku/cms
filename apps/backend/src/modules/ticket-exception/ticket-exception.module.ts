import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Page } from '../page/entities/page.entity'
import { TicketExceptionAttachment } from './entities/ticket-exception-attachment.entity'
import { TicketException } from './entities/ticket-exception.entity'
import { PrivateStorageService } from './storage/private-storage.service'
import { ScenarioModule } from '../scenario/scenario.module'
import { NotificationModule } from '../notification/notification.module'
import { TicketExceptionEvent } from './entities/ticket-exception-event.entity'
import { TicketExceptionController } from './ticket-exception.controller'
import { TicketExceptionService } from './ticket-exception.service'

@Module({
  imports: [
    ScenarioModule,
    NotificationModule,
    TypeOrmModule.forFeature([
      TicketException,
      TicketExceptionEvent,
      TicketExceptionAttachment,
      Page
    ])
  ],
  controllers: [TicketExceptionController],
  providers: [TicketExceptionService, PrivateStorageService],
  exports: [TicketExceptionService]
})
export class TicketExceptionModule {}
