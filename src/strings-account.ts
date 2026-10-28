/**
 * 個人檔案與頭像的介面文字（E11 `e11-t03`）. Kept apart from `strings.ts`, which the home page
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
} as const
