import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import {
    Plus, Search, Edit, Trash2, Download, Send,
    FileText, Paperclip, X, RefreshCw, ArrowRight, ArrowLeft,
    Hash, CheckCircle2, Copy, CheckCircle,
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';

/* ─── Helpers ─── */
const ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const STATUS_COLOR = { Draft: 'yellow', Terkirim: 'green' };
const STATUS_LIST  = ['Draft', 'Terkirim'];

function buildNomor(fmt, seq, kodeJenis, kodeDept, tanggal) {
    const d   = tanggal ? new Date(tanggal) : new Date();
    const sep = fmt?.separator || '/';
    const map = {
        prefix:       fmt?.prefix_kode || '',
        seq:          String(seq).padStart(3, '0'),
        kode_jenis:   kodeJenis || '',
        kode_dept:    kodeDept  || '',
        bulan_romawi: ROMAN[d.getMonth() + 1],
        tahun:        String(d.getFullYear()),
    };
    const bagian = fmt?.format_bagian || ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'];
    return bagian.map(p => map[p] || '').filter(Boolean).join(sep) || '';
}

const fmt = (val) => val
    ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '–';

const today = new Date().toISOString().substring(0, 10);

/* ─── File Picker ─── */
function FilePickerArea({ file, setFile, existingUrl, existingName, onClear }) {
    const ref = useRef(null);
    const displayName = file ? file.name : existingName;
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Surat <span className="font-normal text-gray-400 text-xs">(PDF, Word, Gambar — maks 10 MB)</span>
            </label>
            {displayName ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                    <FileText className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{displayName}</span>
                    <div className="flex gap-1">
                        {existingUrl && !file && (
                            <a href={existingUrl} target="_blank" rel="noreferrer"
                                className="p-1 rounded text-gray-400 hover:text-sky-600 transition-colors">
                                <Download className="h-3.5 w-3.5" />
                            </a>
                        )}
                        <button type="button" onClick={() => { setFile(null); onClear?.(); ref.current && (ref.current.value = ''); }}
                            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => ref.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-4 text-sm text-gray-500 dark:text-gray-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    <Paperclip className="h-4 w-4" /> Klik untuk lampirkan file
                </button>
            )}
            <input ref={ref} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden" onChange={(e) => setFile(e.target.files[0] ?? null)} />
        </div>
    );
}

/* ─── Step 1: Nomor Builder ─── */
function StepNomor({ fmt, nextSeq, kodeDeptList, kodeJenisList, onLanjutkan, onSimpanNomor, onClose }) {
    const [jenis,   setJenis]   = useState(kodeJenisList[0] ?? null);
    const [dept,    setDept]    = useState(kodeDeptList[0]  ?? null);
    const [tgl,     setTgl]     = useState(today);
    const [edited,  setEdited]  = useState(false);
    const [nomorManual, setNomorManual] = useState('');

    const autoNomor = useMemo(
        () => buildNomor(fmt, nextSeq, jenis?.kode, dept?.kode, tgl),
        [fmt, nextSeq, jenis, dept, tgl]
    );

    const nomor = edited ? nomorManual : autoNomor;

    const handleNomorChange = (v) => {
        setEdited(true);
        setNomorManual(v);
    };

    const resetNomor = () => {
        setEdited(false);
        setNomorManual('');
    };

    const handleChange = (setter) => (e) => {
        setter(e);
        // Reset manual edit when config changes so auto kicks in again
        setEdited(false);
        setNomorManual('');
    };

    const useFmtBagian = fmt?.format_bagian ?? [];
    const showDept     = useFmtBagian.includes('kode_dept');

    return (
        <div className="space-y-5">
            {/* Config fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Jenis */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Jenis Surat <span className="text-red-500">*</span>
                    </label>
                    {kodeJenisList.length === 0 ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 border border-amber-200 dark:border-amber-800">
                            Belum ada kode jenis. Atur di <strong>Pengaturan Surat</strong>.
                        </p>
                    ) : (
                        <select value={jenis?.id ?? ''} onChange={e => {
                            const item = kodeJenisList.find(j => String(j.id) === e.target.value);
                            handleChange(() => setJenis(item))(e);
                        }}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                            {kodeJenisList.map(j => (
                                <option key={j.id} value={j.id}>{j.nama} ({j.kode})</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Kode Departemen */}
                {showDept && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Departemen / Bidang
                        </label>
                        {kodeDeptList.length === 0 ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 border border-amber-200 dark:border-amber-800">
                                Belum ada kode departemen. Atur di <strong>Pengaturan Surat</strong>.
                            </p>
                        ) : (
                            <select value={dept?.id ?? ''} onChange={e => {
                                const item = kodeDeptList.find(d => String(d.id) === e.target.value);
                                handleChange(() => setDept(item))(e);
                            }}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {kodeDeptList.map(d => (
                                    <option key={d.id} value={d.id}>{d.nama} ({d.kode})</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Tanggal */}
                <div className={showDept ? '' : 'sm:col-span-2'}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Surat</label>
                    <input type="date" value={tgl}
                        onChange={e => { setTgl(e.target.value); setEdited(false); setNomorManual(''); }}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
            </div>

            {/* Big nomor preview */}
            <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-5 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 dark:text-sky-500 mb-2">
                    Nomor Surat Tergenerate
                </p>
                <p className="font-mono text-2xl sm:text-3xl font-bold text-sky-700 dark:text-sky-300 tracking-wide break-all">
                    {autoNomor || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </p>
                <p className="text-xs text-sky-400 dark:text-sky-500 mt-2">
                    No. urut: <strong>{String(nextSeq).padStart(3, '0')}</strong>
                    {jenis && <> · Jenis: <strong>{jenis.kode}</strong></>}
                    {showDept && dept && <> · Dept: <strong>{dept.kode}</strong></>}
                </p>
            </div>

            {/* Editable nomor */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nomor Surat (dapat diubah manual)
                    </label>
                    {edited && (
                        <button type="button" onClick={resetNomor}
                            className="inline-flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
                            <RefreshCw className="h-3 w-3" /> Reset ke otomatis
                        </button>
                    )}
                </div>
                <input value={nomor} onChange={e => handleNomorChange(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                        edited
                            ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10 text-gray-900 dark:text-gray-100'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                    placeholder="Nomor surat..." />
                {edited && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Nomor telah diubah secara manual.</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-between gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <div className="flex gap-2 flex-wrap">
                    {/* Quick save — simpan nomor tanpa detail */}
                    <Button type="button" variant="secondary"
                        disabled={!nomor}
                        onClick={() => onSimpanNomor({
                            nomor,
                            tgl_surat:  tgl,
                            tgl_keluar: tgl,
                            kategori:   jenis?.nama ?? 'Umum',
                        })}>
                        Simpan Nomor Saja
                    </Button>
                    <Button type="button" icon={ArrowRight}
                        disabled={!nomor}
                        onClick={() => onLanjutkan({
                            nomor,
                            tgl_surat:  tgl,
                            tgl_keluar: tgl,
                            kategori:   jenis?.nama ?? 'Umum',
                        })}>
                        Lanjutkan
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function SuratKeluarIndex({ surat, filters, kode_departemen, kode_jenis, format_nomor, next_seq }) {
    const [showModal,    setShowModal]    = useState(false);
    const [step,         setStep]         = useState(1); // 1 = nomor builder, 2 = form
    const [editItem,     setEditItem]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [fileObj,      setFileObj]      = useState(null);
    const [clearFile,    setClearFile]    = useState(false);
    const [toast,        setToast]        = useState(false);

    const copyNomor = (nomor) => {
        navigator.clipboard.writeText(nomor);
        setToast(true);
        setTimeout(() => setToast(false), 2000);
    };

    const { data, setData, processing, errors, reset } = useForm({
        nomor_surat: '', perihal: '', tujuan: '',
        tgl_surat: today, tgl_keluar: today,
        kategori: 'Umum', status: 'Terkirim', keterangan: '',
    });

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setFileObj(null);
        setClearFile(false);
        setStep(1);
        reset();
    };

    const openTambah = () => {
        reset();
        setEditItem(null);
        setFileObj(null);
        setClearFile(false);
        setStep(1);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setFileObj(null);
        setClearFile(false);
        setData({
            nomor_surat: item.nomor_surat,
            perihal:     item.perihal,
            tujuan:      item.tujuan,
            tgl_surat:   item.tgl_surat?.substring(0, 10) ?? '',
            tgl_keluar:  item.tgl_keluar?.substring(0, 10) ?? '',
            kategori:    item.kategori,
            status:      item.status,
            keterangan:  item.keterangan ?? '',
        });
        setStep(2); // skip nomor builder for edit
        setShowModal(true);
    };

    const handleLanjutkan = ({ nomor, tgl_surat, tgl_keluar, kategori }) => {
        setData(prev => ({ ...prev, nomor_surat: nomor, tgl_surat, tgl_keluar, kategori }));
        setStep(2);
    };

    const handleSimpanNomor = ({ nomor, tgl_surat, tgl_keluar, kategori }) => {
        router.post('/tatausaha/surat-keluar', {
            nomor_surat: nomor,
            tgl_surat,
            tgl_keluar,
            kategori,
            status:  'Draft',
            perihal: null,
            tujuan:  null,
        }, { onSuccess: closeModal });
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = { ...data };
        const opts = { forceFormData: !!fileObj, onSuccess: closeModal };
        if (fileObj) payload.file_surat = fileObj;
        if (clearFile && !fileObj) payload.remove_file = '1';

        if (editItem) {
            router.post(`/tatausaha/surat-keluar/${editItem.id}`, { ...payload, _method: 'PUT' }, opts);
        } else {
            router.post('/tatausaha/surat-keluar', payload, opts);
        }
    };

    const setFilter = (key, val) =>
        router.get('/tatausaha/surat-keluar', { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });

    const tahunList = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    // Kategori options: from kode_jenis + generic
    const kategoriList = [
        ...kode_jenis.map(j => j.nama),
        'Umum', 'Lainnya',
    ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

    const modalTitle = step === 1
        ? 'Buat Nomor Surat'
        : editItem ? 'Edit Surat Keluar' : 'Form Surat Keluar';

    return (
        <AppLayout title="Surat Keluar">
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-sky-500" />
                        Surat Keluar ({surat.total})
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input defaultValue={filters.search}
                                onChange={(e) => setFilter('search', e.target.value)}
                                placeholder="Cari nomor / perihal..."
                                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-44 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        <select value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                            <option value="">Semua Status</option>
                            {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={filters.tahun ?? ''} onChange={(e) => setFilter('tahun', e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                            <option value="">Semua Tahun</option>
                            {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <Button icon={Plus} onClick={openTambah}>Tambah</Button>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Nomor Surat</th>
                                    <th className="px-4 py-3 text-left font-medium">Perihal</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tujuan</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tgl Keluar</th>
                                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Kategori</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {surat.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap group/copy">
                                            <div className="flex items-center gap-1.5">
                                                <span>{item.nomor_surat}</span>
                                                <button
                                                    onClick={() => copyNomor(item.nomor_surat)}
                                                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity rounded p-0.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                                                    title="Salin nomor surat">
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.perihal
                                                ? <p className="font-medium text-gray-900 dark:text-gray-100 max-w-52 truncate">{item.perihal}</p>
                                                : <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-0.5">
                                                    Perlu dilengkapi
                                                  </span>
                                            }
                                            {item.file_url && (
                                                <a href={item.file_url} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline mt-0.5">
                                                    <Paperclip className="h-3 w-3" /> Lihat file
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                            {item.tujuan || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">{fmt(item.tgl_keluar)}</td>
                                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.kategori}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={STATUS_COLOR[item.status] ?? 'gray'}>{item.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {item.file_url && (
                                                    <a href={item.file_url} target="_blank" rel="noreferrer"
                                                        className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Download">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                )}
                                                <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {surat.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            <Send className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm text-gray-400">Belum ada surat keluar.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {surat.last_page > 1 && (
                        <div className="flex justify-center gap-1 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            {surat.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${link.active ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'} ${!link.url ? 'opacity-40 cursor-default' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* ── Modal ── */}
            <Modal show={showModal} onClose={closeModal} title={modalTitle} size="lg">
                {/* Step indicator — only for tambah */}
                {!editItem && (
                    <div className="flex items-center gap-2 mb-5 px-1">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 1 ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold ${step === 1 ? 'bg-sky-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
                            </span>
                            Nomor Surat
                        </div>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-1" />
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 2 ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold ${step === 2 ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                2
                            </span>
                            Detail Surat
                        </div>
                    </div>
                )}

                {/* Step 1 — Nomor Builder */}
                {step === 1 && (
                    <StepNomor
                        fmt={format_nomor}
                        nextSeq={next_seq}
                        kodeDeptList={kode_departemen}
                        kodeJenisList={kode_jenis}
                        onLanjutkan={handleLanjutkan}
                        onSimpanNomor={handleSimpanNomor}
                        onClose={closeModal}
                    />
                )}

                {/* Step 2 — Detail Form */}
                {step === 2 && (
                    <form onSubmit={submit} className="space-y-4">
                        {/* Nomor badge / editable */}
                        <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Hash className="h-4 w-4 text-sky-500 shrink-0" />
                                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">Nomor Surat</span>
                            </div>
                            <input value={data.nomor_surat}
                                onChange={e => setData('nomor_surat', e.target.value)}
                                className="w-full font-mono text-lg font-bold text-sky-700 dark:text-sky-300 bg-transparent border-none outline-none focus:ring-0 placeholder-sky-300"
                                placeholder="Nomor surat..." />
                            {!editItem && (
                                <button type="button" onClick={() => setStep(1)}
                                    className="mt-1 inline-flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
                                    <RefreshCw className="h-3 w-3" /> Ubah nomor
                                </button>
                            )}
                        </div>

                        {errors.nomor_surat && <p className="text-xs text-red-500 -mt-2">{errors.nomor_surat}</p>}

                        {/* Form fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-1 sm:col-span-2">
                                <Input label="Tujuan" value={data.tujuan}
                                    onChange={(e) => setData('tujuan', e.target.value)}
                                    error={errors.tujuan} required
                                    placeholder="Nama instansi / penerima" />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <Input label="Perihal" value={data.perihal}
                                    onChange={(e) => setData('perihal', e.target.value)}
                                    error={errors.perihal} required
                                    placeholder="Isi perihal surat" />
                            </div>
                            <Input label="Tanggal Surat" type="date" value={data.tgl_surat}
                                onChange={(e) => setData('tgl_surat', e.target.value)}
                                error={errors.tgl_surat} required />
                            <Input label="Tanggal Keluar" type="date" value={data.tgl_keluar}
                                onChange={(e) => setData('tgl_keluar', e.target.value)}
                                error={errors.tgl_keluar} required />
                            <Select label="Kategori" value={data.kategori}
                                onChange={(e) => setData('kategori', e.target.value)}>
                                {kategoriList.map((k) => <option key={k} value={k}>{k}</option>)}
                            </Select>
                            <Select label="Status" value={data.status}
                                onChange={(e) => setData('status', e.target.value)}>
                                {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>

                        <Textarea label="Keterangan" value={data.keterangan}
                            onChange={(e) => setData('keterangan', e.target.value)}
                            rows={2} placeholder="Catatan tambahan (opsional)" />

                        <FilePickerArea
                            file={fileObj}
                            setFile={setFileObj}
                            existingUrl={editItem?.file_url}
                            existingName={editItem?.file_surat ? editItem.file_surat.split('/').pop() : null}
                            onClear={() => setClearFile(true)}
                        />

                        <div className="flex justify-between gap-3 pt-1">
                            {!editItem ? (
                                <button type="button" onClick={() => setStep(1)}
                                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                    <ArrowLeft className="h-4 w-4" /> Kembali
                                </button>
                            ) : (
                                <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                            )}
                            <Button type="submit" loading={processing}>Simpan</Button>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Surat Keluar"
                message={`Surat "${deleteTarget?.perihal}" akan dihapus permanen beserta filenya.`}
                onConfirm={() => { router.delete(`/tatausaha/surat-keluar/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-xl pointer-events-none">
                    <CheckCircle className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                    Nomor surat tersalin!
                </div>
            )}
        </AppLayout>
    );
}
