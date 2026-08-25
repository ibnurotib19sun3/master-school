import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function Modal({ show = false, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        const handleKey = (e) => e.key === 'Escape' && onClose?.();
        if (show) {
            document.addEventListener('keydown', handleKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [show, onClose]);

    if (!show) return null;

    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

    return (
        <>
            {/* Backdrop — fixed, tidak ikut scroll */}
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Scroll wrapper — fixed viewport, overflow-y scroll di sini */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-start justify-center p-4 py-8">
                    <div className={cn(
                        'relative w-full rounded-2xl bg-white dark:bg-gray-800 shadow-xl',
                        sizes[size]
                    )}>
                        {/* Header sticky di dalam card */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-4">{children}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
