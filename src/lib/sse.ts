/**
 * Reads the Claude Messages API's server-sent events, which the import upload passes through
 * unchanged, and collects the reply. Text from every text block is joined: with a refusal
 * fallback the second model carries on the same reply in a new block.
 */

export interface ReplyProgress {
  /** The reply's text so far */
  text: string
  outputTokens: number
  model: string
}

export interface ReplyEnd extends ReplyProgress {
  stopReason: string
}

export class StreamError extends Error {}

/** Splits a byte stream into SSE events ({ event, data }) */
export async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    let cut: number
    while ((cut = buffer.search(/\r?\n\r?\n/)) >= 0) {
      const chunk = buffer.slice(0, cut)
      buffer = buffer.slice(cut).replace(/^\r?\n\r?\n/, '')
      let event = 'message'
      const data: string[] = []
      for (const line of chunk.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
      }
      if (data.length) yield { event, data: data.join('\n') }
    }
    if (done) return
  }
}

/** Collects a Messages API stream, reporting progress as text arrives */
export async function readReply(
  body: ReadableStream<Uint8Array>,
  onProgress: (progress: ReplyProgress) => void,
): Promise<ReplyEnd> {
  const reply: ReplyEnd = { text: '', outputTokens: 0, model: '', stopReason: '' }
  const textBlocks = new Set<number>()
  for await (const { data } of sseEvents(body)) {
    let event: Record<string, unknown>
    try {
      event = JSON.parse(data)
    } catch {
      continue
    }
    switch (event.type) {
      case 'message_start': {
        const message = event.message as { model?: string; usage?: { output_tokens?: number } }
        reply.model = message.model ?? ''
        reply.outputTokens = message.usage?.output_tokens ?? 0
        break
      }
      case 'content_block_start': {
        const block = event.content_block as { type?: string }
        if (block.type === 'text') textBlocks.add(Number(event.index))
        break
      }
      case 'content_block_delta': {
        const delta = event.delta as { type?: string; text?: string }
        if (delta.type === 'text_delta' && textBlocks.has(Number(event.index))) {
          reply.text += delta.text ?? ''
          onProgress(reply)
        }
        break
      }
      case 'message_delta': {
        const delta = event.delta as { stop_reason?: string }
        const usage = event.usage as { output_tokens?: number } | undefined
        if (delta.stop_reason) reply.stopReason = delta.stop_reason
        if (usage?.output_tokens) reply.outputTokens = usage.output_tokens
        onProgress(reply)
        break
      }
      case 'error': {
        const error = event.error as { message?: string } | undefined
        throw new StreamError(error?.message ?? 'AI 服務中斷')
      }
    }
  }
  return reply
}
