import { Route, Routes } from 'react-router-dom'
import { HandbookPage } from './pages/HandbookPage.tsx'
import { ExpansionProvider } from './state/ExpansionContext.tsx'
import { PreferencesProvider } from './state/PreferencesContext.tsx'
import { GlobalStyle } from './styles/GlobalStyle.ts'

export function App() {
  return (
    <PreferencesProvider>
      <GlobalStyle />
      <ExpansionProvider>
        <Routes>
          <Route path="/" element={<HandbookPage />} />
          <Route path="/c/:slug" element={<HandbookPage />} />
          <Route path="/c/:slug/:sectionId" element={<HandbookPage />} />
          <Route path="*" element={<HandbookPage />} />
        </Routes>
      </ExpansionProvider>
    </PreferencesProvider>
  )
}
