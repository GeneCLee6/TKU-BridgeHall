/** Sends `body` as JSON without waiting and without ever failing (error reports and usage, E10) */
export function beacon(url: string, body: unknown) {
  const text = JSON.stringify(body)
  try {
    if (navigator.sendBeacon?.(url, text)) return
    void fetch(url, { method: 'POST', body: text, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(
      () => {},
    )
  } catch {
    // Reporting must never cause another error
  }
}
