'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error('ErrorBoundary captured a crash:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    handleClearCacheAndReload = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('aura_cart');
            localStorage.removeItem('aura_products');
            localStorage.removeItem('aura_categories');
            localStorage.removeItem('aura_orders');
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_username');
            localStorage.removeItem('aura_user_role');
            sessionStorage.clear();
            window.location.href = '/';
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={containerStyle}>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                    <div style={cardStyle}>
                        <div style={logoWrapperStyle}>
                            <svg style={logoStyle} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="60" cy="39" r="22" stroke="#C5A880" strokeWidth="5" fill="rgba(197, 168, 128, 0.05)" />
                                <circle cx="60" cy="49" r="22" stroke="#C5A880" strokeWidth="5" fill="rgba(197, 168, 128, 0.05)" />
                            </svg>
                        </div>
                        <h1 style={titleStyle}>SYSTEM GLITCH DETECTED</h1>
                        <p style={subtitleStyle}>
                            AURA encountered an unexpected rendering error. We have safeguarded your session.
                        </p>
                        
                        {this.state.error && (
                            <details style={detailsStyle}>
                                <summary style={summaryStyle}>View Diagnostic Details</summary>
                                <pre style={preStyle}>
                                    {this.state.error.stack || this.state.error.message || String(this.state.error)}
                                </pre>
                            </details>
                        )}

                        <div style={actionsStyle}>
                            <button onClick={this.handleReset} style={primaryBtnStyle}>
                                Return Home
                            </button>
                            <button onClick={this.handleClearCacheAndReload} style={secondaryBtnStyle}>
                                Reset Cache & Reload
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Inline styling for zero-dependency loading speed & reliability
const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#050505',
    backgroundImage: 'radial-gradient(circle at center, rgba(197, 168, 128, 0.03) 0%, transparent 70%)',
    fontFamily: 'var(--font-body, "Outfit", sans-serif)',
    color: '#FFFFFF',
    boxSizing: 'border-box'
};

const cardStyle = {
    maxWidth: '480px',
    width: '100%',
    backgroundColor: 'rgba(10, 10, 10, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(197, 168, 128, 0.15)',
    borderRadius: '24px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 50px rgba(197, 168, 128, 0.02)',
    animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
};

const logoWrapperStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px'
};

const logoStyle = {
    width: '80px',
    height: '80px'
};

const titleStyle = {
    fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '0.12em',
    color: '#C5A880',
    margin: '0 0 12px 0',
    textTransform: 'uppercase'
};

const subtitleStyle = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#9CA3AF',
    margin: '0 0 24px 0'
};

const detailsStyle = {
    textAlign: 'left',
    marginBottom: '24px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)'
};

const summaryStyle = {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    outline: 'none',
    userSelect: 'none'
};

const preStyle = {
    margin: '0',
    padding: '16px',
    overflowX: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '11px',
    lineHeight: '1.5',
    color: '#EF4444',
    maxHeight: '180px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
};

const actionsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const primaryBtnStyle = {
    padding: '14px',
    backgroundColor: '#C5A880',
    color: '#0A0A0A',
    fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.08em',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease'
};

const secondaryBtnStyle = {
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#C5A880',
    fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.08em',
    border: '1px solid rgba(197, 168, 128, 0.3)',
    borderRadius: '50px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease'
};
