import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import { Select } from '@/Components/ui/Input';
import Badge from '@/Components/ui/Badge';
import { GraduationCap, TrendingUp, ClipboardList, FileSpreadsheet, Printer, X, CalendarRange, Search, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const BULAN = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

const statusColor = { Hadir: 'green', Sakit: 'blue', Izin: 'yellow', Alpha: 'red' };

function PersenBar({ persen, color }) {
    const c = color ?? (persen >= 90 ? 'bg-emerald-500' : persen >= 75 ? 'bg-amber-500' : 'bg-red-500');
    const text = color
        ? 'text-gray-600 dark:text-gray-400'
        : persen >= 90 ? 'text-emerald-600 dark:text-emerald-400'
        : persen >= 75 ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
    return (
        <div className="flex items-center gap-2 min-w-25">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(persen, 100)}%` }} />
            </div>
            <span className={`text-xs font-semibold w-10 text-right shrink-0 ${text}`}>{persen}%</span>
        </div>
    );
}

/* ── Kop surat (print header) ──────────────────────────── */
function KopSurat({ kop }) {
    const kontak = [
        kop?.telepon_kop ? `Telp: ${kop.telepon_kop}` : null,
        kop?.email_kop   ? `Email: ${kop.email_kop}`   : null,
        kop?.website_kop ? kop.website_kop              : null,
    ].filter(Boolean).join('  |  ');

    return (
        <div style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 8, borderBottom: '3px solid #111' }}>
                {kop?.logo_url ? (
                    <img src={kop.logo_url} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', flexShrink: 0 }} />
                ) : (
                    <div style={{ width: 70, height: 70, border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#aaa', flexShrink: 0 }}>LOGO</div>
                )}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    {kop?.yayasan_dinas && (
                        <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{kop.yayasan_dinas}</p>
                    )}
                    {kop?.nama_instansi && (
                        <p style={{ fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1.1, letterSpacing: 1, textTransform: 'uppercase' }}>{kop.nama_instansi}</p>
                    )}
                    {kop?.sub_nama && (
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{kop.sub_nama}</p>
                    )}
                    {kop?.alamat_kop && (
                        <p style={{ fontSize: 8.5, color: '#555', marginTop: 2 }}>{kop.alamat_kop}</p>
                    )}
                    {kontak && (
                        <p style={{ fontSize: 8, color: '#777' }}>{kontak}</p>
                    )}
                </div>
            </div>
            <div style={{ height: 1.5, background: '#c8a951', marginBottom: 12 }} />
        </div>
    );
}

/* ── Print overlay ─────────────────────────────────────── */
function PrintOverlay({ target, period, rekap, kop, sekolah, onClose }) {
    const isAll   = target === 'all';
    const rows    = isAll ? rekap : [target];
    const [perPage, setPerPage] = useState(rows.length === 1 ? 1 : 2);

    // Kelompokkan baris sesuai pilihan perPage
    const pages = [];
    for (let i = 0; i < rows.length; i += perPage) pages.push(rows.slice(i, i + perPage));

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 bg-white z-9999 overflow-auto print-overlay">
            <style>{`
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body > * { visibility: hidden !important; }
                    .print-overlay { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; overflow: visible !important; height: auto !important; }
                    .print-overlay * { visibility: visible !important; }
                    .no-print { display: none !important; }
                    .print-page-break { page-break-after: always; }
                }
            `}</style>

            {/* Toolbar — hanya tampil di layar */}
            <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10 shadow-sm">
                <p className="text-sm font-medium text-gray-700">
                    {isAll ? `Preview Print — Semua Guru (${rekap.length})` : `Preview Print — ${target.nama}`}
                </p>
                <div className="flex items-center gap-3">
                    {/* Toggle jumlah per halaman */}
                    {rows.length > 1 && (
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                            <span className="text-xs text-gray-500 px-2">Per halaman:</span>
                            {[1, 2].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setPerPage(n)}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${perPage === n ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                    >
                        <Printer className="h-4 w-4" /> Print
                    </button>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
                    >
                        <X className="h-4 w-4" /> Tutup
                    </button>
                </div>
            </div>

            {/* Konten cetak */}
            <div className="max-w-4xl mx-auto px-8 py-6">
                {pages.map((page, pageIdx) => (
                    <div key={pageIdx} className={pageIdx < pages.length - 1 ? 'print-page-break mb-14 pb-14 border-b-2 border-dashed border-gray-200' : ''}>

                        {/* Rekap tiap guru — masing-masing punya kop + TTD */}
                        {page.map((r, idx) => (
                            <div key={r.id} className={idx === 0 && page.length > 1 ? 'mb-4 pb-4 border-b-2 border-dashed border-gray-300' : ''}>
                                {/* Kop surat per guru */}
                                <KopSurat kop={kop} />

                                {/* Judul */}
                                <div className="text-center mb-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Rekap Kehadiran Guru</p>
                                    <h2 className="text-lg font-bold text-gray-900">Periode: {period}</h2>
                                </div>
                                {/* Info guru */}
                                <table className="w-full text-sm mb-2 border border-gray-300">
                                    <tbody>
                                        <tr style={{ backgroundColor: '#F9FAFB' }}>
                                            <td style={{ padding: '6px 12px', fontWeight: 600, color: '#4B5563', width: 140, border: '1px solid #D1D5DB' }}>Nama Guru</td>
                                            <td style={{ padding: '6px 12px', fontWeight: 700, color: '#111827', border: '1px solid #D1D5DB' }}>{r.nama}</td>
                                            <td style={{ padding: '6px 12px', fontWeight: 600, color: '#4B5563', width: 110, border: '1px solid #D1D5DB' }}>NIP/NIPY</td>
                                            <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: '#374151', border: '1px solid #D1D5DB' }}>{r.nip}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Rekap Jam Pembelajaran */}
                                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284C7', marginBottom: 4 }}>Rekap Jam Pembelajaran</p>
                                <table className="w-full text-sm border border-gray-300" style={{ marginBottom: 8 }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#E0F2FE' }}>
                                            <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: '#111', border: '1px solid #D1D5DB' }}>JP Terjadwal</th>
                                            <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: '#111', border: '1px solid #D1D5DB' }}>JP Hadir</th>
                                            <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: '#111', border: '1px solid #D1D5DB' }}>% Hadir</th>
                                            <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: '#111', border: '1px solid #D1D5DB' }}>JP Tdk Hadir</th>
                                            <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: '#111', border: '1px solid #D1D5DB' }}>% Tdk Hadir</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ textAlign: 'center' }}>
                                            <td style={{ padding: '6px 12px', fontWeight: 700, color: '#374151', border: '1px solid #D1D5DB' }}>{r.jam_terjadwal}</td>
                                            <td style={{ padding: '6px 12px', fontWeight: 700, color: '#0369A1', border: '1px solid #D1D5DB' }}>{r.jp_hadir}</td>
                                            <td style={{ padding: '6px 12px', fontWeight: 700, color: '#111827', border: '1px solid #D1D5DB' }}>{r.persen_mengajar}%</td>
                                            <td style={{ padding: '6px 12px', fontWeight: 700, color: '#B91C1C', border: '1px solid #D1D5DB' }}>{r.jp_tidak_hadir}</td>
                                            <td style={{ padding: '6px 12px', fontWeight: 700, color: '#B91C1C', border: '1px solid #D1D5DB' }}>{r.persen_tidak_hadir}%</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* TTD per guru */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <div style={{ textAlign: 'center', fontSize: 13, color: '#4B5563' }}>
                                        <p>Mengetahui,</p>
                                        <p>Kepala Sekolah</p>
                                        <p style={{ marginTop: 40, fontWeight: 600, textDecoration: 'underline' }}>{sekolah?.kepala_sekolah_nama ?? '________________________________'}</p>
                                        {sekolah?.nip_kepala && <p style={{ fontSize: 11, color: '#6B7280' }}>NIP/NIPY. {sekolah.nip_kepala}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Tabel rekap (dipakai di halaman ini) ─────────────── */
function RekapTable({ rekap, onPrint }) {
    return (
        <div className="overflow-x-auto hidden sm:block">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Nama Guru</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">NIP/NIPY</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap">JP Terjadwal</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap bg-sky-50/60 dark:bg-sky-950/20">JP Hadir</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap">S</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap">I</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap">A</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap bg-sky-50/60 dark:bg-sky-950/20">% Hadir</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap bg-red-50/60 dark:bg-red-950/10">JP Tdk Hadir</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap bg-red-50/60 dark:bg-red-950/10">% Tdk Hadir</th>
                        <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Print</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rekap.length === 0 ? (
                        <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data absensi untuk periode ini.</td></tr>
                    ) : (
                        rekap.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{r.nama}</td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.nip}</td>
                                <td className="px-4 py-3 text-center">
                                    <Badge color="gray">{r.jam_terjadwal}</Badge>
                                </td>
                                <td className="px-4 py-3 text-center bg-sky-50/40 dark:bg-sky-950/10">
                                    <Badge color="sky">{r.jp_hadir}</Badge>
                                </td>
                                <td className="px-4 py-3 text-center"><Badge color="blue">{r.jp_sakit}</Badge></td>
                                <td className="px-4 py-3 text-center"><Badge color="yellow">{r.jp_izin}</Badge></td>
                                <td className="px-4 py-3 text-center"><Badge color={r.jp_alpha > 0 ? 'red' : 'gray'}>{r.jp_alpha}</Badge></td>
                                <td className="px-4 py-3 min-w-30 bg-sky-50/40 dark:bg-sky-950/10"><PersenBar persen={r.persen_mengajar} /></td>
                                <td className="px-4 py-3 text-center bg-red-50/40 dark:bg-red-950/5">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Badge color={r.jp_tidak_hadir > 0 ? 'red' : 'gray'}>{r.jp_tidak_hadir}</Badge>
                                        {r.jp_tidak_hadir > 0 && <span className="text-[10px] text-gray-400">S:{r.jp_sakit}/I:{r.jp_izin}/A:{r.jp_alpha}</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 min-w-30 bg-red-50/40 dark:bg-red-950/5">
                                    <div className="flex items-center gap-2 min-w-25">
                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${r.persen_tidak_hadir > 25 ? 'bg-red-500' : r.persen_tidak_hadir > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(r.persen_tidak_hadir, 100)}%` }} />
                                        </div>
                                        <span className={`text-xs font-semibold w-10 text-right shrink-0 ${r.persen_tidak_hadir > 25 ? 'text-red-600 dark:text-red-400' : r.persen_tidak_hadir > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{r.persen_tidak_hadir}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onPrint(r)}
                                        title="Print rekap guru ini"
                                        className="rounded-lg p-1.5 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
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
    );
}

function GuruSearchSelect({ guru, value, onChange }) {
    const [open, setOpen]     = useState(false);
    const [query, setQuery]   = useState('');
    const ref                 = useRef(null);
    const inputRef            = useRef(null);

    const selected = guru.find((g) => String(g.id) === String(value));
    const label    = selected ? (selected.user?.name ?? '-') : 'Semua Guru';

    const filtered = query
        ? guru.filter((g) => (g.user?.name ?? '').toLowerCase().includes(query.toLowerCase()))
        : guru;

    const pick = useCallback((id) => {
        onChange(id);
        setOpen(false);
        setQuery('');
    }, [onChange]);

    useEffect(() => {
        if (!open) return;
        const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    return (
        <div className="flex flex-col gap-1" ref={ref}>
            <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">Guru</span>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex w-52 items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm hover:border-sky-400 dark:hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                >
                    <span className="truncate">{label}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                    <div className="absolute z-50 mt-1 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                        <div className="flex items-center gap-2 p-2 border-b border-gray-100 dark:border-gray-700">
                            <Search className="h-4 w-4 shrink-0 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari nama guru..."
                                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery('')} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <ul className="max-h-56 overflow-y-auto py-1">
                            <li>
                                <button
                                    type="button"
                                    onClick={() => pick('')}
                                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${!value ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    Semua Guru
                                </button>
                            </li>
                            {filtered.length === 0 ? (
                                <li className="px-3 py-4 text-center text-sm text-gray-400">Tidak ditemukan</li>
                            ) : filtered.map((g) => (
                                <li key={g.id}>
                                    <button
                                        type="button"
                                        onClick={() => pick(String(g.id))}
                                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${String(value) === String(g.id) ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                    >
                                        {g.user?.name ?? '-'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KehadiranGuru({ rekap, detailHarian, guru, filters, bulan, kop, sekolah }) {
    const [bulanTahun, setBulanTahun] = useState(() => {
        const [y, m] = bulan.split('-');
        return { tahun: y, bulan: m };
    });
    const [localFilters, setLocalFilters] = useState({ bulan, guru_id: filters.guru_id ?? '' });
    const [activeTab, setActiveTab]       = useState('rekap');
    const [printTarget, setPrintTarget]   = useState(null);

    const periodLabel = `${BULAN[parseInt(bulanTahun.bulan) - 1]} ${bulanTahun.tahun}`;

    const applyFilter = (next) => {
        setLocalFilters(next);
        router.get('/admin/laporan/kehadiran-guru', next, { preserveState: true, replace: true });
    };

    const changeBulan = (key, val) => {
        const next = { ...bulanTahun, [key]: val };
        setBulanTahun(next);
        applyFilter({ ...localFilters, bulan: `${next.tahun}-${next.bulan}` });
    };

    const totalGuru = rekap.length;
    const rataHadir     = totalGuru > 0 ? Math.round(rekap.reduce((s, r) => s + r.persen_mengajar, 0) / totalGuru) : 0;
    const rataTdkHadir  = totalGuru > 0 ? Math.round(rekap.reduce((s, r) => s + r.persen_tidak_hadir, 0) / totalGuru) : 0;

    const tahunList = [];
    for (let y = 2023; y <= new Date().getFullYear() + 1; y++) tahunList.push(y);

    const exportUrl = `/admin/laporan/kehadiran-guru/export?bulan=${localFilters.bulan}&guru_id=${localFilters.guru_id}`;

    return (
        <AppLayout title="Laporan Kehadiran Guru">
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

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex items-end gap-2">
                        <Select label="Bulan" value={bulanTahun.bulan} onChange={(e) => changeBulan('bulan', e.target.value)} className="w-36">
                            {BULAN.map((b, i) => (
                                <option key={i} value={String(i + 1).padStart(2, '0')}>{b}</option>
                            ))}
                        </Select>
                        <Select label="Tahun" value={bulanTahun.tahun} onChange={(e) => changeBulan('tahun', e.target.value)} className="w-28">
                            {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                        </Select>
                    </div>
                    <GuruSearchSelect
                        guru={guru}
                        value={localFilters.guru_id}
                        onChange={(id) => applyFilter({ ...localFilters, guru_id: id })}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <a
                        href="/admin/laporan/kehadiran-guru/semester"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 dark:border-sky-700 px-3 py-2 text-sm font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                    >
                        <CalendarRange className="h-4 w-4" />
                        Rekap Semester
                    </a>
                    <button
                        onClick={() => setPrintTarget('all')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                    <a
                        href={exportUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export Excel
                    </a>
                </div>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                    { label: 'Total Guru', value: totalGuru, icon: GraduationCap, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30' },
                    { label: 'Rata % Hadir (JP)', value: `${rataHadir}%`, icon: TrendingUp, color: rataHadir >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400', bg: rataHadir >= 90 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30' },
                    { label: 'Rata % Tdk Hadir (JP)', value: `${rataTdkHadir}%`, icon: ClipboardList, color: rataTdkHadir <= 10 ? 'text-emerald-600 dark:text-emerald-400' : rataTdkHadir <= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400', bg: rataTdkHadir <= 10 ? 'bg-emerald-50 dark:bg-emerald-900/30' : rataTdkHadir <= 25 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-red-50 dark:bg-red-900/30' },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-4 flex items-center gap-4 ${s.bg}`}>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm">
                            <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-3">
                {['rekap', 'detail'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors capitalize ${activeTab === t ? 'bg-sky-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
                    >
                        {t === 'rekap' ? 'Rekap Bulanan' : 'Detail Harian'}
                    </button>
                ))}
            </div>

            {/* Tabel Rekap */}
            {activeTab === 'rekap' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rekap — {periodLabel}</CardTitle>
                    </CardHeader>
                    <CardBody className="p-0">
                        {/* Mobile */}
                        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {rekap.length === 0 && (
                                <p className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data absensi untuk periode ini.</p>
                            )}
                            {rekap.map((r) => (
                                <div key={r.id} className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{r.nama}</p>
                                        <button onClick={() => setPrintTarget(r)} className="text-gray-400 hover:text-sky-600 p-1">
                                            <Printer className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-xs text-gray-500 mb-1">
                                        <span>Terjadwal: <span className="font-semibold text-gray-700 dark:text-gray-300">{r.jam_terjadwal} JP</span></span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-xs text-gray-500 mb-2">
                                        <span>H: <span className="font-semibold text-sky-600 dark:text-sky-400">{r.jp_hadir} JP</span></span>
                                        <span>S: <span className="font-semibold text-blue-600 dark:text-blue-400">{r.jp_sakit}</span></span>
                                        <span>I: <span className="font-semibold text-amber-600 dark:text-amber-400">{r.jp_izin}</span></span>
                                        <span>A: <span className="font-semibold text-red-600 dark:text-red-400">{r.jp_alpha}</span></span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-24 text-gray-400 shrink-0">% Hadir</span>
                                            <PersenBar persen={r.persen_mengajar} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-24 text-gray-400 shrink-0">Tdk Hadir ({r.jp_tidak_hadir} JP)</span>
                                            <span className={`text-xs font-semibold ${r.persen_tidak_hadir > 25 ? 'text-red-600' : r.persen_tidak_hadir > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.persen_tidak_hadir}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop */}
                        <RekapTable rekap={rekap} onPrint={setPrintTarget} />
                    </CardBody>
                </Card>
            )}

            {/* Detail Harian */}
            {activeTab === 'detail' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Harian — {periodLabel}</CardTitle>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Tanggal</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Nama Guru</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Jam Masuk</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Jam Keluar</th>
                                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {detailHarian.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data absensi harian.</td></tr>
                                    ) : (
                                        detailHarian.map((d) => (
                                            <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">{d.tanggal}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{d.guru?.user?.name}</td>
                                                <td className="px-4 py-3"><Badge color={statusColor[d.status]}>{d.status}</Badge></td>
                                                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{d.jam_masuk ?? '–'}</td>
                                                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{d.jam_keluar ?? '–'}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{d.keterangan ?? '–'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}
        </AppLayout>
    );
}
