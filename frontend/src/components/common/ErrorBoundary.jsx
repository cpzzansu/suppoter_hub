import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const errMsg = err?.message ?? err?.toString?.() ?? '';
      return (
        <div
          style={{
            padding: 24,
            maxWidth: 480,
            margin: '40px auto',
            background: '#fff5f5',
            border: '1px solid #ffccc7',
            borderRadius: 12,
            color: '#333',
          }}
        >
          <h2 style={{ margin: '0 0 12px', color: '#cf1322' }}>
            오류가 발생했습니다
          </h2>
          <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
            페이지를 불러오는 중 문제가 생겼습니다. 새로고침하거나
            <br />
            다른 브라우저(예: Chrome)에서 다시 시도해 보세요.
          </p>
          {errMsg && (
            <details style={{ marginBottom: 16, fontSize: '0.85rem', color: '#666' }}>
              <summary style={{ cursor: 'pointer' }}>상세 정보</summary>
              <pre
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                }}
              >
                {errMsg}
              </pre>
            </details>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #cf1322',
              background: '#fff',
              color: '#cf1322',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
