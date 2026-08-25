import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    ShieldCheck, ShieldX, FileText, Calendar, User,
    Hash, Tag, ArrowDownToLine, MailOpen, Sun, Moon,
    ExternalLink, Download, Building2,
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

const DISPOSISI_COLOR = {
    Diarsip:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    Diproses:   'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Diteruskan: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

function InfoRow({ icon: Icon, label, value, mono }) {
    if (!value) return null;
    return (
        <div className="flex gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <Icon className="h-4 w-4 text-sky-400 dark:text-sky-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                <p className={`text-sm text-gray-900 dark:text-gray-100 mt-0.5 break-words ${mono ? 'font-mono font-bold' : ''}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

export default function VerifikasiSuratMasuk({ kode, valid, surat, namaSekolah, logoSekolah }) {
    const [isDark, setIsDark] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const dark = localStorage.getItem('theme') === 'dark'
            || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const isPdf   = surat?.file_url?.toLowerCase().endsWith('.pdf');
    const isImage = surat?.file_url && /\.(jpe?g|png|webp)$/i.test(surat.file_url);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
            <Head title="Verifikasi Surat Masuk" />
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
                    {logoSekolah ? (
                        <img src={logoSekolah} alt="Logo" className="h-9 w-9 object-contain shrink-0" />
                    ) : (
                        <img src="/logodjurnal.svg" alt="Logo" className="h-9 w-9 object-contain shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{namaSekolah}</p>
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Verifikasi Surat Masuk</p>
                    </div>
                    <div className="hidden sm:block text-xs text-right text-gray-500 dark:text-gray-400">
                        <p>{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-sky-500 font-mono"><LiveClock /></p>
                    </div>
                    <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-500" />}
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Validity stamp */}
                <div className={`rounded-2xl border-2 p-6 mb-6 flex items-center gap-5 ${
                    valid
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                }`}>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        valid ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                        {valid
                            ? <ShieldCheck className="h-8 w-8 text-white" />
                            : <ShieldX    className="h-8 w-8 text-white" />
                        }
                    </div>
                    <div>
                        <p className={`text-xl font-black ${valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {valid ? 'SURAT MASUK TERVERIFIKASI' : 'DOKUMEN TIDAK DITEMUKAN'}
                        </p>
                        <p className={`text-sm mt-0.5 ${valid ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                            {valid
                                ? 'Data surat masuk ini tercatat resmi dalam sistem administrasi sekolah.'
                                : 'Kode referensi tidak dikenali. Dokumen mungkin belum terdaftar atau kode tidak valid.'
                            }
                        </p>
                    </div>
                </div>

                {valid && surat && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Data surat */}
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MailOpen className="h-4 w-4 text-sky-500" />
                                    Data Surat Masuk
                                </h2>
                                <div>
                                    <InfoRow icon={Hash}       label="Nomor Surat"     value={surat.nomor_surat} mono />
                                    <InfoRow icon={FileText}   label="Perihal"          value={surat.perihal} />
                                    <InfoRow icon={Building2}  label="Pengirim"         value={surat.pengirim} />
                                    <InfoRow icon={Tag}        label="Kategori"         value={surat.kategori} />
                                    <InfoRow icon={Calendar}   label="Tanggal Surat"    value={surat.tgl_surat} />
                                    <InfoRow icon={ArrowDownToLine} label="Tanggal Diterima" value={surat.tgl_diterima} />
                                    <InfoRow icon={User}       label="Dicatat Oleh"     value={surat.dibuat_oleh} />
                                    {surat.keterangan && (
                                        <InfoRow icon={FileText} label="Keterangan" value={surat.keterangan} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status + file */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Disposisi card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-sky-500" />
                                    Status & Referensi
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disposisi</p>
                                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${DISPOSISI_COLOR[surat.disposisi] ?? ''}`}>
                                            {surat.disposisi}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kode Referensi</p>
                                        <p className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 rounded-lg px-2.5 py-1.5 tracking-widest break-all">
                                            {kode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* File */}
                            {surat.file_url && (
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-sky-500" />
                                        File Dokumen
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <a href={surat.file_url} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <Download className="h-3.5 w-3.5" /> Unduh
                                        </a>
                                        {(isPdf || isImage) && (
                                            <button
                                                onClick={() => setShowPreview(!showPreview)}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                {showPreview ? 'Tutup Preview' : 'Preview'}
                                            </button>
                                        )}
                                    </div>

                                    {showPreview && isPdf && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                            <iframe
                                                src={surat.file_url}
                                                title="Preview Surat"
                                                className="w-full"
                                                style={{ height: '500px' }}
                                            />
                                        </div>
                                    )}
                                    {showPreview && isImage && (
                                        <div className="mt-3">
                                            <img src={surat.file_url} alt="File Surat"
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 object-contain max-h-[500px]" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Invalid state */}
                {!valid && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Kode yang Anda cari:</p>
                        <p className="font-mono font-bold text-red-600 dark:text-red-400 text-lg tracking-widest">{kode}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 max-w-md mx-auto">
                            Kode ini tidak ditemukan dalam sistem. Pastikan Anda memindai QR code yang benar,
                            atau hubungi instansi untuk konfirmasi.
                        </p>
                    </div>
                )}

                <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
                    <p>Sistem Administrasi Surat Masuk · {namaSekolah}</p>
                    <p className="mt-0.5">Halaman ini hanya untuk keperluan verifikasi keaslian dokumen</p>
                </div>
            </div>
        </div>
    );
}
