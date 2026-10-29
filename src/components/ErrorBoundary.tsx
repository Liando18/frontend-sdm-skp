import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              padding: '36px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              Terjadi Kendala Tampilan
            </h1>

            <p
              style={{
                fontSize: '14px',
                color: '#64748B',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              Aplikasi mendeteksi anomali pada proses render data tabel. Data Anda tetap aman.
              Silakan segarkan halaman untuk memuat ulang sistem.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#334155',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid #CBD5E1',
                }}
              >
                <strong>Detail Kesalahan:</strong>
                <div style={{ marginTop: '4px', wordBreak: 'break-word' }}>
                  {this.state.error.message}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
              >
                <RefreshCw size={16} />
                Muat Ulang Halaman
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              >
                <Home size={16} />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
