import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ className = '', glass = false }) {
    const { theme, toggle } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggle}
            aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                glass
                    ? 'bg-white/15 hover:bg-white/25'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${className}`}
        >
            {isDark
                ? <Sun className={`h-4 w-4 ${glass ? 'text-amber-200' : 'text-amber-400'}`} />
                : <Moon className={`h-4 w-4 ${glass ? 'text-white/80' : 'text-gray-500'}`} />
            }
        </button>
    );
}
