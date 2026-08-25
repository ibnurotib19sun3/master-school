import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import { Select } from '@/Components/ui/Input';
import Badge from '@/Components/ui/Badge';
import { GraduationCap, TrendingUp, ClipboardList, FileSpreadsheet, Printer, X, ChevronLeft, CalendarRange, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

function PersenBar({ persen }) {
    const c    = persen >= 90 ? 'bg-emerald-500' : persen >= 75 ? 'bg-amber-500' : 'bg-red-500';
    const text = persen >= 90 ? 'text-emerald-600 dark:text-emerald-400'
               : persen >= 75 ? 'text-amber-600 dark:text-amber-400'
               : 'text-red-600 dark:text-red-400';
    return (
        <div className="flex items-center gap-2 min-w-22.5">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
            <span className={`text-xs font-bold w-9 text-right shrink-0 ${text}`}>{persen}%</span>
        </div>
    );
}

function TdkHadirBar({ persen }) {
    const c    = persen > 25 ? 'bg-red-500' : persen > 10 ? 'bg-amber-500' : 'bg-emerald-500';
    const text = persen > 25 ? 'text-red-600 dark:text-red-400' : persen > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
    return (
        <div className="flex items-center gap-2 min-w-22.5">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
            <span className={`text-xs font-bold w-9 text-right shrink-0 ${text}`}>{persen}%</span>
        </div>
    );
}

function fmtTgl(tgl) {
    if (!tgl) return '–';
    return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Kop surat ─────────────────────────────────────────── */
function KopSurat({ kop }) {
    const kontak = [
        kop?.telepon_kop ? `Telp: ${kop.telepon_kop}` : null,
        kop?.email_kop   ? `Email: ${kop.email_kop}`   : null,
        kop?.website_kop ? kop.website_kop              : null,
    ].filter(Boolean).join('  |  ');
    return (
        <div style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 8, borderBottom: '3px solid #111' }}>
                {kop?.logo_url
                    ? <img src={kop.logo_url} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', flexShrink: 0 }} />
                    : <div style={{ width: 70, height: 70, border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#aaa', flexShrink: 0 }}>LOGO</div>
                }
                <div style={{ flex: 1, textAlign: 'center' }}>
                    {kop?.yayasan_dinas && <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{kop.yayasan_dinas}</p>}
                    {kop?.nama_instansi && <p style={{ fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1.1, letterSpacing: 1, textTransform: 'uppercase' }}>{kop.nama_instansi}</p>}
                    {kop?.sub_nama && <p style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{kop.sub_nama}</p>}
                    {kop?.alamat_kop && <p style={{ fontSize: 8.5, color: '#555', marginTop: 2 }}>{kop.alamat_kop}</p>}
                    {kontak && <p style={{ fontSize: 8, color: '#777' }}>{kontak}</p>}
                </div>
            </div>
            <div style={{ height: 1.5, background: '#c8a951', marginBottom: 12 }} />
        </div>
    );
}

/* ── Print overlay ─────────────────────────────────────── */
function PrintOverlay({ target, period, rekap, kop, sekolah, onClose }) {
    const isAll = target === 'all';
    const rows  = isAll ? rekap : [target];

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 bg-white z-9999 overflow-auto print-overlay">
            <style>{`
                @media print {
                    body > * { visibility: hidden !important; }
                    .print-overlay { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; }
                    .print-overlay * { visibility: visible !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10 shadow-sm">
                <p className="text-sm font-medium text-gray-700">
                    {isAll ? `Preview Print — Semua Guru (${rekap.length})` : `Preview Print — ${target.nama}`}
                </p>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700">
                        <Printer className="h-4 w-4" /> Print
                    </button>
                    <button onClick={onClose} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">
                        <X className="h-4 w-4" /> Tutup
                    </button>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-8 py-6">
                {rows.map((r, idx) => (
                    <div key={r.id} className={idx < rows.length - 1 ? 'mb-10 pb-10 border-b-2 border-dashed border-gray-300' : ''}>
                        <KopSurat kop={kop} />
                        <div className="text-center mb-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Rekap Kehadiran Guru — Semester</p>
                            <h2 className="text-base font-bold text-gray-900">{period}</h2>
                        </div>
                        <table className="w-full text-sm mb-4 border border-gray-300">
                            <tbody>
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2 font-semibold text-gray-600 w-40 border border-gray-300">Nama Guru</td>
                                    <td className="px-4 py-2 font-bold text-gray-900 border border-gray-300">{r.nama}</td>
                                    <td className="px-4 py-2 font-semibold text-gray-600 w-32 border border-gray-300">NIP/NIPY</td>
                                    <td className="px-4 py-2 font-mono text-gray-700 border border-gray-300">{r.nip}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-600 mb-1">Rekap Jam Pembelajaran</p>
                        <table className="w-full text-sm mb-6 border border-gray-300">
                            <thead>
                                <tr className="bg-sky-50">
                                    <th className="px-4 py-2 text-center border border-gray-300">JP Terjadwal</th>
                                    <th className="px-4 py-2 text-center border border-gray-300">JP Hadir</th>
                                    <th className="px-4 py-2 text-center border border-gray-300">% Hadir</th>
                                    <th className="px-4 py-2 text-center border border-gray-300">JP Tdk Hadir</th>
                                    <th className="px-4 py-2 text-center border border-gray-300">% Tdk Hadir</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-center">
                                    <td className="px-4 py-2 font-bold text-gray-700 border border-gray-300">{r.jam_terjadwal}</td>
                                    <td className="px-4 py-2 font-bold text-sky-700 border border-gray-300">{r.jp_hadir}</td>
                                    <td className="px-4 py-2 font-bold text-gray-900 border border-gray-300">{r.persen_mengajar}%</td>
                                    <td className="px-4 py-2 font-bold text-red-700 border border-gray-300">{r.jp_tidak_hadir}</td>
                                    <td className="px-4 py-2 font-bold text-red-700 border border-gray-300">{r.persen_tidak_hadir}%</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="flex justify-between items-end mt-6">
                            <p className="text-xs text-gray-400">Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <div className="text-center text-sm text-gray-600">
                                <p>Mengetahui,</p>
                                <p>Kepala Sekolah</p>
                                <p className="mt-12 font-semibold underline">{sekolah?.kepala_sekolah_nama ?? '________________________________'}</p>
                                {sekolah?.nip_kepala && <p className="text-xs text-gray-500">NIP. {sekolah.nip_kepala}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main component ────────────────────────────────────── */
export default function KehadiranGuruSemester({ rekap, guru, tahunAjaran, tahunAjaranList, filters, kop, sekolah }) {
    const [selectedTaId, setSelectedTaId] = useState(String(tahunAjaran?.id ?? ''));
    const [guruId, setGuruId]             = useState(filters?.guru_id ?? '');
    const [printTarget, setPrintTarget]   = useState(null);

    const applyFilter = (taId, gId) => {
        router.get('/admin/laporan/kehadiran-guru/semester', { tahun_ajaran_id: taId, guru_id: gId }, { preserveState: true, replace: true });
    };

    const totalGuru    = rekap.length;
    const rataHadir    = totalGuru > 0 ? Math.round(rekap.reduce((s, r) => s + r.persen_mengajar, 0) / totalGuru) : 0;
    const rataTdkHadir = totalGuru > 0 ? Math.round(rekap.reduce((s, r) => s + r.persen_tidak_hadir, 0) / totalGuru) : 0;

    const smtLabel = tahunAjaran
        ? `Semester ${tahunAjaran.semester} — ${tahunAjaran.nama}`
        : 'Tidak ada data';

    const periodLabel = tahunAjaran
        ? `${smtLabel} (${fmtTgl(tahunAjaran.tanggal_mulai)} – ${fmtTgl(tahunAjaran.tanggal_selesai)})`
        : '–';

    const exportUrl = `/admin/laporan/kehadiran-guru/semester/export?tahun_ajaran_id=${selectedTaId}&guru_id=${guruId}`;

    return (
        <AppLayout title="Rekap Kehadiran Guru — Semester">
            {printTarget && (
                <PrintOverlay
                    target={printTarget}
                    period={periodLabel}
                    rekap={rekap}
                    kop={kop}
                    sekolah={sekolah}
                    onClose={() => setPrintTarget(null)}
                />
            )}

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarRange className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Rekap Kehadiran Guru</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Per Semester · Berbasis Jam Pelajaran (JP)</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                        href="/admin/laporan/kehadiran-guru"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" /> Rekap Bulanan
                    </a>
                    <button
                        onClick={() => setPrintTarget('all')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Printer className="h-4 w-4" /> Print
                    </button>
                    <a
                        href={exportUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                        <FileSpreadsheet className="h-4 w-4" /> Export Excel
                    </a>
                </div>
            </div>

            {/* Filter bar */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex flex-wrap items-end gap-3 mb-4">
                <Select
                    label="Tahun Ajaran / Semester"
                    value={selectedTaId}
                    onChange={(e) => { setSelectedTaId(e.target.value); applyFilter(e.target.value, guruId); }}
                    className="w-60"
                >
                    {tahunAjaranList.map((ta) => (
                        <option key={ta.id} value={ta.id}>
                            Smt {ta.semester} — {ta.nama}{ta.is_aktif ? ' ★' : ''}
                        </option>
                    ))}
                </Select>
                <Select
                    label="Filter Guru"
                    value={guruId}
                    onChange={(e) => { setGuruId(e.target.value); applyFilter(selectedTaId, e.target.value); }}
                    className="w-52"
                >
                    <option value="">Semua Guru</option>
                    {guru.map((g) => <option key={g.id} value={g.id}>{g.user?.name ?? '-'}</option>)}
                </Select>
                {tahunAjaran && (
                    <div className="ml-auto flex items-center gap-2 self-end pb-0.5">
                        <BookOpen className="h-4 w-4 text-sky-500 shrink-0" />
                        <span className="text-sm font-medium text-sky-700 dark:text-sky-300">{periodLabel}</span>
                    </div>
                )}
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                    { label: 'Total Guru', value: totalGuru, icon: GraduationCap, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-100 dark:border-sky-800' },
                    { label: 'Rata-rata % Hadir', value: `${rataHadir}%`, icon: TrendingUp,
                      color: rataHadir >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                      bg: rataHadir >= 90 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30',
                      border: rataHadir >= 90 ? 'border-emerald-100 dark:border-emerald-800' : 'border-amber-100 dark:border-amber-800' },
                    { label: 'Rata-rata % Tdk Hadir', value: `${rataTdkHadir}%`, icon: ClipboardList,
                      color: rataTdkHadir <= 10 ? 'text-emerald-600 dark:text-emerald-400' : rataTdkHadir <= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
                      bg: rataTdkHadir <= 10 ? 'bg-emerald-50 dark:bg-emerald-900/30' : rataTdkHadir <= 25 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-red-50 dark:bg-red-900/30',
                      border: rataTdkHadir <= 10 ? 'border-emerald-100 dark:border-emerald-800' : rataTdkHadir <= 25 ? 'border-amber-100 dark:border-amber-800' : 'border-red-100 dark:border-red-800' },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-4 border flex items-center gap-3 ${s.bg} ${s.border}`}>
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-white/70 dark:bg-gray-800/70 shadow-sm shrink-0">
                            <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{s.label}</p>
                            <p className={`text-xl font-black leading-tight ${s.color}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabel */}
            <Card>
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarRange className="h-4 w-4 text-sky-500" />
                        {smtLabel}
                    </CardTitle>
                </CardHeader>
                <CardBody className="p-0">
                    {/* Mobile */}
                    <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {rekap.length === 0 && (
                            <p className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data absensi untuk semester ini.</p>
                        )}
                        {rekap.map((r) => (
                            <div key={r.id} className="px-4 py-3.5">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{r.nama}</p>
                                        {r.nip && <p className="text-[11px] text-gray-400 font-mono">{r.nip}</p>}
                                    </div>
                                    <button onClick={() => setPrintTarget(r)} className="text-gray-400 hover:text-sky-600 p-1 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                                        <Printer className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                {/* JP row */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md px-2 py-0.5 font-medium">
                                        Terjadwal <span className="font-bold">{r.jam_terjadwal} JP</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-md px-2 py-0.5 font-medium">
                                        Hadir <span className="font-bold">{r.jp_hadir} JP</span>
                                    </span>
                                    {r.jp_tidak_hadir > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[11px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md px-2 py-0.5 font-medium">
                                            Tdk Hadir <span className="font-bold">{r.jp_tidak_hadir} JP</span>
                                        </span>
                                    )}
                                </div>
                                {/* S/I/A */}
                                <div className="flex gap-3 text-xs text-gray-500 mb-2.5">
                                    <span>S: <span className="font-semibold text-blue-600 dark:text-blue-400">{r.jp_sakit}</span></span>
                                    <span>I: <span className="font-semibold text-amber-600 dark:text-amber-400">{r.jp_izin}</span></span>
                                    <span>A: <span className="font-semibold text-red-600 dark:text-red-400">{r.jp_alpha}</span></span>
                                </div>
                                {/* bars */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="w-20 text-gray-400 shrink-0">% Hadir</span>
                                        <PersenBar persen={r.persen_mengajar} />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="w-20 text-gray-400 shrink-0">% Tdk Hadir</span>
                                        <TdkHadirBar persen={r.persen_tidak_hadir} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop */}
                    <div className="overflow-x-auto hidden sm:block">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase">
                                {/* Group header row */}
                                <tr className="bg-gray-100 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
                                    <th rowSpan={2} className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 align-middle">Nama Guru</th>
                                    <th rowSpan={2} className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 align-middle">NIP/NIPY</th>
                                    <th rowSpan={2} className="px-4 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 align-middle">JP Terjadwal</th>
                                    <th colSpan={5} className="px-4 py-1.5 text-center font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 bg-sky-50/60 dark:bg-sky-950/20">
                                        Kehadiran
                                    </th>
                                    <th colSpan={2} className="px-4 py-1.5 text-center font-semibold text-red-500 dark:text-red-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 bg-red-50/60 dark:bg-red-950/10">
                                        Tidak Hadir
                                    </th>
                                    <th rowSpan={2} className="px-4 py-2 text-center font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap align-middle">Print</th>
                                </tr>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-3 py-2 text-center font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap bg-sky-50/60 dark:bg-sky-950/20">JP Hadir</th>
                                    <th className="px-3 py-2 text-center font-medium text-blue-500 whitespace-nowrap bg-sky-50/40 dark:bg-sky-950/10">S</th>
                                    <th className="px-3 py-2 text-center font-medium text-amber-500 whitespace-nowrap bg-sky-50/40 dark:bg-sky-950/10">I</th>
                                    <th className="px-3 py-2 text-center font-medium text-red-500 whitespace-nowrap bg-sky-50/40 dark:bg-sky-950/10">A</th>
                                    <th className="px-3 py-2 text-center font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 bg-sky-50/60 dark:bg-sky-950/20 min-w-27.5">% Hadir</th>
                                    <th className="px-3 py-2 text-center font-semibold text-red-500 dark:text-red-400 whitespace-nowrap bg-red-50/60 dark:bg-red-950/10">JP</th>
                                    <th className="px-3 py-2 text-center font-semibold text-red-500 dark:text-red-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 bg-red-50/60 dark:bg-red-950/10 min-w-27.5">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rekap.length === 0 ? (
                                    <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data absensi untuk semester ini.</td></tr>
                                ) : (
                                    rekap.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap border-r border-gray-100 dark:border-gray-800">{r.nama}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-800">{r.nip || '—'}</td>
                                            <td className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-800">
                                                <span className="inline-flex items-center justify-center min-w-10 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold">{r.jam_terjadwal}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center bg-sky-50/40 dark:bg-sky-950/10">
                                                <Badge color="sky">{r.jp_hadir}</Badge>
                                            </td>
                                            <td className="px-3 py-3 text-center bg-sky-50/30 dark:bg-sky-950/5"><Badge color="blue">{r.jp_sakit}</Badge></td>
                                            <td className="px-3 py-3 text-center bg-sky-50/30 dark:bg-sky-950/5"><Badge color="yellow">{r.jp_izin}</Badge></td>
                                            <td className="px-3 py-3 text-center bg-sky-50/30 dark:bg-sky-950/5"><Badge color={r.jp_alpha > 0 ? 'red' : 'gray'}>{r.jp_alpha}</Badge></td>
                                            <td className="px-3 py-3 bg-sky-50/40 dark:bg-sky-950/10 border-r border-gray-100 dark:border-gray-800">
                                                <PersenBar persen={r.persen_mengajar} />
                                            </td>
                                            <td className="px-3 py-3 text-center bg-red-50/40 dark:bg-red-950/5">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <Badge color={r.jp_tidak_hadir > 0 ? 'red' : 'gray'}>{r.jp_tidak_hadir}</Badge>
                                                    {r.jp_tidak_hadir > 0 && (
                                                        <span className="text-[10px] text-gray-400">S:{r.jp_sakit}/I:{r.jp_izin}/A:{r.jp_alpha}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 bg-red-50/40 dark:bg-red-950/5 border-r border-gray-100 dark:border-gray-800">
                                                <TdkHadirBar persen={r.persen_tidak_hadir} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setPrintTarget(r)}
                                                    title="Print rekap guru ini"
                                                    className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </AppLayout>
    );
}
