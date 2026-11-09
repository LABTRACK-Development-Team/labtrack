import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; errorInfo?: ErrorInfo; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', background: '#0a0a0a', color: '#ff5555', minHeight: '100vh', overflow: 'auto' }}>
          <h1 style={{ fontSize: 24, marginBottom: 20 }}>⚠️ Runtime Error — Copy Mo Ito</h1>
          <h2 style={{ color: '#ffaa00', fontSize: 18 }}>Message:</h2>
          <pre style={{ background: '#000', padding: 15, fontSize: 14, whiteSpace: 'pre-wrap', border: '1px solid #ff5555', borderRadius: 8 }}>
            {this.state.error?.message}
          </pre>
          <h2 style={{ color: '#ffaa00', fontSize: 18 }}>Stack (first 15 lines):</h2>
          <pre style={{ background: '#000', padding: 15, fontSize: 12, whiteSpace: 'pre-wrap', border: '1px solid #666', borderRadius: 8 }}>
            {this.state.error?.stack?.split('\n').slice(0, 15).join('\n')}
          </pre>
          <h2 style={{ color: '#ffaa00', fontSize: 18 }}>Component Stack:</h2>
          <pre style={{ background: '#000', padding: 15, fontSize: 12, whiteSpace: 'pre-wrap', border: '1px solid #666', borderRadius: 8 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); location.href = '/login/admin'; }}
            style={{ marginTop: 20, padding: '12px 24px', background: '#cc0000', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 'bold' }}>
            Clear Storage & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;