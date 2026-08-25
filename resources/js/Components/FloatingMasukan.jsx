import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { MessageSquarePlus, X, Send, ChevronDown } from 'lucide-react';

const KATEGORI = ['Saran', 'Bug/Error', 'Pertanyaan', 'Lainnya'];

const KATEGORI_COLOR = {
    'Saran':       'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300',
    'Bug/Error':   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300',
    'Pertanyaan':  'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300',
    'Lainnya':     'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
};

export default function FloatingMasukan() {
    const [open, setOpen] = useState(false);
    const [sent, setSent] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        kategori: 'Saran',
        judul:    '',
        isi:      '',
    });

    const close = () => {
        setOpen(false);
        setSent(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        post('/masukan', {
            preserveScroll: true,
            preserveState:  true,
            onSuccess: () => {
                setSent(true);
                reset();
                setTimeout(close, 2500);
            },
        });
    };

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(true)}
                title="Kirim Masukan"
                className="fixed bottom-6 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/30 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
                <MessageSquarePlus className="h-4 w-4" />
                <span className="text-sm font-semibold">Masukan</span>
            </button>

            {/* Backdrop + modal */}
            {open && (
                <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={close}
                    />

                    {/* Modal card */}
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center">
                                    <MessageSquarePlus className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Kirim Masukan</p>
                                    <p className="text-xs text-gray-400">Bantu kami tingkatkan aplikasi</p>
                                </div>
                            </div>
                            <button
                                onClick={close}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Sent state */}
                        {sent ? (
                            <div className="px-5 py-10 text-center space-y-3">
                                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                                    <Send className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white">Masukan terkirim!</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Terima kasih, kami akan meninjau masukan Anda.</p>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="px-5 py-4 space-y-4">
                                {/* Kategori */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                        Kategori
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {KATEGORI.map(k => (
                                            <button
                                                key={k}
                                                type="button"
                                                onClick={() => setData('kategori', k)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                                    data.kategori === k
                                                        ? KATEGORI_COLOR[k]
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400'
                                                }`}
                                            >
                                                {k}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Judul */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                        Judul <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.judul}
                                        onChange={e => setData('judul', e.target.value)}
                                        placeholder="Ringkasan singkat masukan Anda"
                                        maxLength={200}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                                    />
                                    {errors.judul && <p className="mt-1 text-xs text-red-500">{errors.judul}</p>}
                                </div>

                                {/* Isi */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                        Detail <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={data.isi}
                                        onChange={e => setData('isi', e.target.value)}
                                        placeholder="Jelaskan masukan, saran, atau kendala yang Anda alami..."
                                        rows={4}
                                        maxLength={2000}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none transition-colors"
                                    />
                                    <div className="flex justify-between mt-1">
                                        {errors.isi
                                            ? <p className="text-xs text-red-500">{errors.isi}</p>
                                            : <span />}
                                        <p className="text-[10px] text-gray-400">{data.isi.length}/2000</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.judul.trim() || !data.isi.trim()}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                            </svg>
                                        ) : (
                                            <Send className="h-3.5 w-3.5" />
                                        )}
                                        Kirim
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
