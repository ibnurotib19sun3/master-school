import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    BookText, Search, X, ChevronLeft, ChevronRight,
    History, Plus, BookOpen, Printer, CheckSquare, Square, GraduationCap,
} from 'lucide-react';
import { useState, useCallback } from 'react';

function toDatePart(val) {
    if (!val) return '';
    return String(val).split('T')[0].split(' ')[0];
}

function fmtLong(val) {
    const d = toDatePart(val);
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

function fmtFull(val) {
    const d = toDatePart(val);
    if (!d) return '–';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

const METODE_BADGE = {
    Ceramah:    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    Diskusi:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Praktik:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Proyek:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Kooperatif: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    Lainnya:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

/* ------------------------------------------------------------------ */
/* Print helper                                                          */
/* ------------------------------------------------------------------ */
function buildKopHtml(kop) {
    if (!kop) return '';
    const kontak = [
        kop.telepon_kop ? `Telp: ${kop.telepon_kop}` : null,
        kop.email_kop   ? `Email: ${kop.email_kop}`   : null,
        kop.website_kop ? kop.website_kop              : null,
        kop.npsn_kop    ? `NPSN: ${kop.npsn_kop}`     : null,
    ].filter(Boolean).join('  ·  ');

    return `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:10px;margin-bottom:10px;border-bottom:3px solid #0284c7;">
        ${kop.logo_url ? `<img src="${kop.logo_url}" alt="Logo" style="width:70px;height:70px;object-fit:contain;flex-shrink:0;" />` : ''}
        <div style="flex:1;text-align:center;">
            ${kop.yayasan_dinas ? `<p style="font-size:10px;color:#555;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:2px;">${kop.yayasan_dinas}</p>` : ''}
            ${kop.nama_instansi ? `<p style="font-size:20px;font-weight:900;color:#111;line-height:1.1;letter-spacing:1px;text-transform:uppercase;">${kop.nama_instansi}</p>` : ''}
            ${kop.sub_nama      ? `<p style="font-size:11px;font-weight:600;color:#333;margin-top:1px;">${kop.sub_nama}</p>`  : ''}
            ${kop.alamat_kop   ? `<p style="font-size:8.5px;color:#555;margin-top:3px;">${kop.alamat_kop}</p>`               : ''}
            ${kontak            ? `<p style="font-size:8.5px;color:#555;margin-top:1px;">${kontak}</p>`                       : ''}
        </div>
    </div>`;
}

function namaLengkapGuru(guru, fallback = '–') {
    if (!guru?.user) return fallback;
    const depan    = guru.gelar_depan    ? `${guru.gelar_depan} `    : '';
    const belakang = guru.gelar_belakang ? `, ${guru.gelar_belakang}` : '';
    return `${depan}${guru.user.name}${belakang}`;
}

function buildPrintHtml(items, kop) {
    const hasCatatan = items.some(j => j.catatan);

    const rows = items.map((j, idx) => {
        const p        = j.pembelajaran ?? {};
        const guru     = namaLengkapGuru(p.guru, '–');
        const mapel    = p.mata_pelajaran?.nama ?? '–';
        const rombel   = p.rombel?.nama ?? '–';
        const capaian  = j.capaian_pembelajaran?.length
            ? j.capaian_pembelajaran.map(cp => `<span style="display:block;font-family:monospace;font-size:9.5px;font-weight:700;color:#4338ca;">${cp.kode_lengkap}</span>`).join('')
            : '<span style="color:#9ca3af;font-style:italic;">–</span>';
        const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';

        return `<tr style="background:${bg};vertical-align:top;">
            <td style="padding:5px 7px;text-align:center;border:1px solid #e5e7eb;white-space:nowrap;">${idx + 1}</td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;white-space:nowrap;">
                <span style="font-weight:600;">${fmtLong(j.tanggal)}</span>
                <span style="display:block;font-size:9.5px;color:#6b7280;">Pertemuan ke-${j.pertemuan_ke ?? '–'}</span>
            </td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;">
                <span style="font-weight:600;">${mapel}</span>
                <span style="display:block;font-size:9.5px;color:#6b7280;">${rombel}</span>
            </td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;">${guru}</td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;font-weight:600;">${j.materi_pokok ?? '–'}</td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;white-space:pre-wrap;max-width:200px;">${j.uraian_materi ?? '–'}</td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;white-space:nowrap;">
                ${(Array.isArray(j.metode) ? j.metode : [j.metode]).filter(Boolean).join(', ') || '–'}
                ${j.media_type ? `<span style="display:block;font-size:9.5px;color:#6b7280;">${j.media_type}</span>` : ''}
            </td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;">${capaian}</td>
            <td style="padding:5px 7px;border:1px solid #e5e7eb;text-align:center;">${j.jumlah_hadir ?? '–'}</td>
            ${hasCatatan ? `<td style="padding:5px 7px;border:1px solid #e5e7eb;white-space:pre-wrap;">${j.catatan ?? ''}</td>` : ''}
        </tr>`;
    }).join('');

    const thStyle = 'padding:7px 8px;background:#0284c7;color:#fff;font-size:10px;font-weight:700;text-align:center;border:1px solid #0369a1;white-space:nowrap;';

    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
    <base href="${window.location.origin}/">
    <title>Jurnal Mengajar</title>
    <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#1f2937; padding:20px; }
        h1 { font-size:14px; font-weight:800; color:#111; margin:10px 0 2px; text-align:center; text-transform:uppercase; letter-spacing:1px; }
        .subtitle { font-size:9.5px; color:#6b7280; margin-bottom:12px; text-align:center; }
        table { border-collapse:collapse; width:100%; }
        @media print { body { padding:10px; } }
    </style></head><body>
    ${buildKopHtml(kop)}
    <h1>Jurnal Mengajar</h1>
    <p class="subtitle">Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} &nbsp;·&nbsp; ${items.length} entri</p>
    <table>
        <thead>
            <tr>
                <th style="${thStyle}">No</th>
                <th style="${thStyle}">Tanggal</th>
                <th style="${thStyle}">Mapel / Kelas</th>
                <th style="${thStyle}">Guru</th>
                <th style="${thStyle}">Materi Pokok</th>
                <th style="${thStyle}">Uraian Materi</th>
                <th style="${thStyle}">Metode / Media</th>
                <th style="${thStyle}">Capaian</th>
                <th style="${thStyle}">Hadir</th>
                ${hasCatatan ? `<th style="${thStyle}">Catatan</th>` : ''}
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
    </body></html>`;
}

function doPrint(items, kop) {
    if (!items.length) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(buildPrintHtml(items, kop));
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
}

/* ------------------------------------------------------------------ */
/* Main component                                                        */
/* ------------------------------------------------------------------ */
export default function GuruJurnalRiwayat({ riwayat, filters, mataPelajaran, isAdmin, kop }) {
    const [dari,     setDari]     = useState(filters.dari   ?? '');
    const [sampai,   setSampai]   = useState(filters.sampai ?? '');
    const [mapel,    setMapel]    = useState(filters.mapel  ?? '');
    const [q,        setQ]        = useState(filters.q      ?? '');
    const [selected, setSelected] = useState(new Set());

    const applyFilter = useCallback((nd, ns, nm, nq) => {
        router.get('/guru/jurnal/riwayat', {
            dari:   nd || undefined,
            sampai: ns || undefined,
            mapel:  nm || undefined,
            q:      nq || undefined,
        }, { preserveState: true, replace: true });
        setSelected(new Set());
    }, []);

    const handleDari   = (v) => { setDari(v);   applyFilter(v, sampai, mapel, q); };
    const handleSampai = (v) => { setSampai(v);  applyFilter(dari, v, mapel, q); };
    const handleMapel  = (v) => { setMapel(v);   applyFilter(dari, sampai, v, q); };
    const handleQ      = (v) => { setQ(v);       applyFilter(dari, sampai, mapel, v); };
    const clearAll     = ()  => { setDari(''); setSampai(''); setMapel(''); setQ(''); applyFilter('', '', '', ''); };

    const hasFilter = dari || sampai || mapel || q;

    const ids        = riwayat.data.map((j) => j.id);
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

    const selectedItems = riwayat.data.filter((j) => selected.has(j.id));

    return (
        <AppLayout title="Riwayat Jurnal Mengajar">
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="h-5 w-5 text-emerald-600" />
                            Riwayat Jurnal Mengajar
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Semua entri jurnal mengajar yang telah diisi
                        </p>
                    </div>
                    <Link href="/guru/jurnal"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Isi Jurnal Hari Ini
                    </Link>
                </div>

                {/* Filter bar */}
                <Card>
                    <CardBody className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Mulai</label>
                                <input type="date" value={dari} onChange={e => handleDari(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Akhir</label>
                                <input type="date" value={sampai} onChange={e => handleSampai(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div className="min-w-44">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mata Pelajaran</label>
                                <select value={mapel} onChange={e => handleMapel(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="">Semua Mapel</option>
                                    {mataPelajaran.map(m => (
                                        <option key={m.id} value={m.id}>{m.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-48">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari Materi</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input type="text" value={q} onChange={e => handleQ(e.target.value)}
                                        placeholder="Kata kunci materi..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            {hasFilter && (
                                <button onClick={clearAll}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <X className="h-3.5 w-3.5" /> Reset
                                </button>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader className="flex items-center gap-3">
                        <CardTitle className="flex-1 flex items-center gap-2">
                            <BookText className="h-4 w-4 text-gray-400" />
                            {riwayat.total} Entri
                            {hasFilter && <span className="text-xs font-normal text-emerald-500">(difilter)</span>}
                        </CardTitle>
                        {/* Tombol print */}
                        <div className="flex gap-2">
                            {selected.size > 0 && (
                                <button
                                    onClick={() => doPrint(selectedItems, kop)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    Cetak {selected.size} Terpilih
                                </button>
                            )}
                            {riwayat.data.length > 0 && (
                                <button
                                    onClick={() => doPrint(riwayat.data, kop)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    Cetak Halaman Ini
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {riwayat.data.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Tidak ada data{hasFilter ? ' sesuai filter' : ''}.</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile card view */}
                                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                    {riwayat.data.map(item => {
                                        const mapelNama  = item.pembelajaran?.mata_pelajaran?.nama ?? '—';
                                        const rombelNama = item.pembelajaran?.rombel?.nama ?? '—';
                                        const guruNama   = namaLengkapGuru(item.pembelajaran?.guru, '—');
                                        const isChecked  = selected.has(item.id);
                                        return (
                                            <div key={item.id}
                                                className={`px-4 py-3 flex gap-3 transition-colors ${isChecked ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                                <button onClick={() => toggleOne(item.id)}
                                                    className={`shrink-0 mt-1 rounded p-0.5 transition-colors ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600 hover:text-emerald-400'}`}>
                                                    {isChecked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">{item.pertemuan_ke}</span>
                                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{fmtLong(item.tanggal)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                                <BookOpen className="h-3 w-3 text-emerald-500 shrink-0" />
                                                                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{mapelNama}</span>
                                                                <span className="text-xs text-gray-400">· {rombelNama}</span>
                                                            </div>
                                                            {isAdmin && <p className="text-xs text-gray-400 mb-1">{guruNama}</p>}
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{item.materi_pokok}</p>
                                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                {(Array.isArray(item.metode) ? item.metode : [item.metode]).filter(Boolean).map((m) => (
                                                                    <span key={m} className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${METODE_BADGE[m] ?? METODE_BADGE.Lainnya}`}>{m}</span>
                                                                ))}
                                                                {item.capaian_pembelajaran?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.capaian_pembelajaran.map((cp) => (
                                                                            <span key={cp.id}
                                                                                className="inline-block font-mono font-bold px-1.5 py-0.5 rounded text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                                                                                {cp.kode_lengkap}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <span className="text-xs text-gray-500">{item.jumlah_hadir ?? 0} hadir</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => doPrint([item], kop)} title="Cetak"
                                                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Desktop table */}
                                <div className="overflow-x-auto hidden sm:block">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <th className="px-3 py-3 w-8">
                                                    <button onClick={toggleAll} className="text-gray-400 hover:text-emerald-600 transition-colors">
                                                        {allChecked
                                                            ? <CheckSquare className="h-4 w-4 text-emerald-600" />
                                                            : <Square className="h-4 w-4" />}
                                                    </button>
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Tanggal</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Pertemuan</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Mata Pelajaran / Kelas</th>
                                                {isAdmin && <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Guru</th>}
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Materi Pokok</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Capaian</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Metode</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Hadir</th>
                                                <th className="px-4 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {riwayat.data.map(item => {
                                                const mapelNama  = item.pembelajaran?.mata_pelajaran?.nama ?? '—';
                                                const rombelNama = item.pembelajaran?.rombel?.nama ?? '—';
                                                const guruNama   = namaLengkapGuru(item.pembelajaran?.guru, '—');
                                                const isChecked  = selected.has(item.id);
                                                return (
                                                    <tr key={item.id}
                                                        className={`transition-colors ${isChecked ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}>
                                                        <td className="px-3 py-3">
                                                            <button onClick={() => toggleOne(item.id)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                                                                {isChecked
                                                                    ? <CheckSquare className="h-4 w-4 text-emerald-600" />
                                                                    : <Square className="h-4 w-4" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                                                            {fmtLong(item.tanggal)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                                                                {item.pertemuan_ke}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <BookOpen className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{mapelNama}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-0.5 pl-5">{rombelNama}</p>
                                                        </td>
                                                        {isAdmin && (
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{guruNama}</td>
                                                        )}
                                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs">
                                                            <p className="line-clamp-2 leading-relaxed">{item.materi_pokok}</p>
                                                        </td>
                                                        <td className="px-4 py-3 max-w-45">
                                                            {item.capaian_pembelajaran?.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {item.capaian_pembelajaran.map((cp) => (
                                                                        <span key={cp.id} title={cp.capaian}
                                                                            className="inline-block font-mono font-bold px-1.5 py-0.5 rounded text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                                                                            {cp.kode_lengkap}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-300 dark:text-gray-600 text-xs">–</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(Array.isArray(item.metode) ? item.metode : [item.metode]).filter(Boolean).map((m) => (
                                                                    <span key={m} className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${METODE_BADGE[m] ?? METODE_BADGE.Lainnya}`}>{m}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                                {item.jumlah_hadir ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => doPrint([item], kop)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-emerald-600 transition-colors"
                                                                title="Cetak jurnal ini"
                                                            >
                                                                <Printer className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bar info seleksi */}
                                {selected.size > 0 && (
                                    <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800 flex items-center gap-3 text-sm">
                                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">{selected.size} jurnal dipilih</span>
                                        <button onClick={() => setSelected(new Set())} className="text-xs text-emerald-500 hover:text-emerald-700 underline">Batal pilih</button>
                                        <button
                                            onClick={() => doPrint(selectedItems, kop)}
                                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                        >
                                            <Printer className="h-3.5 w-3.5" /> Cetak {selected.size} Terpilih
                                        </button>
                                    </div>
                                )}

                                {/* Pagination */}
                                {riwayat.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Halaman {riwayat.current_page} dari {riwayat.last_page}
                                            <span className="ml-2 text-gray-400">({riwayat.total} total)</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={!riwayat.prev_page_url}
                                                onClick={() => riwayat.prev_page_url && router.get(riwayat.prev_page_url)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                                                <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                            </button>
                                            <button
                                                disabled={!riwayat.next_page_url}
                                                onClick={() => riwayat.next_page_url && router.get(riwayat.next_page_url)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-800">
                                                Next <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
