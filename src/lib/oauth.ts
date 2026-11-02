/** The other sites the table lets members sign in with (TKU-BridgeTable e1-t31 Google, e1-t32 LINE) */
export type Provider = 'google' | 'line'
export const PROVIDERS: readonly Provider[] = ['google', 'line']

/** The provider the Worker sent the browser back from (`?google=…` or `?line=…`) */
export const providerBack = (params: URLSearchParams): Provider | undefined => PROVIDERS.find((p) => params.has(p))
