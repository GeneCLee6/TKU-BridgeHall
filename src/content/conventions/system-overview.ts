import type { Convention } from '../../types/convention.ts'

/**
 * 淡江自然制總覽 — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

export const systemOverview: Convention = {
  slug: 'system-overview',
  nameZh: '淡江自然制總覽',
  nameEn: 'TKU Natural System — Overview',
  aliases: ['我們的制度', '自然制', 'Nature', '5-5-4-2', '5542', '制度總覽'],
  category: 'system',
  kind: 'system',
  level: 'basic',
  cardSlots: [
    'wbf.summary.general <- current#0',
    'wbf.openings.2C.description <- nature#0:5',
    'ctcba-simple.header.2over1 = gf <- current#0',
    'ctcba-simple.major.five <- nature#0:2',
    'ctcba-simple.major.five <- nature#0:3',
    'ctcba-simple.major.forcing-1nt <- current#0',
    'ctcba-simple.leads.4th <- signals#0:3',
  ],
  tags: ['舊講義', '開叫總表', '牌力', '訊號', '禮節'],
  summary:
    '2010 年講義《我們的制度》：開叫總表、牌力線位與範圍、開叫基本原則、訊號與橋藝禮節。現行為 12 點開叫、1NT forcing、2/1 迫叫成局。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '修訂版 Mar.2010 張家倚，修自靜宜大學橋藝社我們的制度，感謝!!目錄所列「橋牌歷史之簡介」「橋牌之合約遊戲」「如何計算合約分數及合約分數表」在原檔中沒有內容。',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'current',
      title: '現行制度與本講義的差異',
      summary: '讀這份舊講義前先看這裡',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：社團現在打 1NT forcing 的 2/1 制度：開叫 12 點起（本講義寫 13 點，是給新生學的版本）；開叫 1NT 為 15-17 點、2NT 為 20-21 點、2♣ 為 22 點以上；答叫者在二線叫出新花（2 蓋 1）為迫叫成局，之後雙方報牌型；高花開叫後答叫 1NT 為迫叫。',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：本講義與網站上的特約有衝突時，一律以特約為準（例如 1NT 與 2NT 開叫後的答叫、雷本索、2♦ 開叫、Jacoby 2NT、Bergen 加叫、回答性賭倍）。各章的衝突處另有標示。',
        },
        {
          kind: 'paragraph',
          text: '本講義各章的點力是 13 點開叫時的版本。',
          pending:
            '改為 12 點開叫後，開叫者再叫的各段點力（本講義的 13-15、16-18、19-21）與答叫者的各段點力是否一併調整，待社團確認。',
        },
        {
          kind: 'paragraph',
          text: '2/1 迫叫成局之後，雙方報牌型。',
          pending:
            '2 蓋 1 迫叫成局之後「雙方報牌型」的具體叫法（開叫者第二輪、答叫者第二輪各叫品的意義）本講義沒有，需社團補充。',
        },
      ],
    },
    {
      id: 'nature',
      title: '自然制開叫總表',
      originalTitle: '自 然 制 （Nature）5-5-4-2',
      summary: '各開叫的點力與牌型',
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              text: '開叫 1♣：13-21 H. C. P. ，保證2張↑梅花。',
            },
            {
              text: '開叫 1♦：13-21 H. C. P. ，保證4張↑方塊。',
            },
            {
              text: '開叫 1♥：13-21 H. C. P. ，保證5張↑紅心。',
            },
            {
              text: '開叫 1♠：13-21 H. C. P. ，保證5張↑黑桃。',
            },
            {
              text: '開叫 1NT：15-17 點，平均牌型，無單張或缺門可能有五張低花牌組。',
            },
            {
              text: '開叫 2♣：(1) 22 H. C. P. ↑，any case。(2) 9贏墩↑，H. C. P. ↑。',
            },
            {
              text: '開叫 2♦/♥/♠：阻塞性叫品弱二之竄叫。',
            },
            {
              text: '開叫 2NT：20-21點，平均牌型，無單張或缺門。',
            },
            {
              text: '開叫 3♣/♦/♥/♠：正常阻塞叫，依照二三定律。',
            },
            {
              text: '開叫 3NT：12-15點，Gambling，一門堅強低花。',
              pending: '第九章寫賭博性 3NT 為 7-11 點，與此處 12-15 點不一致。',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：一線花色開叫為 12 點起（12-21）。',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：2♦ 開叫見「2♦ 開叫」特約（弱二♥、弱二♠、20-21 平均牌、22↑帶 5 張低花）。',
        },
      ],
    },
    {
      id: 'levels',
      title: '牌力線位',
      originalTitle: '牌力線位：',
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              text: '1線2線3線：20/22/24 pts↑',
            },
            {
              text: '3NT：26 pts，成約機會35％↑',
            },
            {
              text: '4♥/♠：26 pts，成約機會35％↑',
            },
            {
              text: '5♣/♦：28 pts，成約機會35％↑',
            },
            {
              text: '小滿貫：32 pts，成約機會50％↑',
            },
            {
              text: '大滿貫：34pts，成約機會67％↑',
            },
          ],
        },
      ],
    },
    {
      id: 'ranges',
      title: '牌力範圍',
      originalTitle: '牌力範圍：',
      blocks: [
        {
          kind: 'paragraph',
          text: '開叫者',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '13~15：低限示弱',
            },
            {
              text: '16~18：高限；邀請成局',
            },
            {
              text: '19~21：強烈迫叫',
            },
            {
              text: '22↑：超級好牌',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '答叫者',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '0~5：不予理會',
            },
            {
              text: '6~9：示弱支持',
            },
            {
              text: '10~12：邀請成局',
            },
            {
              text: '13~15：迫叫成局',
            },
            {
              text: '16~18：溫和試滿',
            },
            {
              text: '19↑：強烈試滿',
              pending: '現行 12 點開叫，開叫者低限範圍是否改為 12 點起，待確認。',
            },
            {
              text: '部分合約要 ─ 搶！',
            },
            {
              text: '成局 要 ─ 衝！',
            },
            {
              text: '滿貫 要 ─ 準！',
            },
            {
              text: '出刀 要 ─ 狠！',
            },
            {
              text: '防禦 要 ─ 精！',
            },
            {
              text: '主打 要 ─ 利！',
            },
            {
              text: '牌風 要 ─ 穩！',
            },
          ],
        },
      ],
    },
    {
      id: 'opening-principles',
      title: '開叫之基本原則',
      originalTitle: '開叫之基本原則（指未達正常開叫點時）',
      blocks: [
        {
          kind: 'paragraph',
          text: '計算大牌點，只有持平均牌型叫無王，才是正確。',
        },
        {
          kind: 'paragraph',
          text: '大牌點之計算在牌值估計中只是一個要素。',
        },
        {
          kind: 'paragraph',
          text: '開叫時之選擇',
        },
        {
          kind: 'paragraph',
          text: '手持15-17 H.C.P. ，平均牌型開叫1NT。',
        },
        {
          kind: 'paragraph',
          text: '1 5定律：三家派司至你，HCP＋♠張數 ≧ 1 5時才開叫。',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：此指低限牌力，可開可不開時之原則。若有正常牌力及好牌組或牌型則不在此限。',
        },
      ],
    },
    {
      id: 'signals',
      title: '訊號',
      originalTitle: '☆　訊號　☆',
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              text: '首引後（王牌大歡迎、無王小歡迎）',
            },
            {
              text: '先大後小─偶數張；先小後大─奇數張',
            },
            {
              text: '墊牌─奇正偶轉',
            },
            {
              text: '首攻─０１第４',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：防守信號的完整約定見「橋牌防守信號」特約。',
        },
      ],
    },
    {
      id: 'etiquette',
      title: '橋藝禮節',
      originalTitle: '橋  藝  禮  節',
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              text: '開始下一副牌時，不得再討論上一副牌。',
            },
            {
              text: '不要以對方可能不懂的語言交談。',
            },
            {
              text: '莊家不得與夢家交換牌看。',
            },
            {
              text: '夢家不得召請裁判或舉發違規。',
            },
            {
              text: '夢家不得參與打牌或提供打牌意見。',
            },
            {
              text: '當同伴叫出有特殊意義之特約叫品，須於上家叫牌前，將同伴之叫品劃圈號以提醒對方。',
            },
            {
              text: '對於對方叫品有疑問時，必須輪到自己叫牌或輪到打牌時才可詢問。',
            },
            {
              text: '叫牌或打牌時，不得有特別強調的姿勢或過度猶豫，使同伴得知你的牌情；也應避免利用這種不當的情報，作為自己叫牌或打牌的依據。',
            },
            {
              text: '不得匆促叫牌包括PASS，其間隔至少停3秒鐘。',
            },
            {
              text: '如同伴長考之後採取某項叫品，您的叫牌選擇即受到限制；除非無其他合理叫品，否則不應選擇同伴長考所可能建議之叫品。',
            },
            {
              text: '首引必須反面出牌，等同伴表示不再詢問對方叫牌意義時，始亮出牌面。首引之同伴在叫牌結束之前，不得詢問對方叫品。',
            },
            {
              text: '不要去觸摸別人的牌張，需要看別人的牌張，應該亮出您剛打的那一張牌，示意別人把牌翻開來讓您看﹝注意要在自己未覆牌之前﹞。',
            },
            {
              text: '旁觀者在叫牌或打牌進行時，不得表現任何反應，不得評論牌情，亦不得舉發違規。',
            },
          ],
        },
      ],
    },
    {
      id: 'partner',
      title: '怎樣做一個好橋伴',
      summary: '林憲助譯自ACBL BULLETIN',
      blocks: [
        {
          kind: 'paragraph',
          text: '一場橋賽的勝負多半取決於你們是否有好的默契。如果每一位橋友都能遵循下列守則，不僅每次橋賽都能玩得愉快，而且會有出色的成績。',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '不要老是教訓同伴（除非你可獲得適當的報償）。',
            },
            {
              text: '不必對同伴多說話，除非你也希望同伴對你說類似的話。',
            },
            {
              text: '不要以結果論事來批評你的橋伴。',
            },
            {
              text: '除非你想澄清叫牌或防禦上的誤會，否則不要和你的同伴討論剛打過的牌，所以唯一要討論的是誇獎他主打時表現精采。',
            },
            {
              text: '如果你覺得非常不愉快或有意譏諷或想批評他人時，最好找個藉口離開牌桌去走動一下。',
            },
            {
              text: '不要忘記你的同伴也跟你一樣想多贏一點。',
            },
            {
              text: '不要老是在別人面前批判你的同伴或使他難堪。',
            },
            {
              text: '當你在等牌的空檔，不妨試試談些橋牌以外的話題。',
            },
            {
              text: '當你想向別的橋友討教你們所發生的災難時，應以發生於你身上的為優先。',
            },
            {
              text: '切記！你和你的同伴是站在同一邊。',
            },
            {
              text: '喜歡你的同伴且百分之一百支持他，當同伴發生錯誤時應感同身受。',
            },
            {
              text: '假如你不確定想向同伴說些什麼時，最好暫時閉口。',
            },
            {
              text: '切記！這只不過是一場牌戲。',
            },
            {
              text: '你想要玩得愉快，同時也要使同伴玩得跟你一樣愉快。',
            },
            {
              text: '除非一場比賽已結束，而且你有充分的時間經過徹底思考，否則永遠不要假設你的同伴已經發生錯誤。',
            },
            {
              text: '你應覺得善待同伴是一件快樂的事。',
            },
            {
              text: '當你以口頭分析牌局時，請三思；不要因為倉促而作出不正確的評論使自己難堪。',
            },
            {
              text: '如你自選的橋伴失常，也不必感到沮喪。',
            },
            {
              text: '假如你不能支持同伴就請閉口；永遠不要與敵方共同對抗你的同伴。',
            },
            {
              text: '假如你認為同伴打的太差或覺得和他打牌沒有樂趣時，也不必為難他，只要下次找一個合適的同伴就好了。這總比當一個苦惱者好得多。從另一方面來說，除非你確有信心，否則不要隨意丟棄一同伴。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '（林憲助譯自ACBL BULLETIN）',
        },
      ],
    },
  ],
}
