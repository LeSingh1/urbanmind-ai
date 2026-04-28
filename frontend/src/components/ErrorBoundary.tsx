import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  onReset: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[UrbanMind] Render failed', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex items-center justify-center p-6">
        <div className="max-w-lg bg-bg-panel border border-border-subtle rounded-lg p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-accent-red mb-2">
            App view crashed
          </div>
          <h1 className="text-xl font-semibold mb-2">UrbanMind needs a reset</h1>
          <p className="text-sm text-text-secondary mb-4">
            The current browser session hit a render error. Resetting clears the in-memory city and
            simulation state without changing the running server.
          </p>
          <pre className="text-xs text-text-muted bg-bg-card rounded p-3 overflow-auto mb-4">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              this.props.onReset()
            }}
            className="px-3 py-2 bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-lg text-sm font-medium hover:bg-accent-blue/30"
          >
            Reset App
          </button>
        </div>
      </div>
    )
  }
}
