/**
 * 個人檔案、頭像與他人檔案頁的介面文字（E11 `e11-t03`、`e11-t04`）. Kept apart from `strings.ts`, which the home page
 * carries in full: only the lazy account page and the forum import this (CLAUDE.md rule 4, the
 * home page's JS budget).
 */
export const accountStrings = {
  avatar: '頭像',
  avatarHint: '兩站共用，淡江牌桌的名牌也會顯示。JPG、PNG 或 WebP；裁成正方形後上傳。',
  avatarChoose: '選擇圖片…',
  avatarRemove: '改回預設頭像',
  avatarSaved: '頭像已更新',
  avatarRemoved: '已改回預設頭像',
  avatarBadFormat: '頭像只能是 JPEG、PNG 或 WebP 圖片',
  avatarUnreadable: '讀不出這張圖片，請換一張',
  avatarTooLarge: (kb: number) => `裁好的圖片超過 ${kb} KB，請放大一點或換一張`,
  cropTitle: '裁切頭像',
  cropHint: '拖曳圖片調整位置，用滑桿縮放；圓圈內是別人看到的樣子。也可以用方向鍵移動、＋／－縮放。',
  cropFrame: '頭像裁切範圍',
  cropZoom: '縮放',
  saving: '儲存中…',

  // 我的帳號 › 個人檔案 (e11-t04)
  profile: '個人檔案',
  profileHint: '兩站共用：淡江牌桌的名牌、社員分頁和你的檔案頁都會顯示。每一項都可以留空。',
  displayName: '顯示名稱',
  displayNameHint: (max: number) => `社團怎麼稱呼你，例如真名；登入仍用帳號名稱。最多 ${max} 字`,
  level: '自評程度',
  levelNone: '不填',
  levels: { beginner: '初學者', college: '大專', open: '公開組', master: '橋士組' },
  system: '常用制度',
  systemHint: (max: number) => `例如「淡江制度」或「2/1」，最多 ${max} 字`,
  bio: '自我介紹',
  bioCount: (n: number, max: number) => `${n} / ${max} 字`,
  profileSaved: '個人檔案已儲存',
  myPage: '看我的檔案頁',

  // 我的帳號 › 通知 (F4 靜音)
  notices: '通知',
  noticesHint: '通知在淡江牌桌的鈴鐺裡。',
  muteAdopted: '不接收採用特約的發布通知',
  muteAdoptedHint:
    '你的隊伍或搭檔制度集採用的特約發布新版本時，預設會通知你。勾選後不再收到這一類；你關注的特約、你送審的特約、改到你們覆寫段落的通知與建議統一照常。',
  noticesSaved: '通知設定已儲存',

  // 他人檔案頁 /u/:id (e11-t04)
  memberTitle: '社員檔案',
  memberGone: '找不到這位社員',
  username: (name: string) => `帳號 ${name}`,
  noBio: '還沒有自我介紹。',
  teams: '隊伍',
  noTeams: '不在任何隊伍裡',
  captain: '隊長',
  archived: '已封存',
  pairs: '搭檔',
  noPairs: '沒有現役的搭檔',
  pairWith: (name: string) => `與 ${name}`,
  pairTeam: (name: string) => `（${name}）`,
  postsLater: '最近貼文在討論區上線後顯示。',
  editMine: '在「我的帳號」編輯個人檔案',
  you: '（你）',
} as const
