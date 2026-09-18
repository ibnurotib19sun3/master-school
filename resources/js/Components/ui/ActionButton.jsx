const COLORS = {
    sky:     'border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-600 hover:border-sky-600 dark:hover:bg-sky-500 dark:hover:border-sky-500',
    emerald: 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:border-emerald-600 dark:hover:bg-emerald-500 dark:hover:border-emerald-500',
    rose:    'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:border-rose-600 dark:hover:bg-rose-500 dark:hover:border-rose-500',
};

/**
 * Tombol aksi ikon bulat berbingkai — bg polos, terisi warna + ikon putih saat hover.
 * Dipakai untuk aksi baris tabel (Detail/Edit/Hapus dsb).
 */
export default function ActionButton({ icon: Icon, onClick, title, color = 'sky', className = '' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-full border bg-white dark:bg-gray-900 transition-colors duration-200 hover:text-white shrink-0 ${COLORS[color] ?? COLORS.sky} ${className}`}
        >
            <Icon className="h-3.5 w-3.5" />
        </button>
    );
}
