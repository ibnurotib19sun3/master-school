import AppLayout from '@/Layouts/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input } from '@/Components/ui/Input';
import {
    KeyRound, Plus, Trash2, Copy, Check, CheckCircle2, AlertTriangle,
    Globe, Code2, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

function formatDate(dt) {
    if (!dt) return '–';
    return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ENDPOINTS = [
    {
        method: 'GET', path: '/api/v1/guru',
        desc: 'Daftar data guru',
        params: ['nip (cari 1 guru berdasarkan NIP)', 'is_aktif (true/false, default true)', 'search (nama/nip/nuptk)', 'jabatan', 'per_page (maks 100)'],
    },
    {
        method: 'GET', path: '/api/v1/tatausaha',
        desc: 'Daftar data tata usaha',
        params: ['nip / nipy (cari 1 staf berdasarkan NIPY)', 'is_aktif (true/false, default true)', 'search (nama/nip)', 'per_page (maks 100)'],
    },
    {
        method: 'GET', path: '/api/v1/kehadiran-guru',
        desc: 'Kehadiran harian guru — 1 baris per guru per hari. status: Hadir/Sakit/Izin/Alpha/Tugas_Sekolah/Tidak_Hadir',
        params: ['nip (NIP guru — cara utama filter per orang)', 'tanggal (YYYY-MM-DD)', 'tanggal_awal & tanggal_akhir', 'status', 'per_page'],
    },
    {
        method: 'GET', path: '/api/v1/kehadiran-guru-jp',
        desc: 'Kehadiran guru per Jam Pelajaran (JP) — 1 baris per JP mengajar, sumber dari absensi piket/BK. status_guru: Hadir/Sakit/Izin/Alpha/Tugas_Sekolah',
        params: ['nip (NIP guru)', 'tanggal (YYYY-MM-DD)', 'tanggal_awal & tanggal_akhir', 'status (nilai status_guru)', 'per_page'],
    },
    {
        method: 'GET', path: '/api/v1/kehadiran-guru-rekap',
        desc: 'Rekap bulanan per guru — sumber "% Hadir" yang sama dengan Admin > Laporan > Kehadiran Guru (persen_mengajar)',
        params: ['nip (opsional, 1 guru saja)', 'bulan (YYYY-MM, default bulan berjalan)'],
    },
    {
        method: 'GET', path: '/api/v1/kehadiran-tatausaha',
        desc: 'Kehadiran harian tata usaha — 1 baris per staf per hari. status: Hadir/Sakit/Izin/Alpha/Tugas_Sekolah',
        params: ['nip / nipy (NIPY staf — cara utama filter per orang)', 'tanggal (YYYY-MM-DD)', 'tanggal_awal & tanggal_akhir', 'status', 'per_page'],
    },
    {
        method: 'GET', path: '/api/v1/kehadiran-tatausaha-rekap',
        desc: 'Rekap bulanan per staf — sumber "% Hadir" yang sama dengan Admin > Laporan > Kehadiran Tata Usaha (persen = hadir / hari kerja)',
        params: ['nip / nipy (opsional, 1 staf saja)', 'bulan (YYYY-MM, default bulan berjalan)'],
    },
];

async function copyToClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return;
    }
    // Fallback untuk konteks non-secure (mis. domain .test lokal tanpa HTTPS)
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!ok) throw new Error('execCommand copy failed');
}

function CopyButton({ value, onCopied }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await copyToClipboard(value);
            setCopied(true);
            onCopied?.();
            setTimeout(() => setCopied(false), 1500);
        } catch {
            onCopied?.(false);
        }
    };
    return (
        <button type="button" onClick={copy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin'}
        </button>
    );
}

export default function ApiTokenIndex({ tokens }) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [showCreate, setShowCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDocs, setShowDocs] = useState(false);
    const [copyToast, setCopyToast] = useState(null);

    const handleCopied = (ok = true) => {
        setCopyToast(ok ? 'success' : 'error');
        setTimeout(() => setCopyToast(null), 2500);
    };

    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/api-token', {
            onSuccess: () => { setShowCreate(false); reset(); },
        });
    };

    return (
        <AppLayout title="API Eksternal">
            <div className="space-y-5">
                {flash.success && !flash.plain_token && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {flash.plain_token && (
                    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                            <AlertTriangle className="h-4 w-4" /> Token berhasil dibuat — salin sekarang, tidak akan ditampilkan lagi
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                            <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{flash.plain_token}</code>
                            <CopyButton value={flash.plain_token} onCopied={handleCopied} />
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-sky-500" />
                            Token API Eksternal ({tokens.length})
                        </CardTitle>
                        <Button icon={Plus} onClick={() => setShowCreate(true)}>Buat Token</Button>
                    </CardHeader>
                    <CardBody className="p-0">
                        {tokens.length === 0 ? (
                            <div className="py-14 text-center text-gray-400 dark:text-gray-500">
                                <KeyRound className="h-9 w-9 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Belum ada token API. Buat token untuk mengizinkan aplikasi lain mengakses data.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Nama Aplikasi</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Dibuat</th>
                                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Terakhir Dipakai</th>
                                            <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {tokens.map(t => (
                                            <tr key={t.id}>
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{t.name}</td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{formatDate(t.created_at)}</td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                                    {t.last_used_at ? formatDate(t.last_used_at) : <span className="italic text-gray-400">Belum pernah</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => setDeleteTarget(t)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" /> Cabut
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Dokumentasi API */}
                <Card>
                    <button type="button" onClick={() => setShowDocs(s => !s)}
                        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            <Code2 className="h-4.5 w-4.5 text-sky-500" /> Dokumentasi Penggunaan API
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDocs ? 'rotate-180' : ''}`} />
                    </button>
                    {showDocs && (
                        <CardBody className="pt-0 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Autentikasi</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Sertakan token pada header berikut di setiap request:
                                </p>
                                <div className="mt-1.5 bg-gray-900 rounded-lg px-3 py-2 overflow-x-auto">
                                    <code className="text-xs font-mono text-emerald-300 whitespace-pre">Authorization: Bearer &lt;token&gt;</code>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Endpoint Tersedia</p>
                                <div className="space-y-2">
                                    {ENDPOINTS.map(ep => (
                                        <div key={ep.path} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    {ep.method}
                                                </span>
                                                <code className="text-xs font-mono text-gray-700 dark:text-gray-300">{ep.path}</code>
                                                <span className="text-xs text-gray-400">— {ep.desc}</span>
                                            </div>
                                            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                                                Parameter: {ep.params.join(' · ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2">
                                <strong>Catatan:</strong> gunakan <code className="font-mono">nip</code> (guru) atau <code className="font-mono">nip</code>/<code className="font-mono">nipy</code> (tata usaha) sebagai acuan utama saat mencari data satu orang — bukan <code className="font-mono">id</code> internal, karena nomor ID internal tidak diketahui aplikasi luar.
                            </p>

                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Contoh</p>
                                <div className="bg-gray-900 rounded-lg px-3 py-2 overflow-x-auto">
                                    <code className="text-xs font-mono text-sky-300 whitespace-pre">{`curl -H "Authorization: Bearer <token>" \\
  -H "Accept: application/json" \\
  "${window.location.origin}/api/v1/kehadiran-guru?nip=1234567890&tanggal_awal=2026-09-01&tanggal_akhir=2026-09-15"`}</code>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 shrink-0" /> Semua endpoint mengembalikan data terpaginasi (JSON) dan hanya bisa diakses menggunakan token yang dibuat di halaman ini.
                            </p>
                        </CardBody>
                    )}
                </Card>
            </div>

            {/* Modal buat token */}
            <Modal show={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Buat Token API">
                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Nama Aplikasi"
                        required
                        placeholder="Misal: Aplikasi Absensi Dinas"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        error={errors.name}
                    />
                    <p className="text-xs text-gray-400">
                        Nama ini hanya untuk identifikasi — gunakan nama aplikasi/pihak yang akan memakai token.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset(); }}>Batal</Button>
                        <Button type="submit" loading={processing}>Buat Token</Button>
                    </div>
                </form>
            </Modal>

            {/* Konfirmasi cabut token */}
            <ConfirmDialog
                show={!!deleteTarget}
                title="Cabut Token API"
                message={deleteTarget ? `Token "${deleteTarget.name}" tidak akan bisa dipakai lagi untuk mengakses API. Lanjutkan?` : ''}
                confirmLabel="Ya, Cabut"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) router.delete(`/admin/api-token/${deleteTarget.id}`);
                    setDeleteTarget(null);
                }}
            />

            {/* Toast salin token */}
            {copyToast && (
                <div className="fixed bottom-5 right-5 z-60">
                    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${
                        copyToast === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-900/90 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-200'
                    }`}>
                        {copyToast === 'success'
                            ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                            : <AlertTriangle className="h-4.5 w-4.5 shrink-0" />}
                        {copyToast === 'success' ? 'Token berhasil disalin ke clipboard.' : 'Gagal menyalin token. Salin manual ya.'}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
