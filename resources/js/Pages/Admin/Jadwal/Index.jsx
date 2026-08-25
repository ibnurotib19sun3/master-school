import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Save, BookOpen, Filter, Plus, Trash2, AlertTriangle, ChevronDown, Search, CheckCircle, X, Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

/* ─── Searchable combobox pembelajaran ─── */
function PembelajaranCombobox({ value, options, onChange, placeholder = '— Pilih —' }) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const btnRef = useRef(null);
    const inpRef = useRef(null);
    const boxRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    const selected = options.find((p) => String(p.id) === String(value));
    const filtered = options.filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (p.mata_pelajaran?.nama ?? '').toLowerCase().includes(q)
            || (p.guru?.user?.name ?? '').toLowerCase().includes(q);
    });

    const openBox = () => {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 300) });
        setOpen(true);
        setSearch('');
        setTimeout(() => inpRef.current?.focus(), 30);
    };

    const select = (id) => { onChange(String(id)); setOpen(false); };
    const clear   = ()   => { onChange('');       setOpen(false); };

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
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer
                    ${selected
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        : 'border-dashed border-gray-300 dark:border-gray-600 bg-transparent text-gray-400 dark:text-gray-500'
                    }`}
            >
                <span className="truncate text-left text-xs">
                    {selected
                        ? <>
                            {selected.mata_pelajaran?.nama}
                            {selected.jurusan && <span className="ml-1 text-sky-400"> | {selected.jurusan.kode}</span>}
                            <span className="text-gray-400"> — {selected.guru?.user?.name}</span>
                          </>
                        : placeholder
                    }
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
            </button>

            {open && createPortal(
                <div ref={boxRef} style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <input ref={inpRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari mata pelajaran atau guru..."
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
                            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }} />
                        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                        {value && (
                            <button onClick={clear} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <X className="h-3.5 w-3.5" /> Kosongkan
                            </button>
                        )}
                        {filtered.length === 0
                            ? <p className="px-3 py-3 text-xs text-gray-400 text-center">Tidak ada hasil.</p>
                            : filtered.map((p) => (
                                <button key={p.id} onClick={() => select(p.id)}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors
                                        ${String(p.id) === String(value)
                                            ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    {String(p.id) === String(value) && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-sky-500" />}
                                    <span className="flex-1 min-w-0">
                                        <span className="font-medium">{p.mata_pelajaran?.nama}</span>
                                        {p.jurusan && <span className="ml-1 text-xs text-sky-400"> | {p.jurusan.kode}</span>}
                                        <span className="text-gray-400 ml-1.5 text-xs">{p.guru?.user?.name}</span>
                                    </span>
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

/* ─── Row jadwal ─── */
function JadwalRow({ row, hariList, jamSlots, pembelajaranRombel, onChange, onDelete, breakMap }) {
    const slotInfo = jamSlots.find((s) => s.jam_ke === Number(row.jam_ke));

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            row._dirty ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                       : row.id ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                                : 'border-dashed border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-900/10'
        }`}>
            {/* Hari */}
            <select value={row.hari} onChange={(e) => onChange(row._key, 'hari', e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 w-24 shrink-0">
                {hariList.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>

            {/* Jam ke */}
            <select value={row.jam_ke} onChange={(e) => onChange(row._key, 'jam_ke', Number(e.target.value))}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 w-20 shrink-0">
                {jamSlots.map((s) => <option key={s.jam_ke} value={s.jam_ke}>JP {s.jam_ke}</option>)}
            </select>

            {/* Waktu (read-only hint) */}
            <span className="text-xs font-mono text-gray-400 shrink-0 w-24 hidden sm:block">
                {slotInfo ? `${slotInfo.jam_mulai}–${slotInfo.jam_selesai}` : ''}
                {slotInfo && breakMap[slotInfo.jam_ke] && (
                    <span className="block text-amber-500 text-[10px]">+☕{breakMap[slotInfo.jam_ke]}m</span>
                )}
            </span>

            {/* Pembelajaran combobox */}
            <div className="flex-1 min-w-0">
                <PembelajaranCombobox
                    value={row.pembelajaran_id}
                    options={pembelajaranRombel}
                    onChange={(val) => onChange(row._key, 'pembelajaran_id', val)}
                />
            </div>

            {/* Status badge */}
            {row._dirty && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0 hidden sm:block">
                    {row.id ? 'Ubah' : 'Baru'}
                </span>
            )}

            {/* Delete */}
            <button onClick={() => onDelete(row._key)}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

/* ─── Build initial rows dari jadwalList ─── */
function buildRows(jadwalList) {
    return jadwalList.map((j) => ({
        _key:            `existing-${j.id}`,
        id:              j.id,
        hari:            j.hari,
        jam_ke:          j.jam_ke,
        pembelajaran_id: String(j.pembelajaran_id),
        _original_hari:  j.hari,
        _original_jam:   j.jam_ke,
        _original_pmb:   String(j.pembelajaran_id),
        _isNew:          false,
        _dirty:          false,
    }));
}

function recomputeDirty(row) {
    if (row._isNew) return true;
    return row.hari !== row._original_hari
        || row.jam_ke !== row._original_jam
        || row.pembelajaran_id !== row._original_pmb;
}

let _rowCounter = 0;
const newKey = () => `new-${++_rowCounter}`;

/* ─── Halaman utama ─── */
export default function JadwalIndex({
    jadwalList, rombelList, pembelajaranRombel,
    jamSlots, istirahat = [], hariList, hariIni,
    selectedRombelId,
}) {
    const { errors } = usePage().props;
    const konflikErrors  = errors?.konflik ?? [];
    const importErrors   = usePage().props.flash?.import_errors;
    const breakMap = Object.fromEntries((istirahat ?? []).map((b) => [b.setelah_jp, b.durasi_menit]));

    const [rows, setRows]         = useState([]);
    const [filterHari, setFilter] = useState(null);
    const [submitting, setSubmit] = useState(false);
    const [showImport, setShowImport]       = useState(false);
    const [importRombelId, setImportRombelId] = useState('');
    const [importFile, setImportFile]       = useState(null);
    const [importing, setImporting]         = useState(false);
    const importFileRef = useRef(null);

    /* Rebuild ketika rombel / data berubah */
    useEffect(() => {
        if (!selectedRombelId) { setRows([]); return; }
        setRows(buildRows(jadwalList));
        setFilter(null);
    }, [jadwalList, hariList, jamSlots, selectedRombelId]);

    const handleChange = useCallback((key, field, val) => {
        setRows((prev) => prev.map((r) => {
            if (r._key !== key) return r;
            const updated = { ...r, [field]: val };
            updated._dirty = recomputeDirty(updated);
            return updated;
        }));
    }, []);

    const addRow = () => {
        const defaultHari = filterHari ?? hariIni ?? hariList[0];
        setRows((prev) => [...prev, {
            _key: newKey(), id: null,
            hari: defaultHari, jam_ke: jamSlots[0]?.jam_ke ?? 1,
            pembelajaran_id: '',
            _original_hari: null, _original_jam: null, _original_pmb: null,
            _isNew: true,
            _dirty: true,
        }]);
    };

    const deleteRow = useCallback((key) => {
        setRows((prev) => prev.filter((r) => r._key !== key));
    }, []);

    const switchRombel = (id) => {
        router.get('/admin/jadwal', { rombel_id: id }, { preserveState: false });
    };

    /* Hitung perubahan: baru/ubah + yang dihapus (ada di original tapi sudah tidak ada di rows) */
    const originalIds = jadwalList.map((j) => j.id);
    const currentIds  = rows.filter((r) => r.id).map((r) => r.id);
    const deletedIds  = originalIds.filter((id) => !currentIds.includes(id));

    const changed = rows.filter((r) => r._dirty && r.pembelajaran_id);
    const totalChanges = changed.length + deletedIds.length;

    const save = () => {
        if (!totalChanges) return;

        const payload = [
            ...changed.map((r) => ({
                id:              r.id,
                hari:            r.hari,
                jam_ke:          r.jam_ke,
                pembelajaran_id: r.pembelajaran_id,
                _delete:         false,
            })),
            ...deletedIds.map((id) => ({ id, hari: '', jam_ke: 0, pembelajaran_id: null, _delete: true })),
        ];

        setSubmit(true);
        router.post('/admin/jadwal/bulk', { rows: payload }, {
            onFinish: () => setSubmit(false),
        });
    };

    const closeImport = () => { setShowImport(false); setImportFile(null); setImportRombelId(''); };
    const submitImport = () => {
        if (!importRombelId || !importFile) return;
        setImporting(true);
        router.post('/admin/jadwal/import', { rombel_id: importRombelId, file: importFile }, {
            forceFormData: true,
            onSuccess: closeImport,
            onFinish: () => setImporting(false),
        });
    };

    /* Rows yang ditampilkan, diurutkan hari → jam_ke */
    const hariOrder = Object.fromEntries(hariList.map((h, i) => [h, i]));
    const visibleRows = [...rows]
        .filter((r) => !filterHari || r.hari === filterHari)
        .sort((a, b) => (hariOrder[a.hari] ?? 99) - (hariOrder[b.hari] ?? 99) || a.jam_ke - b.jam_ke);

    /* Group by hari untuk header */
    const groupedHari = hariList.filter((h) => !filterHari || h === filterHari);

    const rombelNama = rombelList.find((r) => r.id === selectedRombelId)?.nama;

    return (
        <AppLayout title="Jadwal Pelajaran">
            {/* ── Filter bar ── */}
            <Card className="mb-4">
                <CardBody className="py-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <Filter className="h-4 w-4 text-gray-400 shrink-0 self-center" />

                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kelas / Rombel</label>
                            <select value={selectedRombelId ?? ''} onChange={(e) => switchRombel(e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-52">
                                <option value="">— Pilih Kelas —</option>
                                {[...rombelList].sort((a, b) => a.nama.localeCompare(b.nama)).map((r) => (
                                    <option key={r.id} value={r.id}>{r.nama}</option>
                                ))}
                            </select>
                        </div>

                        {selectedRombelId && (
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Filter Hari</label>
                                <div className="flex gap-1 flex-wrap">
                                    <button onClick={() => setFilter(null)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                            ${!filterHari ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        Semua
                                    </button>
                                    {hariList.map((h) => (
                                        <button key={h} onClick={() => setFilter(h === filterHari ? null : h)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                                ${filterHari === h ? 'bg-sky-600 text-white'
                                                  : h === hariIni ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="ml-auto flex items-center gap-2 self-end">
                            <a href={`/admin/jadwal/export${selectedRombelId ? `?rombel_id=${selectedRombelId}` : ''}`}
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
                            <p className="font-medium">Pilih kelas di atas untuk mulai mengisi jadwal.</p>
                            <p className="text-sm mt-1">Baris bisa ditambah dan dihapus secara bebas.</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle>{rombelNama ?? 'Jadwal'}</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {rows.length} slot · {rows.filter((r) => r.pembelajaran_id).length} terisi
                                </p>
                            </div>
                            <Button icon={Plus} onClick={addRow} variant="secondary">
                                Tambah Baris
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-1 pb-4">
                        {/* Kolom header */}
                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 tracking-wide">
                            <span className="w-24 shrink-0">Hari</span>
                            <span className="w-20 shrink-0">JP</span>
                            <span className="w-24 shrink-0 hidden sm:block">Waktu</span>
                            <span className="flex-1">Mata Pelajaran / Guru</span>
                            <span className="w-8" />
                        </div>

                        {/* Group by hari */}
                        {groupedHari.map((hari) => {
                            const hariRows = visibleRows.filter((r) => r.hari === hari);
                            if (hariRows.length === 0 && filterHari) return null;
                            const isToday = hari === hariIni;

                            return (
                                <div key={hari}>
                                    {/* Hari separator */}
                                    <div className={`flex items-center gap-2 px-1 py-1 mt-3 mb-1`}>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            isToday ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}>{hari}</span>
                                        <span className="text-xs text-gray-400">{hariRows.length} slot</span>
                                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                    </div>

                                    {hariRows.length === 0 ? (
                                        <p className="px-3 py-2 text-xs text-gray-400 italic">Belum ada jadwal. Klik "+ Tambah Baris".</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {hariRows.map((row) => (
                                                <JadwalRow
                                                    key={row._key}
                                                    row={row}
                                                    hariList={hariList}
                                                    jamSlots={jamSlots}
                                                    pembelajaranRombel={pembelajaranRombel}
                                                    onChange={handleChange}
                                                    onDelete={deleteRow}
                                                    breakMap={breakMap}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {rows.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">Belum ada jadwal. Klik "+ Tambah Baris" untuk mulai.</p>
                            </div>
                        )}

                        {/* Konflik error */}
                        {konflikErrors.length > 0 && (
                            <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Konflik jadwal guru:</p>
                                        <ul className="space-y-0.5">
                                            {(Array.isArray(konflikErrors) ? konflikErrors : [konflikErrors]).map((e, i) => (
                                                <li key={i} className="text-xs text-red-600 dark:text-red-400">• {e}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
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
                                Simpan Jadwal
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* ── Modal Import ── */}
            <Modal show={showImport} onClose={closeImport} title="Import Jadwal Pelajaran" size="md">
                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300 space-y-1">
                        <p className="font-semibold">Format kolom Excel (.xlsx):</p>
                        <p className="font-mono bg-white dark:bg-gray-900 rounded px-2 py-1">Hari, JP, Mata Pelajaran, Guru</p>
                        <p>Download template — Mapel dan Guru sudah terisi dari Pembelajaran rombel, lengkap dengan dropdown Hari dan JP.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rombel <span className="text-red-500">*</span></label>
                        <select value={importRombelId} onChange={(e) => setImportRombelId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value="">— Pilih Rombel —</option>
                            {[...rombelList].sort((a, b) => a.nama.localeCompare(b.nama)).map((r) => (
                                <option key={r.id} value={r.id}>{r.nama}</option>
                            ))}
                        </select>
                    </div>

                    <a href={`/admin/jadwal/template${importRombelId ? `?rombel_id=${importRombelId}` : ''}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-sky-200 dark:border-sky-700 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                        download>
                        <Download className="h-3.5 w-3.5" />
                        Download Template{importRombelId ? ' (terisi Pembelajaran rombel ini)' : ' (kosong)'}
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
