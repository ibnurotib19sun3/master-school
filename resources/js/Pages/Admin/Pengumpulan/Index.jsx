import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import {
    FolderUp, Plus, Trash2, Eye, ChevronLeft, ChevronRight,
    Calendar, Users, CheckCircle, Clock, AlertCircle, Search, X,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';

function fmtDatetime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

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

/* ── Multi-select dengan search ── */
function MultiSelectMapel({ options, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = options.filter(o => o.nama.toLowerCase().includes(q.toLowerCase()));
    const toggle   = (id) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

    const selectedNames = options.filter(o => selected.includes(o.id)).map(o => o.nama);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full min-h-[38px] flex items-center justify-between gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <span className="flex-1 min-w-0">
                    {selected.length === 0 ? (
                        <span className="text-gray-400 dark:text-gray-500">— Semua Mata Pelajaran —</span>
                    ) : selected.length === 1 ? (
                        <span className="text-gray-900 dark:text-white truncate">{selectedNames[0]}</span>
                    ) : (
                        <span className="text-gray-900 dark:text-white">{selected.length} mapel dipilih</span>
                    )}
                </span>
                <span className="text-gray-400 text-xs shrink-0">▼</span>
            </button>

            {/* Tags */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {options.filter(o => selected.includes(o.id)).map(o => (
                        <span key={o.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                            {o.nama}
                            <button type="button" onClick={() => toggle(o.id)} className="hover:text-sky-900 dark:hover:text-sky-100">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <button type="button" onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1">
                        Reset
                    </button>
                </div>
            )}

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="Cari mata pelajaran…"
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-gray-400">Tidak ditemukan</p>
                        ) : filtered.map(o => (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => toggle(o.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                                    selected.includes(o.id)
                                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                    selected.includes(o.id)
                                        ? 'bg-sky-500 border-sky-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                    {selected.includes(o.id) && <CheckCircle className="h-3 w-3 text-white" />}
                                </span>
                                {o.nama}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Pilih format file ── */
const FORMAT_LABELS = {
    pdf:   { label: 'PDF', ext: '.pdf', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' },
    word:  { label: 'Word', ext: '.doc/.docx', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
    excel: { label: 'Excel', ext: '.xls/.xlsx', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' },
    ppt:   { label: 'PowerPoint', ext: '.ppt/.pptx', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' },
    image: { label: 'Gambar', ext: '.jpg/.png', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' },
    zip:   { label: 'ZIP', ext: '.zip', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
};

function FormatPicker({ selected, onChange }) {
    const allKeys = Object.keys(FORMAT_LABELS);
    const toggle = (k) => onChange(selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k]);

    return (
        <div className="flex flex-wrap gap-2">
            {allKeys.map(k => {
                const { label, ext, color } = FORMAT_LABELS[k];
                const active = selected.includes(k);
                return (
                    <button
                        key={k}
                        type="button"
                        onClick={() => toggle(k)}
                        className={`inline-flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                            active ? color + ' ring-2 ring-sky-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <span className="font-semibold">{label}</span>
                        <span className="opacity-60 mt-0.5">{ext}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange, id }) {
    return (
        <button type="button" role="switch" aria-checked={checked} id={id}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                checked ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
        >
            <span className={`pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200 ${
                checked ? 'translate-x-5' : 'translate-x-0.5'
            }`} style={{ height: '18px', width: '18px' }} />
        </button>
    );
}

/* ── Format options untuk create modal ── */
const FORMAT_OPTIONS_CREATE = [
    { key: 'pdf',   label: 'PDF',        ext: '.pdf',      color: 'rose' },
    { key: 'word',  label: 'Word',       ext: '.doc/.docx', color: 'sky' },
    { key: 'excel', label: 'Excel',      ext: '.xls/.xlsx', color: 'emerald' },
    { key: 'ppt',   label: 'PowerPoint', ext: '.ppt/.pptx', color: 'orange' },
    { key: 'image', label: 'Gambar',     ext: '.jpg/.png',  color: 'violet' },
    { key: 'zip',   label: 'ZIP',        ext: '.zip',       color: 'amber' },
];
const FMT_ACTIVE = {
    rose:    'border-rose-500 bg-rose-500 text-white',
    sky:     'border-sky-500 bg-sky-500 text-white',
    emerald: 'border-emerald-500 bg-emerald-500 text-white',
    orange:  'border-orange-500 bg-orange-500 text-white',
    violet:  'border-violet-500 bg-violet-500 text-white',
    amber:   'border-amber-500 bg-amber-500 text-white',
};
const FMT_IDLE = {
    rose:    'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
    sky:     'border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-400',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    orange:  'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    violet:  'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
    amber:   'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
};

/* ── Modal buat pengumpulan ── */
function ModalCreate({ open, onClose, tahunAjaran, mataPelajaran }) {
    const [form, setForm] = useState({
        judul: '', deskripsi: '', batas_waktu: '',
        tahun_ajaran_id: '',
        mata_pelajaran_ids: [],
        format_file: [],
        allow_late_upload: true,
    });
    const [busy, setBusy] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const toggleFormat = (k) => set('format_file', form.format_file.includes(k)
        ? form.format_file.filter(x => x !== k)
        : [...form.format_file, k]
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        setBusy(true);
        router.post('/admin/pengumpulan', form, {
            onFinish: () => { setBusy(false); onClose(); },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 bg-linear-to-r from-emerald-50 to-sky-50 dark:from-emerald-900/20 dark:to-sky-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-800/50">
                            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Buat Pengumpulan Baru</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Isi detail dan pengaturan pengumpulan</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">

                            {/* Kolom kiri — info dasar */}
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Informasi Dasar</p>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        Judul <span className="text-rose-500">*</span>
                                    </label>
                                    <input type="text" value={form.judul} onChange={e => set('judul', e.target.value)} required
                                        placeholder="cth. Pengumpulan RPP Semester Ganjil"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors placeholder-gray-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
                                    </label>
                                    <textarea value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3}
                                        placeholder="Keterangan tambahan untuk guru…"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors resize-none placeholder-gray-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        Batas Waktu <span className="text-rose-500">*</span>
                                    </label>
                                    <input type="datetime-local" value={form.batas_waktu} onChange={e => set('batas_waktu', e.target.value)} required
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        Tahun Ajaran <span className="text-rose-500">*</span>
                                    </label>
                                    <select value={form.tahun_ajaran_id} onChange={e => set('tahun_ajaran_id', e.target.value)} required
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors">
                                        <option value="">— Pilih Tahun Ajaran —</option>
                                        {tahunAjaran.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Kolom kanan — pengaturan */}
                            <div className="px-6 py-5 space-y-5">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pengaturan & Mata Pelajaran</p>

                                {/* Mata pelajaran */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        Filter Mata Pelajaran
                                        <span className="ml-1 text-gray-400 font-normal">(kosong = semua mapel)</span>
                                    </label>
                                    <MultiSelectMapel
                                        options={mataPelajaran}
                                        selected={form.mata_pelajaran_ids}
                                        onChange={v => set('mata_pelajaran_ids', v)}
                                    />
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800" />

                                {/* Format file */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Format File Diizinkan
                                        <span className="ml-1 text-gray-400 font-normal">(kosong = semua format)</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {FORMAT_OPTIONS_CREATE.map(opt => {
                                            const active = form.format_file.includes(opt.key);
                                            return (
                                                <button key={opt.key} type="button"
                                                    onClick={() => toggleFormat(opt.key)}
                                                    className={`inline-flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                                                        active ? FMT_ACTIVE[opt.color] : FMT_IDLE[opt.color]
                                                    }`}
                                                >
                                                    <span className="font-semibold">{opt.label}</span>
                                                    <span className="opacity-60 mt-0.5 text-[10px]">{opt.ext}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800" />

                                {/* Allow late upload */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <label htmlFor="create-toggle-late" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">Upload Terlambat</label>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {form.allow_late_upload
                                                ? 'Guru masih bisa upload (status: Terlambat)'
                                                : 'Portal ditutup — admin buka satu per satu'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs font-medium ${form.allow_late_upload ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>
                                            {form.allow_late_upload ? 'Diizinkan' : 'Ditutup'}
                                        </span>
                                        <Toggle id="create-toggle-late" checked={form.allow_late_upload} onChange={v => set('allow_late_upload', v)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 shrink-0 bg-gray-50/80 dark:bg-gray-800/40">
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {form.format_file.length === 0
                                ? 'Semua format file diterima'
                                : `${form.format_file.length} format dipilih`}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                Batal
                            </button>
                            <button type="submit" disabled={busy}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2">
                                {busy ? (
                                    <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Menyimpan…</>
                                ) : (
                                    <><Plus className="h-3.5 w-3.5" /> Buat Pengumpulan</>
                                )}
                            </button>
                        </div>
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
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, judul }

    const handleDelete = useCallback((id, judul) => {
        setDeleteTarget({ id, judul });
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        router.delete(`/admin/pengumpulan/${deleteTarget.id}`, {
            onFinish: () => setDeleteTarget(null),
        });
    }, [deleteTarget]);

    const { data, current_page, last_page, prev_page_url, next_page_url } = pengumpulan;

    return (
        <AppLayout title="Pengumpulan">
            <div className="space-y-6">
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

                {flash.success && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

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
                                                                onClick={() => handleDelete(p.id, p.judul)}
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

                {last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Halaman {current_page} dari {last_page}</span>
                        <div className="flex gap-2">
                            <Link href={prev_page_url ?? '#'}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${
                                    !prev_page_url ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}>
                                <ChevronLeft className="h-4 w-4" /> Prev
                            </Link>
                            <Link href={next_page_url ?? '#'}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${
                                    !next_page_url ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}>
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

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Pengumpulan"
                message={deleteTarget
                    ? `"${deleteTarget.judul}" akan dihapus beserta semua file yang sudah diunggah. Tindakan ini tidak dapat dibatalkan.`
                    : ''}
                confirmLabel="Ya, Hapus"
                confirmVariant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
