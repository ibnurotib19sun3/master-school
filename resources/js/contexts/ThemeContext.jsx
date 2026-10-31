import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme_mode') || localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Listen to OS theme changes if in system mode
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setSystemPrefersDark(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const effectiveTheme = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

    useEffect(() => {
        const root = document.documentElement;
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme_mode', mode);
        localStorage.setItem('theme', effectiveTheme);
    }, [mode, effectiveTheme]);

    const toggle = () => {
        setMode((prev) => (effectiveTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider
            value={{
                mode,
                setMode,
                theme: effectiveTheme,
                toggle,
                isDark: effectiveTheme === 'dark',
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};
