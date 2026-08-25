import { useEffect } from 'react';
import { AlertTriangle, KeyRound } from 'lucide-react';
import Button from './Button';

const VARIANTS = {
    danger:  { icon: AlertTriangle, iconBg: 'bg-red-100 dark:bg-red-900/30',    iconColor: 'text-red-600 dark:text-red-400',    btn: 'danger'   },
    warning: { icon: KeyRound,      iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', btn: 'primary'  },
};

export default function ConfirmDialog({
    show = false,
    title = 'Hapus Data',
    message = 'Data ini akan dihapus permanen dan tidak dapat dikembalikan.',
    confirmLabel = 'Ya, Hapus',
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        const handleKey = (e) => e.key === 'Escape' && onCancel?.();
        if (show) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [show, onCancel]);

    if (!show) return null;

    const v = VARIANTS[confirmVariant] ?? VARIANTS.danger;
    const Icon = v.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`flex items-center justify-center h-14 w-14 rounded-full shrink-0 ${v.iconBg}`}>
                        <Icon className={`h-7 w-7 ${v.iconColor}`} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
                    </div>
                    <div className="flex w-full gap-3 pt-1">
                        <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
                            Batal
                        </Button>
                        <Button type="button" variant={v.btn} className="flex-1 justify-center" onClick={onConfirm}>
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
