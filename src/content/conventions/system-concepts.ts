import type { Convention } from '../../types/convention.ts'

/**
 * 叫牌觀念、防禦與打牌（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

export const systemConcepts: Convention = {
  slug: 'system-concepts',
  nameZh: '叫牌觀念、防禦與打牌（自然制講義）',
  nameEn: 'Bidding Concepts, Defence and Play (Natural System)',
  aliases: ['評估牌力', '配合', '不配合', '防禦', '首攻', '首引', '打牌', '牌張組合'],
  category: 'system',
  kind: 'system',
  level: 'basic',
  tags: ['舊講義', '評估', '配合', '防禦', '首攻', '打牌'],
  summary: '講義後半：如何評估叫牌制度與牌力、配合與不配合、防禦與首攻、訊號、王牌與無王合約打法。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '如何評估叫牌制度、如何評估牌力、配合與不配合、防禦、王牌/無王合約打法',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'system-evaluation',
      title: '如何評估叫牌制度',
      originalTitle: '如 何 評 估 叫 牌 制 度',
      blocks: [
        {
          kind: 'paragraph',
          text: '定義叫牌制度',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '叫牌路徑',
            },
            {
              text: '溝通訊息',
            },
            {
              text: '極點合約',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '判斷叫牌制度優劣的原則',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '安全性：不超過極點合約。',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：無論是己方或防禦方，在交換訊息、竄叫、阻塞叫、指示首引或平衡叫，都避免超過極點合約。',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '平衡性：每個叫牌路徑所表示的牌，其發生機率相差不多。',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：路徑有限而牌數無窮，故最多之叫品應涵蓋較多之牌。EX) 自然制 1♣ ，精準制 1♣……',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '差異性：每個叫牌路徑所代表的訊息均不同。',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：對合約好壞具有決定性影響的叫牌路徑才重要。EX) Forcing 1NT ，2 over 1',
        },
        {
          kind: 'paragraph',
          text: '衝突性：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '堅固：在起始的叫牌即已傳送對決定合約具有重要因素的訊息 EX) 精準制 1♣',
            },
            {
              text: '隱蔽：牌情洩漏越少越好。',
            },
            {
              text: '速度：迅速達到極點，可使對方先失去叫牌空間。EX) Multi 2♦',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '溝通性：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '差不多時以相互溝通為主。',
            },
            {
              text: '差距大時以強牌為Leader。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '人性化：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '自然',
            },
            {
              text: '簡單',
            },
            {
              text: '彈性',
            },
            {
              text: '符合個性',
            },
          ],
        },
      ],
    },
    {
      id: 'hand-evaluation',
      title: '如何評估牌力',
      originalTitle: '如 何 評 估 叫 牌 力',
      blocks: [
        {
          kind: 'paragraph',
          text: '評估的因素：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: 'HCP',
            },
            {
              text: '分配',
            },
            {
              text: '控制與尊張',
            },
            {
              text: '與同伴的配合',
            },
            {
              text: '敵方叫牌後的考慮',
            },
          ],
        },
        {
          kind: 'hand',
          label: '(EX) 何手牌較佳？',
          hand: {
            spades: 'AQXXX',
            hearts: 'QXX',
            diamonds: 'QXX',
            clubs: 'KX',
          },
        },
        {
          kind: 'hand',
          label: '(EX) 何手牌較佳？',
          hand: {
            spades: 'AKXXXX',
            hearts: 'KXXX',
            diamonds: 'XX',
            clubs: 'X',
          },
        },
        {
          kind: 'paragraph',
          text: '另有a. b. 兩手牌叫牌如右，你是否接受邀請？ 1♠ 3♠ ？',
        },
        {
          kind: 'hand',
          label: 'a.',
          hand: {
            spades: 'KQXXX',
            hearts: 'QJ',
            diamonds: 'JXX',
            clubs: 'KJX',
          },
        },
        {
          kind: 'hand',
          label: 'b.',
          hand: {
            spades: 'JTXXX',
            hearts: 'AX',
            diamonds: 'KX',
            clubs: 'AXXX',
          },
        },
        {
          kind: 'paragraph',
          text: '如何避免錯估己方的防禦力量',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '相信敵方的叫品',
            },
            {
              text: '處罰的時機',
            },
            {
              text: '身價判斷敵方可能是犧牲叫時',
            },
            {
              text: '敵方是在壓力下叫牌',
            },
            {
              text: '分配對敵方不利',
            },
          ],
        },
      ],
    },
    {
      id: 'fit',
      title: '配合與不配合',
      originalTitle: '配 合 與 不 配 合',
      blocks: [
        {
          kind: 'paragraph',
          text: '第四門新花迫叫（選擇合約或試探滿貫）',
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♦ 1♠ 2♣ 2♥*：第四門新花迫叫一圈，要求同伴澄清牌型及點力範圍。',
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♦ 1♠ 2♣ 2♠ 3♥*：第四門新花這邊出來有問♥擋的意思',
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♣ 1♦ 1♥ 1♠*：唯一非第四門新花迫叫成局 此處為迫叫一圈的例子。',
        },
        {
          kind: 'paragraph',
          text: '如果同伴沒有配合，儘快停在低階合約',
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♦ 1♥ 1♠ 2♥ ？',
        },
        {
          kind: 'hand',
          hand: {
            spades: 'AJ85',
            hearts: '94',
            diamonds: 'KQ87',
            clubs: 'KJ3',
          },
        },
        {
          kind: 'hand',
          hand: {
            spades: '73',
            hearts: 'AQJ762',
            diamonds: '43',
            clubs: '985',
          },
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♥ 1♠ 2♥ 2♠ 3♥ ？',
        },
        {
          kind: 'hand',
          hand: {
            spades: 'AKQXXX',
            hearts: 'XX',
            diamonds: 'XX',
            clubs: 'XXX',
          },
        },
        {
          kind: 'paragraph',
          text: '當不配合時叫NT，並非解救叫品（Inv 意義）',
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♥ 1NT 2♥ ？',
        },
        {
          kind: 'hand',
          hand: {
            spades: 'JXX',
            hearts: 'X',
            diamonds: 'QXX',
            clubs: 'KQJXXX',
          },
        },
        {
          kind: 'paragraph',
          text: '當同伴表示兩門牌組做選擇叫品的重要性',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '如張數皆相同時，有大牌點牌組配合者較佳。',
            },
            {
              text: '盡量不要超過同伴的第二門牌組的線位。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♠ 1NT 2♣ ？',
        },
        {
          kind: 'hand',
          label: '改2S 通常比PASS好',
          hand: {
            spades: 'XX',
            hearts: 'XXXX',
            diamonds: 'AXXX',
            clubs: 'QXX',
          },
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♦ 1♠ 2♣ 2♠ 3♦ ？',
        },
        {
          kind: 'hand',
          label: 'PASS',
          hand: {
            spades: 'AKXXXX',
            hearts: 'XX',
            diamonds: 'X',
            clubs: 'XXX',
          },
        },
        {
          kind: 'paragraph',
          text: '答叫者新花（未派司過）99%迫叫',
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♣ 1♥ 1♠ 1NT 2♦*：迫叫',
        },
      ],
    },
    {
      id: 'defence',
      title: '防禦',
      originalTitle: '防    禦',
      blocks: [
        {
          kind: 'paragraph',
          text: '前言',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '防禦錯誤所失去的分數，較打牌或叫牌為多',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '防禦的困難',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '打法簡單',
            },
            {
              text: '缺乏資訊',
            },
            {
              text: '兩個人的合作',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '幫助同伴',
        },
        {
          kind: 'hand',
          label: '上',
          hand: {
            spades: 'XXXXX',
            hearts: 'AX',
            diamonds: 'XX',
            clubs: 'AQJX',
          },
        },
        {
          kind: 'hand',
          label: '左',
          hand: {
            spades: 'AJ',
            hearts: '9X',
            diamonds: 'AJXXX',
            clubs: 'XXXX',
          },
        },
        {
          kind: 'hand',
          label: '右',
          hand: {
            spades: 'X',
            hearts: 'KQJXXX',
            diamonds: 'XXXX',
            clubs: 'XX',
          },
        },
        {
          kind: 'hand',
          label: '下',
          hand: {
            spades: 'KQXX',
            hearts: 'XXX',
            diamonds: 'KQ',
            clubs: 'KXX',
          },
        },
        {
          kind: 'paragraph',
          text: '叫牌：♠ 1♠，W ─，N 3♠，E ─，♠ 4♠，W ─，N ─，E ＝。首引：♥9',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '防禦的好壞與橋牌程度有關',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '防禦的要素',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '叫牌及指示賭倍',
            },
            {
              text: '跟牌',
            },
            {
              text: '計算',
            },
            {
              text: '訊號 （歡迎 ＞ 張數 ＞ 花色選擇）',
            },
            {
              text: '首引',
            },
            {
              text: '推斷',
            },
          ],
        },
      ],
    },
    {
      id: 'opening-lead',
      title: '首攻',
      originalTitle: '首攻',
      blocks: [
        {
          kind: 'paragraph',
          text: '要攻哪一門牌？（依優先順序）',
        },
        {
          kind: 'paragraph',
          text: '對抗王牌合約',
        },
        {
          kind: 'paragraph',
          text: '就位置而言',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '同伴叫過之花色',
            },
            {
              text: '未被叫過之花色',
            },
            {
              text: '夢家叫過之花色',
            },
            {
              text: '莊家叫過之花色',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '就長度而言',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '單張',
            },
            {
              text: '雙張',
            },
            {
              text: '三張',
            },
            {
              text: '長門牌組',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '就牌組本身而言',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '有連續大牌（AKQ、KQJ、QJT等）的花色',
            },
            {
              text: '沒有大牌之花色',
            },
            {
              text: 'J 帶頭之牌組',
            },
            {
              text: 'Q帶頭之牌組',
            },
            {
              text: 'K帶頭之牌組',
            },
            {
              text: 'A帶頭之牌組',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '對抗無王合約',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '同伴之牌組或自己牌組（須注意橋引問題）',
            },
            {
              text: '你的未被任何敵方叫過之牌組',
            },
            {
              text: '引未被叫過之花色',
            },
            {
              text: '引夢家第二次叫之花色',
            },
            {
              text: '當1NT – 3NT時，盡量攻高花（沒有良好首攻時）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '**☆ 對 抗 王 牌 合 約 需 注 意 事 項 ☆**',
        },
        {
          kind: 'paragraph',
          text: '首攻王牌',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '攻其他門皆有危險',
            },
            {
              text: '明顯夢家需要王吃（莊家兩門牌組）',
            },
            {
              text: '你在莊家第一門花色擁有不錯的實力',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '對抗王牌合約從帶A之牌組引牌',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '首引不要從A低引',
            },
            {
              text: '如果你沒有A，拔A應在',
            },
            {
              text: '你防禦滿貫（6NT除外）',
            },
            {
              text: '莊家曾經搶先叫',
            },
            {
              text: '你持單A',
            },
            {
              text: '對抗5♣或5♦，你的A是未叫牌組',
            },
            {
              text: '你方在此門已表示長度及力量',
            },
            {
              text: '你持7或8張帶A之牌組',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '短門引牌',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '單張是不錯之首引（PS：注意是否為敵方牌組）',
            },
            {
              text: '雙張切勿估計太理想，特別是帶大牌時',
            },
            {
              text: '短門引牌最好有王牌控制 EX）AXX、KXX',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '具有下列兩種情況時避免短門引牌',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '王牌本身有贏墩EX）QJX、KQT、QJT',
            },
            {
              text: '你持長王牌時，通常引自己之長門或同伴之長門希望能迫王',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '要攻哪一張？',
        },
        {
          kind: 'paragraph',
          text: '對抗無王合約',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '帶有大牌的長門花色攻第四大牌',
            },
            {
              text: '全部小牌的長門花色攻第二大牌',
            },
            {
              text: '三張小牌攻中間張（MUD）',
            },
            {
              text: '引J為最大張',
            },
            {
              text: '引JT如果下面還有9 or 87 引J 如果JTxx 則引第四大牌',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '對抗王牌合約',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '連續張攻頂張',
            },
            {
              text: '三張小牌攻中間張（MUD）縱使那是同伴叫過之花色',
            },
            {
              text: '帶有大牌的長門花色攻第四大牌',
            },
            {
              text: '全部小牌得長門花色攻第二大牌',
            },
            {
              text: '三張帶大牌攻最小張',
            },
            {
              text: '引J為頂張無大牌',
            },
          ],
        },
      ],
    },
    {
      id: 'signals',
      title: '墊牌與訊號',
      originalTitle: '四、墊牌',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：防守信號以「橋牌防守信號」特約為準。',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '奇偶墊牌',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '五、張數',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '張數信號（同伴引牌跟真信號）莊家引牌 則不必每次跟真信號',
            },
            {
              text: '先大後小表示該門為偶數張，先小後大為奇數張',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：我們先給歡迎信號再給張數信號',
        },
        {
          kind: 'paragraph',
          text: '歡迎信號',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '先大後小是鼓勵性並歡迎同伴繼續再攻此門',
            },
            {
              text: '先小後大則是不歡迎且要求同伴轉攻別門',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '花色選擇',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '大牌是要求同伴攻剩餘花色中較高那一門，反之亦然',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '使用時機：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '當在同伴攻的花色上，夢家為單張時',
            },
            {
              text: '當要給同伴王吃時',
            },
            {
              text: '無王合約要清掉莊家擋張時',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：無王與王牌合約皆奇偶墊牌',
        },
      ],
    },
    {
      id: 'suit-play',
      title: '王牌合約打法',
      originalTitle: '王 牌 合 約 打 法',
      blocks: [
        {
          kind: 'paragraph',
          text: '王牌的作用',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '增加贏墩',
            },
            {
              text: '取得控制',
            },
            {
              text: '修正牌型',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '合約需注意事項',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '贏張來源（如：短門王吃、建立長門等）',
            },
            {
              text: '避免法（王牌分配不同或敵方有一王牌擋張）',
            },
            {
              text: 'Cross - Ruff（交互王吃）最重要的是事先提掉贏墩',
            },
            {
              text: 'Ruffing - Finsse（王吃偷牌）',
            },
            {
              text: '橋引問題',
            },
          ],
        },
      ],
    },
    {
      id: 'notrump-play',
      title: '無王合約打法',
      originalTitle: '無 王 合 約 打 法',
      blocks: [
        {
          kind: 'paragraph',
          text: '一、注意事項',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '計算贏張及橋引',
            },
            {
              text: '長門之建立順序',
            },
            {
              text: '兩手皆為平均牌時，如何建立贏墩',
            },
            {
              text: '牌張組合',
            },
            {
              text: 'EX1) K8XX / JTX　2) AJXXX / KT　3) KT8X / Q97X',
            },
            {
              text: '避免法',
            },
            {
              text: '瞭解OPPS之訊號，並利用手中牌張擾亂其判斷',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: '牌張組合的最佳打法可參考左側目錄「外部參考」的 Bridge Hands 牌張組合表。',
        },
      ],
    },
  ],
}
