// Text of 用 Google 登入 and 用 LINE 登入 on the login page (TKU-BridgeTable e1-t31, e1-t32). Kept
// out of strings.ts so the home page's download does not grow.

/** What the button and the code step say, per provider */
const provider = (name: 'Google' | 'LINE', signIn: string) => ({
  signIn,
  codeIntro: `這個帳號開了兩步驟登入，用 ${name} 登入也要輸入驗證 App 上的 6 位數驗證碼；手機不見的話，輸入一組備用碼。`,
  error: `${name} 登入沒有完成，請再試一次。`,
})

export const oauthStrings = {
  or: '或',
  codeTitle: '輸入驗證碼',
  code: '驗證碼',
  submit: '登入',
  usePassword: '改用帳號密碼登入',
  /** The button texts follow each brand's guidelines (Google's own Traditional Chinese wording) */
  google: provider('Google', '使用 Google 帳戶登入'),
  line: provider('LINE', '用 LINE 登入'),
  /** The Worker sends the browser back with a message code; these are the ones it can send here */
  errors: {
    googleOff: '社團還沒有開放 Google 登入。',
    googleFailed: 'Google 登入沒有完成，請再試一次。',
    googleNotLinked:
      '這個 Google 帳號還沒有綁定社團帳號：請用帳號密碼登入，到淡江牌桌的「我的帳號」綁定 Google；新社員請先申請加入。',
    googleTaken: '這個 Google 帳號已經綁定在另一個社團帳號。',
    lineOff: '社團還沒有開放 LINE 登入。',
    lineFailed: 'LINE 登入沒有完成，請再試一次。',
    lineNotLinked: '這個 LINE 帳號還沒有綁定社團帳號：請用帳號密碼登入，到淡江牌桌的「我的帳號」綁定 LINE；新社員請先申請加入。',
    lineTaken: '這個 LINE 帳號已經綁定在另一個社團帳號。',
    awaitingApproval: '你的申請還在等管理員核准。',
    slowDown: '太頻繁了，請稍後再試。',
  } as Record<string, string>,
}
