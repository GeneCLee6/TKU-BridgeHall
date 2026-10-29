/** The admin page's 隊伍 panel copy (split out of src/strings.ts so the first page does not carry it, e10-t21) */
// 社團管理 → 隊伍 (editors; e2-t07, e2-t10)
export const teamsStrings = {
  title: '隊伍',
  intro: '隊長與編輯者管隊伍；隊伍的制度集只有隊長能改，打開「隊員可編輯制度集」後隊員也能改。',
  none: '還沒有隊伍',
  captain: '隊長',
  members: '隊員',
  count: (n: number, max: number) => `${n} / ${max} 人`,
  newName: '隊名',
  create: '建立隊伍',
  pick: '選擇社員',
  captainOf: (team: string) => `${team} 的隊長`,
  addTo: (team: string) => `加入 ${team} 的社員`,
  add: '加入',
  remove: (name: string, team: string) => `把 ${name} 移出 ${team}`,
  membersEdit: '隊員可編輯制度集',
  archive: '封存',
  unarchive: '取消封存',
  archived: '已封存',
  pairs: (team: string) => `${team} 的搭檔`,
  noPairs: '這一隊還沒有搭檔',
} as const
