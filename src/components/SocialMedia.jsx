import React, { useState, useEffect, useRef } from 'react';

const SocialMedia = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [whatsappOpen, setWhatsappOpen] = useState(false);
    const containerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setWhatsappOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setWhatsappOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="floating-social-container" ref={containerRef}>
            {/* Social Media Toggle Button */}
            <button 
                className={`social-toggle-btn ${isOpen ? 'active' : ''}`}
                id="social-toggle"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (isOpen) setWhatsappOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Toggle Social Media Links"
            >
                {/* Custom share/social network icon representation */}
                <svg className="icon social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>CONNECT US</span>
            </button>

            {/* Social Media Panel */}
            <div className={`social-panel ${isOpen ? 'active' : ''} ${whatsappOpen ? 'whatsapp-expanded' : ''}`} id="social-panel">
                <div className="social-panel-header">
                    <h4>Connect with Us</h4>
                </div>
                
                <div className="social-options">
                    {/* Instagram */}
                    <a 
                        href="https://www.instagram.com/aura.eg.store?igsh=MTE5MHgxeXZjNmtseA==" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-option-item instagram-item"
                    >
                        <div className="social-option-left">
                            <svg className="icon instagram-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <defs>
                                    <linearGradient id="instagram-glow" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#f9ce34" />
                                        <stop offset="50%" stopColor="#ee2a7b" />
                                        <stop offset="100%" stopColor="#6228d7" />
                                    </linearGradient>
                                </defs>
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#instagram-glow)"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#instagram-glow)"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#instagram-glow)"></line>
                            </svg>
                            <span>Instagram</span>
                        </div>
                        <svg className="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </a>

                    {/* TikTok */}
                    <a 
                        href="https://www.tiktok.com/@aurashoes1?_r=1&_t=ZS-97LHKgCndfJ" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-option-item tiktok-item"
                    >
                        <div className="social-option-left">
                            <svg className="icon tiktok-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <defs>
                                    <linearGradient id="tiktok-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00f2fe" />
                                        <stop offset="100%" stopColor="#fe0979" />
                                    </linearGradient>
                                </defs>
                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="url(#tiktok-glow)"></path>
                            </svg>
                            <span>TikTok</span>
                        </div>
                        <svg className="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </a>

                    {/* WhatsApp Accordion */}
                    <div className={`social-option-whatsapp-group ${whatsappOpen ? 'open' : ''}`}>
                        <button 
                            className="social-option-item whatsapp-trigger"
                            onClick={() => setWhatsappOpen(!whatsappOpen)}
                            aria-expanded={whatsappOpen}
                        >
                            <div className="whatsapp-trigger-left">
                                <svg className="icon whatsapp-icon" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                                <span>WhatsApp</span>
                            </div>
                            <svg className={`chevron-icon ${whatsappOpen ? 'rotated' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <polyline points="1 1 5 5 9 1" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>

                        {/* WhatsApp Contact Numbers Submenu */}
                        <div className={`whatsapp-submenu ${whatsappOpen ? 'show' : ''}`}>
                            <a 
                                href="https://wa.me/201208471151" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="whatsapp-number-item"
                            >
                                <span className="number-label">Customer Support 1</span>
                                <span className="number-value">
                                    <svg className="icon whatsapp-number-icon" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', marginRight: '6px' }}>
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    +20 12 08471151
                                </span>
                            </a>
                            <a 
                                href="https://wa.me/201010817058" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="whatsapp-number-item"
                            >
                                <span className="number-label">Customer Support 2</span>
                                <span className="number-value">
                                    <svg className="icon whatsapp-number-icon" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', marginRight: '6px' }}>
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    +20 10 10817058
                                </span>
                            </a>
                            <a 
                                href="https://wa.me/201008598805" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="whatsapp-number-item"
                            >
                                <span className="number-label">Sales & Orders</span>
                                <span className="number-value">
                                    <svg className="icon whatsapp-number-icon" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', marginRight: '6px' }}>
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    +20 10 08598805
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialMedia;
