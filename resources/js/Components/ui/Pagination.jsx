import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination untuk Laravel paginator yang di-passthrough utuh sebagai prop
 * (punya current_page, last_page, from, to, total, prev_page_url, next_page_url, links).
 */
export default function Pagination({ meta, preserveScroll = true }) {
    if (!meta || meta.last_page <= 1) return null;

    const go = (url) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll, replace: true });
    };

    const middleLinks = (meta.links ?? []).slice(1, -1);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Menampilkan <span className="font-medium text-gray-700 dark:text-gray-300">{meta.from ?? 0}</span>
                {'–'}
                <span className="font-medium text-gray-700 dark:text-gray-300">{meta.to ?? 0}</span> dari{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{meta.total}</span> data
            </p>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={!meta.prev_page_url}
                    onClick={() => go(meta.prev_page_url)}
                    aria-label="Halaman sebelumnya"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {middleLinks.map((link, i) => (
                    link.url === null ? (
                        <span key={i} className="px-1.5 text-xs text-gray-400 select-none">…</span>
                    ) : (
                        <button
                            key={i}
                            type="button"
                            onClick={() => go(link.url)}
                            className={`inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                                link.active
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {link.label}
                        </button>
                    )
                ))}

                <button
                    type="button"
                    disabled={!meta.next_page_url}
                    onClick={() => go(meta.next_page_url)}
                    aria-label="Halaman selanjutnya"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
