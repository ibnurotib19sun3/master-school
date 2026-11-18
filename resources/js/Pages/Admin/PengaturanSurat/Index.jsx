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
    const numAwal = Number(pengaturan.nomor_awal_surat) || 0;
    const seqStr = numAwal <= 0
        ? '[Manual]'
        : (numAwal < 1000 ? String(numAwal).padStart(4, '0') : String(numAwal));
    const map  = {
        prefix:          pengaturan.prefix_kode || '',
        seq:             seqStr,
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
    { key: 'prefix',          label: 'Prefix/Kode Sekolah',          example: 'SMK',         hint: 'Kode tetap di awal nomor' },
    { key: 'seq',             label: 'Nomor Urut',                   example: '0001 / 0813', hint: 'Urutan surat tahun ini (4 digit untuk < 1000)' },
    { key: 'kode_jenis',      label: 'Kode Jenis Surat',             example: 'SK',          hint: 'Kode jenis surat saja (misal SK, Und)' },
    { key: 'kode_dept',       label: 'Kode Departemen',              example: 'KUR',         hint: 'Kode bidang/departemen saja' },
    { key: 'kode_jenis_dept', label: 'Kode Jenis.Dept (Gabung)',     example: 'SK.KUR',      hint: 'Jenis & dept digabung dengan titik — misal SK.03' },
    { key: 'kode_dept_jenis', label: 'Kode Dept.Jenis (Gabung)',     example: 'KUR.SK',      hint: 'Dept & jenis digabung dengan titik — urutan terbalik' },
    { key: 'bulan_romawi',    label: 'Bulan (Romawi)',               example: 'VII',         hint: 'Bulan dalam angka romawi' },
    { key: 'tahun',           label: 'Tahun',                        example: '2026',        hint: 'Tahun penerbitan surat' },
];

/* ─── Tab Button ─── */
function TabBtn({ active, onClick, icon: Icon, children }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap active:scale-[0.98] ${
                active
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}>
            <Icon className="h-4 w-4 shrink-0" />
            <span>{children}</span>
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
            <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pb-3 border-b-[3px] border-gray-900 dark:border-gray-300">
                    {sekolah.logo_url ? (
                        <img src={sekolah.logo_url} className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0" alt="Logo" />
                    ) : (
                        <div className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-xs text-gray-400 shrink-0">
                            LOGO
                        </div>
                    )}
                    <div className="flex-1 text-center space-y-0.5">
                        {yayasan && (
                            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{yayasan}</p>
                        )}
                        <p className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900 dark:text-gray-100 leading-tight">
                            {nama || <span className="text-gray-300 dark:text-gray-600 font-normal not-italic">Nama Sekolah</span>}
                        </p>
                        {sub && <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
                        {alamat && <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{alamat}</p>}
                        {contacts && <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 break-words">{contacts}</p>}
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
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
                <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto justify-center">
                    Simpan KOP Surat
                </Button>
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
            {/* Add form - Responsive on mobile */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-end bg-gray-50/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/60">
                <div className="flex-1">
                    <Input label="Nama" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Misal: Kurikulum" />
                </div>
                <div className="w-full sm:w-28">
                    <Input label="Kode" value={form.kode} onChange={e => setForm(p => ({ ...p, kode: e.target.value.toUpperCase() }))} placeholder="KUR" />
                </div>
                <Button icon={Plus} loading={adding} className="w-full sm:w-auto justify-center"
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
    const [nomorAwal, setNomorAwal] = useState(
        pengaturan.nomor_awal_surat !== null && pengaturan.nomor_awal_surat !== undefined
            ? pengaturan.nomor_awal_surat
            : 0
    );
    const [enabled, setEnabled] = useState(
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
    const isManual = Number(nomorAwal) === 0;

    const currentPreview = (() => {
        const sep = separator || '/';
        const numAwal = Number(nomorAwal) || 0;
        let seqStr = '';
        if (numAwal === 0) {
            seqStr = '[No.Urut-Manual]';
        } else if (numAwal < 1000) {
            seqStr = String(numAwal).padStart(4, '0');
        } else {
            seqStr = String(numAwal);
        }

        const map = {
            prefix:          prefixKode || 'SMK',
            seq:             seqStr,
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
        const num = nomorAwal === '' ? 0 : Math.max(0, parseInt(nomorAwal, 10) || 0);
        router.post('/admin/pengaturan-surat/format', {
            separator,
            prefix_kode:      prefixKode || null,
            nomor_awal_surat: num,
            format_bagian:    currentBagian,
        }, { onFinish: () => setSaving(false) });
    };

    return (
        <div className="space-y-6">
            {/* Separator + Prefix + Nomor Awal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="bg-gray-50/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 flex flex-col justify-between">
                    <div>
                        <Input
                            label="Pemisah (Separator)"
                            value={separator}
                            onChange={e => setSeparator(e.target.value)}
                            placeholder="/"
                            className="font-mono text-center font-bold text-lg"
                        />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                        Karakter pemisah antar bagian nomor, biasanya <code>/</code> atau <code>-</code>.
                    </p>
                </div>

                <div className="bg-gray-50/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 flex flex-col justify-between">
                    <div>
                        <Input
                            label="Kode Depan (Prefix)"
                            value={prefixKode}
                            onChange={e => setPrefixKode(e.target.value)}
                            placeholder="cth: 420 atau YP.m"
                            className="font-mono"
                        />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                        Kode instansi/dinas di awal. Aktifkan bagian <strong>Prefix</strong> di bawah jika ingin ditampilkan.
                    </p>
                </div>

                <div className="bg-gray-50/70 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Nomor Awal Surat
                            </label>
                            {isManual ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Manual (0)
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    Otomatis
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={nomorAwal}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '') setNomorAwal('');
                                else setNomorAwal(Math.max(0, parseInt(val, 10) || 0));
                            }}
                            placeholder="0 = Manual"
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-tight">
                        {isManual ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Nilai <strong>0</strong>: belum ada nomor awal. Saat tambah surat keluar, nomor surat diinput secara <strong>manual</strong>.
                            </span>
                        ) : (
                            <span>
                                Mulai nomor urut otomatis dari <strong>{Number(nomorAwal) < 1000 ? String(nomorAwal).padStart(4, '0') : nomorAwal}</strong>.
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Preview Box - Modern & Fully Responsive on Mobile */}
            <div className="rounded-2xl bg-gradient-to-br from-sky-50/90 via-sky-50/30 to-white dark:from-sky-950/40 dark:via-gray-900 dark:to-gray-900 border border-sky-200/90 dark:border-sky-800/80 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-sky-500 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Pratinjau Nomor Surat Tergenerate
                        </span>
                    </div>
                    {isManual ? (
                        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Mode Input Manual (Nomor Awal = 0)
                        </span>
                    ) : (
                        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Mode Otomatis Aktif
                        </span>
                    )}
                </div>

                <div className="py-2.5">
                    <p className="font-mono text-xl sm:text-2xl lg:text-3xl font-extrabold text-sky-800 dark:text-sky-200 tracking-wide break-all leading-tight">
                        {currentPreview}
                    </p>
                </div>

                <div className="pt-2 border-t border-sky-100 dark:border-sky-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <p>
                        {isManual ? (
                            <>Simulasi format saat nomor diisi manual (contoh jenis: <strong>SK</strong>, departemen: <strong>KUR</strong>)</>
                        ) : (
                            <>Contoh nomor urut <strong>{Number(nomorAwal) < 1000 ? String(nomorAwal).padStart(4, '0') : nomorAwal}</strong>, jenis: <strong>SK</strong>, departemen: <strong>KUR</strong></>
                        )}
                    </p>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        {currentBagian.length} bagian aktif
                    </span>
                </div>
            </div>

            {/* Part List - Mobile Optimized */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            Komponen Nomor Surat
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Centang komponen yang diinginkan, gunakan tombol panah untuk mengubah urutan.
                        </p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {order.map((key, idx) => {
                        const part = ALL_PARTS.find(p => p.key === key);
                        if (!part) return null;
                        const isEnabled = enabled[key];
                        const activeIndex = currentBagian.indexOf(key);

                        return (
                            <div
                                key={key}
                                className={`rounded-xl border transition-all duration-150 p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3.5 ${
                                    isEnabled
                                        ? 'border-sky-300 dark:border-sky-700 bg-white dark:bg-gray-900 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 opacity-60'
                                }`}
                            >
                                {/* Position badge */}
                                <div className="shrink-0 flex items-center justify-center">
                                    {isEnabled ? (
                                        <span className="h-6 w-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                            {activeIndex + 1}
                                        </span>
                                    ) : (
                                        <span className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 font-bold text-xs flex items-center justify-center">
                                            -
                                        </span>
                                    )}
                                </div>

                                {/* Checkbox */}
                                <label className="shrink-0 flex items-center cursor-pointer p-1 -m-1">
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={e => setEnabled(p => ({ ...p, [key]: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                    />
                                </label>

                                {/* Label & description */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer select-none"
                                    onClick={() => setEnabled(p => ({ ...p, [key]: !p[key] }))}
                                >
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                            {part.label}
                                        </span>
                                        <span className="rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 text-[11px] font-mono">
                                            {part.example}
                                        </span>
                                        {key === 'prefix' && prefixKode && (
                                            <span className="rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 text-[11px] font-mono font-bold">
                                                {prefixKode}
                                            </span>
                                        )}
                                        {!isEnabled && (
                                            <span className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded">
                                                Nonaktif
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                                        {part.hint}
                                    </p>
                                </div>

                                {/* Move arrow buttons - large & touch friendly for mobile */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => move(idx, -1)}
                                        disabled={idx === 0}
                                        title="Pindah ke atas"
                                        className="h-8 w-8 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all border border-gray-200 dark:border-gray-700 sm:border-transparent sm:hover:border-sky-200"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(idx, 1)}
                                        disabled={idx === order.length - 1}
                                        title="Pindah ke bawah"
                                        className="h-8 w-8 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all border border-gray-200 dark:border-gray-700 sm:border-transparent sm:hover:border-sky-200"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {currentBagian.length === 0 && (
                <div className="rounded-xl p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                    Pilih minimal satu bagian untuk nomor surat.
                </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-3">
                <Button
                    onClick={handleSave}
                    loading={saving}
                    disabled={currentBagian.length === 0}
                    className="w-full sm:w-auto justify-center"
                >
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
            <div className="max-w-4xl mx-auto px-1 sm:px-0">
                <div className="mb-5 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-sky-500" /> Pengaturan Surat
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Kelola KOP surat, kode departemen, kode jenis surat, dan format penomoran.
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 shadow-sm">
                        <Check className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}

                <Card className="shadow-sm">
                    {/* Tab bar - Touch scrollable on mobile */}
                    <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-none">
                        <div className="flex px-2 sm:px-4 gap-1 min-w-max">
                            {TABS.map(t => (
                                <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon}>
                                    {t.label}
                                </TabBtn>
                            ))}
                        </div>
                    </div>

                    <CardBody className="p-4 sm:p-6">
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
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 p-3.5 sm:px-4 sm:py-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Eye className="h-4 w-4 shrink-0 text-sky-500" />
                            <span>Format nomor surat aktif:</span>
                        </div>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 break-all">
                            {previewNomor(pengaturan)}
                        </span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
