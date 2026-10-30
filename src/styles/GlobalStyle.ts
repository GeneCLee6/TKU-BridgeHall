import { createGlobalStyle } from 'styled-components'
import { textSizes } from './tokens.ts'

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html {
    color-scheme: ${({ theme }) => theme.mode};
    font-size: ${({ theme }) => textSizes[theme.textSize]};
  }

  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1rem;
    line-height: ${({ theme }) => theme.lineHeight};
    -webkit-font-smoothing: antialiased;
  }

  /* The style's heading font; in 「一般」 that is the body font at the browser's bold */
  h1, h2, h3 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.headingWeight};
  }

  /*
   * A plain link keeps a quiet underline, so a link in a sentence is not told apart by colour alone
   * (WCAG 1.4.1); it turns solid when pointed at. Links drawn as buttons, tabs and rows (styled,
   * so they have a class) have none.
   */
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-underline-offset: 0.2em;
    text-decoration-thickness: 1px;
    text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
  }
  a:hover { text-decoration-color: currentColor; }
  :where(a[class]) { text-decoration: none; }

  :focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: 4px;
  }

  button { font: inherit; color: inherit; }

  .visually-hidden {
    position: absolute !important;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0);
    white-space: nowrap; border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }

  /*
   * Accordion content is force-mounted so printing can show every panel; Radix leaves it
   * visible, so closed panels are hidden here instead.
   */
  [data-accordion-content][data-state='closed'] { display: none; }

  /* Print: everything expanded, no chrome, black on white. */
  @media print {
    body { background: #fff; color: #000; font-size: 11pt; }
    [data-print='hide'] { display: none !important; }
    [data-accordion-content] { display: block !important; }
    [data-print='card'] { break-inside: auto; box-shadow: none !important; border-color: #999 !important; }
    table, [data-print='keep'] { break-inside: avoid; }
    main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
  }
`
