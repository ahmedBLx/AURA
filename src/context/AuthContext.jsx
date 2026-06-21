'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/$/, '')}/api/v1/auth`;

    // Helper to get auth header
    const getHeaders = (token) => {
        const activeToken = token || localStorage.getItem('aura_token');
        return {
            'Content-Type': 'application/json',
            ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        };
    };

    // Load admin users list
    const fetchAdminUsers = async (token) => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: getHeaders(token)
            });
            if (res.ok) {
                const result = await res.json();
                setUsers(result.data.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch admin users:', err);
        }
    };

    // Initialize session from API
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('aura_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/me`, {
                    headers: getHeaders(token)
                });
                if (res.ok) {
                    const result = await res.json();
                    const me = result.data.user;
                    setUser(me);
                    localStorage.setItem('aura_username', me.name.split(' ')[0]);
                    localStorage.setItem('aura_user_role', me.role);

                    if (me.role === 'admin') {
                        await fetchAdminUsers(token);
                    }
                } else {
                    // Token expired or invalid
                    logout();
                }
            } catch (err) {
                console.error('Session verification error:', err);
                // Fallback to offline/cached user if available
                const sessionUser = localStorage.getItem('aura_username');
                const sessionRole = localStorage.getItem('aura_user_role');
                if (sessionUser && sessionRole) {
                    setUser({ name: sessionUser, role: sessionRole });
                }
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    const login = async (email, password, role) => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, message: result.message || "Invalid credentials or request error." };
            }

            const { user: loggedUser, accessToken } = result.data;

            if (loggedUser.role !== role) {
                return { success: false, message: `Access denied. Selected role is not matched with your account role: ${loggedUser.role}` };
            }

            localStorage.setItem('aura_token', accessToken);
            localStorage.setItem('aura_username', loggedUser.name.split(' ')[0]);
            localStorage.setItem('aura_user_role', loggedUser.role);
            setUser(loggedUser);

            if (loggedUser.role === 'admin') {
                await fetchAdminUsers(accessToken);
            }

            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: "Network connection error. Failed to connect to server." };
        }
    };

    const signup = async (name, email, password, role, adminCode) => {
        try {
            const bodyData = { name, email, password, role };
            if (role === 'admin') {
                bodyData.adminCode = adminCode;
            }

            const res = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const result = await res.json();

            if (!res.ok) {
                return { 
                    success: false, 
                    message: result.message || "Sign up failed.", 
                    field: result.message?.includes('Email') ? 'email' : (role === 'admin' ? 'adminCode' : '')
                };
            }

            const { user: registeredUser, accessToken } = result.data;

            localStorage.setItem('aura_token', accessToken);
            localStorage.setItem('aura_username', registeredUser.name.split(' ')[0]);
            localStorage.setItem('aura_user_role', registeredUser.role);
            setUser(registeredUser);

            if (registeredUser.role === 'admin') {
                await fetchAdminUsers(accessToken);
            }

            return { success: true };
        } catch (err) {
            console.error('Signup error:', err);
            return { success: false, message: "Network connection error. Failed to sign up." };
        }
    };

    const logout = async () => {
        const token = localStorage.getItem('aura_token');
        if (token) {
            try {
                await fetch(`${API_URL}/logout`, {
                    method: 'POST',
                    headers: getHeaders(token),
                    body: JSON.stringify({ refreshToken: token }) // optional body
                });
            } catch (err) {
                console.error('Logout request error:', err);
            }
        }
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_username');
        localStorage.removeItem('aura_user_role');
        setUser(null);
        setUsers([]);
    };

    return (
        <AuthContext.Provider value={{ user, users, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
