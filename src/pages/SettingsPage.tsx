import { useState } from 'react'
import styled from 'styled-components'
import { DisplaySettings } from '../components/DisplaySettings.tsx'
import { Button, Muted, Notice, PageTitle, Panel, PanelTitle } from '../components/ui.tsx'
import { analyticsOn, privacySignal } from '../lib/analytics.ts'
import { settingsStrings } from '../settingsStrings.ts'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import { Frame } from './Frame.tsx'

/**
 * 個人設定 (e9-t15): 風格, 版面, 明暗, 字體, 字級, 花色顏色 and 密度 for this reader, signed in or
 * not. Opened from 閱讀設定's 「更多顯示設定」; 我的帳號 has the same choices under 顯示. 隱私 has
 * 傳送匿名使用統計 (e10-t07) and says what the error reports (e10-t06) carry.
 */
export function SettingsPage() {
  return (
    <Frame title={settingsStrings.title}>
      <PageTitle>{settingsStrings.title}</PageTitle>
      <Muted>{settingsStrings.intro}</Muted>
      <Panel aria-label={settingsStrings.display}>
        <DisplaySettings />
      </Panel>
      <Privacy />
    </Frame>
  )
}

/** 傳送匿名使用統計: changed in the form, kept on 儲存 (2026-10-30) */
function Privacy() {
  const prefs = usePreferences()
  const t = settingsStrings
  const stored = analyticsOn(prefs.analytics)
  const [on, setOn] = useState(stored)
  const [notice, setNotice] = useState('')
  const dirty = on !== stored
  return (
    <Panel aria-labelledby="privacy">
      <PanelTitle id="privacy">{t.privacy}</PanelTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          prefs.update({ analytics: on })
          setNotice(strings.saved)
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => {
              setOn(e.target.checked)
              setNotice('')
            }}
            aria-describedby="analytics-hint"
          />{' '}
          {t.analytics}
        </label>
        <Muted id="analytics-hint">
          {t.analyticsHint}
          {prefs.analytics === undefined && privacySignal() && t.analyticsSignal}
          {t.analyticsClub}
        </Muted>
        <Actions>
          <Button type="submit" $variant="primary" disabled={!dirty}>
            {strings.save}
          </Button>
          <Button type="button" disabled={!dirty} onClick={() => setOn(stored)}>
            {t.discard}
          </Button>
          {dirty ? <Muted role="status">{t.unsavedPlain}</Muted> : notice && <Notice role="status">{notice}</Notice>}
        </Actions>
      </form>
      <Muted>{t.errors}</Muted>
    </Panel>
  )
}

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(2)};

  p {
    margin: 0;
  }
`
