import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import {
    Plus, Search, Edit, Trash2, Download, MailOpen,
    FileText, Paperclip, X, QrCode, Copy, CheckCircle, Printer, ExternalLink,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const DISPOSISI_COLOR = { Diarsip: 'gray', Diproses: 'blue', Diteruskan: 'green' };
const KATEGORI_LIST = ['Umum', 'Dinas', 'Undangan', 'Pemberitahuan', 'Permohonan', 'Lainnya'];
const DISPOSISI_LIST = ['Diarsip', 'Diproses', 'Diteruskan'];

const fmt = (val) => val
    ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '–';

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
                                className="p-1 rounded text-gray-400 hover:text-sky-600 transition-colors" title="Lihat file">
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
                    <Paperclip className="h-4 w-4" />
                    Klik untuk lampirkan file
                </button>
            )}
            <input ref={ref} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] ?? null)} />
        </div>
    );
}

/* ── QR Modal ── */
function QrModal({ item, namaSekolah, onClose }) {
    const qrRef          = useRef(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.verifikasi_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        const w   = window.open('', '_blank', 'width=420,height=520');
        const svg = qrRef.current?.querySelector('svg')?.outerHTML ?? '';
        w.document.write(`<!DOCTYPE html><html><head>
            <title>QR Surat Masuk – ${item.nomor_surat}</title>
            <style>
                body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}
                .card{border:2px solid #0284c7;border-radius:12px;padding:16px 20px;width:250px;text-align:center}
                .title{font-size:9px;font-weight:700;letter-spacing:1px;color:#0284c7;text-transform:uppercase;margin-bottom:8px}
                svg{display:block;margin:0 auto 8px}
                .nomor{font-size:8px;font-family:monospace;color:#374151;margin:4px 0;word-break:break-all}
                .kode{font-size:8px;font-family:monospace;color:#6b7280;background:#f0f9ff;border-radius:4px;padding:3px 6px;margin:4px 0;display:inline-block}
                .label{font-size:7.5px;color:#9ca3af;margin-top:6px}
                @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
            </style>
        </head><body><div class="card">
            <div class="title">Surat Masuk · ${namaSekolah}</div>
            ${svg}
            <div class="nomor">${item.nomor_surat}</div>
            <div class="nomor">${item.perihal ?? ''}</div>
            <div class="kode">${item.kode_ref}</div>
            <div class="label">Pengirim: ${item.pengirim}<br>Diterima: ${fmt(item.tgl_diterima)}</div>
        </div></body></html>`);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 300);
    };

    return (
        <Modal show onClose={onClose} title="QR Code Surat Masuk" size="md">
            <div className="space-y-5">
                {/* Info surat */}
                <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3">
                    <p className="font-mono text-sm font-bold text-sky-700 dark:text-sky-300">{item.nomor_surat}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.perihal}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pengirim: {item.pengirim}</p>
                </div>

                {/* QR Code */}
                <div ref={qrRef} className="flex flex-col items-center gap-4 py-2">
                    <div className="p-4 bg-white rounded-2xl border-2 border-sky-200 dark:border-sky-700 shadow-sm">
                        <QRCodeSVG
                            value={item.verifikasi_url}
                            size={180}
                            level="M"
                            includeMargin={false}
                            fgColor="#0c4a6e"
                        />
                    </div>
                    <p className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 tracking-widest bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                        {item.kode_ref}
                    </p>
                </div>

                {/* URL verifikasi */}
                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Link Verifikasi</p>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                        <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{item.verifikasi_url}</span>
                        <button onClick={handleCopy} className="shrink-0 text-gray-400 hover:text-sky-600 transition-colors p-1">
                            {copied
                                ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                                : <Copy className="h-4 w-4" />}
                        </button>
                        <a href={item.verifikasi_url} target="_blank" rel="noreferrer"
                            className="shrink-0 text-gray-400 hover:text-sky-600 transition-colors p-1">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end flex-wrap pt-1">
                    {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Paperclip className="h-3.5 w-3.5" /> Lihat File Surat
                        </a>
                    )}
                    <button onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                        <Printer className="h-3.5 w-3.5" /> Cetak QR
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default function SuratMasukIndex({ surat, filters, namaSekolah }) {
    const [showModal,    setShowModal]    = useState(false);
    const [editItem,     setEditItem]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [fileObj,      setFileObj]      = useState(null);
    const [clearFile,    setClearFile]    = useState(false);
    const [qrItem,       setQrItem]       = useState(null);
    const [toast,        setToast]        = useState(false);

    const copyNomor = (nomor) => {
        navigator.clipboard.writeText(nomor);
        setToast(true);
        setTimeout(() => setToast(false), 2000);
    };

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nomor_surat: '', perihal: '', pengirim: '', tgl_surat: '', tgl_diterima: '',
        kategori: 'Umum', disposisi: 'Diarsip', keterangan: '',
    });

    const closeModal = () => {
        setShowModal(false); setEditItem(null); setFileObj(null); setClearFile(false); reset();
    };

    const openEdit = (item) => {
        setEditItem(item);
        setFileObj(null);
        setClearFile(false);
        setData({
            nomor_surat:  item.nomor_surat,
            perihal:      item.perihal,
            pengirim:     item.pengirim,
            tgl_surat:    item.tgl_surat?.substring(0, 10) ?? '',
            tgl_diterima: item.tgl_diterima?.substring(0, 10) ?? '',
            kategori:     item.kategori,
            disposisi:    item.disposisi,
            keterangan:   item.keterangan ?? '',
        });
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = { ...data };
        const opts = {
            forceFormData: !!fileObj,
            onSuccess: closeModal,
        };
        if (fileObj) payload.file_surat = fileObj;
        if (clearFile && !fileObj) payload.remove_file = '1';

        if (editItem) {
            router.post(`/tatausaha/surat-masuk/${editItem.id}`, { ...payload, _method: 'PUT' }, opts);
        } else {
            router.post('/tatausaha/surat-masuk', payload, opts);
        }
    };

    const setFilter = (key, val) =>
        router.get('/tatausaha/surat-masuk', { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });

    const tahunList = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    return (
        <AppLayout title="Surat Masuk">
            <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <MailOpen className="h-5 w-5 text-sky-500" />
                        Surat Masuk ({surat.total})
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input defaultValue={filters.search} onChange={(e) => setFilter('search', e.target.value)}
                                placeholder="Cari nomor / perihal..." className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-44 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        {/* Filter disposisi */}
                        <select value={filters.disposisi ?? ''} onChange={(e) => setFilter('disposisi', e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                            <option value="">Semua Disposisi</option>
                            {DISPOSISI_LIST.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {/* Filter tahun */}
                        <select value={filters.tahun ?? ''} onChange={(e) => setFilter('tahun', e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                            <option value="">Semua Tahun</option>
                            {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <Button icon={Plus} onClick={() => setShowModal(true)}>Tambah</Button>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Nomor Surat</th>
                                    <th className="px-4 py-3 text-left font-medium">Perihal</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Pengirim</th>
                                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tgl Diterima</th>
                                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Kategori</th>
                                    <th className="px-4 py-3 text-left font-medium">Disposisi</th>
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
                                            <p className="font-medium text-gray-900 dark:text-gray-100 max-w-50 truncate">{item.perihal}</p>
                                            {item.file_url && (
                                                <a href={item.file_url} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline mt-0.5">
                                                    <Paperclip className="h-3 w-3" /> Lihat file
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.pengirim}</td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">{fmt(item.tgl_diterima)}</td>
                                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.kategori}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={DISPOSISI_COLOR[item.disposisi] ?? 'gray'}>{item.disposisi}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {item.file_url && (
                                                    <a href={item.file_url} target="_blank" rel="noreferrer"
                                                        className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Download">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                )}
                                                <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {item.kode_ref ? (
                                                    <button onClick={() => setQrItem(item)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Lihat QR">
                                                        <QrCode className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => router.post(`/tatausaha/surat-masuk/${item.id}/qr`)} className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Generate QR">
                                                        <QrCode className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {surat.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            <MailOpen className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm text-gray-400">Belum ada surat masuk.</p>
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

            {/* Modal */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Surat Masuk' : 'Tambah Surat Masuk'} size="lg">
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nomor Surat" value={data.nomor_surat} onChange={(e) => setData('nomor_surat', e.target.value)} error={errors.nomor_surat} required placeholder="cth: 001/SM/VII/2026" />
                        <Input label="Pengirim" value={data.pengirim} onChange={(e) => setData('pengirim', e.target.value)} error={errors.pengirim} required placeholder="Instansi / nama pengirim" />
                        <div className="col-span-1 sm:col-span-2">
                            <Input label="Perihal" value={data.perihal} onChange={(e) => setData('perihal', e.target.value)} error={errors.perihal} required placeholder="Isi perihal surat" />
                        </div>
                        <Input label="Tanggal Surat" type="date" value={data.tgl_surat} onChange={(e) => setData('tgl_surat', e.target.value)} error={errors.tgl_surat} required />
                        <Input label="Tanggal Diterima" type="date" value={data.tgl_diterima} onChange={(e) => setData('tgl_diterima', e.target.value)} error={errors.tgl_diterima} required />
                        <Select label="Kategori" value={data.kategori} onChange={(e) => setData('kategori', e.target.value)}>
                            {KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
                        </Select>
                        <Select label="Disposisi" value={data.disposisi} onChange={(e) => setData('disposisi', e.target.value)}>
                            {DISPOSISI_LIST.map((d) => <option key={d} value={d}>{d}</option>)}
                        </Select>
                    </div>
                    <Textarea label="Keterangan" value={data.keterangan} onChange={(e) => setData('keterangan', e.target.value)} rows={2} placeholder="Catatan tambahan (opsional)" />
                    <FilePickerArea
                        file={fileObj}
                        setFile={setFileObj}
                        existingUrl={editItem?.file_url}
                        existingName={editItem?.file_surat ? editItem.file_surat.split('/').pop() : null}
                        onClear={() => setClearFile(true)}
                    />
                    <div className="flex justify-end gap-3 pt-1">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Surat Masuk"
                message={`Surat "${deleteTarget?.perihal}" akan dihapus permanen beserta filenya.`}
                onConfirm={() => { router.delete(`/tatausaha/surat-masuk/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />

            {qrItem && (
                <QrModal item={qrItem} namaSekolah={namaSekolah} onClose={() => setQrItem(null)} />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-xl pointer-events-none">
                    <CheckCircle className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                    Nomor surat tersalin!
                </div>
            )}
        </AppLayout>
    );
}
