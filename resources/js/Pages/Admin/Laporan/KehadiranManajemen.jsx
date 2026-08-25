import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Crown, Filter, TrendingUp, Printer, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const BULAN_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function BarColor(p) {
    return p >= 90 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-red-500';
}
function PctText(p) {
    return p >= 90
        ? 'text-emerald-600 dark:text-emerald-400'
        : p >= 75 ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
}

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
                    {kop?.yayasan_dinas && <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{kop.yayasan_dinas}</p>}
                    {kop?.nama_instansi && <p style={{ fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1.1, letterSpacing: 1, textTransform: 'uppercase' }}>{kop.nama_instansi}</p>}
                    {kop?.sub_nama      && <p style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{kop.sub_nama}</p>}
                    {kop?.alamat_kop    && <p style={{ fontSize: 8.5, color: '#555', marginTop: 2 }}>{kop.alamat_kop}</p>}
                    {kontak             && <p style={{ fontSize: 8, color: '#777' }}>{kontak}</p>}
                </div>
            </div>
            <div style={{ height: 1.5, background: '#c8a951', marginBottom: 12 }} />
        </div>
    );
}

function PrintOverlay({ rekap, hariKerja, period, kop, sekolah, onClose }) {
    const totHadir        = rekap.reduce((s, r) => s + r.hadir, 0);
    const totTugasSekolah = rekap.reduce((s, r) => s + (r.tugas_sekolah ?? 0), 0);
    const totTidakHadir   = rekap.reduce((s, r) => s + (r.tidak_hadir ?? 0), 0);
    const totPersen = rekap.length > 0
        ? Math.round(rekap.reduce((s, r) => s + r.persen, 0) / rekap.length * 10) / 10
        : 0;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto print-overlay">
            <style>{`
                @media print {
                    body > * { visibility: hidden !important; }
                    .print-overlay { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; }
                    .print-overlay * { visibility: visible !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10 shadow-sm">
                <p className="text-sm font-medium text-gray-700">Preview Print — Kehadiran Manajemen</p>
                <div className="flex gap-2">
                    <button onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700">
                        <Printer className="h-4 w-4" /> Print
                    </button>
                    <button onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">
                        <X className="h-4 w-4" /> Tutup
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 py-6">
                <KopSurat kop={kop} />

                <div className="text-center mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Rekap Kehadiran Manajemen</p>
                    <h2 className="text-lg font-bold text-gray-900">Periode: {period}</h2>
                    <p className="text-xs text-gray-500 mt-1">{hariKerja} Hari Kerja</p>
                </div>

                <table className="w-full text-sm border border-gray-300">
                    <thead>
                        <tr className="bg-amber-50">
                            <th className="px-3 py-2 text-center border border-gray-300 w-8">No</th>
                            <th className="px-3 py-2 text-left border border-gray-300">Nama</th>
                            <th className="px-3 py-2 text-left border border-gray-300">Jabatan</th>
                            <th className="px-3 py-2 text-center border border-gray-300">Hari Kerja</th>
                            <th className="px-3 py-2 text-center border border-gray-300 text-emerald-700">Hadir</th>
                            <th className="px-3 py-2 text-center border border-gray-300 text-purple-700">TS</th>
                            <th className="px-3 py-2 text-center border border-gray-300 text-red-600">TH</th>
                            <th className="px-3 py-2 text-center border border-gray-300">% Hadir</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rekap.map((row, idx) => (
                            <tr key={row.id} className={idx % 2 === 0 ? '' : 'bg-gray-50'}>
                                <td className="px-3 py-1.5 text-center text-gray-500 border border-gray-300">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-medium text-gray-900 border border-gray-300">{row.nama}</td>
                                <td className="px-3 py-1.5 text-gray-600 text-xs border border-gray-300">{row.jabatan}</td>
                                <td className="px-3 py-1.5 text-center border border-gray-300">{row.hari_kerja}</td>
                                <td className="px-3 py-1.5 text-center font-bold text-emerald-700 border border-gray-300">{row.hadir}</td>
                                <td className="px-3 py-1.5 text-center text-purple-700 border border-gray-300">{row.tugas_sekolah ?? 0}</td>
                                <td className="px-3 py-1.5 text-center text-red-600 border border-gray-300">{row.tidak_hadir ?? 0}</td>
                                <td className="px-3 py-1.5 text-center font-bold border border-gray-300">{row.persen}%</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-amber-50 font-bold">
                            <td colSpan={4} className="px-3 py-2 border border-gray-300 text-xs uppercase">Total</td>
                            <td className="px-3 py-2 text-center text-emerald-700 border border-gray-300">{totHadir}</td>
                            <td className="px-3 py-2 text-center text-purple-700 border border-gray-300">{totTugasSekolah}</td>
                            <td className="px-3 py-2 text-center text-red-600 border border-gray-300">{totTidakHadir}</td>
                            <td className="px-3 py-2 text-center border border-gray-300">{totPersen}%</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="flex justify-between items-end mt-8">
                    <p className="text-xs text-gray-400">Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="text-center text-sm text-gray-600">
                        <p>Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <p className="mt-12 font-semibold underline">{sekolah?.kepala_sekolah_nama ?? '________________________________'}</p>
                        {sekolah?.nip_kepala && <p className="text-xs text-gray-500">NIP. {sekolah.nip_kepala}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KehadiranManajemen({ rekap, bulan, hariKerja, kop, sekolah }) {
    const [tahun, bln] = bulan.split('-');
    const [showPrint, setShowPrint] = useState(false);

    const totHadir        = rekap.reduce((s, r) => s + r.hadir,  0);
    const totTugasSekolah = rekap.reduce((s, r) => s + (r.tugas_sekolah ?? 0), 0);
    const totTidakHadir   = rekap.reduce((s, r) => s + (r.tidak_hadir ?? 0), 0);
    const totPersen = rekap.length > 0
        ? Math.round(rekap.reduce((s, r) => s + r.persen, 0) / rekap.length * 10) / 10
        : 0;

    const periodLabel = `${BULAN_NAMES[parseInt(bln)]} ${tahun}`;

    return (
        <AppLayout title="Kehadiran Manajemen">
            {showPrint && (
                <PrintOverlay
                    rekap={rekap} hariKerja={hariKerja} period={periodLabel}
                    kop={kop} sekolah={sekolah} onClose={() => setShowPrint(false)}
                />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        Kehadiran Manajemen
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {periodLabel} · {hariKerja} hari kerja
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <input
                        type="month"
                        value={bulan}
                        onChange={(e) => router.get('/admin/laporan/kehadiran-manajemen', { bulan: e.target.value }, { preserveState: true })}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                        onClick={() => setShowPrint(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Printer className="h-4 w-4" /> Print
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Hadir',         val: totHadir,        cls: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Tugas Sekolah', val: totTugasSekolah, cls: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Tidak Hadir',   val: totTidakHadir,   cls: 'text-red-600 dark:text-red-400' },
                ].map(({ label, val, cls }) => (
                    <Card key={label}><CardBody className="p-4 text-center">
                        <p className={`text-2xl font-black ${cls}`}>{val}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                    </CardBody></Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        Rekap Per Jabatan
                    </CardTitle>
                </CardHeader>
                <CardBody className="p-0">
                    {rekap.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Crown className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Tidak ada data manajemen aktif.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-amber-50 dark:bg-amber-900/20 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-8">No</th>
                                        <th className="px-4 py-3 text-left">Nama</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Jabatan</th>
                                        <th className="px-4 py-3 text-center">Hari Kerja</th>
                                        <th className="px-4 py-3 text-center text-emerald-600">Hadir</th>
                                        <th className="px-4 py-3 text-center text-purple-600">TS</th>
                                        <th className="px-4 py-3 text-center text-red-500">TH</th>
                                        <th className="px-4 py-3 text-center min-w-36">Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {rekap.map((row, idx) => {
                                        const p = row.persen;
                                        return (
                                            <tr key={row.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.nama}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{row.jabatan}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{row.hari_kerja}</td>
                                                <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{row.hadir}</td>
                                                <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">{row.tugas_sekolah ?? 0}</td>
                                                <td className="px-4 py-3 text-center text-red-500">{row.tidak_hadir ?? 0}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                            <div className={`h-2 rounded-full ${BarColor(p)} transition-all`} style={{ width: `${Math.min(p, 100)}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-bold w-10 text-right ${PctText(p)}`}>{p}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-amber-50 dark:bg-amber-900/20 border-t-2 border-amber-200 dark:border-amber-800">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                                            Total Keseluruhan
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{totHadir}</td>
                                        <td className="px-4 py-3 text-center font-bold text-purple-600">{totTugasSekolah}</td>
                                        <td className="px-4 py-3 text-center font-bold text-red-500">{totTidakHadir}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <div className={`h-2 rounded-full ${BarColor(totPersen)} transition-all`} style={{ width: `${Math.min(totPersen, 100)}%` }} />
                                                </div>
                                                <span className={`text-xs font-black w-10 text-right ${PctText(totPersen)}`}>{totPersen}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>
        </AppLayout>
    );
}
