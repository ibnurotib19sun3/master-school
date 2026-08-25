import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import Button from '@/Components/ui/Button';
import { useState, useEffect } from 'react';
import {
    Crown, CheckCircle, MessageCircle, CalendarX, Pencil,
} from 'lucide-react';

const STATUS_LIST  = ['Hadir', 'Tugas_Sekolah', 'Tidak_Hadir'];
const STATUS_LABEL = { Hadir: 'Hadir', Tugas_Sekolah: 'Tugas Sekolah', Tidak_Hadir: 'Tidak Hadir' };
const STATUS_SHORT = { Hadir: 'H', Tugas_Sekolah: 'TS', Tidak_Hadir: 'TH' };

const STATUS_COLOR = {
    Hadir:        'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
    Tugas_Sekolah:'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
    Tidak_Hadir:  'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    // lama — untuk data lama yang masih tampil
    Sakit:        'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
    Izin:         'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
    Alpha:        'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
};
const STATUS_IDLE = {
    Hadir:        'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 active:scale-95 dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500',
    Tugas_Sekolah:'bg-purple-500 text-white border-purple-600 hover:bg-purple-600 active:scale-95 dark:bg-purple-600 dark:border-purple-500 dark:hover:bg-purple-500',
    Tidak_Hadir:  'bg-red-500 text-white border-red-600 hover:bg-red-600 active:scale-95 dark:bg-red-600 dark:border-red-500 dark:hover:bg-red-500',
};
const STATUS_ACTIVE = {
    Hadir:        'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 dark:ring-emerald-500',
    Tugas_Sekolah:'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400 dark:ring-purple-500',
    Tidak_Hadir:  'bg-red-700 text-white border-red-800 ring-2 ring-red-400 dark:ring-red-500',
};

const PERLU_KET = ['Tidak_Hadir'];

function buildWaMsg(status, nama, jabatan, tglFmt, keterangan) {
    const header = `Assalamualaikum Bapak/Ibu ${nama},\n\nBerikut informasi presensi Anda:\n📅 ${tglFmt}\n💼 ${jabatan}\n`;
    const ket    = keterangan ? `\nKeterangan: _${keterangan}_` : '';
    switch (status) {
        case 'Hadir':         return header + `✅ *Status: Hadir*\nKehadiran Anda hari ini telah tercatat.\n\nTerima kasih. 🙏`;
        case 'Tugas_Sekolah': return header + `📌 *Status: Tugas Sekolah*\nAnda tercatat melaksanakan tugas sekolah hari ini.\n\nTerima kasih. 🙏`;
        case 'Tidak_Hadir':   return header + `❌ *Status: Tidak Hadir*\nKetidakhadiran Anda hari ini telah tercatat.${ket}\n\nHarap segera menghubungi pihak sekolah jika diperlukan. 🙏`;
        default:              return header + `Status kehadiran Anda hari ini telah tercatat.`;
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

export default function KehadiranManajemen({ manajemenList = [], absensiManajemen = {}, tanggal, hari, hariLibur = null }) {
    const [inlineItem,   setInlineItem]   = useState(null);
    const [inlineStatus, setInlineStatus] = useState('');
    const [inlineKet,    setInlineKet]    = useState('');
    const [submitting,   setSubmitting]   = useState(false);
    const [expanded,     setExpanded]     = useState({});
    const [localStatus,  setLocalStatus]  = useState({});

    useEffect(() => {
        setLocalStatus(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(id => {
                if (absensiManajemen[id]) { delete next[id]; changed = true; }
            });
            return changed ? next : prev;
        });
    }, [absensiManajemen]);

    const tglFormatted = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const handleStatus = (mgr, status) => {
        if (PERLU_KET.includes(status)) {
            const existing = absensiManajemen[mgr.id];
            setInlineItem(mgr);
            setInlineStatus(status);
            setInlineKet(existing?.status === status ? (existing?.keterangan ?? '') : '');
        } else {
            submitDirect(mgr, status, '');
        }
    };

    const submitDirect = (mgr, status, keterangan) => {
        setSubmitting(true);
        setLocalStatus(p => ({ ...p, [mgr.id]: { status, keterangan } }));
        setExpanded(p => { const n = { ...p }; delete n[mgr.id]; return n; });
        router.post('/piket/absensi-guru', { guru_id: mgr.id, status, keterangan }, {
            onSuccess: () => { setInlineItem(null); },
            onError:   () => { setLocalStatus(p => { const n = { ...p }; delete n[mgr.id]; return n; }); },
            onFinish:  () => setSubmitting(false),
        });
    };

    const diisi = manajemenList.filter(m => absensiManajemen[m.id]).length;
    const total = manajemenList.length;

    return (
        <AppLayout title="Kehadiran Manajemen">
            {/* Hari Libur Banner */}
            {hariLibur && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3">
                    <CalendarX className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm">Hari Libur: {hariLibur.nama}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                        <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Kehadiran Manajemen</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tglFormatted}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {[
                        { label: 'Total', val: total,         color: 'amber' },
                        { label: 'Diisi', val: diisi,         color: 'emerald' },
                        { label: 'Belum', val: total - diisi, color: 'red' },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="text-center">
                            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{val}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {manajemenList.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
                    <Crown className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {hariLibur ? 'Hari libur — presensi tidak tersedia.' : 'Tidak ada data manajemen aktif.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {manajemenList.map((mgr) => {
                        const absensi      = absensiManajemen[mgr.id] ?? localStatus[mgr.id];
                        const status       = absensi?.status;
                        const jabatanLabel = Array.isArray(mgr.jabatan) && mgr.jabatan.length > 0
                            ? mgr.jabatan.join(' · ') : '–';

                        const waMsg = status
                            ? buildWaMsg(status, mgr.nama, jabatanLabel, tglFormatted, absensi?.keterangan)
                            : '';

                        return (
                            <div key={mgr.id} className={`rounded-xl border p-4 ${
                                absensi ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                            }`}>
                                {/* Avatar + Nama */}
                                <div className="flex items-center gap-3 mb-3">
                                    {mgr.avatar
                                        ? <img src={mgr.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0"
                                            onError={e => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mgr.nama)}&background=f59e0b&color=fff&bold=true&size=64`; }} />
                                        : <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300 font-bold text-sm">{mgr.nama.charAt(0)}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{mgr.nama}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{jabatanLabel}</p>
                                    </div>
                                </div>

                                {/* Status buttons */}
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {absensi && !expanded[mgr.id] ? (
                                        <>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${STATUS_COLOR[status]}`}>
                                                {STATUS_LABEL[status]}
                                            </span>
                                            <button
                                                onClick={() => setExpanded(p => ({ ...p, [mgr.id]: true }))}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all"
                                            >
                                                <Pencil className="h-3 w-3" /> Ubah
                                            </button>
                                        </>
                                    ) : (
                                        STATUS_LIST.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatus(mgr, s)}
                                                disabled={submitting && inlineItem?.id === mgr.id}
                                                title={STATUS_LABEL[s]}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                                    status === s ? STATUS_ACTIVE[s] : STATUS_IDLE[s]
                                                }`}
                                            >{STATUS_SHORT[s]}</button>
                                        ))
                                    )}
                                </div>

                                {/* Inline keterangan (Sakit / Izin) */}
                                {inlineItem?.id === mgr.id && (
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
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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

                                {/* WA konfirmasi */}
                                {absensi && mgr.nomor_wa && (
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                                        <WaButton
                                            nomor={mgr.nomor_wa}
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
