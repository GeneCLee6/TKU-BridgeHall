import { Component, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { reportError } from '../lib/errorReport.ts'
import { strings } from '../strings.ts'
import { Button, Muted, PageMain, PageTitle } from './ui.tsx'

interface Props {
  children: ReactNode
  /** Going to another page clears the error */
  pathname: string
}

/**
 * Catches what the pages throw while rendering (e10-t06): reports it (kind `boundary`) and offers
 * to reload, instead of leaving a blank page. A chunk that failed to load after a deploy lands
 * here too, and reloading fetches the new one.
 */
type State = { error: boolean; pathname: string }

class Boundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: false, pathname: props.pathname }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { error: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.pathname === state.pathname ? null : { error: false, pathname: props.pathname }
  }

  componentDidCatch(error: unknown) {
    reportError('boundary', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <PageMain role="alert">
        <PageTitle>{strings.crashTitle}</PageTitle>
        <Muted>{strings.crashBody}</Muted>
        <Button type="button" $variant="primary" onClick={() => window.location.reload()}>
          {strings.updateReload}
        </Button>
      </PageMain>
    )
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return <Boundary pathname={useLocation().pathname}>{children}</Boundary>
}
