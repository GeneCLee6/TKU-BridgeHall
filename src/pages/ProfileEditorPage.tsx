import { PageTitle } from '../components/ui.tsx'
import { Frame } from './Frame.tsx'
import { profileEdit as t } from './profileEditStrings.ts'

/** 編輯制度集 (/profiles/:id/edit, E1 e1-t14) */
export function ProfileEditorPage() {
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
    </Frame>
  )
}
