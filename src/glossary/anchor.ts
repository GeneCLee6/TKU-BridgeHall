/**
 * The glossary page's anchor for a term. Apart from match.ts so lib/search.ts (which scripts/ also
 * build, without the DOM's types) does not pull in lib/api.ts.
 */
export const termAnchor = (term: string) => `term-${encodeURIComponent(term.toLowerCase()).replace(/%/g, '')}`
