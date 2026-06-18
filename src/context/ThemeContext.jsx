import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Force theme to be always dark
    const theme = 'dark';
    const toggleTheme = () => {};

    useEffect(() => {
        localStorage.setItem('aura_theme', 'dark');
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
