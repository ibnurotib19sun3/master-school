import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { BookOpen, AlertTriangle, CheckCircle2, ArrowDownToLine, Wand2, NotebookPen } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

/* ── Toggle switch (pola sama seperti di Admin/Pengumpulan/Index.jsx) ── */
function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            } ${checked ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
            <span
                className={`pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200 ${
                    checked ? 'translate-x-5' : 'translate-x-0.5'
                }`}
                style={{ height: '18px', width: '18px' }}
            />
        </button>
    );
}

const jurusanKeyOf = (jurusanId) => jurusanId ?? 'null';

export default function JadwalLiterasi({ rombelList, guruList, tahunAktif, hariAktif, jumlahJp, literasiIsiJurnal }) {
    // Slot yang perlu diisi untuk 1 rombel+hari: 1 slot (gabungan) atau beberapa slot
    // (dipisah per jurusan) — ditentukan dari struktur jadwal JP pertama saat ini
    // (saran_per_hari), supaya UI selalu mengikuti kondisi jadwal terkini. Kalau hari
    // itu belum punya jadwal non-literasi sama sekali, jatuh balik ke data literasi
    // yang sudah tersimpan, atau 1 slot gabungan kosong kalau belum ada apa-apa.
    const getSlots = (r, hari) => {
        const saran = r.saran_per_hari?.[hari] || [];
        if (saran.length > 0) return saran.map((s) => ({ jurusan_id: s.jurusan_id, jurusan_nama: s.jurusan_nama }));
        const saved = r.guru_per_hari?.[hari] || [];
        if (saved.length > 0) return saved.map((s) => ({ jurusan_id: s.jurusan_id, jurusan_nama: s.jurusan_nama }));
        return [{ jurusan_id: null, jurusan_nama: null }];
    };

    const buildInitial = () => Object.fromEntries(
        rombelList.map((r) => [
            r.id,
            Object.fromEntries(hariAktif.map((h) => {
                const map = {};
                (r.guru_per_hari?.[h] || []).forEach((s) => {
                    map[jurusanKeyOf(s.jurusan_id)] = s.guru_id ? String(s.guru_id) : '';
                });
                return [h, map];
            })),
        ])
    );

    const [assignments, setAssignments] = useState(buildInitial);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [isiJurnal, setIsiJurnal] = useState(!!literasiIsiJurnal);
    const [isiJurnalSaving, setIsiJurnalSaving] = useState(false);

    const setGuru = (rombelId, hari, jurusanKey, guruId) => {
        setAssignments((prev) => ({
            ...prev,
            [rombelId]: { ...prev[rombelId], [hari]: { ...prev[rombelId]?.[hari], [jurusanKey]: guruId } },
        }));
    };

    // assignments[rombelId][hari] bisa menyimpan key jurusan "basi" dari sebelum
    // status gabungan/dipisah berubah (mis. dulu gabungan key 'null', sekarang
    // dipisah jadi key jurusan asli) — dibatasi ke slot yang benar-benar aktif
    // sekarang supaya tidak ikut kehitung dobel di deteksi bentrok atau terkirim
    // ke server sebagai entri hantu.
    const getCurrentMap = (r, hari) => {
        const raw = assignments[r.id]?.[hari] || {};
        const map = {};
        getSlots(r, hari).forEach((slot) => {
            const key = jurusanKeyOf(slot.jurusan_id);
            if (raw[key]) map[key] = raw[key];
        });
        return map;
    };

    const isHariMigrated = (r, hari) => r.hari_migrasi.includes(hari);
    const isFullyMigrated = (r) => hariAktif.every((h) => isHariMigrated(r, h));

    // Perubahan yang belum diterapkan: slot (rombel+hari+jurusan) yang nilainya
    // berbeda dari data tersimpan.
    const changedEntries = useMemo(() => {
        const list = [];
        rombelList.forEach((r) => {
            hariAktif.forEach((hari) => {
                const savedMap = {};
                (r.guru_per_hari?.[hari] || []).forEach((s) => { savedMap[jurusanKeyOf(s.jurusan_id)] = s.guru_id ? String(s.guru_id) : ''; });
                const currentMap = assignments[r.id]?.[hari] || {};
                getSlots(r, hari).forEach((slot) => {
                    const key = jurusanKeyOf(slot.jurusan_id);
                    const selected = currentMap[key] || '';
                    const original = savedMap[key] || '';
                    if (selected && selected !== original) {
                        list.push({ rombelId: r.id, hari });
                    }
                });
            });
        });
        return list;
    }, [assignments, rombelList, hariAktif]);

    const changedHariSet = useMemo(() => new Set(changedEntries.map((e) => `${e.rombelId}::${e.hari}`)), [changedEntries]);

    // Deteksi guru yang dipilih ganda pada hari yang sama (tidak boleh — literasi
    // berlangsung bersamaan di semua rombel/jurusan pada hari itu).
    const dupKeys = useMemo(() => {
        const dup = new Set();
        hariAktif.forEach((hari) => {
            const counts = {};
            rombelList.forEach((r) => {
                const currentMap = getCurrentMap(r, hari);
                Object.values(currentMap).forEach((g) => {
                    if (g) counts[g] = (counts[g] || 0) + 1;
                });
            });
            Object.entries(counts).forEach(([g, c]) => {
                if (c > 1) dup.add(`${hari}:${g}`);
            });
        });
        return dup;
    }, [assignments, rombelList, hariAktif]);

    const isDup = (rombelId, hari, jurusanKey) => {
        const g = assignments[rombelId]?.[hari]?.[jurusanKey];
        return !!g && dupKeys.has(`${hari}:${g}`);
    };

    // Sesuaikan SEMUA slot (termasuk yang sudah terisi) dengan guru yang mengajar JP
    // pertama (non-literasi) di rombel+hari(+jurusan) itu saat ini — dihitung server
    // dari jadwal aktual, jadi otomatis benar untuk hari gabungan maupun dipisah per
    // jurusan. Sengaja menimpa nilai lama juga (bukan cuma isi yang kosong) supaya
    // tombol ini benar-benar "menarik ulang" data terkini. Belum tersimpan ke server
    // sampai "Terapkan" diklik, jadi aman untuk dicoba.
    const [tarikMessage, setTarikMessage] = useState('');
    const tarikMessageTimer = useRef(null);
    const tarikDataJadwal = () => {
        const next = {};
        let changedCount = 0;
        rombelList.forEach((r) => {
            next[r.id] = { ...assignments[r.id] };
            hariAktif.forEach((hari) => {
                const saran = r.saran_per_hari?.[hari] || [];
                if (saran.length === 0) return;
                const currentMap = { ...(assignments[r.id]?.[hari] || {}) };
                saran.forEach((s) => {
                    if (!s.guru_id) return;
                    const key = jurusanKeyOf(s.jurusan_id);
                    const saranStr = String(s.guru_id);
                    if ((currentMap[key] || '') !== saranStr) {
                        changedCount++;
                        currentMap[key] = saranStr;
                    }
                });
                next[r.id][hari] = currentMap;
            });
        });
        setAssignments(next);
        setTarikMessage(changedCount > 0
            ? `${changedCount} pilihan disesuaikan dengan jadwal terkini (termasuk yang dipisah/digabung per jurusan). Klik Terapkan untuk menyimpan.`
            : 'Semua pilihan sudah sesuai dengan jadwal terkini — tidak ada yang perlu diubah.');
        clearTimeout(tarikMessageTimer.current);
        tarikMessageTimer.current = setTimeout(() => setTarikMessage(''), 5000);
    };

    const submit = () => {
        setProcessing(true);
        const grouped = {};
        changedHariSet.forEach((key) => {
            const [rombelIdStr, hari] = key.split('::');
            const rombelId = Number(rombelIdStr);
            const r = rombelList.find((item) => item.id === rombelId);
            const currentMap = r ? getCurrentMap(r, hari) : {};
            const entries = Object.entries(currentMap)
                .filter(([, guruId]) => guruId)
                .map(([jurusanKey, guruId]) => ({
                    jurusan_id: jurusanKey === 'null' ? null : Number(jurusanKey),
                    guru_id: guruId,
                }));
            if (entries.length === 0) return;
            grouped[rombelId] = grouped[rombelId] || {};
            grouped[rombelId][hari] = entries;
        });
        const payload = Object.entries(grouped).map(([rombelId, guru_per_hari]) => ({
            rombel_id: Number(rombelId),
            guru_per_hari,
        }));

        router.post('/admin/jadwal-literasi', { assignments: payload }, {
            preserveScroll: true,
            onSuccess: () => setShowConfirm(false),
            onFinish: () => setProcessing(false),
        });
    };

    const toggleIsiJurnal = () => {
        const next = !isiJurnal;
        setIsiJurnal(next);
        setIsiJurnalSaving(true);
        router.post('/admin/jadwal-literasi/isi-jurnal', { isi_jurnal: next }, {
            preserveScroll: true,
            onError: () => setIsiJurnal(!next),
            onFinish: () => setIsiJurnalSaving(false),
        });
    };

    return (
        <AppLayout title="Jam Literasi">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-sky-500" /> Jam Literasi
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Sisipkan Jam Literasi di JP1 setiap hari (JP2 khusus Senin) untuk tiap rombel — pengampu bisa berbeda tiap hari, dan tiap jurusan kalau jadwalnya dipisah
                        {tahunAktif && <> · {tahunAktif.nama} — {tahunAktif.semester}</>}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-start gap-2.5">
                        <NotebookPen className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Isi Jurnal Mengajar untuk Jam Literasi</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {isiJurnal
                                    ? 'Aktif — Jam Literasi muncul di daftar jurnal mengajar guru dan bisa diisi seperti pelajaran lain.'
                                    : 'Nonaktif (default) — Jam Literasi tidak muncul di jurnal mengajar guru.'}
                            </p>
                        </div>
                    </div>
                    <Toggle checked={isiJurnal} onChange={toggleIsiJurnal} disabled={isiJurnalSaving} />
                </div>

                <div className="flex items-start gap-2.5 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                        <p>Menerapkan Jam Literasi untuk 1 rombel akan menggeser semua pelajaran di hari itu turun satu JP (Senin mulai dari JP2, hari lain mulai dari JP1).</p>
                        <p>Proses ini aman diulang — rombel/hari yang sudah pernah diterapkan otomatis dilewati, tidak akan tergeser dua kali.</p>
                        <p>Pengampu literasi boleh berbeda tiap hari untuk rombel yang sama. Mengubah pengampu di hari yang sudah diterapkan cukup memindahkan pengajarnya, tanpa menggeser ulang jadwal.</p>
                        <p>Untuk rombel gabungan jurusan: kalau JP pertama di suatu hari dipisah per jurusan, Jam Literasi hari itu juga otomatis dipisah — 1 pengampu per jurusan. Kalau digabung, cukup 1 pengampu untuk semua.</p>
                        <p>Satu guru tidak bisa jadi pengampu literasi di lebih dari 1 rombel/jurusan pada hari yang sama (semua rombel literasi berlangsung bersamaan).</p>
                        <p>Tombol <span className="font-semibold">Tarik Data Jadwal</span> menyesuaikan SEMUA pilihan (termasuk yang sudah terisi) dengan guru yang mengajar JP pertama (sebelum literasi) di rombel, hari, dan jurusan itu, sesuai jadwal saat ini. Belum tersimpan sampai <span className="font-semibold">Terapkan</span> diklik.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle>Daftar Rombel ({rombelList.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button icon={Wand2} variant="secondary" onClick={tarikDataJadwal}>
                                Tarik Data Jadwal
                            </Button>
                            <Button icon={ArrowDownToLine} disabled={changedEntries.length === 0 || dupKeys.size > 0} onClick={() => setShowConfirm(true)}>
                                Terapkan ({changedEntries.length})
                            </Button>
                        </div>
                    </CardHeader>
                    {tarikMessage && (
                        <div className="px-4 py-2.5 text-xs font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-t border-sky-100 dark:border-sky-800">
                            {tarikMessage}
                        </div>
                    )}
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Rombel</th>
                                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Status</th>
                                        {hariAktif.map((hari) => (
                                            <th key={hari} className="px-3 py-3 text-left font-medium whitespace-nowrap">{hari}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {rombelList.map((r) => {
                                        const done = isFullyMigrated(r);
                                        return (
                                            <tr key={r.id} className={done ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''}>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 align-top">
                                                    {r.nama}
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell align-top">
                                                    {done ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Lengkap ({r.hari_migrasi.length}/{hariAktif.length})
                                                        </span>
                                                    ) : r.hari_migrasi.length > 0 ? (
                                                        <span className="text-xs text-amber-600 dark:text-amber-400">Sebagian ({r.hari_migrasi.length}/{hariAktif.length})</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Belum diterapkan</span>
                                                    )}
                                                </td>
                                                {hariAktif.map((hari) => {
                                                    const slots = getSlots(r, hari);
                                                    const migrated = isHariMigrated(r, hari);
                                                    const anyDup = slots.some((slot) => isDup(r.id, hari, jurusanKeyOf(slot.jurusan_id)));
                                                    return (
                                                        <td key={hari} className="px-3 py-3 align-top">
                                                            <div className="space-y-2">
                                                                {slots.map((slot) => {
                                                                    const jurusanKey = jurusanKeyOf(slot.jurusan_id);
                                                                    const dup = isDup(r.id, hari, jurusanKey);
                                                                    const value = assignments[r.id]?.[hari]?.[jurusanKey] ?? '';
                                                                    return (
                                                                        <div key={jurusanKey}>
                                                                            {slots.length > 1 && (
                                                                                <p className="text-[10px] font-semibold text-sky-500 uppercase mb-0.5">{slot.jurusan_nama || 'Gabungan'}</p>
                                                                            )}
                                                                            <select
                                                                                value={value}
                                                                                onChange={(e) => setGuru(r.id, hari, jurusanKey, e.target.value)}
                                                                                className={`rounded-lg border px-2.5 py-1.5 text-sm w-full min-w-[9rem] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                                                                                    dup ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                                                                                }`}
                                                                            >
                                                                                <option value="">— Pilih guru —</option>
                                                                                {guruList.map((g) => (
                                                                                    <option key={g.id} value={g.id}>{g.nama}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="mt-1 min-h-[1rem]">
                                                                {anyDup ? (
                                                                    <p className="text-[11px] text-red-500">Bentrok hari ini</p>
                                                                ) : migrated ? (
                                                                    <p className="text-[11px] text-emerald-500 inline-flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Diterapkan</p>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <ConfirmDialog
                show={showConfirm}
                title="Terapkan Jam Literasi"
                message={`Jam Literasi akan diterapkan/diperbarui untuk ${changedEntries.length} slot rombel×hari(×jurusan). Jadwal yang belum pernah diterapkan akan digeser turun satu JP. Lanjutkan?`}
                confirmLabel={processing ? 'Memproses...' : 'Ya, Terapkan'}
                onConfirm={submit}
                onCancel={() => setShowConfirm(false)}
            />
        </AppLayout>
    );
}
