import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { UpdatePrompt } from './components/UpdatePrompt.tsx'
import { HandbookShell } from './pages/HandbookShell.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { AuthProvider } from './state/AuthContext.tsx'
import { ContentProvider } from './state/ContentContext.tsx'
import { ExpansionProvider } from './state/ExpansionContext.tsx'
import { PreferencesProvider } from './state/PreferencesContext.tsx'
import { ProfiledContent, ProfileProvider } from './state/ProfileContext.tsx'
import { GlobalStyle } from './styles/GlobalStyle.ts'
import { strings } from './strings.ts'

// The reading pages with convention content; the home page stays free of the card code (e9-t04)
const ConventionPage = lazy(() => import('./pages/ConventionPage.tsx').then((m) => ({ default: m.ConventionPage })))
const BookPage = lazy(() => import('./pages/BookPage.tsx').then((m) => ({ default: m.BookPage })))
// Only editors need these, so readers never download them
const AdminPage = lazy(() => import('./pages/AdminPage.tsx').then((m) => ({ default: m.AdminPage })))
const EditorPage = lazy(() => import('./pages/EditorPage.tsx').then((m) => ({ default: m.EditorPage })))
const ImportPage = lazy(() => import('./pages/ImportPage.tsx').then((m) => ({ default: m.ImportPage })))
const TableReportPage = lazy(() => import('./pages/TableReportPage.tsx').then((m) => ({ default: m.TableReportPage })))
// Kept out of the first download too, which has a size budget (scripts/check-budget.mjs)
const LoginPage = lazy(() => import('./pages/LoginPage.tsx').then((m) => ({ default: m.LoginPage })))
const AccountPage = lazy(() => import('./pages/AccountPage.tsx').then((m) => ({ default: m.AccountPage })))

// The reading pages read the reader's system profile; the editor and the admin page keep the club's content
const handbook = (
  <ProfiledContent>
    <HandbookShell />
  </ProfiledContent>
)

export function App() {
  return (
    <PreferencesProvider>
      <GlobalStyle />
      <UpdatePrompt />
      <AuthProvider>
        <ContentProvider>
          <ProfileProvider>
            <ExpansionProvider>
              <Suspense fallback={<p role="status">{strings.loading}</p>}>
                <Routes>
                  <Route element={handbook}>
                    <Route index element={<HomePage />} />
                    <Route path="/book" element={<BookPage />} />
                    <Route path="/c/:slug" element={<ConventionPage />} />
                    <Route path="/c/:slug/:sectionId" element={<ConventionPage />} />
                    <Route path="*" element={<HomePage notFound />} />
                  </Route>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/new" element={<EditorPage />} />
                  <Route path="/edit/:slug" element={<EditorPage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/integrations/table" element={<TableReportPage />} />
                </Routes>
              </Suspense>
            </ExpansionProvider>
          </ProfileProvider>
        </ContentProvider>
      </AuthProvider>
    </PreferencesProvider>
  )
}
