import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { UpdatePrompt } from './components/UpdatePrompt.tsx'
import { HandbookShell } from './pages/HandbookShell.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { AuthProvider, useAuth } from './state/AuthContext.tsx'
import { ContentProvider } from './state/ContentContext.tsx'
import { ExpansionProvider } from './state/ExpansionContext.tsx'
import { PreferencesProvider } from './state/PreferencesContext.tsx'
import { ProfiledContent, ProfileProvider } from './state/ProfileContext.tsx'
import { GlobalStyle } from './styles/GlobalStyle.ts'
import { strings } from './strings.ts'

// The reading pages with convention content; the home page stays free of the card code (e9-t04)
const ConventionPage = lazy(() => import('./pages/ConventionPage.tsx').then((m) => ({ default: m.ConventionPage })))
const BookPage = lazy(() => import('./pages/BookPage.tsx').then((m) => ({ default: m.BookPage })))
// 叢書 (E5 e5-t05): the shelves, or one article
const Library = lazy(() => import('./pages/LibraryPage.tsx').then((m) => ({ default: m.Library })))
// Only editors need these, so readers never download them
const AdminPage = lazy(() => import('./pages/AdminPage.tsx').then((m) => ({ default: m.AdminPage })))
const EditorPage = lazy(() => import('./pages/EditorPage.tsx').then((m) => ({ default: m.EditorPage })))
// 審核 (e8-t04)
const ReviewPage = lazy(() => import('./pages/ReviewPage.tsx').then((m) => ({ default: m.ReviewPage })))
const ImportPage = lazy(() => import('./pages/ImportPage.tsx').then((m) => ({ default: m.ImportPage })))
const TableReportPage = lazy(() => import('./pages/TableReportPage.tsx').then((m) => ({ default: m.TableReportPage })))
// System profiles: editing (e1-t14) and comparing with the parent (e1-t15)
const ProfileEditorPage = lazy(() =>
  import('./pages/ProfileEditorPage.tsx').then((m) => ({ default: m.ProfileEditorPage })),
)
const ProfileComparePage = lazy(() =>
  import('./pages/ProfileComparePage.tsx').then((m) => ({ default: m.ProfileComparePage })),
)
// Teams and partnerships (e2-t05, e2-t06)
const TeamsPage = lazy(() => import('./pages/TeamsPage.tsx').then((m) => ({ default: m.TeamsPage })))
const TeamPage = lazy(() => import('./pages/TeamsPage.tsx').then((m) => ({ default: m.TeamPage })))
const PairPage = lazy(() => import('./pages/PairPage.tsx').then((m) => ({ default: m.PairPage })))
// 練習 (E6): the questions and the code that makes them load only here
const PracticePage = lazy(() => import('./pages/PracticePage.tsx').then((m) => ({ default: m.PracticePage })))
const PracticeScoresPage = lazy(() =>
  import('./pages/PracticeScoresPage.tsx').then((m) => ({ default: m.PracticeScoresPage })),
)
const PracticeFixesPage = lazy(() => import('./pages/PracticeFixesPage.tsx').then((m) => ({ default: m.PracticeFixesPage })))
// 學習路徑 (E4 e4-t09, e4-t12)
const learn = () => import('./pages/LearnPages.tsx')
const LearnIndexPage = lazy(() => learn().then((m) => ({ default: m.LearnIndexPage })))
const PathPage = lazy(() => learn().then((m) => ({ default: m.PathPage })))
const LessonPage = lazy(() => learn().then((m) => ({ default: m.LessonPage })))
const LearnEditorPage = lazy(() => import('./pages/LearnEditorPage.tsx').then((m) => ({ default: m.LearnEditorPage })))
// A member's profile page (e11-t04)
const MemberPage = lazy(() => import('./pages/MemberPage.tsx').then((m) => ({ default: m.MemberPage })))
// Kept out of the first download too, which has a size budget (scripts/check-budget.mjs)
const CardPage = lazy(() => import('./pages/CardPage.tsx').then((m) => ({ default: m.CardPage })))
const CardSnapshotPage = lazy(() =>
  import('./pages/CardSnapshotPage.tsx').then((m) => ({ default: m.CardSnapshotPage })),
)
const TeamCardsPage = lazy(() => import('./pages/TeamCardsPage.tsx').then((m) => ({ default: m.TeamCardsPage })))
const LoginPage = lazy(() => import('./pages/LoginPage.tsx').then((m) => ({ default: m.LoginPage })))
const AccountPage = lazy(() => import('./pages/AccountPage.tsx').then((m) => ({ default: m.AccountPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })))
const EbooksPage = lazy(() => import('./pages/EbookPages.tsx').then((m) => ({ default: m.EbooksPage })))
const EbookPage = lazy(() => import('./pages/EbookPages.tsx').then((m) => ({ default: m.EbookPage })))
// 名詞解釋 (e4-t05, e4-t07)
const GlossaryPage = lazy(() => import('./glossary/GlossaryPage.tsx').then((m) => ({ default: m.GlossaryPage })))
const GlossaryEditorPage = lazy(() =>
  import('./glossary/GlossaryEditorPage.tsx').then((m) => ({ default: m.GlossaryEditorPage })),
)

// The reading pages read the reader's system profile; the editor and the admin page keep the club's content
const handbook = (
  <ProfiledContent>
    <HandbookShell />
  </ProfiledContent>
)

const loading = <p role="status">{strings.loading}</p>

/**
 * The whole site is for signed-in members (2026-10-29): a signed-out visitor only gets the login
 * page, which brings them back here afterwards (`?next=`). The content and the reader's profile
 * load only after signing in, since the Worker answers them only to members.
 */
function SignedIn() {
  const { user } = useAuth()
  const { pathname, search } = useLocation()
  if (user === undefined) return loading
  if (!user) {
    const here = pathname + search
    return <Navigate to={here === '/' ? '/login' : `/login?next=${encodeURIComponent(here)}`} replace />
  }
  return (
    <ContentProvider>
      <ProfileProvider>
        <ExpansionProvider>
          <Outlet />
        </ExpansionProvider>
      </ProfileProvider>
    </ContentProvider>
  )
}

export function App() {
  return (
    <PreferencesProvider>
      <GlobalStyle />
      <UpdatePrompt />
      <AuthProvider>
        <Suspense fallback={loading}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<SignedIn />}>
              <Route element={handbook}>
                <Route index element={<HomePage />} />
                <Route path="/book" element={<BookPage />} />
                <Route path="/c/:slug" element={<ConventionPage />} />
                <Route path="/c/:slug/:sectionId" element={<ConventionPage />} />
                <Route path="/library/:slug?" element={<Library />} />
                <Route path="/glossary" element={<GlossaryPage />} />
                <Route path="*" element={<HomePage notFound />} />
              </Route>
              <Route
                path="/practice"
                element={
                  <ProfiledContent>
                    <PracticePage />
                  </ProfiledContent>
                }
              />
              <Route
                path="/practice/scores"
                element={
                  <ProfiledContent>
                    <PracticeScoresPage />
                  </ProfiledContent>
                }
              />
              <Route
                path="/practice/fixes"
                element={
                  <ProfiledContent>
                    <PracticeFixesPage />
                  </ProfiledContent>
                }
              />
              <Route path="/learn" element={<LearnIndexPage />} />
              <Route path="/learn/:pathId" element={<ProfiledContent><PathPage /></ProfiledContent>} />
              <Route path="/learn/:pathId/:lessonId" element={<ProfiledContent><LessonPage /></ProfiledContent>} />
              <Route path="/learn/:pathId/edit" element={<LearnEditorPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/glossary/edit" element={<GlossaryEditorPage />} />
              <Route path="/new" element={<EditorPage />} />
              <Route path="/edit/:slug" element={<EditorPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/review/:slug" element={<ReviewPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/integrations/table" element={<TableReportPage />} />
              <Route path="/profiles/:id/edit" element={<ProfileEditorPage />} />
              <Route path="/profiles/:id/compare" element={<ProfileComparePage />} />
              <Route path="/cards/:profileId" element={<CardPage />} />
              <Route path="/cards/:profileId/:templateId" element={<CardPage />} />
              <Route path="/cards/:profileId/:templateId/:form" element={<CardPage />} />
              <Route path="/cards/:profileId/:templateId/v/:n" element={<CardSnapshotPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/:id" element={<TeamPage />} />
              <Route path="/teams/:id/cards" element={<TeamCardsPage />} />
              <Route path="/teams/:id/cards/:templateId" element={<TeamCardsPage />} />
              <Route path="/pairs/:id" element={<PairPage />} />
              <Route path="/u/:id" element={<MemberPage />} />
              <Route path="/library/book" element={<EbooksPage />} />
              <Route path="/library/book/:id" element={<EbookPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </PreferencesProvider>
  )
}
