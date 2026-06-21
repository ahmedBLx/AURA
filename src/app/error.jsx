'use client';

// Segment-level error boundary. Catches render/runtime errors within a route so
// a failure shows a recoverable fallback instead of bubbling up to the root and
// triggering Next.js's hard-reload recovery (which can loop on old browsers).
import React from 'react';

export default function Error({ error, reset }) {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
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
          Please try again. If this keeps happening, updating your device&apos;s
          iOS / browser may help.
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
    </div>
  );
}
