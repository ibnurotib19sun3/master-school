import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Save, BookOpen, Filter, Plus, Trash2, Search, CheckCircle, X, ChevronDown, Info, AlertTriangle, ChevronUp, Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

/* ─── Searchable combobox untuk mata pelajaran ─── */
function MapelCombobox({ value, options, onChange, placeholder = '— Pilih Mata Pelajaran —' }) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const btnRef = useRef(null);
    const inpRef = useRef(null);
    const boxRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    const selected = options.find((m) => String(m.id) === String(value));
    const filtered = options.filter((m) =>
        !search || m.nama.toLowerCase().includes(search.toLowerCase())
    );

    const openBox = () => {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 280) });
        setOpen(true);
        setSearch('');
        setTimeout(() => inpRef.current?.focus(), 30);
    };

    const select = (id) => { onChange(String(id)); setOpen(false); };
    const clear   = ()   => { onChange('');        setOpen(false); };

    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target))
                setOpen(false);
        };
        const closeScroll = () => setOpen(false);
        document.addEventListener('mousedown', close);
        window.addEventListener('scroll', closeScroll, true);
        return () => { document.removeEventListener('mousedown', close); window.removeEventListener('scroll', closeScroll, true); };
    }, [open]);

    return (
        <>
            <button ref={btnRef} type="button" onClick={openBox}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                    selected
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        : 'border-dashed border-gray-300 dark:border-gray-600 bg-transparent text-gray-400 dark:text-gray-500'
                }`}
            >
                <span className="truncate text-left text-xs">
                    {selected ? selected.nama : placeholder}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
            </button>

            {open && createPortal(
                <div ref={boxRef}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
                >
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <input ref={inpRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari mata pelajaran..."
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
                            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                        {value && (
                            <button onClick={clear}
                                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <X className="h-3.5 w-3.5" /> Kosongkan
                            </button>
                        )}
                        {filtered.length === 0
                            ? <p className="px-3 py-3 text-xs text-gray-400 text-center">Tidak ada hasil.</p>
                            : filtered.map((m) => (
                                <button key={m.id} onClick={() => select(m.id)}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                                        String(m.id) === String(value)
                                            ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {String(m.id) === String(value) && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-sky-500" />}
                                    <span className="flex-1 min-w-0">{m.nama}</span>
                                </button>
                            ))
                        }
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

/* ─── Row satu pembelajaran ─── */
function PembelajaranRow({ row, mataPelajaran, guruList, rombelJurusan, onChange, onDelete }) {
    const mapelNama = useMemo(
        () => mataPelajaran.find((m) => String(m.id) === String(row.mata_pelajaran_id))?.nama ?? null,
        [mataPelajaran, row.mata_pelajaran_id]
    );

    const guruFiltered = useMemo(() => {
        if (!row.mata_pelajaran_id) return guruList;
        const mapelId = Number(row.mata_pelajaran_id);
        const matched = guruList.filter((g) => Array.isArray(g.bidang_studi) && g.bidang_studi.map(Number).includes(mapelId));
        return matched.length > 0 ? matched : guruList;
    }, [guruList, row.mata_pelajaran_id]);

    const noExactMatch = row.mata_pelajaran_id
        && guruList.filter((g) => Array.isArray(g.bidang_studi) && g.bidang_studi.map(Number).includes(Number(row.mata_pelajaran_id))).length === 0;

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            row._dirty
                ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                : row.id
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                    : 'border-dashed border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-900/10'
        }`}>
            {/* Mata pelajaran combobox */}
            <div className="flex-1 min-w-0">
                <MapelCombobox
                    value={row.mata_pelajaran_id}
                    options={mataPelajaran}
                    onChange={(val) => onChange(row._key, 'mapel', val)}
                />
            </div>

            {/* Kelompok jurusan — hanya tampil jika rombel punya lebih dari 1 jurusan */}
            {rombelJurusan.length > 0 && (
                <div className="w-36 shrink-0">
                    <select
                        value={row.jurusan_id ?? ''}
                        onChange={(e) => onChange(row._key, 'jurusan', e.target.value || null)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                        <option value="">Semua</option>
                        {rombelJurusan.map((j) => (
                            <option key={j.id} value={j.id}>{j.kode}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Guru select */}
            <div className="w-52 shrink-0">
                <select
                    value={row.guru_id}
                    onChange={(e) => onChange(row._key, 'guru', e.target.value)}
                    disabled={!row.mata_pelajaran_id}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                >
                    <option value="">{row.mata_pelajaran_id ? '— Pilih Guru —' : '— Pilih mapel dulu —'}</option>
                    {guruFiltered.map((g) => (
                        <option key={g.id} value={g.id}>{g.user?.name}</option>
                    ))}
                </select>
                {noExactMatch && row.mata_pelajaran_id && (
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-500">
                        <Info className="h-2.5 w-2.5 shrink-0" /> Menampilkan semua guru
                    </p>
                )}
            </div>

            {/* Status pill */}
            {row._dirty && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0 hidden sm:block">
                    {row.id ? 'Ubah' : 'Baru'}
                </span>
            )}

            {/* Hapus */}
            <button
                onClick={() => onDelete(row._key)}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

/* ─── Build rows dari data existing ─── */
function buildRows(list) {
    return list.map((p) => ({
        _key:              `existing-${p.id}`,
        id:                p.id,
        mata_pelajaran_id: String(p.mata_pelajaran_id),
        guru_id:           String(p.guru_id),
        jurusan_id:        p.jurusan_id ?? null,
        _original_mapel:   String(p.mata_pelajaran_id),
        _original_guru:    String(p.guru_id),
        _original_jurusan: p.jurusan_id ?? null,
        get _dirty() {
            return this.mata_pelajaran_id !== this._original_mapel
                || this.guru_id !== this._original_guru
                || String(this.jurusan_id ?? '') !== String(this._original_jurusan ?? '');
        },
    }));
}

let _rowCounter = 0;
const newKey = () => `new-${++_rowCounter}`;

/* ─── Section: Pembelajaran tanpa jadwal ─── */
function TanpaJadwalSection({ items }) {
    const [open, setOpen] = useState(true);
    if (items.length === 0) return null;

    // Group by rombel (sudah sorted dari backend)
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.rombel]) acc[item.rombel] = { rombel_id: item.rombel_id, items: [] };
        acc[item.rombel].items.push(item);
        return acc;
    }, {});

    return (
        <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors text-left"
            >
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                        Pembelajaran Belum Dijadwalkan
                    </span>
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                        {items.length}
                    </span>
                </div>
                {open
                    ? <ChevronUp className="h-4 w-4 text-amber-500 shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-amber-500 shrink-0" />
                }
            </button>

            {open && (
                <div className="border-t border-amber-200 dark:border-amber-800">
                    {/* Tabel header */}
                    <div className="grid grid-cols-3 gap-x-4 px-4 py-1.5 bg-amber-100/60 dark:bg-amber-900/20 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        <span>Rombel</span>
                        <span>Mata Pelajaran</span>
                        <span>Guru Pengampu</span>
                    </div>
                    <div className="divide-y divide-amber-100 dark:divide-amber-900/40">
                        {Object.entries(grouped).map(([rombel, { rombel_id, items: gItems }]) => (
                            <div key={rombel}>
                                {/* Subheader rombel */}
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30">
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                        {rombel}
                                    </span>
                                    <span className="text-xs text-amber-500">— {gItems.length} mapel</span>
                                    <button
                                        onClick={() => router.get('/admin/jadwal', { rombel_id })}
                                        className="ml-auto text-[10px] font-medium text-sky-600 dark:text-sky-400 hover:underline"
                                    >
                                        Buka Jadwal →
                                    </button>
                                </div>
                                {/* Baris data */}
                                {gItems.map((item, idx) => (
                                    <div key={item.id}
                                        className={`grid grid-cols-3 gap-x-4 px-4 py-2 text-sm ${
                                            idx % 2 === 0
                                                ? 'bg-white dark:bg-gray-900/20'
                                                : 'bg-amber-50/40 dark:bg-amber-950/10'
                                        }`}
                                    >
                                        <span className="text-gray-400 dark:text-gray-500 text-xs italic">↳ {rombel}</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.mata_pelajaran}</span>
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{item.guru}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Halaman utama ─── */
export default function PembelajaranIndex({
    rombelList, mataPelajaran, guruList, tahunAjaran,
    selectedRombelId, pembelajaranList, tanpaJadwal = [],
}) {
    const [rows, setRows]      = useState([]);
    const [submitting, setSub] = useState(false);
    const [showImport, setShowImport]     = useState(false);
    const [importRombelId, setImportRombelId] = useState('');
    const [importFile, setImportFile]     = useState(null);
    const [importing, setImporting]       = useState(false);
    const importFileRef = useRef(null);
    const importErrors  = usePage().props.flash?.import_errors;

    useEffect(() => {
        if (!selectedRombelId) { setRows([]); return; }
        setRows(buildRows(pembelajaranList));
    }, [pembelajaranList, selectedRombelId]);

    const handleChange = useCallback((key, field, val) => {
        setRows((prev) => prev.map((r) => {
            if (r._key !== key) return r;
            if (field === 'mapel')   return { ...r, mata_pelajaran_id: val, guru_id: '' };
            if (field === 'guru')    return { ...r, guru_id: val };
            if (field === 'jurusan') return { ...r, jurusan_id: val };
            return r;
        }));
    }, []);

    const addRow = () => setRows((prev) => [...prev, {
        _key: newKey(), id: null,
        mata_pelajaran_id: '', guru_id: '', jurusan_id: null,
        _original_mapel: null, _original_guru: null, _original_jurusan: undefined,
        get _dirty() { return true; },
    }]);

    const deleteRow = useCallback((key) => {
        setRows((prev) => prev.filter((r) => r._key !== key));
    }, []);

    const switchRombel = (id) => {
        router.get('/admin/pembelajaran', { rombel_id: id }, { preserveState: false });
    };

    /* Hitung perubahan */
    const originalIds  = (pembelajaranList ?? []).map((p) => p.id);
    const currentIds   = rows.filter((r) => r.id).map((r) => r.id);
    const deletedIds   = originalIds.filter((id) => !currentIds.includes(id));
    const changed      = rows.filter((r) => r._dirty && r.mata_pelajaran_id && r.guru_id);
    const totalChanges = changed.length + deletedIds.length;

    const save = () => {
        if (!totalChanges || !selectedRombelId) return;
        setSub(true);
        router.post('/admin/pembelajaran/bulk', {
            rombel_id:       selectedRombelId,
            tahun_ajaran_id: tahunAjaran?.id ?? null,
            rows: [
                ...changed.map((r) => ({
                    id:                r.id,
                    mata_pelajaran_id: r.mata_pelajaran_id,
                    guru_id:           r.guru_id,
                    jurusan_id:        r.jurusan_id ?? null,
                    _delete:           false,
                })),
                ...deletedIds.map((id) => ({ id, _delete: true })),
            ],
        }, { onFinish: () => setSub(false) });
    };

    const closeImport = () => { setShowImport(false); setImportFile(null); setImportRombelId(''); };
    const submitImport = () => {
        if (!importRombelId || !importFile) return;
        setImporting(true);
        router.post('/admin/pembelajaran/import', { rombel_id: importRombelId, file: importFile }, {
            forceFormData: true,
            onSuccess: closeImport,
            onFinish: () => setImporting(false),
        });
    };

    const selectedRombel = rombelList.find((r) => r.id === selectedRombelId);
    const rombelNama    = selectedRombel?.nama;
    const rombelJurusan = selectedRombel?.jurusan_list ?? [];
    const sortedRombel  = [...rombelList].sort((a, b) => a.nama.localeCompare(b.nama));

    return (
        <AppLayout title="Pembelajaran per Rombel">
            {/* ── Filter bar ── */}
            <Card className="mb-4">
                <CardBody className="py-3">
                    <div className="flex items-end gap-3 flex-wrap">
                        <Filter className="h-4 w-4 text-gray-400 shrink-0 self-center" />
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kelas / Rombel</label>
                            <select
                                value={selectedRombelId ?? ''}
                                onChange={(e) => switchRombel(e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-52"
                            >
                                <option value="">— Pilih Kelas —</option>
                                {sortedRombel.map((r) => (
                                    <option key={r.id} value={r.id}>{r.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <a href="/admin/pembelajaran/export"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Download className="h-3.5 w-3.5" /> Export Excel
                            </a>
                            <button onClick={() => setShowImport(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                                <Upload className="h-3.5 w-3.5" /> Import Excel
                            </button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {!selectedRombelId ? (
                <Card>
                    <CardBody>
                        <div className="text-center py-16 text-gray-400">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Pilih kelas di atas untuk mulai mengisi pembelajaran.</p>
                            <p className="text-sm mt-1">Baris bisa ditambah dan dihapus secara bebas.</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <CardTitle>{rombelNama ?? 'Pembelajaran'}</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {rows.length} baris ·{' '}
                                    {rows.filter((r) => r.mata_pelajaran_id && r.guru_id).length} lengkap
                                </p>
                            </div>
                            <Button icon={Plus} onClick={addRow} variant="secondary">Tambah Baris</Button>
                        </div>
                    </CardHeader>

                    <CardBody className="space-y-2 pb-4">
                        {/* Header kolom */}
                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 tracking-wide">
                            <span className="flex-1">Mata Pelajaran</span>
                            {rombelJurusan.length > 0 && <span className="w-36 shrink-0">Kelompok</span>}
                            <span className="w-52 shrink-0">Guru Pengampu</span>
                            <span className="w-16 shrink-0" />
                        </div>

                        {/* Baris */}
                        {rows.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p className="text-sm">Belum ada pembelajaran. Klik "+ Tambah Baris" untuk mulai.</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {rows.map((row) => (
                                    <PembelajaranRow
                                        key={row._key}
                                        row={row}
                                        mataPelajaran={mataPelajaran}
                                        guruList={guruList}
                                        rombelJurusan={rombelJurusan}
                                        onChange={handleChange}
                                        onDelete={deleteRow}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Footer simpan */}
                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                            <span className="text-xs text-gray-400">
                                {totalChanges > 0
                                    ? <span className="text-amber-600 dark:text-amber-400">{totalChanges} perubahan belum disimpan</span>
                                    : <span className="text-emerald-600 dark:text-emerald-400">Semua tersimpan</span>
                                }
                            </span>
                            <Button icon={Save} loading={submitting} onClick={save} disabled={!totalChanges}>
                                Simpan Pembelajaran
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* ── Pembelajaran belum dijadwalkan ── */}
            <div className="mt-4">
                <TanpaJadwalSection items={tanpaJadwal} />
            </div>

            {/* ── Modal Import ── */}
            <Modal show={showImport} onClose={closeImport} title="Import Pembelajaran" size="md">
                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300 space-y-1">
                        <p className="font-semibold">Format kolom Excel (.xlsx):</p>
                        <p className="font-mono bg-white dark:bg-gray-900 rounded px-2 py-1">Mata Pelajaran, Guru, Jurusan (opsional)</p>
                        <p>Download template — kolom Mapel, Guru, dan Jurusan sudah ada dropdown pilihannya.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rombel Tujuan <span className="text-red-500">*</span></label>
                        <select value={importRombelId} onChange={(e) => setImportRombelId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value="">— Pilih Rombel —</option>
                            {sortedRombel.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </select>
                    </div>

                    <a href={`/admin/pembelajaran/template${importRombelId ? `?rombel_id=${importRombelId}` : ''}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-sky-200 dark:border-sky-700 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                        download>
                        <Download className="h-3.5 w-3.5" />
                        Download Template{importRombelId ? ' (berisi data saat ini)' : ' (kosong)'}
                    </a>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload File Excel <span className="text-red-500">*</span></label>
                        <div onClick={() => importFileRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 cursor-pointer transition-colors">
                            <FileSpreadsheet className="h-5 w-5 text-sky-400 shrink-0" />
                            {importFile
                                ? <span className="text-xs text-sky-600 dark:text-sky-400 truncate">{importFile.name}</span>
                                : <span className="text-xs text-gray-400">Klik untuk pilih file .xlsx</span>}
                        </div>
                        <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
                    </div>

                    {importErrors?.length > 0 && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-1">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" /> {importErrors.length} baris dilewati:
                            </p>
                            {importErrors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400 pl-5">· {e}</p>)}
                            {importErrors.length > 5 && <p className="text-xs text-red-400 pl-5">dan {importErrors.length - 5} lainnya...</p>}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" onClick={closeImport}>Batal</Button>
                        <Button icon={Upload} loading={importing} onClick={submitImport} disabled={!importRombelId || !importFile}>
                            Import
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
