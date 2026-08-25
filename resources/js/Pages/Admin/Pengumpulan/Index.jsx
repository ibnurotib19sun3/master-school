import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import {
    FolderUp, Plus, Trash2, Eye, ChevronLeft, ChevronRight,
    Calendar, Users, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { Link } from '@inertiajs/react';

/* ── helpers ── */
function fmtDatetime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

/* ── status badge ── */
function ProgressBar({ uploaded, total }) {
    const p = pct(uploaded, total);
    const color = p === 100 ? 'bg-emerald-500' : p > 50 ? 'bg-amber-400' : 'bg-rose-400';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${p}%` }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{uploaded}/{total}</span>
        </div>
    );
}

/* ── Modal buat pengumpulan ── */
function ModalCreate({ open, onClose, tahunAjaran, mataPelajaran }) {
    const [form, setForm] = useState({
        judul: '', deskripsi: '', batas_waktu: '',
        tahun_ajaran_id: '', mata_pelajaran_id: '',
    });
    const [busy, setBusy] = useState(false);
    const flash = usePage().props.flash ?? {};

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setBusy(true);
        router.post('/admin/pengumpulan', form, {
            onFinish: () => { setBusy(false); onClose(); },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Buat Pengumpulan Baru</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Judul */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Judul <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.judul}
                            onChange={e => set('judul', e.target.value)}
                            required
                            placeholder="cth. Pengumpulan RPP Semester Ganjil"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                        <textarea
                            value={form.deskripsi}
                            onChange={e => set('deskripsi', e.target.value)}
                            rows={3}
                            placeholder="Opsional — keterangan tambahan untuk guru"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Batas Waktu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Batas Waktu <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={form.batas_waktu}
                                onChange={e => set('batas_waktu', e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        {/* Tahun Ajaran */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tahun Ajaran <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={form.tahun_ajaran_id}
                                onChange={e => set('tahun_ajaran_id', e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="">— Pilih —</option>
                                {tahunAjaran.map(t => (
                                    <option key={t.id} value={t.id}>{t.nama}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mata Pelajaran (opsional filter) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Filter Mata Pelajaran{' '}
                            <span className="text-xs text-gray-400 font-normal">(kosongkan = semua mapel)</span>
                        </label>
                        <select
                            value={form.mata_pelajaran_id}
                            onChange={e => set('mata_pelajaran_id', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">— Semua Mata Pelajaran —</option>
                            {mataPelajaran.map(m => (
                                <option key={m.id} value={m.id}>{m.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                            Batal
                        </button>
                        <Button type="submit" disabled={busy}>
                            {busy ? 'Menyimpan…' : 'Buat Pengumpulan'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Main page ── */
export default function PengumpulanIndex({ pengumpulan, tahunAjaran, mataPelajaran }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [showCreate, setShowCreate] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = useCallback((id) => {
        if (!confirm('Hapus pengumpulan ini? Semua file yang sudah diunggah juga akan dihapus.')) return;
        router.delete(`/admin/pengumpulan/${id}`);
    }, []);

    const { data, current_page, last_page, prev_page_url, next_page_url } = pengumpulan;

    return (
        <AppLayout title="Pengumpulan">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FolderUp className="h-5 w-5 text-sky-500" /> Pengumpulan
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Kelola tugas pengumpulan dan pantau progres guru
                        </p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Buat Pengumpulan
                    </Button>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {/* Table */}
                <Card>
                    <CardBody className="p-0">
                        {data.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 dark:text-gray-500">
                                <FolderUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">Belum ada pengumpulan. Buat yang pertama!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Judul</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Tahun Ajaran</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Batas Waktu</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 min-w-40">Progres</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                            <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {data.map(p => {
                                            const isExpired = new Date(p.batas_waktu) < new Date();
                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900 dark:text-white">{p.judul}</p>
                                                        {p.deskripsi && (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{p.deskripsi}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {p.tahun_ajaran?.nama ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            {fmtDatetime(p.batas_waktu)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <ProgressBar uploaded={p.uploaded_count} total={p.items_count} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {p.is_aktif ? (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                isExpired
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            }`}>
                                                                {isExpired ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                                                {isExpired ? 'Kedaluwarsa' : 'Aktif'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                                <Clock className="h-3 w-3" /> Nonaktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={`/admin/pengumpulan/${p.id}`}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" /> Detail
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(p.id)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Pagination */}
                {last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Halaman {current_page} dari {last_page}</span>
                        <div className="flex gap-2">
                            <Link
                                href={prev_page_url ?? '#'}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${
                                    !prev_page_url ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" /> Prev
                            </Link>
                            <Link
                                href={next_page_url ?? '#'}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${
                                    !next_page_url ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <ModalCreate
                open={showCreate}
                onClose={() => setShowCreate(false)}
                tahunAjaran={tahunAjaran}
                mataPelajaran={mataPelajaran}
            />
        </AppLayout>
    );
}
