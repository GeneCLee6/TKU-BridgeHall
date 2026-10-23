import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AccountPage } from './pages/AccountPage.tsx'
import { HandbookPage } from './pages/HandbookPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { AuthProvider } from './state/AuthContext.tsx'
import { ContentProvider } from './state/ContentContext.tsx'
import { ExpansionProvider } from './state/ExpansionContext.tsx'
import { PreferencesProvider } from './state/PreferencesContext.tsx'
import { GlobalStyle } from './styles/GlobalStyle.ts'
import { strings } from './strings.ts'

// Only editors need these, so readers never download them
const AdminPage = lazy(() => import('./pages/AdminPage.tsx').then((m) => ({ default: m.AdminPage })))
const EditorPage = lazy(() => import('./pages/EditorPage.tsx').then((m) => ({ default: m.EditorPage })))
const ImportPage = lazy(() => import('./pages/ImportPage.tsx').then((m) => ({ default: m.ImportPage })))

export function App() {
  return (
    <PreferencesProvider>
      <GlobalStyle />
      <AuthProvider>
        <ContentProvider>
          <ExpansionProvider>
            <Suspense fallback={<p role="status">{strings.loading}</p>}>
              <Routes>
                <Route path="/" element={<HandbookPage />} />
                <Route path="/c/:slug" element={<HandbookPage />} />
                <Route path="/c/:slug/:sectionId" element={<HandbookPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/new" element={<EditorPage />} />
                <Route path="/edit/:slug" element={<EditorPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="*" element={<HandbookPage />} />
              </Routes>
            </Suspense>
          </ExpansionProvider>
        </ContentProvider>
      </AuthProvider>
    </PreferencesProvider>
  )
}
