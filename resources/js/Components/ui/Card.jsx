import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export function Card({ children, className, ...props }) {
    return (
        <div className={cn('rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm', className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className }) {
    return <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700', className)}>{children}</div>;
}

export function CardBody({ children, className }) {
    return <div className={cn('px-4 py-4 sm:px-6', className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
    return <h3 className={cn('text-base font-semibold text-gray-900 dark:text-gray-100', className)}>{children}</h3>;
}
