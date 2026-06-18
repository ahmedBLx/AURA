import React from 'react';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-container">
                <div className="footer-brand-col">
                    <a href="#" onClick={(e) => e.preventDefault()} className="brand-logo footer-logo">
                        <svg className="brand-logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="60" cy="28" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                            <circle cx="60" cy="52" r="22" stroke="#FFFFFF" strokeWidth="5" fill="rgba(255, 255, 255, 0.05)" />
                            <path d="M 12 105 L 22 85 L 32 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 40 85 L 40 95 C 40 105 60 105 60 95 L 60 85" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 68 105 L 68 85 H 74 C 81 85 81 95 74 95 H 68 M 74 95 L 80 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 96 105 L 106 85 L 116 105" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                            <text x="117" y="88" fill="#FFFFFF" fontSize="8" fontFamily="sans-serif" fontWeight="bold">®</text>
                        </svg>
                    </a>
                    <p className="footer-tagline">Dare To Dream</p>
                    <p className="footer-desc">Premium sneaker and lifestyle design. Crafted for the creators, explorers, and dreamers.</p>
                </div>
                
                <div className="footer-links-col">
                    <h4>Collections</h4>
                    <ul>
                        <li><a href="#nomad" onClick={(e) => e.preventDefault()}>AURA Nomad</a></li>
                        <li><a href="#eclipse" onClick={(e) => e.preventDefault()}>AURA Eclipse</a></li>
                        <li><a href="#horizon" onClick={(e) => e.preventDefault()}>AURA Horizon</a></li>
                        <li><a href="#retro" onClick={(e) => e.preventDefault()}>AURA Retro</a></li>
                    </ul>
                </div>

                <div className="footer-links-col">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="#chat" onClick={(e) => e.preventDefault()}>Live Support</a></li>
                        <li><a href="#shipping" onClick={(e) => e.preventDefault()}>Shipping Details</a></li>
                        <li><a href="#returns" onClick={(e) => e.preventDefault()}>Returns & Exchanges</a></li>
                        <li><a href="#care" onClick={(e) => e.preventDefault()}>Sneaker Care Guide</a></li>
                    </ul>
                </div>

                <div className="footer-links-col">
                    <h4>Join the Club</h4>
                    <p className="newsletter-text">Subscribe to receive early drops and priority access.</p>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Your email address" className="newsletter-input" disabled />
                        <button className="newsletter-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>JOIN</button>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 AURA. All rights reserved. Designed for young adults and sneaker enthusiasts.</p>
            </div>
        </footer>
    );
};

export default Footer;
