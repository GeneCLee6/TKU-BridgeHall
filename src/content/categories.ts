import type { Category } from '../types/convention.ts'

/** Sidebar groups, in display order. Add a CategoryId in types/convention.ts first. */
export const categories: Category[] = [
  { id: 'notrump', label: '無王開叫後續', description: '1NT、2NT 開叫之後的答叫與競叫' },
  { id: 'suit-openings', label: '花色開叫後續', description: '花色開叫之後的答叫與再叫' },
  { id: 'signals', label: '防守信號', description: '防守時的出牌與墊牌信號' },
  { id: 'competitive', label: '競叫與防守', description: '敵方插叫或我方插叫時的約定' },
]
