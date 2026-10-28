import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventions } from '../../src/content/index.ts'
import type { ProfileAccess, ProfileInput, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { walkSections } from '../../src/lib/sections.ts'
import { profileEdit as t } from '../../src/pages/profileEditStrings.ts'

/**
 * The system profile editor (/profiles/:id/edit, e1-t14) against a fake Worker: a team profile
 * under the club's, saved as one input against the version loaded.
 */

const dropped = conventions[0]!
const target = (() => {
  for (const c of conventions) {
    let found: { slug: string; sectionId: string; blockIndex: number } | undefined
    walkSections(c.sections, (s) => {
      const blockIndex = s.blocks?.findIndex((b) => b.kind === 'responses') ?? -1
      if (!found && blockIndex >= 0) found = { slug: c.slug, sectionId: s.id, blockIndex }
    })
    if (found) return found
  }
  throw new Error('no convention with a responses block')
})()
const MEANING = '隊伍約定的意義'

const base = { updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const CLUB: SystemProfile = { ...base, id: 'club', name: '社團預設', scope: 'club', version: 2 }
const TEAM: SystemProfile = { ...base, id: 'team', name: '甲隊', scope: 'team', version: 4 }
const summary = ({ adopted, overrides, notes, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})

let access: ProfileAccess
let saveStatus: number
let sent: { method: string; path: string; body: unknown }[]

configure({ asyncUtilTimeout: 10_000 })
vi.setConfig({ testTimeout: 40_000 })

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  access = { notes: true, edit: true, share: true }
  saveStatus = 200
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      sent.push({ method, path, body })
      const route = `${method} ${path}`
      if (route === 'GET /api/me') return json(200, { user: { id: 'u1', username: 'amy', admin: false, permissions: ['bookEdit'] } })
      if (route === 'GET /api/book/profiles') return json(200, { profiles: [CLUB, TEAM].map(summary) })
      if (route === 'GET /api/book/profiles/club') return json(200, { profile: CLUB })
      if (route === 'GET /api/book/profiles/team') return json(200, { profile: TEAM, access })
      if (route === 'PUT /api/book/profiles/team') {
        if (saveStatus === 409) return json(409, { error: '有人先存了', code: 'profileConflict' })
        const { profile } = body as { profile: ProfileInput }
        return json(200, { profile: { ...TEAM, ...profile, version: 5 } })
      }
      return json(401, { error: '請先登入', code: 'signInFirst' })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const renderEditor = async () => {
  render(
    <MemoryRouter initialEntries={['/profiles/team/edit']}>
      <App />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: t.titleOf('甲隊') }, { timeout: 15_000 })).toBeInTheDocument()
}

/** Turns the first convention off and reads one of the target's rows otherwise */
async function edit() {
  const user = userEvent.setup()
  await user.selectOptions(screen.getByRole('combobox', { name: dropped.nameZh }), 'off')

  const rows = screen.getByRole('region', { name: t.rowTitle })
  await user.selectOptions(within(rows).getByRole('combobox', { name: t.convention }), target.slug)
  await user.selectOptions(within(rows).getByRole('combobox', { name: t.section }), target.sectionId)
  await user.selectOptions(within(rows).getByRole('combobox', { name: t.row }), `${target.blockIndex}:0`)
  const meaning = within(rows).getByRole('textbox', { name: t.newMeaning })
  await user.clear(meaning)
  await user.type(meaning, MEANING)
  await user.click(within(rows).getByRole('button', { name: new RegExp(`^${t.addRow}`) }))
  expect(within(rows).getByRole('table')).toHaveTextContent(MEANING)
  expect(screen.getByText(t.unsaved)).toBeInTheDocument()
  return user
}

describe('the system profile editor', () => {
  it('adopts, overrides a row and saves the whole profile against the version loaded', async () => {
    await renderEditor()
    expect(screen.getByRole('link', { name: t.compare })).toHaveAttribute('href', '/profiles/team/compare')
    const user = await edit()

    await user.click(screen.getByRole('button', { name: new RegExp(`^${t.save}`) }))
    expect(await screen.findByText(t.savedVersion(5))).toBeInTheDocument()
    const put = sent.find((s) => s.method === 'PUT')!
    const { profile, baseVersion } = put.body as { profile: ProfileInput; baseVersion: number }
    expect(baseVersion).toBe(4)
    expect(profile.adopted).toEqual({ [dropped.slug]: 'off' })
    expect(profile.overrides).toEqual([
      { kind: 'row', slug: target.slug, sectionId: target.sectionId, blockIndex: target.blockIndex, rowIndex: 0, meaning: MEANING },
    ])
    expect(profile).toMatchObject({ name: '甲隊', scope: 'team', notes: [] })
  })

  it('does not overwrite a newer version: says so and offers to reload', async () => {
    saveStatus = 409
    await renderEditor()
    const user = await edit()
    await user.click(screen.getByRole('button', { name: new RegExp(`^${t.save}`) }))
    expect(await screen.findByText(new RegExp(`^${t.conflict.slice(0, 10)}`))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(`^${t.save}`) })).toBeDisabled()

    const before = sent.filter((s) => s.path === '/api/book/profiles/team' && s.method === 'GET').length
    await user.click(screen.getByRole('button', { name: new RegExp(`^${t.reload}`) }))
    await waitFor(() =>
      expect(sent.filter((s) => s.path === '/api/book/profiles/team' && s.method === 'GET').length).toBe(before + 1),
    )
    await waitFor(() => expect(screen.queryByText(t.unsaved)).not.toBeInTheDocument())
    expect(sent.filter((s) => s.method === 'PUT')).toHaveLength(1)
  })

  it('shows the profile read-only to a member who may not edit it', async () => {
    access = { notes: true, edit: false, share: false }
    await renderEditor()
    expect(screen.getByText(t.readOnly)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: dropped.nameZh })).toBeDisabled()
    expect(screen.queryByRole('button', { name: new RegExp(`^${t.save}`) })).not.toBeInTheDocument()
  })

  it('is listed on the admin page with links to edit and compare', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )
    const panel = await screen.findByRole('region', { name: t.adminTitle }, { timeout: 15_000 })
    expect(await within(panel).findByRole('link', { name: `${t.edit}：甲隊` })).toHaveAttribute('href', '/profiles/team/edit')
    expect(within(panel).getByRole('link', { name: `${t.compare}：社團預設` })).toHaveAttribute('href', '/profiles/club/compare')
  })
})
