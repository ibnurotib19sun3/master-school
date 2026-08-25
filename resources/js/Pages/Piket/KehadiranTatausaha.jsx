import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/ui/Button';
import { useState, useEffect } from 'react';
import {
    UserCog, CheckCircle, AlertCircle, MessageCircle, BellRing, CalendarX, Pencil,
} from 'lucide-react';

const STATUS_LIST  = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Tugas_Sekolah'];
const STATUS_LABEL = { Hadir: 'Hadir', Sakit: 'Sakit', Izin: 'Izin', Alpha: 'Alpha', Tugas_Sekolah: 'Tugas Sekolah' };
const STATUS_SHORT = { Hadir: 'H', Sakit: 'S', Izin: 'I', Alpha: 'A', Tugas_Sekolah: 'TS' };

const STATUS_COLOR = {
    Hadir:        'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
    Sakit:        'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
    Izin:         'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
    Alpha:        'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    Tugas_Sekolah:'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
};
const STATUS_IDLE = {
    Hadir:        'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 active:scale-95 dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500',
    Sakit:        'bg-sky-500 text-white border-sky-600 hover:bg-sky-600 active:scale-95 dark:bg-sky-600 dark:border-sky-500 dark:hover:bg-sky-500',
    Izin:         'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 active:scale-95 dark:bg-amber-600 dark:border-amber-500 dark:hover:bg-amber-500',
    Alpha:        'bg-red-500 text-white border-red-600 hover:bg-red-600 active:scale-95 dark:bg-red-600 dark:border-red-500 dark:hover:bg-red-500',
    Tugas_Sekolah:'bg-purple-500 text-white border-purple-600 hover:bg-purple-600 active:scale-95 dark:bg-purple-600 dark:border-purple-500 dark:hover:bg-purple-500',
};
const STATUS_ACTIVE = {
    Hadir:        'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 dark:ring-emerald-500',
    Sakit:        'bg-sky-700 text-white border-sky-800 ring-2 ring-sky-400 dark:ring-sky-500',
    Izin:         'bg-amber-700 text-white border-amber-800 ring-2 ring-amber-400 dark:ring-amber-500',
    Alpha:        'bg-red-700 text-white border-red-800 ring-2 ring-red-400 dark:ring-red-500',
    Tugas_Sekolah:'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400 dark:ring-purple-500',
};

const PERLU_KET = ['Sakit', 'Izin', 'Tugas_Sekolah'];

function buildWaMsg(status, nama, jabatan, tglFmt, keterangan) {
    const header = `Assalamualaikum Bapak/Ibu ${nama},\n\nBerikut informasi presensi Anda:\n📅 ${tglFmt}\n💼 ${jabatan}\n`;
    const ket    = keterangan ? `\nKeterangan: _${keterangan}_` : '';
    switch (status) {
        case 'Hadir':        return header + `✅ *Status: Hadir*\nKehadiran Anda hari ini telah tercatat. Mohon segera mengisi jurnal harian.\n\nTerima kasih. 🙏`;
        case 'Sakit':        return header + `🤒 *Status: Sakit*\nKetidakhadiran Anda karena sakit telah tercatat.${ket}\n\nSemoga lekas sembuh. 🙏`;
        case 'Izin':         return header + `📋 *Status: Izin*\nIzin Anda hari ini telah tercatat.${ket}\n\nTerima kasih. 🙏`;
        case 'Alpha':        return header + `⚠️ *Status: Alpha*\nKetidakhadiran Anda tercatat sebagai *Alpha* karena tidak ada pemberitahuan sebelumnya. Segera hubungi pihak sekolah.`;
        case 'Tugas_Sekolah':return header + `📋 *Status: Tugas Sekolah*\nAnda tercatat sedang melaksanakan tugas di luar kantor.${ket}\n\nTerima kasih. 🙏`;
        default:             return header + `Status kehadiran Anda hari ini telah tercatat.`;
    }
}

function WaButton({ nomor, text, label, icon: Icon, variant = 'wa' }) {
    if (!nomor) return null;
    const bersih = nomor.replace(/\D/g, '');
    const url    = `https://wa.me/${bersih}?text=${encodeURIComponent(text)}`;
    const cls    = variant === 'reminder'
        ? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 transition-colors'
        : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 transition-colors';
    return (
        <a href={url} target="_blank" rel="noreferrer" className={cls}>
            <Icon className="h-3 w-3 shrink-0" /> {label}
        </a>
    );
}

export default function KehadiranTatausaha({ tatausahaList = [], absensiTatausaha = {}, jurnalTuHariIni = {}, tanggal, hari, hariLibur = null }) {
    const [inlineItem,    setInlineItem]    = useState(null);
    const [inlineStatus,  setInlineStatus]  = useState('');
    const [inlineKet,     setInlineKet]     = useState('');
    const [submitting,    setSubmitting]    = useState(false);
    const [expanded,      setExpanded]      = useState({});
    const [localStatus,   setLocalStatus]   = useState({});

    useEffect(() => {
        setLocalStatus(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(id => {
                if (absensiTatausaha[id]) { delete next[id]; changed = true; }
            });
            return changed ? next : prev;
        });
    }, [absensiTatausaha]);

    const tglFormatted = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const handleStatus = (tu, newStatus) => {
        if (PERLU_KET.includes(newStatus)) {
            const existing = absensiTatausaha[tu.id];
            setInlineItem(tu);
            setInlineStatus(newStatus);
            setInlineKet(existing?.status === newStatus ? (existing?.keterangan ?? '') : '');
        } else {
            submitDirect(tu, newStatus, '');
        }
    };

    const submitDirect = (tu, status, keterangan) => {
        setSubmitting(true);
        setLocalStatus(p => ({ ...p, [tu.id]: { status, keterangan } }));
        setExpanded(p => { const n = { ...p }; delete n[tu.id]; return n; });
        router.post('/piket/absensi-tatausaha', { tatausaha_id: tu.id, status, keterangan }, {
            onSuccess: () => { setInlineItem(null); },
            onError:   () => { setLocalStatus(p => { const n = { ...p }; delete n[tu.id]; return n; }); },
            onFinish:  () => setSubmitting(false),
        });
    };

    const diisi  = Object.keys(absensiTatausaha).length;
    const total  = tatausahaList.length;

    return (
        <AppLayout title="Kehadiran TU">
            {/* Hari Libur Banner */}
            {hariLibur && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3">
                    <CalendarX className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm">Hari Libur: {hariLibur.nama}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                        <UserCog className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Kehadiran Tata Usaha</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tglFormatted}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {[
                        { label: 'Total', val: total,         color: 'sky' },
                        { label: 'Diisi', val: diisi,         color: 'emerald' },
                        { label: 'Belum', val: total - diisi, color: 'amber' },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="text-center">
                            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{val}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {tatausahaList.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
                    <UserCog className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {hariLibur ? 'Hari libur — presensi tidak tersedia.' : 'Tidak ada data tata usaha aktif.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tatausahaList.map((tu) => {
                        const absensi   = absensiTatausaha[tu.id] ?? localStatus[tu.id];
                        const nama      = tu.user?.name ?? 'Karyawan';
                        const status    = absensi?.status;
                        const hadir     = status === 'Hadir' || status === 'Tugas_Sekolah';
                        const adaJurnal = !!jurnalTuHariIni[tu.id];

                        const waMsg    = status ? buildWaMsg(status, nama, tu.jabatan ?? 'Tata Usaha', tglFormatted, absensi?.keterangan) : '';
                        const waJurnal = `Assalamualaikum Bapak/Ibu ${nama},\n\nMohon segera mengisi jurnal harian tata usaha:\n📅 ${tglFormatted}\n\nTerima kasih. 🙏`;

                        return (
                            <div key={tu.id} className={`rounded-xl border p-4 ${
                                absensi ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                            }`}>
                                {/* Avatar + Nama */}
                                <div className="flex items-center gap-3 mb-3">
                                    {tu.user?.avatar_url
                                        ? <img src={tu.user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                                        : <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 text-sky-700 dark:text-sky-300 font-bold text-sm">{nama.charAt(0)}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{nama}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tu.jabatan ?? 'Tata Usaha'}</p>
                                    </div>
                                </div>

                                {/* Status buttons */}
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {absensi && !expanded[tu.id] ? (
                                        <>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${STATUS_COLOR[status]}`}>
                                                {STATUS_LABEL[status] ?? status}
                                            </span>
                                            <button
                                                onClick={() => setExpanded(p => ({ ...p, [tu.id]: true }))}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all"
                                            >
                                                <Pencil className="h-3 w-3" /> Ubah
                                            </button>
                                        </>
                                    ) : (
                                        STATUS_LIST.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatus(tu, s)}
                                                disabled={submitting && inlineItem?.id === tu.id}
                                                title={STATUS_LABEL[s]}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                                    status === s ? STATUS_ACTIVE[s] : STATUS_IDLE[s]
                                                }`}
                                            >{STATUS_SHORT[s]}</button>
                                        ))
                                    )}
                                </div>

                                {/* Inline keterangan */}
                                {inlineItem?.id === tu.id && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[inlineStatus]}`}>
                                                {STATUS_LABEL[inlineStatus]}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan (opsional)</p>
                                        </div>
                                        <input
                                            type="text"
                                            value={inlineKet}
                                            onChange={e => setInlineKet(e.target.value)}
                                            placeholder="Alasan / keterangan..."
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => submitDirect(inlineItem, inlineStatus, inlineKet)} loading={submitting} icon={CheckCircle}>
                                                Simpan
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => setInlineItem(null)}>
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Jurnal status (jika hadir) */}
                                {hadir && (
                                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                        {adaJurnal ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
                                                <CheckCircle className="h-3 w-3 shrink-0" /> Jurnal Terisi
                                            </span>
                                        ) : (
                                            <>
                                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
                                                    <AlertCircle className="h-3 w-3 shrink-0" /> Jurnal Belum Diisi
                                                </span>
                                                <WaButton nomor={tu.nomor_wa} text={waJurnal} label="Ingatkan Isi Jurnal" icon={BellRing} variant="reminder" />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* WA konfirmasi */}
                                {absensi && tu.nomor_wa && (
                                    <div className={`${hadir ? 'mt-2' : 'mt-2.5'} pt-2.5 border-t border-gray-100 dark:border-gray-700`}>
                                        <WaButton
                                            nomor={tu.nomor_wa}
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
            )}
        </AppLayout>
    );
}
