/**
 * ErrorBoundary.tsx — ZERØ MERIDIAN push75
 * React class-based Error Boundary — isolasi crash per tile/page.
 * Jika satu tile WebSocket error / JSON parse error / Canvas exception,
 * hanya tile itu yang jatuh — seluruh halaman tetap hidup.
 *
 * Usage:
 *   <ErrorBoundary label="TradingViewChart">
 *     <TradingViewChart />
 *   </ErrorBoundary>
 *
 * rgba() only ✓  displayName ✓  Zero className ✓
 */

import { Component, ReactNode } from 'react';

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;
  label?:    string;
}

interface State {
  hasError: boolean;
  error?:   Error;
}

export class ErrorBoundary extends Component<Props, State> {
  static displayName = 'ErrorBoundary';

  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.warn('[ZM ErrorBoundary] ' + (this.props.label ?? 'component'), error.message, info.componentStack.slice(0, 200));
  }

  private readonly handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        aria-label={'Error: ' + (this.props.label ?? 'component')}
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '8px',
          padding:        '24px 16px',
          minHeight:      '80px',
          background:     'rgba(251,113,133,0.04)',
          border:         '1px solid rgba(251,113,133,0.15)',
          borderRadius:   '8px',
        }}
      >
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      '10px',
          color:         'rgba(251,113,133,0.8)',
          letterSpacing: '0.08em',
          fontWeight:    600,
        }}>
          {'⚠ ' + (this.props.label ? this.props.label.toUpperCase() + ' — ' : '') + 'ERROR'}
        </span>

        {this.state.error && (
          <span style={{
            fontFamily:  "'JetBrains Mono', monospace",
            fontSize:    '9px',
            color:       'rgba(148,163,184,0.4)',
            maxWidth:    '300px',
            textAlign:   'center',
            wordBreak:   'break-word',
            lineHeight:  1.5,
          }}>
            {this.state.error.message}
          </span>
        )}

        <button
          type="button"
          onClick={this.handleReset}
          aria-label="Retry component"
          style={{
            marginTop:     '4px',
            padding:       '4px 14px',
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '9px',
            letterSpacing: '0.08em',
            background:    'rgba(251,113,133,0.08)',
            border:        '1px solid rgba(251,113,133,0.25)',
            borderRadius:  '4px',
            color:         'rgba(251,113,133,0.7)',
            cursor:        'pointer',
          }}
        >
          RETRY
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
