import styled from 'styled-components'
import { today } from '../lib/format.ts'
import { conventionDomId } from '../lib/sections.ts'
import { pageStrings } from '../pageStrings.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'
import { printColors as ink } from '../styles/tokens.ts'
import type { Category, ConventionMeta } from '../types/convention.ts'

/**
 * Print v2 (e9-t10, DESIGN-V2.md §8): a book page in black and white, with a running head
 * 「淡江橋館 · 特約名」 and the page number at the foot. Only the convention page and the whole
 * book mount these, so other pages (and the system card) print as before; both are lazy, so none
 * of this is in the home page's download.
 *
 * The rules are a plain <style media="print">, not styled-components: its CSS parser does not keep
 * the page-margin boxes (`@top-left` inside `@page`). Browsers without margin boxes print the
 * pages without the head and the number.
 */

/** A CSS string literal */
const cssString = (text: string) => JSON.stringify(text)

const marginBox = `font: 9pt sans-serif; color: ${ink.ink};`

const base = `
@page {
  size: A4;
  margin: 18mm 16mm 16mm;
  @bottom-center { content: counter(page); ${marginBox} }
}
body { background: ${ink.paper} !important; }
#main { max-width: none !important; padding: 0 !important; opacity: 1 !important; }
#main > [role='status'] { display: none !important; }
#main :not([role='img']) {
  color: ${ink.ink} !important;
  background: transparent !important;
  border-color: ${ink.rule} !important;
  box-shadow: none !important;
}
#main a { text-decoration: none; }
#main button > svg { display: none; }
h1, h2, h3, h4, h5, h6 { break-after: avoid; }
p, li { orphans: 3; widows: 3; }
[data-print-only] { display: block !important; }
`

const head = (name: string) => cssString(pageStrings.print.head(strings.appNameZh, name))

/** One convention on its page: its name heads every printed page */
export function PrintConventionStyle({ name }: { name: string }) {
  return <style media="print">{`${base}\n@page { @top-left { content: ${head(name)}; ${marginBox} } }`}</style>
}

/**
 * The whole book printed (印整本): a cover (club, system profile, date), a contents page, then each
 * convention from a new page, headed with its name. Each convention is a named page; a category's
 * heading joins its first convention's page so it does not stand alone at the foot of the last.
 * The rest of the page (the bar above the book) shares the cover's page, so no blank page comes
 * first. The cover and contents are hidden on screen and from screen readers.
 */
export function PrintBook({ categories, conventions }: { categories: Category[]; conventions: ConventionMeta[] }) {
  const { list, activeId } = useProfiles()
  const profile = list.find((p) => p.id === activeId)?.name ?? strings.profiles.club
  const groups = categories
    .map((category) => ({ category, items: conventions.filter((c) => c.category === category.id) }))
    .filter((g) => g.items.length > 0)

  let n = 0
  const pages = groups.flatMap(({ category, items }) =>
    items.map((c, i) => {
      const page = `c${n++}`
      const selector = [`[id=${cssString(conventionDomId(c.slug))}]`]
      if (i === 0) selector.push(`[id=${cssString(`cat-${category.id}`)}]`)
      return `@page ${page} { @top-left { content: ${head(c.nameZh)}; ${marginBox} } }\n${selector.join(', ')} { page: ${page}; }`
    }),
  )

  return (
    <>
      <style media="print">
        {`${base}\n@page front { @bottom-center { content: none; } }\n#main { page: front; }\n${pages.join('\n')}`}
      </style>
      <Front hidden data-print-only>
        <Cover>
          <p>{pageStrings.print.club}</p>
          <h1>{strings.appNameZh}</h1>
          <p lang="en">{strings.appNameEn}</p>
          <h2>{pageStrings.print.book}</h2>
          <p>{pageStrings.print.profile(profile)}</p>
          <p>{pageStrings.print.printed(today())}</p>
        </Cover>
        <Contents>
          <h2>{pageStrings.print.contents}</h2>
          {groups.map(({ category, items }) => (
            <section key={category.id}>
              <h3>{category.label}</h3>
              <ol>
                {items.map((c) => (
                  <li key={c.slug}>
                    {c.nameZh}
                    <span lang="en">{c.nameEn}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </Contents>
      </Front>
    </>
  )
}

const Front = styled.div`
  page: front;
`

const Cover = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6mm;
  min-height: 240mm;
  text-align: center;
  break-after: page;

  h1 {
    margin: 0;
    font-size: 32pt;
  }
  h2 {
    margin: 12mm 0 0;
    font-size: 20pt;
  }
  p {
    margin: 0;
    font-size: 12pt;
  }
`

const Contents = styled.div`
  break-after: page;

  h2 {
    margin: 0 0 6mm;
    font-size: 18pt;
  }
  h3 {
    margin: 5mm 0 2mm;
    font-size: 12pt;
  }
  ol {
    margin: 0;
    padding-left: 8mm;
  }
  li {
    font-size: 10.5pt;
    line-height: 1.7;
  }
  span {
    margin-left: 3mm;
    font-size: 9pt;
  }
`
