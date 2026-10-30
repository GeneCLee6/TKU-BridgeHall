import type { Category, Convention } from '../types/convention.ts'

/**
 * GET /api/book/export (L1, e8-t12; TKU-BridgeTable worker/book.ts BookExport): every convention as
 * members read it, the online entries laid over the built-in layer. Only an admin or the export
 * token reaches it; scripts/export-content.ts writes it out for the backup (CONTENT_GUIDE.md §6.5).
 * Apart from lib/api.ts (which re-exports these) so the Node scripts can import them alone.
 */
export interface BookExport {
  format: 1
  exportedAt: number
  /** The online entries' version and the built-in layer's */
  version: number
  builtinVersion: number
  /** Catalogue order: the built-in ones (an online entry in place of its own), then the online-only ones, oldest first */
  conventions: ExportedConvention[]
  /** Conventions an online entry hides */
  hidden: { slug: string; builtin: boolean; online: ExportedOnline }[]
  /** The categories as edited online (the Worker's BookCategory); empty when they never were */
  categories: Category[]
}

export interface ExportedConvention {
  slug: string
  source: 'builtin' | 'online'
  /** There is a built-in convention with this slug */
  builtin: boolean
  convention: Convention
  online?: ExportedOnline
}

/** The online entry's version and who published it (the Worker's BookEntry, in part) */
export interface ExportedOnline {
  version: number
  updatedAt: number
  updatedBy: string
  /** The `updated` date of the built-in convention the first online edit started from */
  bundledUpdated?: string
}
