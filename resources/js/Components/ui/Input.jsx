import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export function Input({ className, error, label, required, suffix, ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <div className={suffix ? 'relative' : undefined}>
                <input
                    required={required}
                    className={cn(
                        'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm',
                        'focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500',
                        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-sky-400',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        suffix && 'pr-9',
                        className,
                    )}
                    {...props}
                />
                {suffix && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
                        {suffix}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}

export function Select({ className, error, label, required, children, ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <select
                required={required}
                className={cn(
                    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm',
                    'focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500',
                    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                    error && 'border-red-500',
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}

export function Textarea({ className, error, label, required, ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <textarea
                required={required}
                className={cn(
                    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm',
                    'focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500',
                    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
                    error && 'border-red-500',
                    className,
                )}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
