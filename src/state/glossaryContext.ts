import { createContext, type ReactNode } from 'react'

/**
 * Marks glossary terms in one piece of text (e4-t06). `seen` holds the terms already marked in the
 * same paragraph, so each is marked once; `plain` renders the text between terms. The marker and
 * the glossary come from src/glossary/ (loaded with the reading pages only); without a provider
 * RichText renders as before. Kept tiny because RichText is on the home page.
 */
export type GlossaryMarker = (text: string, seen: Set<string>, plain: (text: string) => ReactNode[]) => ReactNode[]

export const GlossaryContext = createContext<GlossaryMarker | null>(null)
