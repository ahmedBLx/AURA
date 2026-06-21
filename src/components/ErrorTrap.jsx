'use client';

// App-wide runtime error trap (diagnostic).
//
// React error boundaries only catch errors thrown during render/lifecycle.
// They do NOT catch errors in event handlers, async callbacks, or failed
// script/chunk loads — which is exactly what "breaks when performing an action"
// looks like. This component listens at the window level for ALL of those and
// shows them on-screen, so issues on devices without dev tools (old iPhones)
// are visible instead of silent.
//
// It is OFF by default and never shown to normal users. Enable it on a test
// device by visiting any page with `?debug=1` appended to the URL; the flag is
// then remembered for the session. Errors are persisted to sessionStorage so
// they survive a page reload (important when the bug causes a refresh loop).
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'aura_errlog';

export default function ErrorTrap() {
  const [enabled, setEnabled] = useState(false);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const on = params.get('debug') === '1' || localStorage.getItem('aura_debug') === '1';
    if (on) localStorage.setItem('aura_debug', '1');
    setEnabled(on);
    if (!on) return;

    // Restore any errors captured right before a reload.
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) setLog(saved);
    } catch {}

    const push = (entry) => {
      setLog((prev) => {
        const next = [...prev.slice(-9), { ...entry, t: new Date().toISOString().slice(11, 19) }];
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    const onError = (e) => {
      // Resource load failure (script/chunk/img/css) — target carries src/href.
      const target = e.target;
      if (target && target !== window && (target.src || target.href)) {
        push({ type: 'resource', msg: `Failed to load: ${target.src || target.href}` });
        return;
      }
      push({
        type: 'error',
        msg: (e.error && (e.error.stack || e.error.message)) || e.message || 'Unknown error',
        where: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : '',
      });
    };

    const onRejection = (e) => {
      const r = e.reason;
      push({ type: 'promise', msg: (r && (r.stack || r.message)) || String(r) });
    };

    // Capture phase (true) so resource-load errors, which don't bubble, are caught.
    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!enabled) return null;

  const clear = () => {
    setLog([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const disable = () => {
    localStorage.removeItem('aura_debug');
    clear();
    setEnabled(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        maxHeight: '45vh',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.93)',
        color: '#fff',
        font: '11px/1.45 ui-monospace, Menlo, monospace',
        padding: '10px 12px',
        borderTop: '2px solid #C5A880',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ color: '#C5A880' }}>AURA debug · {log.length} captured</strong>
        <span>
          <button onClick={clear} style={btn}>clear</button>
          <button onClick={disable} style={{ ...btn, marginLeft: 6 }}>off</button>
        </span>
      </div>
      {log.length === 0 ? (
        <div style={{ opacity: 0.6 }}>No errors yet. Reproduce the action that breaks.</div>
      ) : (
        log.map((l, i) => (
          <div key={i} style={{ marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <span style={{ color: '#ff6b6b' }}>
              {l.t} [{l.type}]
            </span>{' '}
            {l.msg}
            {l.where ? `\n  @ ${l.where}` : ''}
          </div>
        ))
      )}
    </div>
  );
}

const btn = {
  background: '#C5A880',
  color: '#0A0A0A',
  border: 'none',
  borderRadius: 4,
  padding: '3px 10px',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};
