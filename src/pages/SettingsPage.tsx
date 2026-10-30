import { DisplaySettings } from '../components/DisplaySettings.tsx'
import { Muted, PageTitle, Panel, PanelTitle } from '../components/ui.tsx'
import { analyticsOn, privacySignal } from '../lib/analytics.ts'
import { settingsStrings } from '../settingsStrings.ts'
import { usePreferences } from '../state/PreferencesContext.tsx'
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

function Privacy() {
  const prefs = usePreferences()
  const t = settingsStrings
  return (
    <Panel aria-labelledby="privacy">
      <PanelTitle id="privacy">{t.privacy}</PanelTitle>
      <label>
        <input
          type="checkbox"
          checked={analyticsOn(prefs.analytics)}
          onChange={(e) => prefs.update({ analytics: e.target.checked })}
          aria-describedby="analytics-hint"
        />{' '}
        {t.analytics}
      </label>
      <Muted id="analytics-hint">
        {t.analyticsHint}
        {prefs.analytics === undefined && privacySignal() && ` ${t.analyticsSignal}`} {t.analyticsClub}
      </Muted>
      <Muted>{t.errors}</Muted>
    </Panel>
  )
}
