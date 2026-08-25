import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Card, CardBody } from '@/Components/ui/Card';
import {
    Clock, BookOpen, CheckCircle, AlertCircle,
    ClipboardList, FileText, Calendar, MessageCircle, BellRing, Info,
    GraduationCap, CalendarX, Pencil, User,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';

const STATUS_GURU = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Tugas_Sekolah'];
const STATUS_GURU_LABEL = {
    Hadir: 'Hadir', Sakit: 'Sakit', Izin: 'Izin', Alpha: 'Alpha',
    Tugas_Sekolah: 'Tugas Sekolah',
};
const STATUS_GURU_COLOR = {
    Hadir:        'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
    Sakit:        'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
    Izin:         'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
    Alpha:        'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    Tugas_Sekolah:'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
};
const PERLU_TUGAS = ['Sakit', 'Izin', 'Tugas_Sekolah'];
const STATUS_SHORT = { Hadir: 'H', Sakit: 'S', Izin: 'I', Alpha: 'A', Tugas_Sekolah: 'TS' };
const STATUS_GURU_IDLE = {
    Hadir:        'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 active:scale-95 dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500',
    Sakit:        'bg-sky-500 text-white border-sky-600 hover:bg-sky-600 active:scale-95 dark:bg-sky-600 dark:border-sky-500 dark:hover:bg-sky-500',
    Izin:         'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 active:scale-95 dark:bg-amber-600 dark:border-amber-500 dark:hover:bg-amber-500',
    Alpha:        'bg-red-500 text-white border-red-600 hover:bg-red-600 active:scale-95 dark:bg-red-600 dark:border-red-500 dark:hover:bg-red-500',
    Tugas_Sekolah:'bg-purple-500 text-white border-purple-600 hover:bg-purple-600 active:scale-95 dark:bg-purple-600 dark:border-purple-500 dark:hover:bg-purple-500',
};

function toMinutes(timeStr) {
    if (!timeStr) return -1;
    const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
    return h * 60 + m;
}

function buildWaUrl(nomor, text) {
    if (!nomor) return null;
    const bersih = nomor.replace(/\D/g, '');
    return `https://wa.me/${bersih}?text=${encodeURIComponent(text)}`;
}

function fmtTanggal(tgl) {
    return new Date(tgl).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

// Pesan WA per-JP (dari presensi piket per jadwal)
function buildWaPerJP(status, guru, mapel, rombel, jamKe, tglFmt, tugas, keterangan) {
    const header = `Assalamualaikum Bapak/Ibu ${guru},\n\nBerikut informasi presensi mengajar Anda:\n ${tglFmt}\n ${mapel} – ${rombel} (JP ${jamKe})\n`;
    const ket    = keterangan ? `\nKeterangan: _${keterangan}_` : '';
    switch (status) {
        case 'Hadir':
            return header + `*Status: Hadir*\nKehadiran Anda mengajar telah tercatat dengan baik. Mohon segera mengisi jurnal mengajar.\n\nTerima kasih.`;
        case 'Sakit':
            return header + `*Status: Sakit*\nKetidakhadiran Anda karena sakit telah tercatat.${ket}\n\nSemoga lekas sembuh.`;
        case 'Izin':
            return header + `*Status: Izin*\nIzin Anda telah tercatat.${ket}\n\nTerima kasih.`;
        case 'Alpha':
            return header + `*Status: Alpha (Tidak Hadir Tanpa Keterangan)*\nKetidakhadiran Anda tercatat sebagai *Alpha* karena tidak ada pemberitahuan sebelumnya. Status ini akan mempengaruhi rekap kehadiran dan penilaian kinerja Anda.\n\nApabila ada alasan yang sah, segera hubungi pihak sekolah hari ini.`;
        case 'Tugas_Sekolah':
            return header + `*Status: Tugas Sekolah*\nAnda tercatat sedang melaksanakan tugas di luar kelas.${tugas ? `\n\n📝 Tugas siswa: ${tugas}` : ''}\n\nTerima kasih.`;
        default:
            return header + `Status kehadiran Anda telah tercatat.`;
    }
}

// Pesan WA kehadiran harian guru (ringkasan semua JP hari ini)
function buildWaGuruHarian(status, nama, tercatat, tglFmt, slots) {
    const header  = `Assalamualaikum Bapak/Ibu ${nama},\n\nBerikut rekap kehadiran mengajar Anda:\n📅 ${tglFmt}\n`;
    const jpLines = slots.length > 0
        ? '\n' + slots.map((s) => `  • JP ${s.jam_ke}: ${s.status ? (s.status === 'Tugas_Sekolah' ? 'Tugas Sekolah' : s.status) : '–'}`).join('\n')
        : '';
    switch (status) {
        case 'Hadir':
            return header + `✅ *Status: Hadir* (${tercatat} JP)${jpLines}\n\nKehadiran Anda hari ini telah tercatat dengan baik. Terima kasih atas dedikasi Anda. 🙏`;
        case 'Sakit':
            return header + `🤒 *Status: Sakit*${jpLines}\n\nKetidakhadiran Anda karena sakit telah tercatat.\n\nSemoga lekas sembuh. 🙏`;
        case 'Izin':
            return header + `📋 *Status: Izin*${jpLines}\n\nIzin Anda hari ini telah tercatat.\n\nTerima kasih. 🙏`;
        case 'Alpha':
            return header + `⚠️ *Status: Alpha (Tidak Hadir Tanpa Keterangan)*${jpLines}\n\nKetidakhadiran Anda hari ini tercatat sebagai *Alpha*. Status ini akan mempengaruhi rekap kehadiran dan penilaian kinerja Anda.\n\nApabila ada alasan yang sah, segera hubungi pihak sekolah hari ini.`;
        default:
            return header + `Status kehadiran Anda hari ini telah tercatat.`;
    }
}

// Pesan WA kehadiran tata usaha
function buildWaTatausaha(status, nama, jabatan, tglFmt, keterangan) {
    const header = `Assalamualaikum Bapak/Ibu ${nama},\n\nBerikut informasi presensi Anda:\n📅 ${tglFmt}\n💼 ${jabatan}\n`;
    const ket    = keterangan ? `\nKeterangan: _${keterangan}_` : '';
    switch (status) {
        case 'Hadir':
            return header + `✅ *Status: Hadir*\nKehadiran Anda hari ini telah tercatat. Mohon segera mengisi jurnal harian.\n\nTerima kasih. 🙏`;
        case 'Sakit':
            return header + `🤒 *Status: Sakit*\nKetidakhadiran Anda karena sakit telah tercatat.${ket}\n\nSemoga lekas sembuh. 🙏`;
        case 'Izin':
            return header + `📋 *Status: Izin*\nIzin Anda hari ini telah tercatat.${ket}\n\nTerima kasih. 🙏`;
        case 'Alpha':
            return header + `⚠️ *Status: Alpha (Tidak Hadir Tanpa Keterangan)*\nKetidakhadiran Anda hari ini tercatat sebagai *Alpha* karena tidak ada pemberitahuan sebelumnya. Status ini akan mempengaruhi rekap kehadiran Anda.\n\nApabila ada alasan yang sah, segera hubungi pihak sekolah hari ini.`;
        case 'Tugas_Sekolah':
            return header + `📋 *Status: Tugas Sekolah*\nAnda tercatat sedang melaksanakan tugas di luar kantor.${ket}\n\nTerima kasih. 🙏`;
        default:
            return header + `Status kehadiran Anda hari ini telah tercatat.`;
    }
}

function WaButton({ nomor, text, label, icon: Icon, variant = 'wa' }) {
    if (!nomor) return null;
    const url = buildWaUrl(nomor, text);
    const base = variant === 'reminder'
        ? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/40 transition-colors'
        : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40 transition-colors';
    return (
        <a href={url} target="_blank" rel="noreferrer" className={base}>
            <Icon className="h-3 w-3 shrink-0" />
            {label}
        </a>
    );
}


const STATUS_GURU_BTN_ACTIVE = {
    Hadir:        'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 dark:ring-emerald-500',
    Sakit:        'bg-sky-700 text-white border-sky-800 ring-2 ring-sky-400 dark:ring-sky-500',
    Izin:         'bg-amber-700 text-white border-amber-800 ring-2 ring-amber-400 dark:ring-amber-500',
    Alpha:        'bg-red-700 text-white border-red-800 ring-2 ring-red-400 dark:ring-red-500',
    Tugas_Sekolah:'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400 dark:ring-purple-500',
};

export default function PiketDashboard({ jadwal, piketRecords, jurnalStatus, hari, tanggal, pembelajaranTanpaJadwal, hariLibur = null }) {
    const [nowMin, setNowMin] = useState(() => {
        const n = new Date(); return n.getHours() * 60 + n.getMinutes();
    });
    useEffect(() => {
        const id = setInterval(() => {
            const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes());
        }, 60_000);
        return () => clearInterval(id);
    }, []);

    const [jamFilter,    setJamFilter]   = useState(0);
    const [rombelFilter, setRombelFilter] = useState('');
    const [inlineItem,   setInlineItem]   = useState(null);
    const [inlineStatus, setInlineStatus] = useState('');
    const [inlineFields, setInlineFields] = useState({ keterangan: '', tugas: '', deadline_tugas: '' });
    const [inlineSubmitting, setInlineSubmitting] = useState(false);
    const [confirmJurnal,    setConfirmJurnal]    = useState(null);

    // Jadwal cards: track which items are in edit mode (tombol Ubah diklik)
    const [expandedPiket, setExpandedPiket] = useState({});
    const [localPiket,    setLocalPiket]    = useState({});

    // Bersihkan localPiket saat piketRecords dari server sudah terupdate
    useEffect(() => {
        setLocalPiket(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(id => {
                if (piketRecords[id]) { delete next[id]; changed = true; }
            });
            return changed ? next : prev;
        });
    }, [piketRecords]);

    const rombelList = useMemo(() =>
        [...new Set(jadwal.map((j) => j.rombel_nama).filter(Boolean))].sort(),
        [jadwal]
    );

    const filtered = useMemo(() =>
        jadwal
            .filter((j) => jamFilter === 0 || j.jam_ke === jamFilter)
            .filter((j) => !rombelFilter || j.rombel_nama === rombelFilter),
        [jadwal, jamFilter, rombelFilter]
    );

    // Hitung kehadiran guru dari piketRecords per-jadwal (bukan input manual)
    const guruKehadiran = useMemo(() => {
        const map = {};
        jadwal.forEach((j) => {
            const guruId = j.pembelajaran?.guru_id;
            if (!guruId) return;
            if (!map[guruId]) {
                map[guruId] = {
                    id:       guruId,
                    nama:     j.guru_nama ?? '–',
                    nomor_wa: j.guru_nomor_wa,
                    avatar:   j.pembelajaran?.guru?.user?.avatar_url ?? null,
                    slots:    [],
                };
            }
            const piket = piketRecords[j.id] ?? localPiket[j.id];
            map[guruId].slots.push({
                jadwal_id: j.id,
                jam_ke:    j.jam_ke,
                jam_mulai: j.jam_mulai,
                mapel:     j.mapel_nama,
                status:    piket?.status_guru ?? null,
            });
        });

        return Object.values(map).map((g) => {
            const recorded   = g.slots.filter((s) => s.status);
            const hasHadir   = recorded.some((s) => s.status === 'Hadir' || s.status === 'Tugas_Sekolah');
            let status = null;
            if (recorded.length > 0) {
                if (hasHadir) {
                    status = 'Hadir';
                } else {
                    const uniq = [...new Set(recorded.map((s) => s.status))];
                    status = uniq.length === 1 ? uniq[0] : 'Alpha';
                }
            }
            return { ...g, status, tercatat: recorded.length, total: g.slots.length };
        }).sort((a, b) => a.nama.localeCompare(b.nama));
    }, [jadwal, piketRecords, localPiket]);

    const openInline = useCallback((item, status) => {
        const piket = piketRecords[item.id];
        setInlineItem(item);
        setInlineStatus(status);
        setInlineFields({
            keterangan:     piket?.keterangan    ?? '',
            tugas:          piket?.tugas         ?? '',
            deadline_tugas: piket?.deadline_tugas
                ? String(piket.deadline_tugas).substring(0, 10)
                : '',
        });
    }, [piketRecords]);

    const doSubmitInline = useCallback((item, status, fields) => {
        setInlineSubmitting(true);
        const payload = {
            jadwal_id:      item.id,
            tanggal:        new Date().toISOString().split('T')[0],
            status_guru:    status,
            keterangan:     fields.keterangan     ?? '',
            tugas:          fields.tugas          ?? '',
            deadline_tugas: fields.deadline_tugas ?? '',
        };
        setLocalPiket(p => ({ ...p, [item.id]: { status_guru: status, ...fields } }));
        setExpandedPiket(p => { const n = { ...p }; delete n[item.id]; return n; });
        router.post('/piket/absensi', payload, {
            onSuccess: () => { setInlineItem(null); setConfirmJurnal(null); },
            onError:   () => { setLocalPiket(p => { const n = { ...p }; delete n[item.id]; return n; }); },
            onFinish:  () => setInlineSubmitting(false),
        });
    }, []);

    const handleQuickStatus = useCallback((item, newStatus) => {
        const piket      = piketRecords[item.id];
        const wasHadir   = piket?.status_guru === 'Hadir';
        const adaJurnal  = !!jurnalStatus[item.id];
        const needsConfirm = wasHadir && adaJurnal && newStatus !== 'Hadir';
        const needsFields  = PERLU_TUGAS.includes(newStatus);

        if (needsConfirm) {
            setConfirmJurnal({ item, newStatus, needsFields });
            return;
        }
        if (needsFields) {
            openInline(item, newStatus);
        } else {
            doSubmitInline(item, newStatus, {});
        }
    }, [piketRecords, jurnalStatus, openInline, doSubmitInline]);

    const confirmAndProceed = useCallback(() => {
        if (!confirmJurnal) return;
        const { item, newStatus, needsFields } = confirmJurnal;
        setConfirmJurnal(null);
        if (needsFields) {
            openInline(item, newStatus);
        } else {
            doSubmitInline(item, newStatus, {});
        }
    }, [confirmJurnal, openInline, doSubmitInline]);

    const tglFormatted = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const sudahDiisi  = (id) => !!(piketRecords[id] ?? localPiket[id]);
    const sudahJurnal = (jadwal_id) => !!jurnalStatus[jadwal_id];

    return (
        <AppLayout title="Dashboard Piket">
            {/* Hari Libur Banner */}
            {hariLibur && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3">
                    <CalendarX className="h-5 w-5 text-rose-500 shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-rose-700 dark:text-rose-400">
                            Hari Libur: {hariLibur.nama}
                        </p>
                        <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5">
                            {hariLibur.jam_tertentu === null
                                ? 'Semua jam pembelajaran tidak dihitung dalam keaktifan guru hari ini.'
                                : `Jam JP ${hariLibur.jam_tertentu.join(', ')} tidak dihitung dalam keaktifan jurnal.`}
                        </p>
                    </div>
                </div>
            )}
            {/* Info bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                        <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Presensi Hari Ini</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tglFormatted}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {[
                        { label: 'Total Jam', val: jadwal.length, color: 'indigo' },
                        { label: 'Presensi', val: jadwal.filter((j) => sudahDiisi(j.id)).length, color: 'emerald' },
                        { label: 'Belum', val: jadwal.filter((j) => !sudahDiisi(j.id)).length, color: 'amber' },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="text-center">
                            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{val}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hint: ada pembelajaran belum dijadwalkan */}
            {pembelajaranTanpaJadwal > 0 && (
                <div className="mb-4 p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 flex items-start gap-3">
                    <Info className="h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">
                            {pembelajaranTanpaJadwal} pembelajaran belum memiliki jadwal
                        </p>
                        <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                            Pembelajaran yang belum ditambahkan jadwalnya tidak akan muncul di dashboard ini.
                            Tambahkan jadwal melalui menu <strong>Akademik → Jadwal Pelajaran</strong>.
                        </p>
                    </div>
                </div>
            )}

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                {/* Filter Rombel */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rombel:</span>
                    <select
                        value={rombelFilter}
                        onChange={(e) => setRombelFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-32"
                    >
                        <option value="">Semua Kelas</option>
                        {rombelList.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0 hidden sm:block" />

                {/* Filter JP */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">JP:</span>
                    {[{ label: 'Semua', ke: 0 }, ...[...new Map(jadwal.map((j) => [j.jam_ke, { label: `JP ${j.jam_ke} · ${j.jam_mulai?.substring(0,5)}`, ke: j.jam_ke }])).values()]].map(({ label, ke }) => (
                        <button key={ke} onClick={() => setJamFilter(ke)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                jamFilter === ke ? 'bg-sky-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >{label}</button>
                    ))}
                </div>
            </div>

            {/* Jadwal list */}
            {filtered.length === 0 ? (
                <Card><CardBody>
                    <div className="text-center py-14 text-gray-400">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada jadwal hari {hari} ini.</p>
                    </div>
                </CardBody></Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((item) => {
                        const piket    = piketRecords[item.id] ?? localPiket[item.id];
                        const terisi   = !!piket;
                        const mulai    = toMinutes(item.jam_mulai);
                        const selesai  = toMinutes(item.jam_selesai);
                        const aktif    = mulai >= 0 && selesai > 0 && nowMin >= mulai && nowMin < selesai;
                        const mapel   = item.mapel_nama ?? '–';
                        const rombel  = item.rombel_nama ?? item.mapel_nama ?? '–';
                        const guru    = item.guru_nama ?? '–';
                        const nomor   = item.guru_nomor_wa;
                        const adaJurnal = sudahJurnal(item.id);
                        const guruHadir = piket?.status_guru === 'Hadir';

                        // Pesan WA konfirmasi per-JP (semua status)
                        const waKonfirmasi = terisi && piket.status_guru
                            ? buildWaPerJP(piket.status_guru, guru, mapel, rombel, item.jam_ke, tglFormatted, piket.tugas, piket.keterangan)
                            : '';
                        // Pesan WA reminder jurnal
                        const waJurnal = `Assalamualaikum Bapak/Ibu ${guru},\n\nMohon segera mengisi jurnal mengajar untuk:\n📅 ${tglFormatted}\n📚 ${mapel} – ${rombel} (JP ${item.jam_ke})\n\nTerima kasih. 🙏`;

                        return (
                            <div key={item.id} className={`rounded-xl border p-4 transition-all ${
                                aktif  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-700'
                                : terisi ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                         : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                            }`}>
                                <div className="flex items-start gap-4">
                                    {/* Jam badge */}
                                    <div className="shrink-0 flex flex-col items-center gap-1">
                                        <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center ${
                                            aktif ? 'bg-emerald-500' : 'bg-sky-100 dark:bg-sky-900/40'
                                        }`}>
                                            <span className={`text-xs font-bold leading-none ${aktif ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`}>Jam</span>
                                            <span className={`text-lg font-black leading-none ${aktif ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`}>{item.jam_ke}</span>
                                        </div>
                                        {aktif && (
                                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">● Berlangsung</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">{mapel}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                                        {item.jam_mulai?.substring(0,5)} – {item.jam_selesai?.substring(0,5)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                                        {rombel}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 shrink-0" />
                                                        {guru}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 items-center shrink-0">
                                                {terisi && !expandedPiket[item.id] ? (
                                                    <>
                                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${STATUS_GURU_COLOR[piket.status_guru]}`}>
                                                            {STATUS_GURU_LABEL[piket.status_guru]}
                                                        </span>
                                                        <button
                                                            onClick={() => setExpandedPiket((p) => ({ ...p, [item.id]: true }))}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all"
                                                        >
                                                            <Pencil className="h-3 w-3" /> Ubah
                                                        </button>
                                                    </>
                                                ) : (
                                                    STATUS_GURU.map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleQuickStatus(item, s)}
                                                            disabled={inlineSubmitting && inlineItem?.id === item.id}
                                                            title={STATUS_GURU_LABEL[s]}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                                                piket?.status_guru === s
                                                                    ? STATUS_GURU_BTN_ACTIVE[s]
                                                                    : STATUS_GURU_IDLE[s]
                                                            }`}
                                                        >{STATUS_SHORT[s]}</button>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Baris kedua: WA links + jurnal status */}
                                        {terisi && (
                                            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                                {/* WA Konfirmasi (semua status) */}
                                                {terisi && piket.status_guru && (
                                                    <WaButton
                                                        nomor={nomor}
                                                        text={waKonfirmasi}
                                                        label="Kirim WA Konfirmasi"
                                                        icon={MessageCircle}
                                                        variant={guruHadir ? 'wa' : 'reminder'}
                                                    />
                                                )}

                                                {/* Status jurnal */}
                                                {guruHadir && (
                                                    adaJurnal ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
                                                            <CheckCircle className="h-3 w-3 shrink-0" /> Jurnal Terisi
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
                                                                <AlertCircle className="h-3 w-3 shrink-0" /> Jurnal Belum Diisi
                                                            </span>
                                                            <WaButton
                                                                nomor={nomor}
                                                                text={waJurnal}
                                                                label="Ingatkan Isi Jurnal"
                                                                icon={BellRing}
                                                                variant="reminder"
                                                            />
                                                        </>
                                                    )
                                                )}

                                                {/* Tugas info */}
                                                {piket.tugas && (
                                                    <div className="w-full mt-1 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300">
                                                        <span className="font-semibold">Tugas:</span> {piket.tugas}
                                                        {piket.deadline_tugas && (
                                                            <span className="ml-2 text-sky-500">(Deadline: {String(piket.deadline_tugas).substring(0,10)})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Inline form untuk S / I / TS */}
                                {inlineItem?.id === item.id && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_GURU_COLOR[inlineStatus]}`}>
                                                {STATUS_GURU_LABEL[inlineStatus]}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan &amp; Tugas Siswa</p>
                                        </div>

                                        {/* Keterangan */}
                                        <input
                                            type="text"
                                            value={inlineFields.keterangan}
                                            onChange={(e) => setInlineFields((p) => ({ ...p, keterangan: e.target.value }))}
                                            placeholder="Alasan / keterangan (opsional)..."
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />

                                        {/* Tugas siswa */}
                                        <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 p-3 space-y-2">
                                            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5" /> Tugas Siswa (opsional)
                                            </p>
                                            <textarea
                                                value={inlineFields.tugas}
                                                onChange={(e) => setInlineFields((p) => ({ ...p, tugas: e.target.value }))}
                                                rows={2}
                                                placeholder="Kerjakan soal halaman 45–50..."
                                                className="w-full rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                            />
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-sky-600 dark:text-sky-400 shrink-0">Deadline:</label>
                                                <input
                                                    type="date"
                                                    value={inlineFields.deadline_tugas}
                                                    onChange={(e) => setInlineFields((p) => ({ ...p, deadline_tugas: e.target.value }))}
                                                    className="rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => doSubmitInline(inlineItem, inlineStatus, inlineFields)} loading={inlineSubmitting} icon={CheckCircle}>
                                                Simpan
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => setInlineItem(null)}>
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== KEHADIRAN GURU HARIAN (ringkasan per guru) ===== */}
            {guruKehadiran.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                        <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Kehadiran Guru Harian</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {guruKehadiran.filter((g) => g.tercatat > 0).length} / {guruKehadiran.length} sudah tercatat
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {guruKehadiran.map((guru) => {
                            const { status, slots, tercatat, total } = guru;
                            const waMsg = status
                                ? buildWaGuruHarian(status, guru.nama, tercatat, tglFormatted, slots)
                                : null;

                            return (
                                <div key={guru.id} className={`rounded-xl border p-4 ${
                                    tercatat > 0
                                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        {guru.avatar
                                            ? <img src={guru.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                                            : <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 text-sky-700 dark:text-sky-300 font-bold text-sm">{guru.nama.charAt(0)}</div>
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{guru.nama}</p>
                                            <p className="text-xs text-gray-400">{total} JP hari ini</p>
                                            {status ? (
                                                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 ${STATUS_GURU_COLOR[status]}`}>
                                                    {STATUS_GURU_LABEL[status]}
                                                </span>
                                            ) : (
                                                <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                                                    Belum Tercatat
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* JP status chips */}
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {slots.map((s) => (
                                            <span key={s.jadwal_id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                                                !s.status
                                                    ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                                    : STATUS_GURU_COLOR[s.status]
                                            }`}>
                                                JP {s.jam_ke}
                                                {s.status ? ` · ${STATUS_GURU_LABEL[s.status]}` : ' · –'}
                                            </span>
                                        ))}
                                    </div>

                                    {/* WA Button */}
                                    {status && guru.nomor_wa && (
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                                            <WaButton
                                                nomor={guru.nomor_wa}
                                                text={waMsg}
                                                label="Kirim WA Konfirmasi"
                                                icon={MessageCircle}
                                                variant={status === 'Hadir' ? 'wa' : 'reminder'}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal konfirmasi hapus jurnal */}
            {confirmJurnal && (
                <Modal show={!!confirmJurnal} onClose={() => setConfirmJurnal(null)} title="Konfirmasi Ubah Status">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Jurnal Mengajar Sudah Diisi</p>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                    <strong>{confirmJurnal.item.guru_nama}</strong> sudah mengisi jurnal mengajar untuk JP ini.
                                    Mengubah status ke <strong>{STATUS_GURU_LABEL[confirmJurnal.newStatus]}</strong> akan{' '}
                                    <strong>menghapus jurnal mengajar</strong> hari ini secara permanen.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Yakin ingin melanjutkan?</p>
                        <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="secondary" onClick={() => setConfirmJurnal(null)}>Batal</Button>
                            <Button type="button" variant="danger" onClick={confirmAndProceed}>
                                Ya, Ubah Status
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    );
}
