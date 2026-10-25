import { api, ApiError, type ProfileInput, type SystemProfile } from '../../src/lib/api.ts'

/** The system profile calls against TKU BridgeTable's routes (its worker/roles.ts and club.ts) */

const profile: SystemProfile = {
  id: 'ab12',
  name: 'A 隊',
  scope: 'team',
  parentId: 'club',
  adopted: { lebensohl: 'off' },
  overrides: [],
  notes: [],
  version: 2,
  updatedAt: 1,
  updatedBy: 'u1',
}
const input: ProfileInput = { name: 'A 隊', scope: 'team', adopted: { lebensohl: 'off' }, overrides: [], notes: [] }

let sent: { method: string; path: string; body: unknown }[]
let answer: { status: number; body: unknown }

beforeEach(() => {
  sent = []
  answer = { status: 200, body: {} }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      sent.push({ method: init?.method ?? 'GET', path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      return new Response(JSON.stringify(answer.body), { status: answer.status })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('system profile API', () => {
  it('reads the list, one profile and its versions', async () => {
    answer.body = { profiles: [{ id: 'club' }] }
    expect(await api.book.profiles()).toEqual([{ id: 'club' }])
    answer.body = { profile }
    expect(await api.book.profile('ab12')).toEqual(profile)
    answer.body = { revisions: [{ profileId: 'ab12', version: 2 }] }
    expect(await api.book.profileRevisions('ab12')).toEqual([{ profileId: 'ab12', version: 2 }])
    answer.body = { revision: { profileId: 'ab12', version: 1, profile } }
    expect((await api.book.profileRevision('ab12', 1)).profile).toEqual(profile)
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      'GET /api/book/profiles',
      'GET /api/book/profiles/ab12',
      'GET /api/book/profiles/ab12/revisions',
      'GET /api/book/profiles/ab12/revisions/1',
    ])
  })

  it('creates, saves with baseVersion and deletes', async () => {
    answer.body = { profile }
    await api.book.createProfile(input, '開隊')
    await api.book.saveProfile('ab12', input, 2)
    answer.body = { ok: true }
    await api.book.deleteProfile('ab12', 3)
    expect(sent).toEqual([
      { method: 'POST', path: '/api/book/profiles', body: { profile: input, note: '開隊' } },
      { method: 'PUT', path: '/api/book/profiles/ab12', body: { profile: input, baseVersion: 2 } },
      { method: 'DELETE', path: '/api/book/profiles/ab12', body: { baseVersion: 3 } },
    ])
  })

  it("passes on the Worker's refusals", async () => {
    answer = { status: 409, body: { error: 'ben 剛剛修改了這個制度集，請重新載入後再改', code: 'profileConflict', params: { name: 'ben' } } }
    const error = await api.book.saveProfile('ab12', input, 1).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'profileConflict', params: { name: 'ben' } })
    answer = { status: 403, body: { error: '社團預設的制度集不能刪除', code: 'profileProtected' } }
    await expect(api.book.deleteProfile('club', 0)).rejects.toMatchObject({ status: 403, code: 'profileProtected' })
  })
})
