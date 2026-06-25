'use client';

// Load runtime polyfills first, before any other client code runs. ThemeProvider
// is the outermost client provider, so this guarantees old-browser polyfills are
// in place before auth/theme/hydration logic executes. See src/polyfills.js.
import '../polyfills';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('aura_theme');
            if (saved) {
                setTheme(saved === 'light' ? 'light' : 'dark');
            }
        } catch (err) {
            console.warn('Failed to access localStorage for loading theme:', err);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('aura_theme', theme);
        } catch (err) {
            console.warn('Failed to access localStorage for saving theme:', err);
        }
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        } else {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        }
    }, [theme]);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
