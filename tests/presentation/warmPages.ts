/**
 * The convention and book pages are React.lazy (e9-t04), like the login, account and admin pages. The first import of their module tree
 * can take seconds in a cold test run, longer than findBy* waits; importing them once before the
 * tests keeps the tests about behaviour, not about how fast the files transform.
 */
export const warmPages = () =>
  Promise.all([
    import('../../src/pages/ConventionPage.tsx'),
    import('../../src/pages/BookPage.tsx'),
    import('../../src/components/ReadingSettings.tsx'),
    import('../../src/pages/LoginPage.tsx'),
    import('../../src/pages/SettingsPage.tsx'),
    import('../../src/pages/CardOverview.tsx'),
    import('../../src/pages/AccountPage.tsx'),
    import('../../src/pages/AdminPage.tsx'),
  ])
