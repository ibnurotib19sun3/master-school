import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import { Select } from '@/Components/ui/Input';
import {
    ClipboardCheck, Search, Save, ChevronLeft, ChevronRight,
    Users, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

const STATUS_LIST  = ['Hadir', 'Sakit', 'Izin', 'Alpha'];
const STATUS_SHORT = { Hadir: 'H', Sakit: 'S', Izin: 'I', Alpha: 'A' };

const STATUS_ACTIVE = {
    Hadir: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500',
    Sakit: 'bg-sky-600    text-white border-sky-600    dark:bg-sky-500    dark:border-sky-500',
    Izin:  'bg-amber-500  text-white border-amber-500  dark:bg-amber-400  dark:border-amber-400',
    Alpha: 'bg-red-600    text-white border-red-600    dark:bg-red-500    dark:border-red-500',
};
const STATUS_IDLE = {
    Hadir: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    Sakit: 'bg-sky-50     text-sky-600     border-sky-200     hover:bg-sky-100     dark:bg-sky-900/20     dark:text-sky-400     dark:border-sky-800',
    Izin:  'bg-amber-50   text-amber-600   border-amber-200   hover:bg-amber-100   dark:bg-amber-900/20   dark:text-amber-500   dark:border-amber-800',
    Alpha: 'bg-red-50     text-red-600     border-red-200     hover:bg-red-100     dark:bg-red-900/20     dark:text-red-400     dark:border-red-800',
};
const STATUS_BADGE = { Hadir: 'green', Sakit: 'sky', Izin: 'yellow', Alpha: 'red' };

function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function PresensiHarianIndex({ rombelList, siswaList, presensiRecords, canEdit, filters }) {
    const [tanggal,  setTanggal]  = useState(filters.tanggal  ?? today());
    const [rombelId, setRombelId] = useState(filters.rombel_id ?? '');
    const [search,   setSearch]   = useState(filters.search   ?? '');
    const [saving,   setSaving]   = useState(false);

    // records: { [siswa_id]: { status, keterangan } }
    const initRecords = useCallback(() => {
        const init = {};
        siswaList.forEach((s) => {
            init[s.id] = presensiRecords[s.id]
                ? { status: presensiRecords[s.id].status, keterangan: presensiRecords[s.id].keterangan ?? '' }
                : { status: 'Hadir', keterangan: '' };
        });
        return init;
    }, [siswaList, presensiRecords]);

    const [records, setRecords] = useState(initRecords);

    // Re-init when siswaList/presensiRecords change (filter navigation)
    const prevSiswaKey = useMemo(() => siswaList.map(s => s.id).join(','), [siswaList]);
    const [lastKey, setLastKey] = useState(prevSiswaKey);
    if (prevSiswaKey !== lastKey) {
        setRecords(initRecords());
        setLastKey(prevSiswaKey);
    }

    const navigate = useCallback((params) => {
        router.get('/guru/presensi-harian', { tanggal, rombel_id: rombelId, search, ...params }, {
            preserveState: true, replace: true,
        });
    }, [tanggal, rombelId, search]);

    const onRombel = (v) => { setRombelId(v); navigate({ rombel_id: v }); };
    const onSearch = (v) => { setSearch(v); navigate({ search: v }); };
    const onDateNav = (n) => { const d = addDays(tanggal, n); setTanggal(d); navigate({ tanggal: d }); };
    const onDatePick = (v) => { setTanggal(v); navigate({ tanggal: v }); };

    const setStatus = (siswaId, status) => setRecords((p) => ({ ...p, [siswaId]: { ...p[siswaId], status } }));
    const setKet    = (siswaId, val)    => setRecords((p) => ({ ...p, [siswaId]: { ...p[siswaId], keterangan: val } }));

    const summary = useMemo(() => {
        const s = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
        Object.values(records).forEach(({ status }) => { if (s[status] !== undefined) s[status]++; });
        return s;
    }, [records]);

    const handleSave = () => {
        if (!rombelId || siswaList.length === 0) return;
        setSaving(true);
        const payload = {
            tanggal,
            rombel_id: rombelId,
            records: Object.entries(records).map(([siswaId, rec]) => ({
                siswa_id:   parseInt(siswaId),
                status:     rec.status,
                keterangan: rec.keterangan || null,
            })),
        };
        router.post('/guru/presensi-harian', payload, {
            onFinish: () => setSaving(false),
            preserveScroll: true,
        });
    };

    const sudahAdaData = siswaList.some((s) => presensiRecords[s.id]);

    return (
        <AppLayout title="Presensi Siswa Harian">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-sky-600" />
                        Presensi Siswa Harian
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {canEdit ? 'Isi presensi harian kehadiran siswa' : 'Lihat data presensi harian siswa'}
                    </p>
                </div>
                <a
                    href="/guru/presensi-harian/rekap"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 px-3 py-2 text-sm font-medium hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors shrink-0"
                >
                    Rekap Presensi →
                </a>
            </div>

            {/* ── Filter bar ── */}
            <Card className="mb-4">
                <CardBody>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Date navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onDateNav(-1)}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => onDatePick(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 w-40"
                            />
                            <button
                                onClick={() => onDateNav(1)}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Rombel */}
                        <select
                            value={rombelId}
                            onChange={(e) => onRombel(e.target.value)}
                            className="flex-1 sm:max-w-56 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                            <option value="">-- Pilih Kelas/Rombel --</option>
                            {rombelList.map((r) => (
                                <option key={r.id} value={r.id}>{r.nama}</option>
                            ))}
                        </select>

                        {/* Search */}
                        <div className="relative flex-1 sm:max-w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => onSearch(e.target.value)}
                                placeholder="Cari nama siswa..."
                                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {!rombelId ? (
                <div className="text-center py-16 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Pilih kelas/rombel untuk melihat daftar siswa</p>
                </div>
            ) : siswaList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{search ? 'Siswa tidak ditemukan' : 'Tidak ada siswa aktif di kelas ini'}</p>
                </div>
            ) : (
                <>
                    {/* ── Summary ── */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {STATUS_LIST.map((s) => (
                            <div key={s} className={`rounded-xl border px-3 py-2.5 text-center ${STATUS_IDLE[s]}`}>
                                <div className="text-xl font-bold">{summary[s]}</div>
                                <div className="text-xs font-medium mt-0.5">{s}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Status info ── */}
                    {sudahAdaData && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>Data presensi tanggal ini sudah ada. {canEdit ? 'Perubahan akan menimpa data sebelumnya.' : ''}</span>
                        </div>
                    )}

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>
                                {fmtDate(tanggal)}
                                <span className="ml-2 text-sm font-normal text-gray-400">({siswaList.length} siswa)</span>
                            </CardTitle>
                            {canEdit && (
                                <Button icon={Save} loading={saving} onClick={handleSave} size="sm">
                                    Simpan
                                </Button>
                            )}
                        </CardHeader>

                        {/* Mobile list */}
                        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {siswaList.map((s, idx) => {
                                const rec = records[s.id] ?? { status: 'Hadir', keterangan: '' };
                                return (
                                    <div key={s.id} className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={s.avatar_url} alt={s.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{s.name}</p>
                                                <p className="text-xs text-gray-400">{s.nis}</p>
                                            </div>
                                            {canEdit ? (
                                                <div className="flex items-center gap-1">
                                                    {STATUS_LIST.map((st) => (
                                                        <button
                                                            key={st}
                                                            onClick={() => setStatus(s.id, st)}
                                                            className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${rec.status === st ? STATUS_ACTIVE[st] : STATUS_IDLE[st]}`}
                                                        >
                                                            {STATUS_SHORT[st]}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Badge color={STATUS_BADGE[rec.status]}>{rec.status}</Badge>
                                            )}
                                        </div>
                                        {canEdit && (rec.status === 'Sakit' || rec.status === 'Izin' || rec.status === 'Alpha') && (
                                            <input
                                                type="text"
                                                value={rec.keterangan}
                                                onChange={(e) => setKet(s.id, e.target.value)}
                                                placeholder="Keterangan (opsional)..."
                                                className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                            />
                                        )}
                                        {!canEdit && rec.keterangan && (
                                            <p className="mt-1 text-xs text-gray-400 truncate">{rec.keterangan}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium w-10">No</th>
                                        <th className="px-4 py-3 text-left font-medium">Nama Siswa</th>
                                        <th className="px-4 py-3 text-left font-medium w-28">NIS</th>
                                        <th className="px-4 py-3 text-left font-medium w-44">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {siswaList.map((s, idx) => {
                                        const rec = records[s.id] ?? { status: 'Hadir', keterangan: '' };
                                        return (
                                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-2.5 text-gray-400 text-center">{idx + 1}</td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <img src={s.avatar_url} alt={s.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{s.nis}</td>
                                                <td className="px-4 py-2.5">
                                                    {canEdit ? (
                                                        <div className="flex items-center gap-1">
                                                            {STATUS_LIST.map((st) => (
                                                                <button
                                                                    key={st}
                                                                    onClick={() => setStatus(s.id, st)}
                                                                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${rec.status === st ? STATUS_ACTIVE[st] : STATUS_IDLE[st]}`}
                                                                    title={st}
                                                                >
                                                                    {STATUS_SHORT[st]}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Badge color={STATUS_BADGE[rec.status]}>{rec.status}</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {canEdit ? (
                                                        <input
                                                            type="text"
                                                            value={rec.keterangan}
                                                            onChange={(e) => setKet(s.id, e.target.value)}
                                                            placeholder={rec.status !== 'Hadir' ? 'Keterangan...' : ''}
                                                            disabled={rec.status === 'Hadir'}
                                                            className="w-full px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">{rec.keterangan || '–'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {canEdit && (
                            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <Button icon={Save} loading={saving} onClick={handleSave}>
                                    Simpan Presensi
                                </Button>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </AppLayout>
    );
}
