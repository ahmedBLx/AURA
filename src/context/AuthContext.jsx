'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load admin users list
    const fetchAdminUsers = useCallback(async (signal) => {
        try {
            const result = await apiClient.get('auth/users', { signal });
            if (signal?.aborted) return;
            setUsers(result.data.users || []);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Failed to fetch admin users:', err);
        }
    }, []);

    const logout = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
        if (token) {
            try {
                await apiClient.post('auth/logout', { refreshToken: token });
            } catch (err) {
                console.error('Logout request error:', err);
            }
        }
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_username');
        localStorage.removeItem('aura_user_role');
        setUser(null);
        setUsers([]);
    }, []);

    const login = useCallback(async (email, password, role) => {
        try {
            const result = await apiClient.post('auth/login', { email, password });
            const { user: loggedUser, accessToken } = result.data;

            if (loggedUser.role !== role) {
                return { success: false, message: `Access denied. Selected role is not matched with your account role: ${loggedUser.role}` };
            }

            localStorage.setItem('aura_token', accessToken);
            localStorage.setItem('aura_username', loggedUser.name.split(' ')[0]);
            localStorage.setItem('aura_user_role', loggedUser.role);
            setUser(loggedUser);

            if (loggedUser.role === 'admin') {
                await fetchAdminUsers();
            }

            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: err.message || "Network connection error. Failed to connect to server." };
        }
    }, [fetchAdminUsers]);

    const signup = useCallback(async (name, email, password, role, adminCode) => {
        try {
            const bodyData = { name, email, password, role };
            if (role === 'admin') {
                bodyData.adminCode = adminCode;
            }

            const result = await apiClient.post('auth/signup', bodyData);
            const { user: registeredUser, accessToken } = result.data;

            localStorage.setItem('aura_token', accessToken);
            localStorage.setItem('aura_username', registeredUser.name.split(' ')[0]);
            localStorage.setItem('aura_user_role', registeredUser.role);
            setUser(registeredUser);

            if (registeredUser.role === 'admin') {
                await fetchAdminUsers();
            }

            return { success: true };
        } catch (err) {
            console.error('Signup error:', err);
            return { 
                success: false, 
                message: err.message || "Sign up failed.", 
                field: err.message?.includes('Email') ? 'email' : (role === 'admin' ? 'adminCode' : '')
            };
        }
    }, [fetchAdminUsers]);

    // Initialize session from API
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const verifySession = async () => {
            const token = localStorage.getItem('aura_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const result = await apiClient.get('auth/me', { signal });
                if (signal.aborted) return;
                const me = result.data.user;
                setUser(me);
                localStorage.setItem('aura_username', me.name.split(' ')[0]);
                localStorage.setItem('aura_user_role', me.role);

                if (me.role === 'admin') {
                    await fetchAdminUsers(signal);
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                if (signal.aborted) return;
                console.error('Session verification error:', err);
                
                // If it is an explicit authentication error (401), clear stale credentials
                if (err.status === 401 || err.message?.includes('401') || err.message?.includes('token')) {
                    logout();
                } else {
                    // Fallback to offline/cached user ONLY for transient network/server-offline errors
                    const sessionUser = localStorage.getItem('aura_username');
                    const sessionRole = localStorage.getItem('aura_user_role');
                    if (sessionUser && sessionRole) {
                        setUser({ name: sessionUser, role: sessionRole });
                    } else {
                        logout();
                    }
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        verifySession();

        return () => {
            controller.abort();
        };
    }, [fetchAdminUsers, logout]);

    const value = useMemo(() => ({
        user,
        users,
        login,
        signup,
        logout,
        loading
    }), [user, users, login, signup, logout, loading]);

    return (
        // Always render children — do NOT gate the whole app behind `loading`.
        // Gating blanked every page until the /me request resolved, causing a
        // visible blank→content flicker (worst on slow old-device networks) and
        // delaying SSR content. Protected routes guard themselves via `loading`
        // (e.g. the admin page shows a "Verifying…" state); public pages don't
        // need auth, so they can render immediately.
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
