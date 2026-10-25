import type { Category } from '../types/convention.ts'

/**
 * The catalogue's groups as the site ships them, in display order. Editors can change them online
 * (the admin page); the site then shows the online list (lib/categories.ts), and these are what it
 * shows offline before it has ever seen that list, or when it was never edited.
 */
export const categories: Category[] = [
  { id: 'notrump', label: '無王開叫後續', description: '1NT、2NT 開叫之後的答叫與競叫', order: 0 },
  { id: 'suit-openings', label: '花色開叫後續', description: '花色開叫之後的答叫與再叫', order: 1 },
  { id: 'signals', label: '防守信號', description: '防守時的出牌與墊牌信號', order: 2 },
  { id: 'competitive', label: '競叫與防守', description: '敵方插叫或我方插叫時的約定', order: 3 },
  {
    id: 'system',
    label: '制度總覽（舊講義）',
    description: '2010 年講義《我們的制度》；與特約衝突時以特約為準',
    order: 4,
  },
]
