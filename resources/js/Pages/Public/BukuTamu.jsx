import { useState, useEffect, useMemo } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
    Search, User, BookOpen, CheckCircle, ChevronRight,
    ClipboardList, Phone, Building2, MessageSquare,
    Sun, Moon, X, ArrowLeft,
} from 'lucide-react';

function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <span className="font-mono tabular-nums">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
}

const TAMU_JABATAN_COLOR = {
    guru: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    tatausaha: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

function StafCard({ staf, selected, onSelect }) {
    const isSelected = selected?.key === staf.key;
    return (
        <button
            type="button"
            onClick={() => onSelect(staf)}
            className={`w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3 ${
                isSelected
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 ring-2 ring-sky-400 ring-offset-1 dark:ring-offset-gray-900'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-sky-300 dark:hover:border-sky-600'
            }`}
        >
            {staf.avatar ? (
                <img src={staf.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
            ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-gray-400" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {staf.nama}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {staf.jabatan.slice(0, 2).map((j) => (
                        <span key={j} className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${TAMU_JABATAN_COLOR[staf.tipe]}`}>
                            {j}
                        </span>
                    ))}
                    {staf.jabatan.length > 2 && (
                        <span className="text-xs text-gray-400">+{staf.jabatan.length - 2}</span>
                    )}
                </div>
            </div>
            {isSelected && <CheckCircle className="h-5 w-5 text-sky-500 shrink-0" />}
        </button>
    );
}

export default function BukuTamu({ staf = [], namaSekolah, logoSekolah }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [isDark, setIsDark] = useState(false);
    const [q, setQ] = useState('');
    const [filterTipe, setFilterTipe] = useState(''); // '' | 'guru' | 'tatausaha'
    const [selected, setSelected] = useState(null);
    const [step, setStep] = useState(1); // 1=cari, 2=isi form
    const [form, setForm] = useState({ nama_tamu: '', instansi: '', nomor_hp: '', keperluan: '' });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const dark = localStorage.getItem('theme') === 'dark'
            || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    useEffect(() => {
        if (flash.success) setDone(true);
    }, [flash.success]);

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const filtered = useMemo(() => {
        const ql = q.toLowerCase();
        return staf.filter((s) => {
            if (filterTipe && s.tipe !== filterTipe) return false;
            if (!ql) return true;
            const nameMatch = s.nama.toLowerCase().includes(ql);
            const jabMatch  = s.jabatan.some((j) => j.toLowerCase().includes(ql));
            return nameMatch || jabMatch;
        });
    }, [staf, q, filterTipe]);

    const handleSelect = (s) => {
        setSelected(s);
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selected) return;
        setSubmitting(true);
        router.post('/buku-tamu', {
            ...form,
            yang_dituju_tipe:    selected.tipe,
            yang_dituju_id:      selected.id,
            yang_dituju_nama:    selected.nama,
            yang_dituju_jabatan: selected.jabatan.join(', '),
        }, {
            onSuccess: () => setDone(true),
            onFinish: () => setSubmitting(false),
        });
    };

    const handleReset = () => {
        setDone(false);
        setSelected(null);
        setStep(1);
        setForm({ nama_tamu: '', instansi: '', nomor_hp: '', keperluan: '' });
        setQ('');
    };

    const tanggal = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
            <Head title="Buku Tamu" />
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    {logoSekolah ? (
                        <img src={logoSekolah} alt="Logo" className="h-10 w-10 object-contain shrink-0" />
                    ) : (
                        <img src="/logodjurnal.svg" alt="Logo" className="h-10 w-10 object-contain shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                            {namaSekolah}
                        </p>
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Buku Tamu Digital</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
                        <span>{tanggal}</span>
                        <span className="text-sky-500 font-mono"><LiveClock /></span>
                    </div>
                    <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
                        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-500" />}
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Success screen */}
                {done ? (
                    <div className="max-w-md mx-auto text-center py-16">
                        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Berhasil Terdaftar!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            Kunjungan Anda telah tercatat. Silakan menunggu di ruang tamu.
                        </p>
                        <p className="text-sm font-medium text-sky-600 dark:text-sky-400 mb-8">
                            Menemui: <span className="font-bold">{selected?.nama}</span>
                        </p>
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition-colors"
                        >
                            Daftar Tamu Baru
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* ===== PANEL KIRI: Cari Staf ===== */}
                        <div className={`lg:col-span-3 ${step === 2 ? 'hidden lg:block' : 'block'}`}>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList className="h-5 w-5 text-sky-500" />
                                    <h2 className="font-bold text-gray-900 dark:text-white">Cari Yang Ingin Ditemui</h2>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    Ketik nama atau jabatan untuk mencari
                                </p>

                                {/* Search bar */}
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau jabatan..."
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-gray-400"
                                    />
                                    {q && (
                                        <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Filter tipe */}
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {[
                                        { val: '',           label: 'Semua' },
                                        { val: 'guru',       label: 'Guru' },
                                        { val: 'tatausaha',  label: 'Tata Usaha' },
                                    ].map(({ val, label }) => (
                                        <button
                                            key={val}
                                            onClick={() => setFilterTipe(val)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                filterTipe === val
                                                    ? 'bg-sky-600 text-white border-sky-600'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-sky-400'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Results */}
                                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                    {filtered.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400">
                                            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Tidak ada yang cocok dengan pencarian.</p>
                                        </div>
                                    ) : (
                                        filtered.map((s) => (
                                            <StafCard
                                                key={s.key}
                                                staf={s}
                                                selected={selected}
                                                onSelect={handleSelect}
                                            />
                                        ))
                                    )}
                                </div>

                                <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} orang ditemukan</p>
                            </div>
                        </div>

                        {/* ===== PANEL KANAN: Form ===== */}
                        <div className={`lg:col-span-2 ${step === 1 ? 'hidden lg:block' : 'block'}`}>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                {/* Back button (mobile only) */}
                                <button
                                    onClick={handleBack}
                                    className="lg:hidden flex items-center gap-1 text-sky-600 dark:text-sky-400 text-sm font-medium mb-4 hover:underline"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Kembali Cari
                                </button>

                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="h-5 w-5 text-sky-500" />
                                    <h2 className="font-bold text-gray-900 dark:text-white">Data Kunjungan</h2>
                                </div>

                                {/* Selected person card */}
                                {selected ? (
                                    <div className="mb-5 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 flex items-center gap-3">
                                        {selected.avatar ? (
                                            <img src={selected.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-sky-200 dark:bg-sky-800 flex items-center justify-center shrink-0">
                                                <User className="h-5 w-5 text-sky-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-sky-700 dark:text-sky-300 truncate">{selected.nama}</p>
                                            <p className="text-xs text-sky-500 dark:text-sky-400 truncate">{selected.jabatan.join(' · ')}</p>
                                        </div>
                                        <button
                                            onClick={() => { setSelected(null); setStep(1); }}
                                            className="text-sky-400 hover:text-sky-600 shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 shrink-0" />
                                        Pilih dulu orang yang ingin ditemui di panel sebelah kiri.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="Masukkan nama Anda"
                                                value={form.nama_tamu}
                                                onChange={(e) => setForm({ ...form, nama_tamu: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                            Instansi / Asal
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Sekolah, perusahaan, dll."
                                                value={form.instansi}
                                                onChange={(e) => setForm({ ...form, instansi: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                            Nomor HP / WA
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="08xxxxxxxxxx"
                                                value={form.nomor_hp}
                                                onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                            Keperluan <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={3}
                                            placeholder="Jelaskan keperluan kunjungan Anda..."
                                            value={form.keperluan}
                                            onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || !selected}
                                        className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                            </svg>
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                        {submitting ? 'Menyimpan...' : 'Daftar Sekarang'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
