import AppLayout from '@/Layouts/AppLayout';
import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, BookOpen, Users, Inbox, CheckCircle2, Printer, Download, FileText } from 'lucide-react';

const HARI_COLOR = {
    Senin:  { bg: 'bg-sky-50 dark:bg-sky-950/30',   border: 'border-sky-200 dark:border-sky-800',   badge: 'bg-sky-600',  text: 'text-sky-700 dark:text-sky-300',   dot: 'bg-sky-500',  ring: 'ring-sky-500/30'  },
    Selasa: { bg: 'bg-sky-50 dark:bg-sky-950/30',        border: 'border-sky-200 dark:border-sky-800',        badge: 'bg-sky-600',    text: 'text-sky-700 dark:text-sky-300',        dot: 'bg-sky-500',    ring: 'ring-sky-500/30'    },
    Rabu:   { bg: 'bg-emerald-50 dark:bg-emerald-950/30',  border: 'border-emerald-200 dark:border-emerald-800',  badge: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300',  dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
    Kamis:  { bg: 'bg-amber-50 dark:bg-amber-950/30',      border: 'border-amber-200 dark:border-amber-800',      badge: 'bg-amber-600',   text: 'text-amber-700 dark:text-amber-300',      dot: 'bg-amber-500',   ring: 'ring-amber-500/30'   },
    Jumat:  { bg: 'bg-purple-50 dark:bg-purple-950/30',    border: 'border-purple-200 dark:border-purple-800',    badge: 'bg-purple-600',  text: 'text-purple-700 dark:text-purple-300',    dot: 'bg-purple-500',  ring: 'ring-purple-500/30'  },
    Sabtu:  { bg: 'bg-rose-50 dark:bg-rose-950/30',        border: 'border-rose-200 dark:border-rose-800',        badge: 'bg-rose-600',    text: 'text-rose-700 dark:text-rose-300',        dot: 'bg-rose-500',    ring: 'ring-rose-500/30'    },
    Ahad:   { bg: 'bg-orange-50 dark:bg-orange-950/30',    border: 'border-orange-200 dark:border-orange-800',    badge: 'bg-orange-600',  text: 'text-orange-700 dark:text-orange-300',    dot: 'bg-orange-500',  ring: 'ring-orange-500/30'  },
};

function JadwalCard({ item, hari }) {
    const c = HARI_COLOR[hari] ?? HARI_COLOR.Senin;
    return (
        <div className={`relative flex gap-3 rounded-2xl border ${c.border} ${c.bg} p-4 transition-all hover:shadow-md`}>
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${c.dot}`} />

            {/* Time column */}
            <div className="pl-3 shrink-0 flex flex-col items-center justify-center min-w-16 text-center gap-1">
                <span className={`text-xs font-bold ${c.text}`}>{item.jam_mulai ?? '—'}</span>
                {item.jam_selesai && (
                    <span className="text-[10px] text-gray-400 leading-none">–{item.jam_selesai}</span>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${c.badge}`}>
                    JP {item.jam_ke}
                </span>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-300 dark:bg-gray-600 opacity-40 self-stretch" />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                    <BookOpen className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${c.text}`} />
                    <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
                        {item.mata_pelajaran ?? '—'}
                    </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {item.kode_mapel && (
                        <span className="font-mono text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {item.kode_mapel}
                        </span>
                    )}
                    {item.rombel && (
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.rombel}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail button */}
            {item.pembelajaran_id && (
                <div className="shrink-0 flex items-center">
                    <Link
                        href={`/guru/jadwal-saya/detail/${item.pembelajaran_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Detail
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function JadwalSayaIndex({ jadwal, hariAktif, hariIni, tahunAktif, sekolah = {} }) {
    const { auth } = usePage().props;
    const namaGuru = auth?.user?.nama_lengkap ?? auth?.user?.name ?? '';

    const [selectedHari, setSelectedHari] = useState(hariIni);

    const byHari   = Object.fromEntries(hariAktif.map((h) => [h, jadwal.filter((j) => j.hari === h)]));
    const totalJP  = jadwal.length;
    const hariDgJP = hariAktif.filter((h) => (byHari[h]?.length ?? 0) > 0).length;
    const todayJP  = byHari[hariIni]?.length ?? 0;
    const list     = byHari[selectedHari] ?? [];
    const todayC   = HARI_COLOR[hariIni] ?? HARI_COLOR.Senin;

    const exportExcel = () => {
        const header = `<tr style="background:#4f46e5;color:white;font-weight:bold">
            <th>Hari</th><th>JP</th><th>Jam</th>
            <th>Mata Pelajaran</th><th>Kode</th><th>Kelas / Rombel</th>
        </tr>`;
        const rows = hariAktif.flatMap((hari) =>
            (byHari[hari] ?? []).map((item) => `<tr>
                <td>${hari}</td>
                <td>${item.jam_ke}</td>
                <td>${item.jam_mulai ?? ''} – ${item.jam_selesai ?? ''}</td>
                <td>${item.mata_pelajaran ?? ''}</td>
                <td>${item.kode_mapel ?? ''}</td>
                <td>${item.rombel ?? ''}</td>
            </tr>`)
        ).join('');

        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"></head>
            <body>
                <h2>Jadwal Mengajar${namaGuru ? ' — ' + namaGuru : ''}</h2>
                <p>Tahun Ajaran: ${tahunAktif ?? '–'}</p>
                <table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt">
                    <thead>${header}</thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
        </html>`;

        const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `jadwal-saya-${new Date().toISOString().slice(0, 10)}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => window.print();

    return (
        <AppLayout title="Jadwal Saya">
            {/* Print styles — diinjeksi ke dokumen, #app disembunyikan agar header/footer tidak buat halaman ekstra */}
            <style>{`
                @media print {
                    @page { margin: 10mm 12mm; size: A4 portrait; }
                    #app { display: none !important; }
                    .jadwal-print-area {
                        display: block !important;
                        background: white;
                        font-family: Arial, sans-serif;
                        font-size: 9.5pt;
                        color: #111;
                    }
                    .jadwal-print-area table { page-break-inside: auto; }
                    .jadwal-print-area tr    { page-break-inside: avoid; }
                }
            `}</style>

            {/* Print-only area — Portal ke body agar tidak di dalam #app */}
            {createPortal(
              <div className="jadwal-print-area" style={{ display: 'none' }}>

                {/* ── Kop Surat ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 10, borderBottom: '3px solid #4f46e5', marginBottom: 14 }}>
                    {sekolah.logo_url && (
                        <img src={sekolah.logo_url} alt="Logo"
                            style={{ height: 70, width: 70, objectFit: 'contain', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                        {sekolah.yayasan_dinas && (
                            <div style={{ fontSize: 8.5, color: '#555', marginBottom: 1 }}>{sekolah.yayasan_dinas}</div>
                        )}
                        <div style={{ fontSize: 15, fontWeight: 'bold', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                            {sekolah.nama ?? 'Nama Sekolah'}
                        </div>
                        <div style={{ fontSize: 8.5, color: '#444', marginTop: 3, lineHeight: 1.5 }}>
                            {[sekolah.alamat, sekolah.kota].filter(Boolean).join(', ')}
                            {sekolah.telepon && <span> &nbsp;·&nbsp; Telp: {sekolah.telepon}</span>}
                            {sekolah.website && <span> &nbsp;·&nbsp; {sekolah.website}</span>}
                        </div>
                        {sekolah.npsn && (
                            <div style={{ fontSize: 8, color: '#888', marginTop: 1 }}>NPSN: {sekolah.npsn}</div>
                        )}
                    </div>
                </div>

                {/* ── Judul ── */}
                <div style={{ textAlign: 'center', margin: '10px 0 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        Jadwal Mengajar
                    </div>
                    <div style={{ fontSize: 8.5, color: '#555', marginTop: 5, display: 'flex', justifyContent: 'center', gap: 24 }}>
                        <span><strong>Nama</strong>&nbsp;: {namaGuru || '–'}</span>
                        <span><strong>Tahun Ajaran</strong>&nbsp;: {tahunAktif || '–'}</span>
                    </div>
                </div>

                {/* ── Tabel Jadwal ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                    <thead>
                        <tr style={{ background: '#4f46e5', color: 'white' }}>
                            {[
                                { label: 'No',              w: '4%',  align: 'center' },
                                { label: 'JP',              w: '5%',  align: 'center' },
                                { label: 'Jam',             w: '13%', align: 'center' },
                                { label: 'Mata Pelajaran',  w: '38%', align: 'left'   },
                                { label: 'Kode',            w: '10%', align: 'center' },
                                { label: 'Kelas / Rombel',  w: '30%', align: 'left'   },
                            ].map(({ label, w, align }) => (
                                <th key={label} style={{
                                    padding: '5px 7px', border: '1px solid #818cf8',
                                    textAlign: align, width: w, fontWeight: 'bold', fontSize: 9,
                                }}>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let no = 0;
                            return hariAktif.flatMap((hari) => {
                                const items = byHari[hari] ?? [];
                                if (items.length === 0) return [];
                                return [
                                    // Baris subheader hari
                                    <tr key={`h-${hari}`} style={{ background: '#eef2ff' }}>
                                        <td colSpan={6} style={{
                                            padding: '3px 8px', border: '1px solid #c7d2fe',
                                            fontWeight: 'bold', fontSize: 8.5, color: '#3730a3',
                                            letterSpacing: '0.5px', textTransform: 'uppercase',
                                        }}>{hari}</td>
                                    </tr>,
                                    // Baris data
                                    ...items.map((item, idx) => (
                                        <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                            <td style={{ padding: '4px 7px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#888', fontSize: 8 }}>{++no}</td>
                                            <td style={{ padding: '4px 7px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{item.jam_ke}</td>
                                            <td style={{ padding: '4px 7px', border: '1px solid #e2e8f0', textAlign: 'center', fontFamily: 'Courier New, monospace', fontSize: 8.5 }}>
                                                {item.jam_mulai ?? '–'} – {item.jam_selesai ?? '–'}
                                            </td>
                                            <td style={{ padding: '4px 7px', border: '1px solid #e2e8f0', fontWeight: 500 }}>{item.mata_pelajaran ?? '–'}</td>
                                            <td style={{ padding: '4px 7px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#6366f1', fontFamily: 'Courier New, monospace', fontSize: 8 }}>
                                                {item.kode_mapel ?? '–'}
                                            </td>
                                            <td style={{ padding: '4px 7px', border: '1px solid #e2e8f0' }}>{item.rombel ?? '–'}</td>
                                        </tr>
                                    )),
                                ];
                            });
                        })()}
                        {jadwal.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: '#999', fontStyle: 'italic' }}>Tidak ada jadwal</td></tr>
                        )}
                    </tbody>
                </table>

                {/* ── Total & TTD ── */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 8.5 }}>
                    <div style={{ color: '#555' }}>
                        Total: <strong>{totalJP} JP</strong> per minggu &nbsp;|&nbsp;
                        Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {sekolah.kepala && (
                        <div style={{ textAlign: 'center', minWidth: 180 }}>
                            <div>Mengetahui,</div>
                            <div style={{ fontWeight: 'bold' }}>Kepala Sekolah</div>
                            <div style={{ height: 44 }} />
                            <div style={{ fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: 3 }}>
                                {sekolah.kepala}
                            </div>
                            {sekolah.nip_kepala && (
                                <div style={{ fontSize: 8, color: '#555' }}>NIP. {sekolah.nip_kepala}</div>
                            )}
                        </div>
                    )}
                </div>

            </div>,
              document.body
            )}

            <div className="space-y-6">

                {/* Page header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-sky-600" /> Jadwal Saya
                        </h1>
                        {tahunAktif && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tahunAktif}</p>
                        )}
                    </div>
                    {jadwal.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={exportExcel}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                                <Download className="h-3.5 w-3.5" /> Excel
                            </button>
                            <button onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <Printer className="h-3.5 w-3.5" /> Print
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats grid — 2 col on mobile, 3 col on sm+ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="h-4 w-4 text-sky-500" />
                            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">Total JP</span>
                        </div>
                        <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 tabular-nums">{totalJP}</p>
                        <p className="text-xs text-sky-500/70 mt-0.5">jam per minggu</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Hari Aktif</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{hariDgJP}</p>
                        <p className="text-xs text-emerald-500/70 mt-0.5">hari mengajar</p>
                    </div>

                    <div className={`col-span-2 sm:col-span-1 rounded-2xl border p-4 ${
                        todayJP > 0
                            ? `${todayC.border} ${todayC.bg}`
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
                    }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className={`h-4 w-4 ${todayJP > 0 ? todayC.text : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${todayJP > 0 ? todayC.text : 'text-gray-500 dark:text-gray-400'}`}>
                                Hari Ini
                            </span>
                        </div>
                        <p className={`text-2xl font-bold tabular-nums ${todayJP > 0 ? todayC.text : 'text-gray-500 dark:text-gray-400'}`}>
                            {todayJP}
                        </p>
                        <p className={`text-xs mt-0.5 ${todayJP > 0 ? `${todayC.text} opacity-70` : 'text-gray-400 dark:text-gray-500'}`}>
                            {todayJP > 0 ? `JP ${hariIni}` : 'Tidak ada jadwal'}
                        </p>
                    </div>
                </div>

                {/* Day tabs — horizontally scrollable on mobile */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-x-visible">
                    <div className="flex gap-2 pt-1 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
                        {hariAktif.map((hari) => {
                            const c       = HARI_COLOR[hari] ?? HARI_COLOR.Senin;
                            const count   = byHari[hari]?.length ?? 0;
                            const active  = selectedHari === hari;
                            const isToday = hariIni === hari;
                            return (
                                <button key={hari} onClick={() => setSelectedHari(hari)}
                                    className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap
                                        ${active
                                            ? `${c.badge} text-white shadow-md ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 ${c.ring}`
                                            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}>
                                    {hari}
                                    {count > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center
                                            ${active ? 'bg-white/30 text-white' : `${c.badge} text-white`}`}>
                                            {count}
                                        </span>
                                    )}
                                    {isToday && !active && (
                                        <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-950 ${c.dot}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main content — jadwal list + weekly sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Jadwal list */}
                    <div className="lg:col-span-2">
                        {list.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-5">
                                    <Inbox className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tidak ada jadwal hari {selectedHari}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {list.map((item) => (
                                    <JadwalCard key={item.id} item={item} hari={selectedHari} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Weekly summary sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                                Ringkasan Mingguan
                            </p>
                            <div className="space-y-1">
                                {hariAktif.map((hari) => {
                                    const c          = HARI_COLOR[hari] ?? HARI_COLOR.Senin;
                                    const count      = byHari[hari]?.length ?? 0;
                                    const isToday    = hariIni === hari;
                                    const isSelected = selectedHari === hari;
                                    return (
                                        <button key={hari}
                                            onClick={() => setSelectedHari(hari)}
                                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition-all text-left
                                                ${isSelected
                                                    ? `${c.bg} border ${c.border}`
                                                    : 'hover:bg-gray-50 dark:hover:bg-white/4'
                                                }`}>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${count > 0 ? c.dot : 'bg-gray-200 dark:bg-gray-700'}`} />
                                                <span className={`text-sm font-medium truncate ${isToday ? c.text : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {hari}
                                                </span>
                                                {isToday && (
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${c.badge} text-white`}>
                                                        hari ini
                                                    </span>
                                                )}
                                            </div>
                                            {count > 0 ? (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${c.badge}`}>
                                                    {count} JP
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 shrink-0">—</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/6 flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total semua hari</span>
                                <span className="text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                                    {totalJP} JP
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
