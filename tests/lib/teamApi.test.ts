import { api, ApiError, type ClubTeam, type Partnership } from '../../src/lib/api.ts'

/** The team and partnership calls against TKU BridgeTable's routes (its worker/roles.ts clubRouteNeed and club.ts) */

const team: ClubTeam = { id: 't1', name: 'A 隊', captainId: 'u1', memberIds: ['u1', 'u2'], profileId: 'p1', createdAt: 1 }
const pair: Partnership = { id: 'pr1', userIds: ['u1', 'u2'], profileId: '', createdAt: 1, status: 'pending' }

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

describe('team and partnership API (e2-t02, e2-t03)', () => {
  it('reads and changes teams', async () => {
    answer.body = { teams: [team] }
    expect(await api.club.teams()).toEqual([team])
    answer.body = { team, pairs: [] }
    expect(await api.club.team('t1')).toEqual({ team, pairs: [] })
    answer.body = { team }
    expect(await api.club.createTeam({ name: 'A 隊', captainId: 'u1', memberIds: ['u2'] })).toEqual(team)
    await api.club.updateTeam('t1', { archived: true })
    await api.club.addMember('t1', 'u3')
    await api.club.removeMember('t1', 'u3')
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      'GET /api/club/teams',
      'GET /api/club/teams/t1',
      'POST /api/club/teams',
      'PATCH /api/club/teams/t1',
      'POST /api/club/teams/t1/members',
      'DELETE /api/club/teams/t1/members/u3',
    ])
    expect(sent[2].body).toEqual({ name: 'A 隊', captainId: 'u1', memberIds: ['u2'] })
    expect(sent[3].body).toEqual({ archived: true })
    expect(sent[4].body).toEqual({ userId: 'u3' })
  })

  it('invites, answers and ends partnerships', async () => {
    answer.body = { pairs: [pair] }
    expect(await api.club.pairs()).toEqual([pair])
    answer.body = { pair }
    expect(await api.club.pair('pr1')).toEqual(pair)
    expect(await api.club.invite({ partnerId: 'u2', teamId: 't1' })).toEqual(pair)
    await api.club.accept('pr1')
    await api.club.decline('pr1')
    answer.body = { pair: null }
    expect(await api.club.end('pr1')).toBeNull()
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      'GET /api/club/pairs',
      'GET /api/club/pairs/pr1',
      'POST /api/club/pairs',
      'POST /api/club/pairs/pr1/accept',
      'POST /api/club/pairs/pr1/decline',
      'POST /api/club/pairs/pr1/end',
    ])
    expect(sent[2].body).toEqual({ partnerId: 'u2', teamId: 't1' })
  })

  it("passes on the Worker's limits as ApiError", async () => {
    answer = { status: 409, body: { error: 'namy 已經有 10 個搭檔', code: 'pairLimit', params: { max: 10, name: 'namy' } } }
    const error = await api.club.invite({ partnerId: 'u2' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'pairLimit', params: { max: 10 } })
  })
})
