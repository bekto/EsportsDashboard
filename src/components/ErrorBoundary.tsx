import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Catches render-time errors so one bad component can't blank the whole page. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="max-w-md text-sm text-zinc-400">{error.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
        >
          Reload
        </button>
      </div>
    )
  }
}
