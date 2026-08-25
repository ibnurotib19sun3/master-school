import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import Button from '@/Components/ui/Button';
import { Textarea } from '@/Components/ui/Input';
import {
    Settings, ShieldAlert, ShieldCheck, AlertTriangle,
    Eye, Info, Lock, Users, Wrench,
} from 'lucide-react';
import { useState } from 'react';

export default function PemeliharaanIndex({ isMaintenance, maintenanceMessage, namaSekolah }) {
    const [confirmToggle, setConfirmToggle] = useState(false);

    const { data, setData, post, processing } = useForm({
        maintenance_message: maintenanceMessage ?? '',
    });

    const saveMessage = (e) => {
        e.preventDefault();
        post('/admin/pemeliharaan/pesan', { preserveScroll: true });
    };

    const toggle = () => {
        router.post('/admin/pemeliharaan/toggle', {}, { preserveScroll: true });
        setConfirmToggle(false);
    };

    return (
        <AppLayout title="Mode Pemeliharaan">
            <div className="space-y-6">

                {/* Page header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="h-5 w-5 text-sky-600" /> Mode Pemeliharaan
                    </h1>
                    {namaSekolah && (
                        <p className="text-sm font-medium text-sky-600 dark:text-sky-400">{namaSekolah}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Aktifkan saat sistem sedang dalam perbaikan. Hanya Super Admin yang dapat login.
                    </p>
                </div>

                {/* Warning banner — only when active */}
                {isMaintenance && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-700 dark:text-amber-300">
                            <p className="font-semibold">Sistem sedang dalam pemeliharaan.</p>
                            <p className="mt-0.5">
                                Semua pengguna yang sedang login akan diarahkan ke halaman pemeliharaan.
                                Hanya akun Super Admin yang dapat mengakses sistem.
                            </p>
                        </div>
                    </div>
                )}

                {/* Two-column layout: controls left, info sidebar right */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ── Left column (3/5) ── */}
                    <div className="lg:col-span-3 space-y-5">

                        {/* Status + toggle card */}
                        <div className={`rounded-2xl border-2 p-6 transition-all ${
                            isMaintenance
                                ? 'border-amber-300 dark:border-amber-700 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
                                : 'border-emerald-300 dark:border-emerald-700 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
                        }`}>
                            <div className="flex items-center gap-4">
                                {/* Icon with pulse on maintenance */}
                                <div className={`relative rounded-2xl p-4 shrink-0 ${
                                    isMaintenance
                                        ? 'bg-amber-100 dark:bg-amber-900/40'
                                        : 'bg-emerald-100 dark:bg-emerald-900/40'
                                }`}>
                                    {isMaintenance
                                        ? <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                        : <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                    }
                                    {isMaintenance && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className={`text-lg font-bold leading-tight ${
                                        isMaintenance
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-emerald-700 dark:text-emerald-300'
                                    }`}>
                                        {isMaintenance ? 'Mode Pemeliharaan AKTIF' : 'Sistem Berjalan Normal'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        {isMaintenance
                                            ? 'Pengguna lain tidak dapat login saat ini'
                                            : 'Semua pengguna dapat mengakses sistem'}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle action */}
                            <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10">
                                {!confirmToggle ? (
                                    <Button
                                        variant={isMaintenance ? 'secondary' : 'primary'}
                                        onClick={() => setConfirmToggle(true)}
                                    >
                                        {isMaintenance ? 'Matikan Mode Pemeliharaan' : 'Aktifkan Mode Pemeliharaan'}
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {isMaintenance
                                                ? 'Matikan pemeliharaan? Semua pengguna bisa login kembali.'
                                                : 'Aktifkan pemeliharaan? Pengguna lain tidak bisa login.'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="danger" onClick={toggle} loading={processing}>
                                                Ya, {isMaintenance ? 'Matikan' : 'Aktifkan'}
                                            </Button>
                                            <Button variant="secondary" onClick={() => setConfirmToggle(false)}>
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message editor */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="rounded-lg bg-sky-100 dark:bg-sky-900/40 p-1.5">
                                    <Wrench className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Pesan Pemeliharaan</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Pesan yang ditampilkan kepada pengguna
                                    </p>
                                </div>
                            </div>
                            <form onSubmit={saveMessage} className="space-y-4">
                                <Textarea
                                    value={data.maintenance_message}
                                    onChange={(e) => setData('maintenance_message', e.target.value)}
                                    rows={5}
                                    placeholder="Sistem sedang dalam proses pemeliharaan dan peningkatan layanan. Kami akan segera kembali."
                                />
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <a href="/maintenance" target="_blank"
                                        className="inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 hover:underline">
                                        <Eye className="h-4 w-4" /> Preview halaman
                                    </a>
                                    <Button type="submit" loading={processing}>Simpan Pesan</Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Right sidebar (2/5) ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* What happens card */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="h-4 w-4 text-sky-500 shrink-0" />
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Apa yang Terjadi?
                                </p>
                            </div>
                            <div className="space-y-3.5">
                                {[
                                    {
                                        icon: Users,
                                        text: 'Pengguna yang sedang login diarahkan ke halaman pemeliharaan',
                                        color: 'text-amber-500',
                                    },
                                    {
                                        icon: Lock,
                                        text: 'Login diblokir untuk semua role kecuali Super Admin',
                                        color: 'text-rose-500',
                                    },
                                    {
                                        icon: ShieldCheck,
                                        text: 'Super Admin tetap bisa mengakses seluruh fitur sistem',
                                        color: 'text-emerald-500',
                                    },
                                ].map(({ icon: Icon, text, color }, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips card */}
                        <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-3">
                                Tips
                            </p>
                            <ul className="space-y-2.5">
                                {[
                                    'Isi pesan pemeliharaan sebelum mengaktifkan mode ini.',
                                    'Gunakan tombol preview untuk melihat tampilan halaman pemeliharaan.',
                                    'Segera matikan mode ini setelah perbaikan selesai.',
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-sky-700 dark:text-sky-300">
                                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
