import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiSuggestContentChangesRequest } from '@cms/types'

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }))
vi.mock('@/utils/http', () => ({ default: { post: postMock } }))

import { aiSuggestContentChanges } from '@/api/ai'

const request: AiSuggestContentChangesRequest = {
  instruction: '更新报名标题',
  targets: [{ componentId: 'form-1', type: 'BusinessForm', title: '原标题' }]
}

describe('AI 内容更新接口响应校验', () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  it('合法响应返回经过协议解析的数据', async () => {
    postMock.mockResolvedValue({
      code: 10000,
      message: 'success',
      data: {
        source: 'model',
        changes: [
          { componentId: 'form-1', type: 'BusinessForm', title: '新标题', extra: '不进入应用数据' }
        ],
        warnings: []
      }
    })
    const response = await aiSuggestContentChanges(request)
    expect(response.data.changes).toEqual([
      { componentId: 'form-1', type: 'BusinessForm', title: '新标题' }
    ])
    expect(postMock).toHaveBeenCalledWith('/atlas-cms/aiSuggestContentChanges', request, {
      showError: false
    })
  })

  it('无效的成功响应被拒绝，不将数字标题传给应用链路', async () => {
    postMock.mockResolvedValue({
      code: 10000,
      data: {
        source: 'model',
        changes: [{ componentId: 'form-1', type: 'BusinessForm', title: 123 }],
        warnings: []
      }
    })
    await expect(aiSuggestContentChanges(request)).rejects.toThrow(
      'AI 返回的内容格式不正确，请重新生成'
    )
  })

  it('业务失败响应不被误报为协议错误', async () => {
    const failure = { code: 50000, message: 'AI 服务不可用', data: null }
    postMock.mockResolvedValue(failure)
    expect(await aiSuggestContentChanges(request)).toBe(failure)
  })

  it('请求错误原样交给弹窗统一提示', async () => {
    const error = { message: 'AI 服务不可用', code: 50000 }
    postMock.mockRejectedValue(error)
    await expect(aiSuggestContentChanges(request)).rejects.toBe(error)
  })
})
