import { readReply, sseEvents, StreamError } from '../../src/lib/sse.ts'

/** A response body that arrives in the given pieces */
function stream(...pieces: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece))
      controller.close()
    },
  })
}

const event = (type: string, data: object) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`

describe('reading the AI reply stream', () => {
  it('splits events even when they arrive cut in pieces', async () => {
    const text = event('ping', {}) + event('message_stop', {})
    const seen: string[] = []
    for await (const e of sseEvents(stream(text.slice(0, 7), text.slice(7, 30), text.slice(30)))) seen.push(e.event)
    expect(seen).toEqual(['ping', 'message_stop'])
  })

  it('joins the text blocks, skips thinking and the fallback marker, and reports progress', async () => {
    const progress: number[] = []
    const reply = await readReply(
      stream(
        event('message_start', { message: { model: 'claude-opus-5-5', usage: { output_tokens: 1 } } }),
        event('content_block_start', { index: 0, content_block: { type: 'thinking', thinking: '' } }),
        event('content_block_delta', { index: 0, delta: { type: 'thinking_delta', thinking: '' } }),
        event('content_block_start', { index: 1, content_block: { type: 'text', text: '' } }),
        event('content_block_delta', { index: 1, delta: { type: 'text_delta', text: '{"conven' } }),
        event('content_block_start', { index: 2, content_block: { type: 'fallback' } }),
        event('content_block_start', { index: 3, content_block: { type: 'text', text: '' } }),
        event('content_block_delta', { index: 3, delta: { type: 'text_delta', text: 'tions":[]}' } }),
        event('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 42 } }),
        event('message_stop', {}),
      ),
      (p) => progress.push(p.text.length),
    )
    expect(reply).toEqual({ text: '{"conventions":[]}', outputTokens: 42, model: 'claude-opus-5-5', stopReason: 'end_turn' })
    expect(progress).toEqual([8, 18, 18])
  })

  it('stops with the service’s error', async () => {
    await expect(readReply(stream(event('error', { error: { type: 'overloaded_error', message: 'Overloaded' } })), () => {})).rejects.toThrow(
      StreamError,
    )
  })
})
