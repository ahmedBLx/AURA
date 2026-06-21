'use client';

// Root-level error boundary. In the App Router, when a client error escapes all
// other boundaries (e.g. a hydration failure), Next.js's last-resort recovery is
// a HARD navigation (full page reload) to the same URL. If the error is
// deterministic — as a browser-incompatibility error is — that reload hits the
// same error again, producing an infinite refresh loop that ends in a Safari tab
// crash on old iPhones.
//
// This boundary catches that error and renders a static fallback INSTEAD of
// reloading, breaking the loop. It also surfaces the actual error text so the
// real root cause is visible on the device rather than hidden behind a crash.
import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0A0A0A',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '440px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            We hit an unexpected error. Please try again, or update your device&apos;s
            iOS / browser if this keeps happening.
          </p>

          <button
            onClick={() => reset()}
            style={{
              padding: '11px 22px',
              backgroundColor: '#C5A880',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: '50px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>

          {error?.message ? (
            <pre
              style={{
                marginTop: '24px',
                padding: '12px',
                fontSize: '11px',
                lineHeight: 1.5,
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'rgba(255,255,255,0.5)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                overflowX: 'auto',
              }}
            >
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : ''}
            </pre>
          ) : null}
        </div>
      </body>
    </html>
  );
}
