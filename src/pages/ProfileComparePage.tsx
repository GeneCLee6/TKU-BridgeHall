import { PageTitle } from '../components/ui.tsx'
import { Frame } from './Frame.tsx'
import { profileCompare as t } from './profileCompareStrings.ts'

/** 與母制度集比較 (/profiles/:id/compare, E1 e1-t15, AC-1.7) */
export function ProfileComparePage() {
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
    </Frame>
  )
}
