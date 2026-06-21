'use client';

// Load runtime polyfills first, before any other client code runs. ThemeProvider
// is the outermost client provider, so this guarantees old-browser polyfills are
// in place before auth/theme/hydration logic executes. See src/polyfills.js.
import '../polyfills';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const saved = localStorage.getItem('aura_theme');
        if (saved) {
            setTheme(saved === 'light' ? 'light' : 'dark');
        }
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        localStorage.setItem('aura_theme', theme);
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        } else {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
