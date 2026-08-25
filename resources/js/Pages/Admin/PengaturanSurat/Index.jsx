import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Input, Textarea } from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import { Card, CardHeader, CardBody } from '@/Components/ui/Card';
import {
    Building2, Code2, FileType2, Hash, Settings2,
    Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown,
    GripVertical, Eye, Info,
} from 'lucide-react';
import { useState } from 'react';

/* ─── helpers ─── */
const ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function previewNomor(pengaturan) {
    const sep  = pengaturan.separator || '/';
    const map  = {
        prefix:          pengaturan.prefix_kode || '',
        seq:             '001',
        kode_jenis:      'SK',
        kode_dept:       'KUR',
        kode_jenis_dept: 'SK.KUR',
        kode_dept_jenis: 'KUR.SK',
        bulan_romawi:    ROMAN[new Date().getMonth() + 1],
        tahun:           String(new Date().getFullYear()),
    };
    const parts = (pengaturan.format_bagian || ['seq','kode_jenis','kode_dept','bulan_romawi','tahun'])
        .map(p => map[p] ?? '')
        .filter(Boolean);
    return parts.join(sep) || '—';
}

const ALL_PARTS = [
    { key: 'prefix',          label: 'Prefix/Kode Sekolah',          example: 'SMK',    hint: 'Kode tetap di awal nomor' },
    { key: 'seq',             label: 'Nomor Urut',                   example: '001',    hint: 'Urutan surat tahun ini' },
    { key: 'kode_jenis',      label: 'Kode Jenis Surat',             example: 'SK',     hint: 'Kode jenis surat saja (misal SK, Und)' },
    { key: 'kode_dept',       label: 'Kode Departemen',              example: 'KUR',    hint: 'Kode bidang/departemen saja' },
    { key: 'kode_jenis_dept', label: 'Kode Jenis.Dept (Gabung)',     example: 'SK.KUR', hint: 'Jenis & dept digabung dengan titik — misal SK.03' },
    { key: 'kode_dept_jenis', label: 'Kode Dept.Jenis (Gabung)',     example: 'KUR.SK', hint: 'Dept & jenis digabung dengan titik — urutan terbalik' },
    { key: 'bulan_romawi',    label: 'Bulan (Romawi)',               example: 'VII',    hint: 'Bulan dalam angka romawi' },
    { key: 'tahun',           label: 'Tahun',                        example: '2026',   hint: 'Tahun penerbitan surat' },
];

/* ─── Tab Button ─── */
function TabBtn({ active, onClick, icon: Icon, children }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
            <Icon className="h-4 w-4" /> {children}
        </button>
    );
}

/* ─── KOP Preview ─── */
function KopPreview({ form, sekolah }) {
    const yayasan = form.yayasan_dinas || sekolah.yayasan_dinas;
    const nama    = form.nama_instansi  || sekolah.nama_sekolah;
    const sub     = form.sub_nama;
    const alamat  = form.alamat_kop || [sekolah.alamat, sekolah.kecamatan, sekolah.kota].filter(Boolean).join(', ');
    const telepon = form.telepon_kop   || sekolah.telepon;
    const email   = form.email_kop     || sekolah.email_sekolah;
    const website = form.website_kop   || sekolah.website;
    const npsn    = form.npsn_kop      || sekolah.npsn;

    const contacts = [
        telepon  && `Telp: ${telepon}`,
        email    && `Email: ${email}`,
        website,
    ].filter(Boolean).join('  |  ');

    return (
        <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800">
                <Eye className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-sky-500 dark:text-sky-400">Pratinjau KOP Surat</span>
                <span className="ml-auto text-xs text-sky-400 dark:text-sky-500 italic">Update otomatis saat mengetik</span>
            </div>
            <div className="p-5">
                <div className="flex items-center gap-4 pb-3 border-b-[3px] border-gray-900 dark:border-gray-300">
                    {sekolah.logo_url ? (
                        <img src={sekolah.logo_url} className="h-16 w-16 object-contain shrink-0" alt="Logo" />
                    ) : (
                        <div className="h-16 w-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-xs text-gray-400 shrink-0">
                            LOGO
                        </div>
                    )}
                    <div className="flex-1 text-center space-y-0.5">
                        {yayasan && (
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{yayasan}</p>
                        )}
                        <p className="text-xl font-black uppercase tracking-wide text-gray-900 dark:text-gray-100 leading-tight">
                            {nama || <span className="text-gray-300 dark:text-gray-600 font-normal not-italic">Nama Sekolah</span>}
                        </p>
                        {sub && <p className="text-[11px] text-gray-500 dark:text-gray-400">{sub}</p>}
                        {alamat && <p className="text-[10px] text-gray-500 dark:text-gray-400">{alamat}</p>}
                        {contacts && <p className="text-[10px] text-gray-400 dark:text-gray-500">{contacts}</p>}
                    </div>
                </div>
                <div className="h-1 bg-yellow-500 mt-0.5 rounded-sm" />
                {npsn && (
                    <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">NPSN: {npsn}</p>
                )}
            </div>
        </div>
    );
}

/* ─── KOP Surat Tab ─── */
function TabKop({ pengaturan, sekolah }) {
    const [form, setForm] = useState({
        nama_instansi: pengaturan.nama_instansi ?? '',
        sub_nama:      pengaturan.sub_nama ?? '',
        yayasan_dinas: pengaturan.yayasan_dinas ?? '',
        alamat_kop:    pengaturan.alamat_kop ?? '',
        telepon_kop:   pengaturan.telepon_kop ?? '',
        website_kop:   pengaturan.website_kop ?? '',
        email_kop:     pengaturan.email_kop ?? '',
        npsn_kop:      pengaturan.npsn_kop ?? '',
    });
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = () => {
        setSaving(true);
        router.post('/admin/pengaturan-surat/kop', form, { onFinish: () => setSaving(false) });
    };

    return (
        <div className="space-y-6">
            {/* Live KOP Preview */}
            <KopPreview form={form} sekolah={sekolah} />

            {/* Info fallback */}
            <div className="flex items-start gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3 text-sm text-sky-700 dark:text-sky-400">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">KOP Surat Khusus</p>
                    <p className="mt-0.5 opacity-80">
                        Jika dikosongkan, KOP surat akan menggunakan data dari <strong>Pengaturan Sekolah</strong>.
                        Isi hanya jika ingin override khusus untuk surat menyurat.
                    </p>
                </div>
            </div>

            {/* Form override */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <Input label="Yayasan / Dinas (override)" value={form.yayasan_dinas} onChange={e => set('yayasan_dinas', e.target.value)}
                        placeholder={sekolah.yayasan_dinas || 'Yayasan Pendidikan ... / Dinas Pendidikan Prov. ...'} />
                </div>
                <Input label="Nama Instansi (override)" value={form.nama_instansi} onChange={e => set('nama_instansi', e.target.value)} placeholder={sekolah.nama_sekolah || 'Misal: SMK Contoh Negeri 1'} />
                <Input label="Sub Nama / Bidang" value={form.sub_nama} onChange={e => set('sub_nama', e.target.value)} placeholder="Misal: Bidang Administrasi" />
                <div className="sm:col-span-2">
                    <Textarea label="Alamat KOP (override)" value={form.alamat_kop} onChange={e => set('alamat_kop', e.target.value)} placeholder={sekolah.alamat || 'Jl. Contoh No. 1, Kota'} rows={2} />
                </div>
                <Input label="Telepon (override)" value={form.telepon_kop} onChange={e => set('telepon_kop', e.target.value)} placeholder={sekolah.telepon || '(021) 1234567'} />
                <Input label="NPSN (override)" value={form.npsn_kop} onChange={e => set('npsn_kop', e.target.value)} placeholder={sekolah.npsn || '12345678'} />
                <Input label="Email (override)" type="email" value={form.email_kop} onChange={e => set('email_kop', e.target.value)} placeholder={sekolah.email_sekolah || 'info@sekolah.sch.id'} />
                <Input label="Website (override)" value={form.website_kop} onChange={e => set('website_kop', e.target.value)} placeholder={sekolah.website || 'www.sekolah.sch.id'} />
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} loading={saving}>Simpan KOP Surat</Button>
            </div>
        </div>
    );
}

/* ─── Kode Table (reusable for dept & jenis) ─── */
function KodeTable({ items, onStore, onUpdate, onDestroy, addLabel }) {
    const [form, setForm]     = useState({ nama: '', kode: '' });
    const [editId, setEditId] = useState(null);
    const [editForm, setEF]   = useState({});
    const [adding, setAdding] = useState(false);

    const startEdit = (item) => { setEditId(item.id); setEF({ nama: item.nama, kode: item.kode, aktif: item.aktif }); };
    const cancelEdit = () => setEditId(null);

    return (
        <div className="space-y-4">
            {/* Add form */}
            <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-40">
                    <Input label="Nama" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Misal: Kurikulum" />
                </div>
                <div className="w-28">
                    <Input label="Kode" value={form.kode} onChange={e => setForm(p => ({ ...p, kode: e.target.value.toUpperCase() }))} placeholder="KUR" />
                </div>
                <Button icon={Plus} loading={adding}
                    onClick={() => {
                        if (!form.nama || !form.kode) return;
                        setAdding(true);
                        onStore(form, () => { setForm({ nama: '', kode: '' }); setAdding(false); });
                    }}>
                    {addLabel}
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 w-8">#</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 w-24">Kode</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 w-20">Status</th>
                            <th className="px-4 py-2.5 w-28" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {items.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Belum ada data</td></tr>
                        )}
                        {items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                {editId === item.id ? (
                                    <>
                                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-2">
                                            <Input value={editForm.nama} onChange={e => setEF(p => ({ ...p, nama: e.target.value }))} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input value={editForm.kode} onChange={e => setEF(p => ({ ...p, kode: e.target.value.toUpperCase() }))} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="checkbox" checked={editForm.aktif}
                                                    onChange={e => setEF(p => ({ ...p, aktif: e.target.checked }))}
                                                    className="rounded border-gray-300" />
                                                <span className="text-xs">Aktif</span>
                                            </label>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex gap-1">
                                                <button onClick={() => onUpdate(item.id, editForm, cancelEdit)}
                                                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button onClick={cancelEdit}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{item.nama}</td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-block rounded-md bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 text-xs font-mono font-bold">
                                                {item.kode}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                item.aktif
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                            }`}>
                                                {item.aktif ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => startEdit(item)}
                                                    className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => { if (confirm('Hapus data ini?')) onDestroy(item.id); }}
                                                    className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─── Format Nomor Tab ─── */
function TabFormat({ pengaturan }) {
    const defaultParts = pengaturan.format_bagian ?? ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'];

    const [separator, setSeparator] = useState(pengaturan.separator ?? '/');
    const [prefixKode, setPrefixKode] = useState(pengaturan.prefix_kode ?? '');
    const [enabled, setEnabled]     = useState(
        () => {
            const set = new Set(defaultParts);
            return Object.fromEntries(ALL_PARTS.map(p => [p.key, set.has(p.key)]));
        }
    );
    const [order, setOrder] = useState(
        () => {
            const inParts = defaultParts.filter(k => ALL_PARTS.some(p => p.key === k));
            const notIn   = ALL_PARTS.map(p => p.key).filter(k => !inParts.includes(k));
            return [...inParts, ...notIn];
        }
    );
    const [saving, setSaving] = useState(false);

    const move = (idx, dir) => {
        setOrder(prev => {
            const arr  = [...prev];
            const swap = idx + dir;
            if (swap < 0 || swap >= arr.length) return arr;
            [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
            return arr;
        });
    };

    const currentBagian = order.filter(k => enabled[k]);

    const currentPreview = (() => {
        const sep = separator || '/';
        const map = {
            prefix:          prefixKode || 'SMK',
            seq:             '001',
            kode_jenis:      'SK',
            kode_dept:       'KUR',
            kode_jenis_dept: 'SK.KUR',
            kode_dept_jenis: 'KUR.SK',
            bulan_romawi:    ROMAN[new Date().getMonth() + 1],
            tahun:           String(new Date().getFullYear()),
        };
        return currentBagian.map(k => map[k]).filter(Boolean).join(sep) || '—';
    })();

    const handleSave = () => {
        setSaving(true);
        router.post('/admin/pengaturan-surat/format', {
            separator,
            prefix_kode:  prefixKode || null,
            format_bagian: currentBagian,
        }, { onFinish: () => setSaving(false) });
    };

    return (
        <div className="space-y-6">
            {/* Separator + Prefix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Input label="Separator antar bagian" value={separator}
                        onChange={e => setSeparator(e.target.value)}
                        placeholder="/" className="font-mono" />
                    <p className="text-xs text-gray-400 mt-1">Biasanya garis miring  <code>/</code></p>
                </div>
                <div>
                    <Input label="Kode Depan (Prefix)" value={prefixKode}
                        onChange={e => setPrefixKode(e.target.value)}
                        placeholder="YP.m/7" className="font-mono" />
                    <p className="text-xs text-gray-400 mt-1">
                        Boleh mengandung tanda baca. Contoh: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">YP.m/7</code> → <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">YP.m/7/001/SK/...</code>.
                        Aktifkan bagian "Prefix" di daftar bawah agar muncul.
                    </p>
                </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-5 py-4">
                <p className="text-xs text-sky-500 dark:text-sky-400 font-semibold uppercase tracking-wide mb-1.5">Pratinjau Nomor Surat</p>
                <p className="font-mono text-2xl font-bold text-sky-700 dark:text-sky-300 tracking-wider">
                    {currentPreview}
                </p>
                <p className="text-xs text-sky-400 dark:text-sky-500 mt-1">
                    Contoh: No. urut 001, Surat Keputusan (SK), Kurikulum (KUR)
                </p>
            </div>

            {/* Part list */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Bagian Nomor Surat — centang yang diinginkan, atur urutan dengan tombol ▲▼
                </p>
                <div className="space-y-2">
                    {order.map((key, idx) => {
                        const part = ALL_PARTS.find(p => p.key === key);
                        if (!part) return null;
                        const isEnabled = enabled[key];
                        return (
                            <div key={key}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                                    isEnabled
                                        ? 'border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-900'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50'
                                }`}>
                                <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                                <input type="checkbox" checked={isEnabled}
                                    onChange={e => setEnabled(p => ({ ...p, [key]: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-sky-600" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{part.label}</span>
                                        <span className="rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 text-xs font-mono">
                                            {part.example}
                                        </span>
                                        {key === 'prefix' && prefixKode && (
                                            <span className="rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 text-xs font-mono font-bold">
                                                {prefixKode}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{part.hint}</p>
                                </div>
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button onClick={() => move(idx, -1)} disabled={idx === 0}
                                        className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 transition-colors">
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => move(idx, 1)} disabled={idx === order.length - 1}
                                        className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 transition-colors">
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {currentBagian.length === 0 && (
                <p className="text-sm text-red-500">Pilih minimal satu bagian untuk nomor surat.</p>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSave} loading={saving} disabled={currentBagian.length === 0}>
                    Simpan Format Nomor
                </Button>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function PengaturanSuratIndex({ pengaturan, sekolah, kode_departemen, kode_jenis }) {
    const [tab, setTab] = useState('kop');
    const { props }     = usePage();
    const flash         = props.flash ?? {};

    /* Dept helpers — Inertia refreshes props automatically after each request */
    const storeDept   = (form, done) => router.post('/admin/pengaturan-surat/kode-dept', form, { onFinish: done });
    const updateDept  = (id, form, done) => router.put(`/admin/pengaturan-surat/kode-dept/${id}`, form, { onFinish: done });
    const destroyDept = (id) => router.delete(`/admin/pengaturan-surat/kode-dept/${id}`);

    /* Jenis helpers */
    const storeJenis   = (form, done) => router.post('/admin/pengaturan-surat/kode-jenis', form, { onFinish: done });
    const updateJenis  = (id, form, done) => router.put(`/admin/pengaturan-surat/kode-jenis/${id}`, form, { onFinish: done });
    const destroyJenis = (id) => router.delete(`/admin/pengaturan-surat/kode-jenis/${id}`);

    const TABS = [
        { key: 'kop',    label: 'KOP Surat',        icon: Building2  },
        { key: 'dept',   label: 'Kode Departemen',   icon: Code2      },
        { key: 'jenis',  label: 'Kode Jenis Surat',  icon: FileType2  },
        { key: 'format', label: 'Format Nomor',      icon: Hash       },
    ];

    return (
        <AppLayout title="Pengaturan Surat">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-sky-500" /> Pengaturan Surat
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Kelola KOP surat, kode departemen, kode jenis surat, dan format penomoran.
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                        <Check className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                <Card>
                    {/* Tab bar */}
                    <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <div className="flex px-2 gap-1 min-w-max">
                            {TABS.map(t => (
                                <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon}>
                                    {t.label}
                                </TabBtn>
                            ))}
                        </div>
                    </div>

                    <CardBody className="pt-6">
                        {tab === 'kop'    && <TabKop    pengaturan={pengaturan} sekolah={sekolah} />}
                        {tab === 'dept'   && (
                            <KodeTable
                                items={kode_departemen}
                                addLabel="Tambah"
                                onStore={storeDept}
                                onUpdate={updateDept}
                                onDestroy={destroyDept}
                            />
                        )}
                        {tab === 'jenis'  && (
                            <KodeTable
                                items={kode_jenis}
                                addLabel="Tambah"
                                onStore={storeJenis}
                                onUpdate={updateJenis}
                                onDestroy={destroyJenis}
                            />
                        )}
                        {tab === 'format' && <TabFormat pengaturan={pengaturan} />}
                    </CardBody>
                </Card>

                {/* Format preview footer */}
                {tab !== 'format' && (
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Eye className="h-4 w-4" />
                            <span>Format nomor surat aktif:</span>
                        </div>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                            {previewNomor(pengaturan)}
                        </span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
