import { NotificationService } from '../src/modules/notification/notification.service'
import { Notification } from '../src/modules/notification/entities/notification.entity'
import { User } from '../src/modules/auth/entities/user.entity'

const input = {
  sourceEventId: 1,
  exceptionId: 2,
  type: 'supplement_requested',
  scenarioId: null,
  submitterUserId: 'original-user-id',
  submitterUsername: 'old-name'
}

const harness = () => {
  const users = { findOne: jest.fn().mockResolvedValue({ id: input.submitterUserId }) }
  const insert = jest.fn().mockResolvedValue({})
  const builder = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    execute: insert
  }
  const notifications = { insert, createQueryBuilder: () => builder }
  const manager = {
    getRepository: (entity: unknown) => (entity === User ? users : notifications)
  }
  const service = new NotificationService({} as never, users as never)
  return { service, users, insert, builder, manager }
}

describe('NotificationService 事务内提醒', () => {
  it('账号改名后仍优先按稳定用户 ID 找到接收人', async () => {
    const { service, manager, users, builder } = harness()
    await service.createForEventIn(manager as never, input)
    expect(users.findOne).toHaveBeenCalledWith({ where: { id: input.submitterUserId } })
    expect(builder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: input.submitterUserId
      })
    )
    expect(builder.onConflict).toHaveBeenCalledWith(
      '("source_event_id", "recipient_user_id") DO NOTHING'
    )
  })

  it('只有历史记录缺用户 ID 时才按用户名查找', async () => {
    const { service, manager, users } = harness()
    await service.createForEventIn(manager as never, { ...input, submitterUserId: null })
    expect(users.findOne).toHaveBeenCalledWith({ where: { username: input.submitterUsername } })
  })

  it('有 ID 的账号不存在时不回退给同名账号', async () => {
    const { service, manager, users, insert } = harness()
    users.findOne.mockResolvedValue(null)
    await service.createForEventIn(manager as never, input)
    expect(users.findOne).toHaveBeenCalledTimes(1)
    expect(insert).not.toHaveBeenCalled()
  })

  it('非去重错误必须传播，交给业务事务回滚', async () => {
    const { service, manager, insert } = harness()
    insert.mockRejectedValue(new Error('notification insert failed'))
    await expect(service.createForEventIn(manager as never, input)).rejects.toThrow(
      'notification insert failed'
    )
    expect(manager.getRepository(Notification)).toBeDefined()
  })
})
