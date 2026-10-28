import { DisplaySettings } from '../components/DisplaySettings.tsx'
import { Muted, PageTitle, Panel } from '../components/ui.tsx'
import { settingsStrings } from '../settingsStrings.ts'
import { Frame } from './Frame.tsx'

/**
 * 個人設定 (e9-t15): 風格, 版面, 明暗, 字體, 字級, 花色顏色 and 密度 for this reader, signed in or
 * not. Opened from 閱讀設定's 「更多顯示設定」; 我的帳號 has the same choices under 顯示.
 */
export function SettingsPage() {
  return (
    <Frame title={settingsStrings.title}>
      <PageTitle>{settingsStrings.title}</PageTitle>
      <Muted>{settingsStrings.intro}</Muted>
      <Panel aria-label={settingsStrings.display}>
        <DisplaySettings />
      </Panel>
    </Frame>
  )
}
