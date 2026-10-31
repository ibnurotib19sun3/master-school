import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
    const { mode, setMode } = useTheme();

    return (
        <div
            className={`inline-flex items-center gap-0.5 rounded-full p-1 bg-gray-100 dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 ${className}`}
            role="group"
            aria-label="Pilih Mode Tema"
        >
            {/* Light */}
            <button
                type="button"
                onClick={() => setMode('light')}
                title="Mode Terang"
                aria-label="Mode Terang"
                className={`p-1.5 rounded-full transition-all duration-150 ${
                    mode === 'light'
                        ? 'bg-white text-sky-600 shadow-xs'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
            >
                <Sun className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>

            {/* Dark */}
            <button
                type="button"
                onClick={() => setMode('dark')}
                title="Mode Gelap"
                aria-label="Mode Gelap"
                className={`p-1.5 rounded-full transition-all duration-150 ${
                    mode === 'dark'
                        ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
            >
                <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>

            {/* System */}
            <button
                type="button"
                onClick={() => setMode('system')}
                title="Mengikuti Sistem"
                aria-label="Mengikuti Sistem"
                className={`p-1.5 rounded-full transition-all duration-150 ${
                    mode === 'system'
                        ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
            >
                <Monitor className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
        </div>
    );
}
