import '@fontsource-variable/noto-sans-tc'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App.tsx'
import { setUpApp } from './lib/pwa.ts'
import { readStoredPrefs } from './state/PreferencesContext.tsx'
import { loadStyle } from './styles/tokens.ts'

setUpApp()

const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )

// A reader who picked a style other than 「一般」 gets its tokens (one small chunk) before the
// first paint, so the page does not flash in 「一般」 first; without them (offline), 「一般」 it is
void loadStyle(readStoredPrefs().style)
  .catch(() => {})
  .finally(render)
