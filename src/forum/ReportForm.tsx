import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Button, ErrorText, Field, Row, TextArea } from '../components/ui.tsx'
import { errorText } from '../lib/api.ts'
import { FORUM_LIMITS } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { forumStrings as t } from './forumStrings.ts'

/**
 * 檢舉 (e11-t09, AC-11.6): a member tells the officers about someone else's post or comment, with
 * why. Opens under the post or comment from its 「⋯」 menu; reporting the same one again while the
 * officers have not handled it only changes the reason (TKU-BridgeTable worker/forum.ts).
 */
export function ReportForm({ target, targetId, onDone }: { target: 'post' | 'comment'; targetId: string; onDone: (sent: boolean) => void }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const length = [...reason.trim()].length

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!length) return setError(t.reportEmpty)
    if (length > FORUM_LIMITS.reportReasonMax) return setError(t.reportTooLong(FORUM_LIMITS.reportReasonMax))
    setBusy(true)
    setError('')
    try {
      await forumApi.report({ target, targetId, reason: reason.trim() })
      onDone(true)
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  return (
    <Form onSubmit={(e) => void submit(e)} aria-label={target === 'post' ? t.reportPost : t.reportComment}>
      <Field>
        {t.reportReason}
        <TextArea autoFocus rows={3} value={reason} maxLength={FORUM_LIMITS.reportReasonMax + 50} onChange={(e) => setReason(e.target.value)} />
        <small>{t.reportHint}</small>
      </Field>
      <Row>
        <Button type="button" $small $variant="ghost" onClick={() => onDone(false)}>
          {t.cancel}
        </Button>
        <Button type="submit" $small $variant="danger" disabled={busy}>
          {busy ? t.sending : t.reportSend}
        </Button>
      </Row>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Form>
  )
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`
