import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html { color-scheme: ${({ theme }) => theme.mode}; }

  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 16px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  a { color: ${({ theme }) => theme.colors.primary}; }

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
