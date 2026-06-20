import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const openTimeRef = useRef(0);

    const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
    const [successMessage, setSuccessMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Form inputs state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupAdminCode, setSignupAdminCode] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);

    // Validation errors state
    const [errors, setErrors] = useState({});

    // Reset forms on close or change tab
    useEffect(() => {
        if (!isOpen) {
            resetForms();
        } else {
            openTimeRef.current = Date.now();
        }
    }, [isOpen]);


    const resetForms = () => {
        setActiveTab('login');
        setIsSuccess(false);
        setSuccessMessage('');
        
        setLoginEmail('');
        setLoginPassword('');
        setShowLoginPassword(false);
        
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupAdminCode('');
        setShowSignupPassword(false);
        setTermsChecked(false);
        
        setErrors({});
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!validateEmail(loginEmail)) {
            newErrors.loginEmail = true;
        }
        if (loginPassword.length < 1) {
            newErrors.loginPassword = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const res = await login(loginEmail, loginPassword, 'admin');
        if (res.success) {
            setSuccessMessage("Admin authentication successful. Accessing console...");
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                navigate('/admin');
            }, 1800);
        } else {
            setErrors({
                loginEmail: true,
                loginPassword: true,
                loginPassText: res.message
            });
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (signupName.trim().length < 2) {
            newErrors.signupName = true;
        }
        if (!validateEmail(signupEmail)) {
            newErrors.signupEmail = true;
        }
        if (signupPassword.length < 8) {
            newErrors.signupPassword = true;
        }
        if (signupAdminCode !== 'A#D=M##NZ') {
            newErrors.signupAdminCode = true;
        }
        if (!termsChecked) {
            newErrors.terms = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const res = await signup(signupName, signupEmail, signupPassword, 'admin', signupAdminCode);
        if (res.success) {
            setSuccessMessage("Admin account created successfully. Redirecting...");
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                navigate('/admin');
            }, 1800);
        } else {
            if (res.field === 'email') {
                setErrors({ signupEmail: true, signupEmailText: res.message });
            } else if (res.field === 'adminCode') {
                setErrors({ signupAdminCode: true });
            } else {
                setErrors({ signupEmail: true, signupEmailText: res.message });
            }
        }
    };

    // ESC close keybind
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="auth-backdrop active" 
            onClick={(e) => {
                if (Date.now() - openTimeRef.current > 400 && e.target.classList.contains('auth-backdrop')) {
                    onClose();
                }
            }}
        >
            <div className="auth-modal-wrapper">
                <div className="auth-modal-content">
                    <button className="auth-close-btn" onClick={onClose} aria-label="Close authentication modal">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    {/* Success State */}
                    <div className={`auth-success-state ${isSuccess ? 'active' : ''}`}>
                        <div className="success-checkmark-wrapper">
                            <svg className="checkmark-svg" viewBox="0 0 52 52">
                                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <h3>Welcome to AURA Admin</h3>
                        <p>{successMessage}</p>
                    </div>

                    {/* Auth Header */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-gold)', letterSpacing: '0.1em' }}>ADMIN PORTAL</h2>
                    </div>

                    {/* Auth Tabs */}
                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('login'); setErrors({}); }}
                        >
                            Sign In
                        </button>
                        <button 
                            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('signup'); setErrors({}); }}
                        >
                            Register Admin
                        </button>
                    </div>

                    <div className="auth-forms-container">
                        {/* Login Form */}
                        {activeTab === 'login' && (
                            <form className="auth-form active" onSubmit={handleLoginSubmit}>
                                <div className={`form-group ${errors.loginEmail ? 'invalid' : ''}`}>
                                    <label htmlFor="login-email">Admin Email Address</label>
                                    <input 
                                        type="email" 
                                        id="login-email" 
                                        required 
                                        placeholder="admin@aura.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                    />
                                    <span className="error-text">Please enter a valid email address.</span>
                                </div>
                                <div className={`form-group ${errors.loginPassword ? 'invalid' : ''}`}>
                                    <div className="label-row">
                                        <label htmlFor="login-password">Password</label>
                                    </div>
                                    <div className="input-with-icon">
                                        <input 
                                            type={showLoginPassword ? "text" : "password"} 
                                            id="login-password" 
                                            required 
                                            placeholder="••••••••"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                        />
                                        <button 
                                            type="button" 
                                            className="toggle-password" 
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            style={{ color: showLoginPassword ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.4)' }}
                                            aria-label="Toggle password visibility"
                                        >
                                            <svg className="icon eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        </button>
                                    </div>
                                    <span className="error-text">{errors.loginPassText || "Password is required."}</span>
                                </div>
                                <button type="submit" className="auth-submit-btn">SIGN IN TO ADMIN</button>
                            </form>
                        )}

                        {/* Sign Up Form */}
                        {activeTab === 'signup' && (
                            <form className="auth-form active" onSubmit={handleSignupSubmit}>
                                <div className={`form-group ${errors.signupName ? 'invalid' : ''}`}>
                                    <label htmlFor="signup-name">Full Name</label>
                                    <input 
                                        type="text" 
                                        id="signup-name" 
                                        required 
                                        placeholder="e.g. Alex Carter"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                    />
                                    <span className="error-text">Name is required.</span>
                                </div>
                                <div className={`form-group ${errors.signupEmail ? 'invalid' : ''}`}>
                                    <label htmlFor="signup-email">Email Address</label>
                                    <input 
                                        type="email" 
                                        id="signup-email" 
                                        required 
                                        placeholder="name@domain.com"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                    />
                                    <span className="error-text">{errors.signupEmailText || "Please enter a valid email address."}</span>
                                </div>
                                <div className={`form-group ${errors.signupPassword ? 'invalid' : ''}`}>
                                    <label htmlFor="signup-password">Password</label>
                                    <div className="input-with-icon">
                                        <input 
                                            type={showSignupPassword ? "text" : "password"} 
                                            id="signup-password" 
                                            required 
                                            placeholder="At least 8 characters"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                        />
                                        <button 
                                            type="button" 
                                            className="toggle-password" 
                                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                                            style={{ color: showSignupPassword ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.4)' }}
                                            aria-label="Toggle password visibility"
                                        >
                                            <svg className="icon eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        </button>
                                    </div>
                                    <span className="error-text">Password must be at least 8 characters.</span>
                                </div>

                                <div className={`form-group ${errors.signupAdminCode ? 'invalid' : ''}`} id="signup-admin-code-group">
                                    <label htmlFor="signup-admin-code">Admin Verification Code</label>
                                    <input 
                                        type="password" 
                                        id="signup-admin-code" 
                                        required
                                        placeholder="Enter admin security code"
                                        value={signupAdminCode}
                                        onChange={(e) => setSignupAdminCode(e.target.value)}
                                    />
                                    <span className="error-text">Admin verification code is incorrect or missing.</span>
                                </div>

                                <div className="form-options">
                                    <label className="checkbox-container">
                                        <input 
                                            type="checkbox" 
                                            id="signup-terms" 
                                            required 
                                            checked={termsChecked}
                                            onChange={(e) => setTermsChecked(e.target.checked)}
                                        />
                                        <span className="checkbox-checkmark"></span>
                                        <span className="checkbox-label">I agree to the Terms of Service & Privacy Policy</span>
                                    </label>
                                </div>
                                <button type="submit" className="auth-submit-btn">CREATE ADMIN ACCOUNT</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
