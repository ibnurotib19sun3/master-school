import AppLayout from '@/Layouts/AppLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    ClipboardList, Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    History, Plus, BookOpen, Printer, CheckSquare, Square, Users,
} from 'lucide-react';
import { Fragment, useState, useCallback } from 'react';

const STATUS_COLOR = {
    Hadir: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Sakit: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Izin:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Alpha: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

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

function namaLengkapGuru(guru, fallback = '–') {
    if (!guru?.user) return fallback;
    const depan    = guru.gelar_depan    ? `${guru.gelar_depan} `    : '';
    const belakang = guru.gelar_belakang ? `, ${guru.gelar_belakang}` : '';
    return `${depan}${guru.user.name}${belakang}`;
}

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

function buildSesiHtml(item, idx) {
    const p      = item.pembelajaran ?? {};
    const mapel  = p.mata_pelajaran?.nama ?? '–';
    const rombel = p.rombel?.nama ?? '–';
    const guru   = namaLengkapGuru(p.guru, '–');

    const siswaRows = (item.absensi ?? [])
        .slice()
        .sort((a, b) => (a.siswa?.user?.name ?? '').localeCompare(b.siswa?.user?.name ?? ''))
        .map((a, i) => `
            <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td style="padding:4px 7px;text-align:center;border:1px solid #e5e7eb;">${i + 1}</td>
                <td style="padding:4px 7px;border:1px solid #e5e7eb;">${a.siswa?.user?.name ?? '–'}</td>
                <td style="padding:4px 7px;border:1px solid #e5e7eb;text-align:center;font-weight:600;">${a.status}</td>
                <td style="padding:4px 7px;border:1px solid #e5e7eb;">${a.keterangan ?? ''}</td>
            </tr>`).join('');

    return `
    <div style="${idx > 0 ? 'page-break-before:always;' : ''}margin-bottom:16px;">
        <h2 style="font-size:12.5px;font-weight:800;color:#111;margin-bottom:2px;">${mapel} · ${rombel}</h2>
        <p style="font-size:9.5px;color:#6b7280;margin-bottom:8px;">
            ${fmtLong(item.tanggal)} &nbsp;·&nbsp; Pertemuan ke-${item.pertemuan_ke ?? '–'} &nbsp;·&nbsp; Guru: ${guru}
            &nbsp;·&nbsp; H:${item.ringkasan?.hadir ?? 0} S:${item.ringkasan?.sakit ?? 0} I:${item.ringkasan?.izin ?? 0} A:${item.ringkasan?.alpha ?? 0}
        </p>
        <table style="border-collapse:collapse;width:100%;">
            <thead>
                <tr>
                    <th style="padding:6px 8px;background:#0284c7;color:#fff;font-size:9.5px;font-weight:700;text-align:center;border:1px solid #0369a1;width:30px;">No</th>
                    <th style="padding:6px 8px;background:#0284c7;color:#fff;font-size:9.5px;font-weight:700;text-align:left;border:1px solid #0369a1;">Nama Siswa</th>
                    <th style="padding:6px 8px;background:#0284c7;color:#fff;font-size:9.5px;font-weight:700;text-align:center;border:1px solid #0369a1;width:80px;">Status</th>
                    <th style="padding:6px 8px;background:#0284c7;color:#fff;font-size:9.5px;font-weight:700;text-align:left;border:1px solid #0369a1;">Keterangan</th>
                </tr>
            </thead>
            <tbody>${siswaRows || '<tr><td colspan="4" style="padding:10px;text-align:center;color:#9ca3af;border:1px solid #e5e7eb;">Belum ada data presensi</td></tr>'}</tbody>
        </table>
    </div>`;
}

function buildPrintHtml(items, kop) {
    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
    <base href="${window.location.origin}/">
    <title>Riwayat Presensi Siswa</title>
    <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#1f2937; padding:20px; }
        h1 { font-size:14px; font-weight:800; color:#111; margin:10px 0 2px; text-align:center; text-transform:uppercase; letter-spacing:1px; }
        .subtitle { font-size:9.5px; color:#6b7280; margin-bottom:14px; text-align:center; }
        @media print { body { padding:10px; } }
    </style></head><body>
    ${buildKopHtml(kop)}
    <h1>Riwayat Presensi Siswa</h1>
    <p class="subtitle">Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} &nbsp;·&nbsp; ${items.length} sesi</p>
    ${items.map((item, idx) => buildSesiHtml(item, idx)).join('')}
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

function RingkasanBadges({ ringkasan }) {
    if (!ringkasan) return null;
    return (
        <div className="flex items-center gap-1 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${STATUS_COLOR.Hadir}`}>H {ringkasan.hadir}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${STATUS_COLOR.Sakit}`}>S {ringkasan.sakit}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${STATUS_COLOR.Izin}`}>I {ringkasan.izin}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${STATUS_COLOR.Alpha}`}>A {ringkasan.alpha}</span>
        </div>
    );
}

function DetailSiswaList({ item }) {
    const list = (item.absensi ?? []).slice().sort((a, b) => (a.siswa?.user?.name ?? '').localeCompare(b.siswa?.user?.name ?? ''));
    if (list.length === 0) {
        return <p className="text-xs text-gray-400 py-3">Belum ada data presensi untuk sesi ini.</p>;
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 py-3">
            {list.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-xs">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{a.siswa?.user?.name ?? '–'}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${STATUS_COLOR[a.status] ?? ''}`}>{a.status}</span>
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main component                                                        */
/* ------------------------------------------------------------------ */
export default function GuruAbsensiRiwayat({ riwayat, filters, rombelList, isAdmin, kop }) {
    const [dari,      setDari]      = useState(filters.dari      ?? '');
    const [sampai,    setSampai]    = useState(filters.sampai    ?? '');
    const [rombelId,  setRombelId]  = useState(filters.rombel_id ?? '');
    const [q,         setQ]         = useState(filters.q         ?? '');
    const [selected,  setSelected]  = useState(new Set());
    const [expanded,  setExpanded]  = useState(new Set());

    const applyFilter = useCallback((nd, ns, nr, nq) => {
        router.get('/guru/absensi/riwayat', {
            dari:      nd || undefined,
            sampai:    ns || undefined,
            rombel_id: nr || undefined,
            q:         nq || undefined,
        }, { preserveState: true, replace: true });
        setSelected(new Set());
    }, []);

    const handleDari     = (v) => { setDari(v);     applyFilter(v, sampai, rombelId, q); };
    const handleSampai   = (v) => { setSampai(v);   applyFilter(dari, v, rombelId, q); };
    const handleRombel   = (v) => { setRombelId(v); applyFilter(dari, sampai, v, q); };
    const handleQ        = (v) => { setQ(v);        applyFilter(dari, sampai, rombelId, v); };
    const clearAll       = ()  => { setDari(''); setSampai(''); setRombelId(''); setQ(''); applyFilter('', '', '', ''); };

    const hasFilter = dari || sampai || rombelId || q;

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
    const toggleExpand = (id) => {
        setExpanded((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const selectedItems = riwayat.data.filter((j) => selected.has(j.id));

    return (
        <AppLayout title="Riwayat Presensi Siswa">
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="h-5 w-5 text-emerald-600" />
                            Riwayat Presensi Siswa
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Presensi siswa per sesi, sesuai jurnal mengajar {isAdmin ? 'semua guru' : 'Anda'}
                        </p>
                    </div>
                    <Link href="/guru/absensi"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Isi Presensi Hari Ini
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
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rombel</label>
                                <select value={rombelId} onChange={e => handleRombel(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="">Semua Rombel</option>
                                    {rombelList.map(r => (
                                        <option key={r.id} value={r.id}>{r.nama}</option>
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
                            <ClipboardList className="h-4 w-4 text-gray-400" />
                            {riwayat.total} Sesi
                            {hasFilter && <span className="text-xs font-normal text-emerald-500">(difilter)</span>}
                        </CardTitle>
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
                                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Tidak ada data{hasFilter ? ' sesuai filter' : ''}.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
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
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Mata Pelajaran / Kelas</th>
                                                {isAdmin && <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Guru</th>}
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Ringkasan</th>
                                                <th className="px-4 py-3 w-20"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {riwayat.data.map(item => {
                                                const mapelNama  = item.pembelajaran?.mata_pelajaran?.nama ?? '—';
                                                const rombelNama = item.pembelajaran?.rombel?.nama ?? '—';
                                                const guruNama   = namaLengkapGuru(item.pembelajaran?.guru, '—');
                                                const isChecked  = selected.has(item.id);
                                                const isOpen     = expanded.has(item.id);
                                                return (
                                                    <Fragment key={item.id}>
                                                        <tr
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
                                                                <p className="text-xs text-gray-400 font-normal">Pertemuan ke-{item.pertemuan_ke ?? '–'}</p>
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
                                                            <td className="px-4 py-3">
                                                                <RingkasanBadges ringkasan={item.ringkasan} />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1 justify-end">
                                                                    <button
                                                                        onClick={() => toggleExpand(item.id)}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 transition-colors"
                                                                        title="Lihat detail per siswa"
                                                                    >
                                                                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => doPrint([item], kop)}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-emerald-600 transition-colors"
                                                                        title="Cetak sesi ini"
                                                                    >
                                                                        <Printer className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {isOpen && (
                                                            <tr>
                                                                <td colSpan={isAdmin ? 6 : 5} className="px-6 pb-2 bg-gray-50/60 dark:bg-gray-900/30">
                                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2">
                                                                        <Users className="h-3.5 w-3.5" /> Detail per siswa
                                                                    </div>
                                                                    <DetailSiswaList item={item} />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {selected.size > 0 && (
                                    <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800 flex items-center gap-3 text-sm">
                                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">{selected.size} sesi dipilih</span>
                                        <button onClick={() => setSelected(new Set())} className="text-xs text-emerald-500 hover:text-emerald-700 underline">Batal pilih</button>
                                        <button
                                            onClick={() => doPrint(selectedItems, kop)}
                                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                        >
                                            <Printer className="h-3.5 w-3.5" /> Cetak {selected.size} Terpilih
                                        </button>
                                    </div>
                                )}

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
