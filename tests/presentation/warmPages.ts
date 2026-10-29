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
    import('../../src/components/NewcomerPrompt.tsx'),
    import('../../src/pages/LoginPage.tsx'),
    import('../../src/pages/SettingsPage.tsx'),
    import('../../src/pages/CardOverview.tsx'),
    import('../../src/pages/AccountPage.tsx'),
    import('../../src/pages/AdminPage.tsx'),
    // What a signed-in member's handbook loads besides (the whole site needs an account, 2026-10-29)
    import('../../src/components/ProfileSwitch.tsx'),
    import('../../src/components/MobileToolbar.tsx'),
    import('../../src/components/Avatar.tsx'),
    import('../../src/pages/HomeBlocks.tsx'),
    import('../../src/lib/profiles.ts'),
  ])
