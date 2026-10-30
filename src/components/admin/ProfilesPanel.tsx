import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorText, type ProfileSummary } from '../../lib/api.ts'
import { profileEdit as t } from '../../pages/profileEditStrings.ts'
import { strings } from '../../strings.ts'
import { DataTable, TableScroll } from '../DataTable.tsx'
import { GitCompare, Pencil } from 'lucide-react'
import { Button, ErrorText, Muted, Panel, PanelTitle, Row } from '../ui.tsx'

/**
 * 制度集 on the admin page (e1-t14): every profile the editor may read, with links to edit it and
 * to compare it with its parent. Making and deleting profiles happen with the teams and
 * partnerships (the Worker makes their profiles).
 */
export function ProfilesPanel() {
  const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    api.book.profiles().then(
      (list) => current && setProfiles(list),
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [])

  return (
    <Panel aria-labelledby="admin-profiles">
      <PanelTitle id="admin-profiles">{t.adminTitle}</PanelTitle>
      <Muted>{t.adminIntro}</Muted>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {profiles &&
        (profiles.length ? (
          <TableScroll>
            <DataTable>
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th>{t.scope}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{strings.profiles.scopes[p.scope]}</td>
                    <td>
                      <Row>
                        <Button as={Link} to={`/profiles/${encodeURIComponent(p.id)}/edit`} aria-label={`${t.edit}：${p.name}`} $small $variant="ghost">
                          <Pencil size={16} aria-hidden />
                          {t.edit}
                        </Button>
                        <Button as={Link} to={`/profiles/${encodeURIComponent(p.id)}/compare`} aria-label={`${t.compare}：${p.name}`} $small $variant="ghost">
                          <GitCompare size={16} aria-hidden />
                          {t.compare}
                        </Button>
                      </Row>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </TableScroll>
        ) : (
          <Muted>{t.adminEmpty}</Muted>
        ))}
    </Panel>
  )
}
