import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SocialMedia from '../components/SocialMedia';

const LoginPage = () => {
    const { login, signup, user } = useAuth();
    const navigate = useNavigate();

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

    // Redirect if already logged in as admin
    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

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

    return (
        <main className="login-page-container" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', position: 'relative' }}>
            <style>{`
                .login-card {
                    --border-color: rgba(255, 255, 255, 0.08);
                    --input-bg: rgba(255, 255, 255, 0.03);
                    --input-border: rgba(255, 255, 255, 0.1);
                    --input-bg-focus: rgba(255, 255, 255, 0.06);
                    --text-color: #FFFFFF;
                    --placeholder-color: rgba(255, 255, 255, 0.4);
                    background-color: rgba(10, 10, 10, 0.85);
                    backdrop-filter: none; /* Removed blur to prevent iOS Safari crashes */
                    -webkit-backdrop-filter: none;
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg);
                    padding: 40px;
                    max-width: 460px;
                    width: 100%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
                    position: relative;
                    color: var(--text-color);
                }
                .login-card::before {
                    content: '';
                    position: absolute;
                    top: -1.5px;
                    left: -1.5px;
                    right: -1.5px;
                    bottom: -1.5px;
                    background: linear-gradient(90deg, #FF5E97, #A044FF, #00D2FF, #FF5E97);
                    background-size: 300% 100%;
                    border-radius: var(--border-radius-lg);
                    z-index: -1;
                    animation: borderGlow 6s linear infinite;
                }
                .portal-title {
                    font-family: var(--font-heading);
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--color-gold);
                    letter-spacing: 0.1em;
                    text-align: center;
                    margin-bottom: 24px;
                }
                
                /* Reusing existing auth-tabs and form styles */
                .auth-tabs {
                    display: flex;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    margin-bottom: 24px;
                    width: 100%;
                }
                .auth-tab-btn {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: var(--font-heading);
                    font-weight: 500;
                    font-size: 13.5px;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    border-bottom: 2px solid transparent;
                    text-align: center;
                }
                .auth-tab-btn.active {
                    color: var(--color-gold);
                    border-bottom-color: var(--color-gold);
                }
                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .form-group label {
                    font-size: 11.5px;
                    font-weight: 500;
                    color: var(--color-text-muted, #9CA3AF);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .form-group input {
                    background-color: var(--input-bg);
                    border: 1px solid var(--input-border);
                    border-radius: 8px;
                    padding: 11px 14px;
                    color: #FFFFFF;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    outline: none;
                    transition: var(--transition-smooth);
                }
                .form-group input:focus {
                    border-color: var(--color-gold);
                    background-color: var(--input-bg-focus);
                }
                .form-group.invalid input {
                    border-color: #EF4444;
                }
                .error-text {
                    font-size: 11px;
                    color: #EF4444;
                    margin-top: 2px;
                    display: none;
                }
                .form-group.invalid .error-text {
                    display: block;
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    width: 100%;
                }
                .input-with-icon input {
                    width: 100%;
                    padding-right: 44px;
                }
                .toggle-password {
                    position: absolute;
                    right: 0;
                    top: 0;
                    height: 100%;
                    width: 44px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition-smooth);
                }
                .toggle-password .icon {
                    width: 16px;
                    height: 16px;
                }
                .auth-submit-btn {
                    margin-top: 10px;
                    padding: 12px;
                    background-color: var(--color-gold);
                    color: var(--color-primary, #0A0A0A);
                    font-family: var(--font-heading);
                    font-weight: 600;
                    font-size: 12.5px;
                    letter-spacing: 0.05em;
                    border-radius: var(--border-radius-pill, 50px);
                    border: none;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    text-transform: uppercase;
                }
                .auth-submit-btn:hover {
                    background-color: #FFFFFF;
                    color: #0A0A0A;
                }
                .form-options {
                    margin-top: 4px;
                }
                
                /* Checkbox styles */
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--color-text-muted);
                    user-select: none;
                }
                
                /* Success state overlay */
                .auth-success-state {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #0A0A0A;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    text-align: center;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.35s ease;
                    border-radius: calc(var(--border-radius-lg) - 1.5px);
                }
                .auth-success-state.active {
                    opacity: 1;
                    pointer-events: auto;
                }
                .success-checkmark-wrapper {
                    width: 80px;
                    height: 80px;
                    margin-bottom: 24px;
                }
                .checkmark-svg {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: block;
                    stroke-width: 2;
                    stroke: var(--color-gold);
                    stroke-miterlimit: 10;
                    box-shadow: inset 0px 0px 0px var(--color-gold);
                    animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s unique;
                }
                .checkmark-circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-width: 2;
                    stroke-miterlimit: 10;
                    stroke: var(--color-gold);
                    fill: none;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                .checkmark-check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                }
                @keyframes stroke {
                    100% { stroke-dashoffset: 0; }
                }
                
                /* Light Theme overrides */
                html.light-theme .login-card {
                    --border-color: rgba(0, 0, 0, 0.08) !important;
                    --input-bg: rgba(0, 0, 0, 0.03) !important;
                    --input-border: rgba(0, 0, 0, 0.1) !important;
                    --input-bg-focus: rgba(0, 0, 0, 0.05) !important;
                    --text-color: #111827 !important;
                    background-color: rgba(255, 255, 255, 0.95) !important;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08) !important;
                }
                html.light-theme .auth-tab-btn {
                    color: rgba(0, 0, 0, 0.4);
                }
                html.light-theme .form-group input {
                    color: #111827;
                }
                html.light-theme .auth-success-state {
                    background-color: #FFFFFF;
                    color: #111827;
                }
                html.light-theme .auth-success-state h3 {
                    color: #111827;
                }
            `}</style>

            <div className="login-card">
                {/* Success State */}
                <div className={`auth-success-state ${isSuccess ? 'active' : ''}`}>
                    <div className="success-checkmark-wrapper">
                        <svg className="checkmark-svg" viewBox="0 0 52 52">
                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '8px' }}>Welcome to AURA Admin</h3>
                    <p style={{ fontSize: '15px', color: 'var(--color-text-muted)' }}>{successMessage}</p>
                </div>

                {/* Portal Title */}
                <div className="portal-title">ADMIN PORTAL</div>

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
                        <form className="auth-form" onSubmit={handleLoginSubmit}>
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
                                <label htmlFor="login-password">Password</label>
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
                        <form className="auth-form" onSubmit={handleSignupSubmit}>
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
                                        style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    <span className="checkbox-label">I agree to the Terms of Service & Privacy Policy</span>
                                </label>
                            </div>
                            <button type="submit" className="auth-submit-btn">CREATE ADMIN ACCOUNT</button>
                        </form>
                    )}
                </div>
            </div>

            <SocialMedia />
        </main>
    );
};

export default LoginPage;
