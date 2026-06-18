import React, { useState, useEffect, useRef } from 'react';

const LiveChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! Welcome to AURA support. How can I help you today?",
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom whenever messages list updates
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 300);
        }
    }, [isOpen]);

    const getSmartSupportReply = (userInput) => {
        const text = userInput.toLowerCase();
        if (text.includes('price') || text.includes('cost') || text.includes('how much')) {
            return "Our premium AURA Nomad sneakers are $190, which includes free worldwide delivery. Retro series are $220.";
        }
        if (text.includes('size') || text.includes('fit')) {
            return "AURA sneakers run true to size. If you're in between sizes, we recommend selecting the larger size.";
        }
        if (text.includes('delivery') || text.includes('shipping') || text.includes('ship')) {
            return "We offer free standard shipping globally. Shipping takes about 2 to 4 business days.";
        }
        if (text.includes('return') || text.includes('refund')) {
            return "We have a 30-day hassle-free return policy. Simply request a return from your dashboard.";
        }
        return `Thank you for reaching out! A customer specialist will be online with you in a moment to help with your question: "${userInput}"`;
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text) return;

        // Append user message
        const userMsg = {
            id: Date.now(),
            text,
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');

        // Simulate typing and bot response
        setTimeout(() => {
            setIsTyping(true);

            setTimeout(() => {
                setIsTyping(false);
                const replyText = getSmartSupportReply(text);
                const botMsg = {
                    id: Date.now() + 1,
                    text: replyText,
                    sender: "bot",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages((prev) => [...prev, botMsg]);
            }, 1200);
        }, 600);
    };

    return (
        <div className="floating-chat-container">
            {/* Typing Styles injection */}
            <style>{`
                .typing-indicator-msg .dot { 
                    width: 6px; 
                    height: 6px; 
                    background-color: var(--color-text-muted); 
                    border-radius: 50%; 
                    display: inline-block; 
                    animation: blink 1.4s infinite both; 
                }
                .typing-indicator-msg .dot:nth-child(2) { animation-delay: .2s; }
                .typing-indicator-msg .dot:nth-child(3) { animation-delay: .4s; }
                @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
            `}</style>

            {/* Chat Toggle Button */}
            <button 
                className="chat-toggle-btn" 
                id="chat-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Live Chat"
            >
                <svg className="icon chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>SUPPORT</span>
            </button>

            {/* Chat Widget Box */}
            <div className={`chat-widget ${isOpen ? 'active' : ''}`} id="chat-widget">
                <div className="chat-header">
                    <div className="chat-brand">
                        <div className="chat-logo">AU</div>
                        <div>
                            <h4>AURA assistant</h4>
                            <span className="chat-status">Online</span>
                        </div>
                    </div>
                    <button 
                        className="chat-close" 
                        id="chat-close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close Live Chat"
                    >
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Messages Panel */}
                <div className="chat-messages" id="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
                            <p>{msg.text}</p>
                            <span className="message-time">{msg.time}</span>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message bot-message typing-indicator-msg" id="typing-indicator">
                            <p style={{ display: 'flex', gap: '4px', alignItems: 'center', margin: 0 }}>
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Text Area Form */}
                <form className="chat-input-area" id="chat-form" onSubmit={handleSendMessage}>
                    <input 
                        type="text" 
                        id="chat-input"
                        className="chat-input"
                        placeholder="Ask about sizes, shipping, refunds..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        ref={inputRef}
                    />
                    <button type="submit" className="chat-send" aria-label="Send message">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LiveChat;
