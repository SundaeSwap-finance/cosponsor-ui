import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/shadcn/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface IErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface IErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Catches uncaught render errors anywhere in its child tree and shows a
 * friendly fallback UI instead of crashing the whole app to a white screen.
 *
 * Note: React error boundaries do NOT catch errors in event handlers, async
 * code, or server-side rendering — they only catch errors thrown during render.
 * For async blockchain errors, components handle those locally with try/catch.
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={'flex min-h-[60vh] w-full items-center justify-center p-8'}>
          <div className={'flex max-w-md flex-col items-center gap-6 text-center'}>
            <div
              className={
                'bg-sun-action-tertiary/10 text-sun-action-tertiary flex size-16 items-center justify-center rounded-full'
              }
            >
              <AlertTriangle className={'size-8'} />
            </div>
            <div className={'flex flex-col gap-2'}>
              <h2 className={'sun-text-20-md text-sun-header'}>Something went wrong</h2>
              <p className={'sun-text-14-rg text-sun-default'}>
                An unexpected error occurred. You can try recovering, or reload the page if the
                issue persists.
              </p>
              {this.state.error?.message && (
                <p
                  className={
                    'sun-text-12-rg text-sun-muted bg-sun-surface-muted mt-2 rounded-md p-3 font-mono break-words'
                  }
                >
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className={'flex flex-row gap-2'}>
              <Button variant="secondary" onClick={this.handleReset}>
                <RotateCcw className={'size-4'} />
                Try again
              </Button>
              <Button onClick={this.handleReload}>Reload page</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
