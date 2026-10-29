import type { EbookLicense } from '../lib/ebooks.ts'

/**
 * Text for the e-book pages (E5 e5-t09～e5-t11, e5-t15). Only those pages import it (lazy), so it
 * stays out of the home page's JavaScript.
 */
export const ebookStrings = {
  listTitle: '電子書',
  listIntro: '社團的講義與學長寫的書，直接在站內閱讀。',
  empty: '還沒有電子書。',
  loadFailed: '載不到電子書',
  filesOff: '電子書的檔案空間還沒開通，請聯絡管理員。',
  byAuthors: (authors: string[]) => authors.join('、'),
  pagesCount: (n: number) => `${n} 頁`,
  year: (y: number) => `${y} 年`,
  noCover: '沒有封面',
  back: '← 電子書',
  library: '← 叢書',
  read: '閱讀',
  notFound: '找不到這本書。',
  fileMissing: '這本書的檔案現在讀不到（檔案空間未開通或已移除）。',

  licenses: {
    // The same words as the articles' (libraryStrings.licenses)
    own: '社團自撰',
    permitted: '經授權轉載',
    'members-only': '僅社員可看',
  } satisfies Record<EbookLicense, string>,
  // The whole site is for members (2026-10-29), so a license only says where the book comes from
  licenseHints: {
    own: '社員自己寫的',
    permitted: '已取得作者或出版者同意',
    'members-only': '舊的分類；全站已改成登入才能看，和其他兩種一樣',
  } satisfies Record<EbookLicense, string>,
  licenseLabel: '授權',

  // Upload and edit (reviewers)
  uploadTitle: '上傳電子書',
  uploadIntro: '只收 PDF，最大 50 MB；太大的請先壓縮。不放未取得授權的商業書籍，違反授權的書會由幹部下架。',
  fields: {
    file: 'PDF 檔',
    replaceFile: '換新的 PDF（選填）',
    title: '書名',
    authors: '作者（多位以「、」分隔）',
    series: '系列（例如：主打、防守、社課講義）',
    year: '年代（西元，選填）',
    pages: '頁數（選填）',
    cover: '封面圖片（選填）',
    license: '授權',
    licensePick: '請選擇',
  },
  problems: {
    title: '請填書名',
    authors: '請填作者',
    series: '請填系列',
    license: '請選擇授權',
    year: '年代要是 1900 到 2100 的西元年',
    pages: '頁數要是正整數',
    file: '請選擇 PDF 檔',
    type: '只能上傳 PDF',
    size: 'PDF 超過 50 MB，請先壓縮',
    coverType: '封面只能是 JPEG、PNG 或 WebP 圖片',
  } as Record<string, string>,
  uploading: (percent: number) => `上傳中… ${percent}%`,
  coverUploading: '上傳封面…',
  saving: '儲存中…',
  upload: '上傳',
  save: '儲存',
  saved: '已儲存。',
  uploaded: (title: string) => `已上傳《${title}》。`,
  edit: '編輯資料',
  cancel: '取消',
  remove: '下架並刪除',
  removeConfirm: (title: string) => `確定下架《${title}》？PDF 檔會一起刪除，無法復原。`,
  removed: '已下架。',

  // The bucket (e5-t15)
  usage: (used: string, max: string) => `檔案空間已用 ${used}／${max}`,
  usageWarn: '檔案空間已超過 8 GB，快到免費上限，請清理用不到的電子書或圖片。',

  // The reader (e5-t10)
  reader: {
    loading: '載入 PDF…',
    failed: '這個 PDF 打不開。',
    prev: '上一頁',
    next: '下一頁',
    page: '頁碼',
    of: (n: number) => `／ ${n}`,
    fullscreen: '全螢幕',
    exitFullscreen: '離開全螢幕',
    zoomIn: '放大',
    zoomOut: '縮小',
    label: (title: string) => `《${title}》閱讀器`,
  },
}
