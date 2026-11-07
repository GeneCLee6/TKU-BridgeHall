import { describe, expect, it } from 'vitest'
import { ApiError, errorText, LIMITS } from '../../src/lib/api.ts'

describe('errorText', () => {
  it('shows the server’s message', () => {
    expect(errorText(new ApiError('帳號或密碼錯誤', 401, 'badLogin'))).toBe('帳號或密碼錯誤')
  })

  it('sends an admin without 兩步驟登入 to 淡江牌桌, not to this site’s 我的帳號 (table, 社長 2026-11-02)', () => {
    const text = errorText(new ApiError('管理員要先開啟兩步驟登入才能使用管理功能，請到「我的帳號」設定', 403, 'adminTwoFactorRequired'))
    expect(text).toBe('管理員要先在 Overtrick 開啟兩步驟登入，才能使用管理與編輯功能。')
  })
})

describe('LIMITS', () => {
  it('asks for passwords of 12 characters, as the table does since e11-t29', () => {
    expect(LIMITS.passwordMin).toBe(12)
  })
})
