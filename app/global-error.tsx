'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '1rem',
          background: '#09090b',
          color: '#fafafa',
        }}>
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Erro crítico
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
              Ocorreu um erro grave na aplicação. Tente recarregar a página.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
