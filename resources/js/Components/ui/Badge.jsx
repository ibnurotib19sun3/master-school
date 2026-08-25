import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const colors = {
    blue:   'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    sky:    'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    green:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    red:    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    gray:   'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    teal:   'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    pink:   'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
};

export default function Badge({ children, color = 'gray', className }) {
    return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color], className)}>
            {children}
        </span>
    );
}
