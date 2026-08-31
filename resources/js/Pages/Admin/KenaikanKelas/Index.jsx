import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import {
    ChevronsUp, X, AlertTriangle, CheckCircle, Users,
    ChevronRight, Loader2, CheckSquare, Square, Info,
    GraduationCap,
} from 'lucide-react';
import { useState, useCallback } from 'react';

const TINGKAT_LABEL = { 10: 'X', 11: 'XI', 12: 'XII' };
const TINGKAT_COLOR = {
    10: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    11: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    12: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
};

/* ─── Modal ─── */
function ProsesModal({ rombel, targetOptions, onClose }) {
    const isLulus   = rombel.tingkat >= 12;
    const nextLevel = rombel.tingkat + 1;

    // Kandidat target: tingkat+1, bukan rombel itu sendiri
    const candidates = targetOptions.filter(r => r.tingkat === nextLevel);

    const [targetId,   setTargetId]   = useState(candidates[0]?.id ?? '');
    const [siswaList,  setSiswaList]  = useState(null); // null = belum dimuat
    const [loading,    setLoading]    = useState(false);
    const [selected,   setSelected]   = useState(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [step,       setStep]       = useState(1); // 1=pilih target, 2=pilih siswa, 3=konfirmasi

    /* Load daftar siswa */
    const loadSiswa = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch(`/admin/kenaikan-kelas/${rombel.id}/siswa`);
            const data = await res.json();
            setSiswaList(data);
            setSelected(new Set(data.map(s => s.id)));
        } catch {
            setSiswaList([]);
        } finally {
            setLoading(false);
        }
    }, [rombel.id]);

    const goStep2 = () => {
        if (!isLulus && !targetId) return;
        setStep(2);
        if (!siswaList) loadSiswa();
    };

    const toggleAll = () => {
        if (!siswaList) return;
        if (selected.size === siswaList.length) setSelected(new Set());
        else setSelected(new Set(siswaList.map(s => s.id)));
    };

    const toggleOne = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSubmit = () => {
        if (selected.size === 0) return;
        setSubmitting(true);
        router.post('/admin/kenaikan-kelas/proses', {
            source_rombel_id: rombel.id,
            target_rombel_id: isLulus ? null : targetId,
            lulus:            isLulus,
            siswa_ids:        [...selected],
        }, {
            onSuccess: onClose,
            onFinish:  () => setSubmitting(false),
        });
    };

    const targetRombel = targetOptions.find(r => String(r.id) === String(targetId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <ChevronsUp className="h-5 w-5 text-sky-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white">Kenaikan Kelas</h3>
                        {/* Step indicator */}
                        <div className="flex items-center gap-1 ml-2">
                            {[1, 2].map(s => (
                                <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? 'w-6 bg-sky-500' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {/* Info sumber rombel */}
                    <div className={`mx-6 mt-5 rounded-xl border px-4 py-3 ${TINGKAT_COLOR[rombel.tingkat] ?? 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Sumber Rombel</p>
                        <p className="font-bold text-base">{rombel.nama}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs opacity-80">
                            <span>Kelas {TINGKAT_LABEL[rombel.tingkat] ?? rombel.kelas_nama}</span>
                            {rombel.jurusan && <span>{rombel.jurusan}</span>}
                            <span>{rombel.tahun_ajaran}</span>
                            <span className="font-semibold">{rombel.siswa_aktif} siswa aktif</span>
                        </div>
                    </div>

                    {/* STEP 1 — Pilih target */}
                    {step === 1 && (
                        <div className="px-6 py-5 space-y-4">
                            {isLulus ? (
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-start gap-3">
                                    <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Siswa Kelas XII — Lulus</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                            Siswa yang dipilih akan ditandai status <strong>Lulus</strong> dan dikeluarkan dari rombel.
                                            Tindakan ini tidak dapat dibatalkan otomatis.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Rombel Tujuan <span className="text-red-500">*</span>
                                    </label>
                                    {candidates.length === 0 ? (
                                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            Tidak ada rombel Kelas {TINGKAT_LABEL[nextLevel] ?? nextLevel} yang tersedia.
                                            Buat rombel tujuan terlebih dahulu.
                                        </div>
                                    ) : (
                                        <select
                                            value={targetId}
                                            onChange={e => setTargetId(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        >
                                            <option value="">— Pilih rombel —</option>
                                            {candidates.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.nama}
                                                    {r.jurusan ? ` — ${r.jurusan}` : ''}
                                                    {' '}({r.tahun_ajaran})
                                                    {' · '}Terisi {r.siswa_aktif}/{r.kapasitas}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Preview target */}
                                    {targetRombel && (
                                        <div className="mt-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <ChevronRight className="h-3.5 w-3.5 text-sky-500" />
                                                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">Target</p>
                                            </div>
                                            <p className="font-bold text-sky-900 dark:text-sky-100">{targetRombel.nama}</p>
                                            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                                                {targetRombel.jurusan} · {targetRombel.tahun_ajaran}
                                                {' · '}Kapasitas: {targetRombel.siswa_aktif}/{targetRombel.kapasitas}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>Pada langkah berikutnya Anda dapat memilih siswa mana saja yang akan diproses.</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 — Pilih siswa */}
                    {step === 2 && (
                        <div className="px-6 py-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Pilih Siswa
                                </p>
                                {siswaList && siswaList.length > 0 && (
                                    <button
                                        onClick={toggleAll}
                                        className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                                    >
                                        {selected.size === siswaList.length ? 'Batalkan Semua' : 'Pilih Semua'}
                                    </button>
                                )}
                            </div>

                            {loading && (
                                <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm">Memuat data siswa...</span>
                                </div>
                            )}

                            {!loading && siswaList && siswaList.length === 0 && (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    Tidak ada siswa aktif di rombel ini.
                                </div>
                            )}

                            {!loading && siswaList && siswaList.length > 0 && (
                                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                    {siswaList.map(s => {
                                        const checked = selected.has(s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => toggleOne(s.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                                    checked
                                                        ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700'
                                                        : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                }`}
                                            >
                                                {checked
                                                    ? <CheckSquare className="h-4 w-4 text-sky-500 shrink-0" />
                                                    : <Square className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                                                }
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.nama}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{s.nis}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {siswaList && siswaList.length > 0 && (
                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    {selected.size} dari {siswaList.length} siswa dipilih
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
                    {step === 1 ? (
                        <>
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Batal
                            </button>
                            <button
                                onClick={goStep2}
                                disabled={!isLulus && !targetId}
                                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                Lanjut — Pilih Siswa <ChevronRight className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                ← Kembali
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || selected.size === 0 || loading}
                                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isLulus
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUp className="h-4 w-4" />}
                                {isLulus ? `Tandai ${selected.size} Siswa Lulus` : `Naikkan ${selected.size} Siswa`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function KenaikanKelasIndex({ rombelList, targetOptions }) {
    const { props: { flash } } = usePage();
    const [activeRombel, setActiveRombel] = useState(null);

    // Kelompokkan per tingkat
    const grouped = [10, 11, 12].map(tingkat => ({
        tingkat,
        label: TINGKAT_LABEL[tingkat] ?? String(tingkat),
        items: rombelList.filter(r => r.tingkat === tingkat),
    })).filter(g => g.items.length > 0);

    return (
        <AppLayout title="Kenaikan Kelas">
            {activeRombel && (
                <ProsesModal
                    rombel={activeRombel}
                    targetOptions={targetOptions}
                    onClose={() => setActiveRombel(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ChevronsUp className="h-5 w-5 text-sky-500" />
                        Kenaikan Kelas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Naikkan siswa dari satu rombel ke rombel berikutnya, atau tandai kelulusan kelas XII.
                    </p>
                </div>
            </div>

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4 shrink-0" /> {flash.success}
                </div>
            )}

            {/* Warning */}
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                    <span className="font-semibold">Perhatian:</span> Kenaikan kelas akan mengubah data rombel siswa secara permanen.
                    Pastikan rombel tujuan sudah dibuat sebelum memproses. Siswa yang tidak naik kelas jangan diikutkan.
                </p>
            </div>

            {rombelList.length === 0 ? (
                <Card>
                    <CardBody className="py-16 text-center text-gray-400">
                        <ChevronsUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Tidak ada rombel aktif.</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-6">
                    {grouped.map(group => (
                        <Card key={group.tingkat}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${TINGKAT_COLOR[group.tingkat]}`}>
                                        Kelas {group.label}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {group.items.length} rombel
                                        {group.tingkat < 12 ? ` → naik ke Kelas ${TINGKAT_LABEL[group.tingkat + 1]}` : ' → Lulus'}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {group.items.map(r => (
                                        <div key={r.id} className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{r.nama}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                    {r.jurusan && <span>{r.jurusan}</span>}
                                                    <span>{r.tahun_ajaran}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{r.siswa_aktif}</p>
                                                    <p className="text-xs text-gray-400">Siswa Aktif</p>
                                                </div>

                                                <button
                                                    onClick={() => setActiveRombel(r)}
                                                    disabled={r.siswa_aktif === 0}
                                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                                        r.siswa_aktif === 0
                                                            ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400'
                                                            : group.tingkat >= 12
                                                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                                                    }`}
                                                >
                                                    {group.tingkat >= 12 ? (
                                                        <><GraduationCap className="h-4 w-4" /> Tandai Lulus</>
                                                    ) : (
                                                        <><ChevronsUp className="h-4 w-4" /> Naikkan Kelas</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
