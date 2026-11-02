// Text of 用 Google 登入 on the login page (TKU-BridgeTable e1-t31). Kept out of strings.ts so the
// home page's download does not grow.

export const googleStrings = {
  or: '或',
  signIn: '用 Google 登入',
  codeTitle: '輸入驗證碼',
  codeIntro: '這個帳號開了兩步驟登入，用 Google 登入也要輸入驗證 App 上的 6 位數驗證碼；手機不見的話，輸入一組備用碼。',
  code: '驗證碼',
  submit: '登入',
  usePassword: '改用帳號密碼登入',
  /** The Worker sends the browser back with a message code; these are the ones it can send here */
  errors: {
    googleOff: '社團還沒有開放 Google 登入。',
    googleFailed: 'Google 登入沒有完成，請再試一次。',
    googleNotLinked:
      '這個 Google 帳號還沒有綁定社團帳號：請用帳號密碼登入，到淡江牌桌的「我的帳號」綁定 Google；新社員請先申請加入。',
    googleTaken: '這個 Google 帳號已經綁定在另一個社團帳號。',
    awaitingApproval: '你的申請還在等管理員核准。',
    slowDown: '太頻繁了，請稍後再試。',
  } as Record<string, string>,
  error: 'Google 登入沒有完成，請再試一次。',
}
