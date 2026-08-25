import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import {
    FileText, Search, Eye, Video, Presentation, BookMarked,
    FileSpreadsheet, ExternalLink, GraduationCap, Printer, CheckSquare, Square,
} from 'lucide-react';
import { useState, useCallback } from 'react';

const metodeBadge = {
    Ceramah: 'blue', Diskusi: 'indigo', Praktik: 'green',
    Proyek: 'purple', Kooperatif: 'yellow', Lainnya: 'gray',
};

/* ------------------------------------------------------------------ */
/* Print helper                                                          */
/* ------------------------------------------------------------------ */
function fmtTanggal(v) {
    if (!v) return '–';
    const d = new Date(String(v).length === 10 ? v + 'T00:00:00' : v);
    return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildPrintHtml(items) {
    const rows = items.map((j, idx) => {
        const p = j.pembelajaran ?? {};
        const guru  = p.guru?.user?.name ?? '–';
        const mapel = p.mata_pelajaran?.nama ?? '–';
        const rombel = p.rombel?.nama ?? '–';

        const capaianHtml = j.capaian_pembelajaran?.length
            ? j.capaian_pembelajaran.map(cp =>
                `<tr><td style="padding:3px 8px;font-family:monospace;font-weight:700;white-space:nowrap;color:#4338ca">${cp.kode_lengkap}</td>
                      <td style="padding:3px 8px;">${cp.capaian}</td></tr>`
              ).join('')
            : `<tr><td colspan="2" style="padding:3px 8px;color:#9ca3af;font-style:italic">Tidak ada capaian yang dipilih</td></tr>`;

        return `
        <div class="entry" style="page-break-inside:avoid;margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:12px;">
            <div style="background:#eef2ff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #c7d2fe;">
                <div style="font-weight:700;font-size:13px;color:#1e1b4b;">${idx + 1}. ${guru} — ${mapel} (${rombel})</div>
                <div style="color:#6b7280;font-size:11px;">${fmtTanggal(j.tanggal)} &nbsp;·&nbsp; Pertemuan ke-${j.pertemuan_ke ?? '–'} &nbsp;·&nbsp; ${j.jumlah_hadir ?? '–'} siswa hadir</div>
            </div>
            <div style="padding:10px 14px;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:3px 0;width:140px;color:#6b7280;vertical-align:top;">Materi Pokok</td>
                        <td style="padding:3px 0;color:#111827;font-weight:600;">${j.materi_pokok ?? '–'}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#6b7280;vertical-align:top;">Uraian Materi</td>
                        <td style="padding:3px 0;color:#374151;white-space:pre-wrap;">${j.uraian_materi ?? '–'}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;color:#6b7280;vertical-align:top;">Metode / Media</td>
                        <td style="padding:3px 0;color:#374151;">${(Array.isArray(j.metode) ? j.metode : [j.metode]).filter(Boolean).join(', ') || '–'}${j.media_type ? ' &nbsp;/&nbsp; ' + j.media_type : ''}</td>
                    </tr>
                    ${j.catatan ? `<tr>
                        <td style="padding:3px 0;color:#6b7280;vertical-align:top;">Catatan</td>
                        <td style="padding:3px 0;color:#374151;white-space:pre-wrap;">${j.catatan}</td>
                    </tr>` : ''}
                </table>
                <div style="margin-top:8px;">
                    <div style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;display:flex;align-items:center;gap:4px;">
                        🎓 Capaian Pembelajaran
                    </div>
                    <table style="width:100%;border-collapse:collapse;background:#f5f3ff;border-radius:6px;overflow:hidden;">
                        ${capaianHtml}
                    </table>
                </div>
            </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
    <title>Jurnal Mengajar</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; padding: 20px; }
        h1 { font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; }
        .subtitle { font-size: 11px; color: #6b7280; margin-bottom: 16px; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
        @media print {
            body { padding: 0; }
            .entry { break-inside: avoid; }
        }
    </style></head><body>
    <h1>Rekap Jurnal Mengajar</h1>
    <p class="subtitle">Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; ${items.length} entri</p>
    ${rows}
    </body></html>`;
}

function doPrint(items) {
    if (!items.length) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(buildPrintHtml(items));
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
}

/* ------------------------------------------------------------------ */
/* Detail modal                                                          */
/* ------------------------------------------------------------------ */
function DetailModal({ jurnal, onClose, onPrint }) {
    if (!jurnal) return null;
    const j = jurnal;
    const p = j.pembelajaran ?? {};

    return (
        <Modal show onClose={onClose} title="Detail Jurnal Mengajar" size="lg">
            <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 flex flex-wrap gap-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Guru</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{p.guru?.user?.name ?? '–'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mata Pelajaran</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{p.mata_pelajaran?.nama ?? '–'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rombel</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{p.rombel?.nama ?? '–'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{fmtTanggal(j.tanggal)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pertemuan ke-</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{j.pertemuan_ke ?? '–'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hadir</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{j.jumlah_hadir ?? '–'} siswa</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Field label="Materi Pokok" value={j.materi_pokok} />
                <Field label="Uraian Materi" value={j.uraian_materi} multiline />

                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                        Capaian Pembelajaran
                    </p>
                    {j.capaian_pembelajaran?.length > 0 ? (
                        <div className="space-y-1.5">
                            {j.capaian_pembelajaran.map((cp) => (
                                <div key={cp.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
                                    <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">{cp.kode_lengkap}</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{cp.capaian}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Tidak ada capaian yang dipilih</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Metode</p>
                        <div className="flex flex-wrap gap-1">
                            {(Array.isArray(j.metode) ? j.metode : [j.metode]).filter(Boolean).map((m) => (
                                <Badge key={m} color={metodeBadge[m] ?? 'gray'}>{m}</Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Media</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{j.media_type ?? '–'}</p>
                            {(j.media_link || j.media_url) && j.media_type && j.media_type !== 'Papan Tulis' && (() => {
                                const link = j.media_link || j.media_url;
                                const isVid = j.media_type === 'Video Pembelajaran';
                                const IconMap = { 'Video Pembelajaran': Video, 'Presentasi': Presentation, 'Modul Ajar': BookMarked, 'Jobsheet': FileSpreadsheet };
                                const Icon = IconMap[j.media_type] ?? ExternalLink;
                                return (
                                    <a href={link} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors">
                                        {isVid ? <ExternalLink className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        <Icon className="h-3 w-3" />
                                        {j.media_ref_judul ?? (isVid ? 'Tonton' : 'Lihat File')}
                                    </a>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {j.catatan && <Field label="Catatan" value={j.catatan} multiline />}
            </div>

            {/* Print tombol di modal */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                    onClick={() => doPrint([j])}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                >
                    <Printer className="h-4 w-4" /> Cetak Jurnal Ini
                </button>
            </div>
        </Modal>
    );
}

function Field({ label, value, multiline }) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            {multiline
                ? <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{value ?? '–'}</p>
                : <p className="text-sm text-gray-800 dark:text-gray-200">{value ?? '–'}</p>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main component                                                        */
/* ------------------------------------------------------------------ */
export default function AdminJurnalIndex({ jurnal, guruList, rombelList, filters }) {
    const [detail, setDetail]     = useState(null);
    const [selected, setSelected] = useState(new Set());

    const setFilter = (key, val) => {
        router.get('/admin/jurnal-mengajar', { ...filters, [key]: val || undefined }, {
            preserveState: true, replace: true,
        });
        setSelected(new Set());
    };
    const resetFilters = () => {
        router.get('/admin/jurnal-mengajar', {}, { preserveState: true, replace: true });
        setSelected(new Set());
    };

    const hasFilter = Object.values(filters).some(Boolean);
    const ids       = jurnal.data.map((j) => j.id);
    const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));

    const toggleAll = () => {
        if (allChecked) {
            setSelected((p) => { const s = new Set(p); ids.forEach((id) => s.delete(id)); return s; });
        } else {
            setSelected((p) => { const s = new Set(p); ids.forEach((id) => s.add(id)); return s; });
        }
    };
    const toggleOne = (id) => {
        setSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const selectedItems = jurnal.data.filter((j) => selected.has(j.id));

    const printSelected = () => doPrint(selectedItems);
    const printAll      = () => doPrint(jurnal.data);

    return (
        <AppLayout title="Jurnal Mengajar Guru">
            {/* Filter bar */}
            <Card className="mb-4">
                <CardBody className="py-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <Search className="h-4 w-4 text-gray-400 self-center shrink-0" />
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Dari Tanggal</label>
                            <input type="date" value={filters.tanggal_dari ?? ''} onChange={(e) => setFilter('tanggal_dari', e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sampai Tanggal</label>
                            <input type="date" value={filters.tanggal_sampai ?? ''} onChange={(e) => setFilter('tanggal_sampai', e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Guru</label>
                            <select value={filters.guru_id ?? ''} onChange={(e) => setFilter('guru_id', e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-44">
                                <option value="">Semua Guru</option>
                                {guruList.map((g) => <option key={g.id} value={g.id}>{g.user?.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rombel</label>
                            <select value={filters.rombel_id ?? ''} onChange={(e) => setFilter('rombel_id', e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-40">
                                <option value="">Semua Rombel</option>
                                {rombelList.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                            </select>
                        </div>
                        {hasFilter && (
                            <button onClick={resetFilters} className="self-end text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                Reset filter
                            </button>
                        )}
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader className="flex items-center gap-3">
                    <CardTitle className="flex-1">
                        Jurnal Mengajar Guru
                        <span className="ml-2 text-sm font-normal text-gray-400">({jurnal.total} entri)</span>
                    </CardTitle>
                    {/* Tombol print */}
                    <div className="flex gap-2">
                        {selected.size > 0 && (
                            <button
                                onClick={printSelected}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                            >
                                <Printer className="h-4 w-4" />
                                Cetak {selected.size} Terpilih
                            </button>
                        )}
                        {jurnal.data.length > 0 && (
                            <button
                                onClick={printAll}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Printer className="h-4 w-4" />
                                Cetak Halaman Ini
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {jurnal.data.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Belum ada jurnal.</p>
                            <p className="text-sm mt-1">Coba ubah filter di atas.</p>
                        </div>
                    ) : (
                        <>
                        {/* Mobile card view */}
                        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {jurnal.data.map((item) => {
                                const isChecked = selected.has(item.id);
                                return (
                                    <div key={item.id}
                                        className={`px-4 py-3 flex gap-3 transition-colors ${isChecked ? 'bg-sky-50 dark:bg-sky-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                        <button onClick={() => toggleOne(item.id)}
                                            className={`shrink-0 mt-1 rounded p-0.5 transition-colors ${isChecked ? 'text-sky-600 dark:text-sky-400' : 'text-gray-300 dark:text-gray-600 hover:text-sky-400'}`}>
                                            {isChecked ? <CheckSquare className="h-4 w-4 text-sky-600" /> : <Square className="h-4 w-4" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <img src={item.pembelajaran?.guru?.user?.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.pembelajaran?.guru?.user?.name ?? '–'}</p>
                                                        <p className="text-xs text-gray-400 ml-auto shrink-0">{fmtTanggal(item.tanggal)}</p>
                                                    </div>
                                                    <p className="text-xs text-sky-500 dark:text-sky-400 mb-1">
                                                        {item.pembelajaran?.mata_pelajaran?.nama ?? '–'} · {item.pembelajaran?.rombel?.nama ?? '–'}
                                                    </p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{item.materi_pokok}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <div className="flex flex-wrap gap-1">
                                                            {(Array.isArray(item.metode) ? item.metode : [item.metode]).filter(Boolean).map((m) => (
                                                                <Badge key={m} color={metodeBadge[m] ?? 'gray'}>{m}</Badge>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-500">{item.jumlah_hadir ?? '–'} hadir</span>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex flex-col gap-1">
                                                    <button onClick={() => setDetail(item)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors">
                                                        <Eye className="h-3 w-3" /> Detail
                                                    </button>
                                                    <button onClick={() => doPrint([item])}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 transition-colors">
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Desktop table */}
                        <div className="overflow-x-auto hidden sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-3 py-3 w-8">
                                            <button onClick={toggleAll} className="text-gray-400 hover:text-sky-600 transition-colors">
                                                {allChecked
                                                    ? <CheckSquare className="h-4 w-4 text-sky-600" />
                                                    : <Square className="h-4 w-4" />}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Tanggal</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Guru</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Mata Pelajaran</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Rombel</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Materi Pokok</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Metode</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Hadir</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {jurnal.data.map((item) => (
                                        <tr key={item.id}
                                            className={`transition-colors ${selected.has(item.id) ? 'bg-sky-50 dark:bg-sky-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                            <td className="px-3 py-3">
                                                <button onClick={() => toggleOne(item.id)} className="text-gray-400 hover:text-sky-600 transition-colors">
                                                    {selected.has(item.id)
                                                        ? <CheckSquare className="h-4 w-4 text-sky-600" />
                                                        : <Square className="h-4 w-4" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                                {fmtTanggal(item.tanggal)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <img src={item.pembelajaran?.guru?.user?.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                                    <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.pembelajaran?.guru?.user?.name ?? '–'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">{item.pembelajaran?.mata_pelajaran?.nama ?? '–'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">{item.pembelajaran?.rombel?.nama ?? '–'}</td>
                                            <td className="px-4 py-3 max-w-48">
                                                <p className="truncate text-gray-700 dark:text-gray-300">{item.materi_pokok}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {(Array.isArray(item.metode) ? item.metode : [item.metode]).filter(Boolean).map((m) => (
                                                        <Badge key={m} color={metodeBadge[m] ?? 'gray'}>{m}</Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">{item.jumlah_hadir ?? '–'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setDetail(item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> Detail
                                                    </button>
                                                    <button
                                                        onClick={() => doPrint([item])}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 transition-colors"
                                                        title="Cetak jurnal ini"
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}

                    {/* Bar info seleksi */}
                    {selected.size > 0 && (
                        <div className="px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border-t border-sky-100 dark:border-sky-800 flex items-center gap-3 text-sm">
                            <CheckSquare className="h-4 w-4 text-sky-600" />
                            <span className="text-sky-700 dark:text-sky-300 font-medium">{selected.size} jurnal dipilih</span>
                            <button onClick={() => setSelected(new Set())} className="text-xs text-sky-500 hover:text-sky-700 underline">Batal pilih</button>
                            <button
                                onClick={printSelected}
                                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                            >
                                <Printer className="h-3.5 w-3.5" /> Cetak {selected.size} Terpilih
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {jurnal.last_page > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Menampilkan {jurnal.from}–{jurnal.to} dari {jurnal.total}
                            </p>
                            <div className="flex gap-1">
                                {jurnal.links.map((link, i) => (
                                    <Link key={i} href={link.url ?? '#'}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            link.active ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            <DetailModal jurnal={detail} onClose={() => setDetail(null)} />
        </AppLayout>
    );
}
