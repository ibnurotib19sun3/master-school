import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import {
    FileText, Calendar, Clock, BookOpen, Users,
    CheckCircle, AlertCircle, Lock, Upload, Info, Video,
    Presentation, BookMarked, FileSpreadsheet, Link as LinkIcon,
    ExternalLink, Download, ListChecks, X, ChevronDown, Search,
} from 'lucide-react';
import { useRef, useState } from 'react';

const METODE = ['Ceramah', 'Diskusi', 'Praktik', 'Proyek', 'Kooperatif', 'Lainnya'];

function groupByPembelajaran(jadwalList) {
    const map = {};
    for (const j of jadwalList) {
        const pid = j.pembelajaran_id;
        if (!map[pid]) map[pid] = [];
        map[pid].push(j);
    }
    // sort each group by jam_ke
    return Object.values(map).map((g) => g.sort((a, b) => a.jam_ke - b.jam_ke));
}

function formatJamKe(group) {
    const jams = group.map((j) => j.jam_ke);
    if (jams.length === 1) return `JP ${jams[0]}`;
    const consecutive = jams.every((v, i) => i === 0 || v === jams[i - 1] + 1);
    return consecutive ? `JP ${jams[0]}–${jams[jams.length - 1]}` : `JP ${jams.join(', ')}`;
}
const MEDIA_TYPES = ['Video Pembelajaran', 'Presentasi', 'Modul Ajar', 'Jobsheet', 'Papan Tulis', 'Lainnya'];

const PIKET_COLOR = {
    Hadir:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Sakit:        'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Izin:         'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Alpha:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Tugas_Sekolah:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const PIKET_LABEL = { Tugas_Sekolah: 'Tugas Sekolah' };

const MEDIA_CFG = {
    'Video Pembelajaran': { list: 'videoList',     accept: null,                      label: 'Video',       icon: Video,          urlField: true  },
    'Presentasi':         { list: 'presentasiList', accept: '.pptx,.ppt,.pdf',         label: 'Presentasi',  icon: Presentation,   urlField: false },
    'Modul Ajar':         { list: 'modulList',      accept: '.pdf,.doc,.docx',         label: 'Modul Ajar',  icon: BookMarked,     urlField: false },
    'Jobsheet':           { list: 'jobsheetList',   accept: '.pdf,.doc,.docx,.xlsx,.xlsm', label: 'Jobsheet', icon: FileSpreadsheet, urlField: false },
};

const MEDIA_ICON = {
    'Video Pembelajaran': Video,
    'Presentasi':         Presentation,
    'Modul Ajar':         BookMarked,
    'Jobsheet':           FileSpreadsheet,
};

function MediaViewBtn({ mediaType, mediaLink, mediaRefJudul, mediaUrl }) {
    const link = mediaLink || mediaUrl;
    if (!link || !mediaType || mediaType === 'Papan Tulis') return null;
    const Icon  = MEDIA_ICON[mediaType] ?? ExternalLink;
    const isVid = mediaType === 'Video Pembelajaran';
    return (
        <a href={link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors whitespace-nowrap">
            {isVid ? <ExternalLink className="h-3 w-3" /> : <Download className="h-3 w-3" />}
            <Icon className="h-3 w-3" />
            {mediaRefJudul ?? (isVid ? 'Tonton' : 'Buka')}
        </a>
    );
}

function initForm() {
    return {
        pembelajaran_id: '', jadwal_id: '',
        jadwal_ids: [],
        materi_pokok: '', uraian_materi: '',
        capaian_ids: [],
        metode: ['Ceramah'],
        media_type: '', media_ref_id: '', media_url: '',
        media_file: null, media_judul: '',
        catatan: '',
        _relatedJadwal: [],
    };
}

function CapaianMultiSelect({ value, onChange, options, mapelNama }) {
    const [search, setSearch] = useState('');
    const [open, setOpen]     = useState(false);
    const containerRef        = useRef(null);

    const selected = options.filter((o) => value.includes(o.id));
    const filtered = options.filter(
        (o) => !value.includes(o.id) &&
               (o.kode_lengkap.toLowerCase().includes(search.toLowerCase()) ||
                o.capaian.toLowerCase().includes(search.toLowerCase()))
    );

    const toggle = (id) => {
        onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
        setOpen(false);
        setSearch('');
    };

    return (
        <div className="w-full" ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capaian Pembelajaran
                {mapelNama && <span className="ml-1.5 text-xs font-normal text-sky-500">— {mapelNama}</span>}
            </label>

            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                    {selected.map((o) => (
                        <div key={o.id} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800">
                            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs shrink-0 mt-0.5">{o.kode_lengkap}</span>
                            <span className="flex-1 text-xs text-sky-800 dark:text-sky-300 leading-relaxed">{o.capaian}</span>
                            <button type="button" onClick={() => toggle(o.id)} className="shrink-0 p-0.5 hover:text-red-500 text-sky-400 dark:text-sky-500 transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Trigger */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((p) => !p)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <span className={selected.length === 0 ? 'text-gray-400' : ''}>
                        {selected.length === 0 ? 'Pilih capaian pembelajaran…' : `${selected.length} capaian dipilih`}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                    <div className="absolute z-40 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-64 flex flex-col">
                        {/* Search */}
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari kode atau capaian…"
                                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {options.length === 0 ? (
                                <div className="px-3 py-4 text-center text-xs text-gray-400">
                                    {mapelNama
                                        ? `Belum ada capaian untuk ${mapelNama}. Tambahkan di menu Capaian Pembelajaran.`
                                        : 'Belum ada capaian pembelajaran. Tambahkan di menu Capaian Pembelajaran.'}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="px-3 py-3 text-center text-xs text-gray-400">Tidak ditemukan</div>
                            ) : (
                                filtered.map((o) => (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => { toggle(o.id); setSearch(''); }}
                                        className="w-full text-left px-3 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors flex items-start gap-2.5"
                                    >
                                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs shrink-0 mt-0.5">{o.kode_lengkap}</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{o.capaian}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        {value.length > 0 && (
                            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { onChange([]); setOpen(false); }}
                                    className="w-full text-xs text-center text-red-500 hover:text-red-700 py-0.5"
                                >
                                    Hapus semua pilihan
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function MediaPicker({ mediaType, form, setField, lists }) {
    const fileRef = useRef(null);
    const [mode, setMode] = useState('pick'); // 'pick' | 'upload'

    if (!mediaType || mediaType === 'Papan Tulis') return null;

    if (mediaType === 'Lainnya') {
        return (
            <div className="mt-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Keterangan / Tautan</label>
                <input type="text" value={form.media_url}
                    onChange={(e) => setField('media_url', e.target.value)}
                    placeholder="Deskripsikan media atau masukkan tautan"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
        );
    }

    const cfg = MEDIA_CFG[mediaType];
    if (!cfg) return null;

    const list = lists[cfg.list] ?? [];
    const Icon = cfg.icon;

    // Video Pembelajaran — URL only, no file
    if (cfg.urlField) {
        return (
            <div className="mt-2 space-y-2">
                {list.length > 0 && (
                    <select value={form.media_ref_id} onChange={(e) => setField('media_ref_id', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">— Pilih dari video saya —</option>
                        {list.map((v) => <option key={v.id} value={v.id}>{v.judul}</option>)}
                    </select>
                )}
                <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    <input type="url" value={form.media_url}
                        onChange={(e) => setField('media_url', e.target.value)}
                        placeholder="Atau tempel link video (https://...)"
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
            </div>
        );
    }

    // File-based types (Presentasi, Modul Ajar, Jobsheet)
    return (
        <div className="mt-2 space-y-2">
            {/* Mode toggle */}
            <div className="flex gap-1">
                <button type="button"
                    onClick={() => { setMode('pick'); setField('media_file', null); setField('media_judul', ''); }}
                    className={`flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors ${mode === 'pick' ? 'bg-sky-50 dark:bg-sky-900/40 border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 font-medium' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    Pilih yang Ada
                </button>
                <button type="button"
                    onClick={() => { setMode('upload'); setField('media_ref_id', ''); }}
                    className={`flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors ${mode === 'upload' ? 'bg-sky-50 dark:bg-sky-900/40 border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 font-medium' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    Upload Baru
                </button>
            </div>

            {mode === 'pick' ? (
                list.length === 0 ? (
                    <p className="text-xs text-gray-400 italic px-1">Belum ada {cfg.label}. Pilih "Upload Baru" untuk menambahkan.</p>
                ) : (
                    <select value={form.media_ref_id} onChange={(e) => setField('media_ref_id', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">— Pilih {cfg.label} —</option>
                        {list.map((item) => <option key={item.id} value={item.id}>{item.judul}</option>)}
                    </select>
                )
            ) : (
                <div className="space-y-2">
                    <div onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 cursor-pointer transition-colors">
                        <Icon className="h-5 w-5 text-sky-400 shrink-0" />
                        {form.media_file ? (
                            <span className="text-xs text-sky-600 dark:text-sky-400 truncate">{form.media_file.name}</span>
                        ) : (
                            <span className="text-xs text-gray-400">Klik pilih file — {cfg.accept?.replace(/\./g, '').toUpperCase()}</span>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept={cfg.accept} className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setField('media_file', f);
                            if (!form.media_judul) setField('media_judul', f.name.replace(/\.[^.]+$/, ''));
                        }} />
                    <input type="text" value={form.media_judul}
                        onChange={(e) => setField('media_judul', e.target.value)}
                        placeholder="Judul file (opsional)"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">File akan disimpan ke menu {cfg.label} setelah jurnal disimpan.</p>
                </div>
            )}
        </div>
    );
}

export default function JurnalIndex({
    jadwalHariIni, piketRecords, jurnalHariIni, absensiCounts, pertemuanKe,
    videoList, presentasiList, modulList, jobsheetList, mataPelajaran,
    riwayat, isAdmin, tanggalHariIni, pembelajaranTanpaJadwal,
    capaianList = [],
}) {
    const [showModal, setShowModal]   = useState(false);
    const [editItem, setEditItem]     = useState(null);
    const [form, setForm]             = useState(initForm());
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError]   = useState('');

    const lists = { videoList, presentasiList, modulList, jobsheetList };

    const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

    // jurnalHariIni: { pembelajaran_id: [journal, ...] }
    // Hitung jadwal_ids yang sudah tercakup per pembelajaran
    const coveredByPid = {};
    Object.entries(jurnalHariIni).forEach(([pid, journals]) => {
        const ids = new Set();
        journals.forEach((j) => (j.jadwal_ids ?? []).forEach((id) => ids.add(Number(id))));
        coveredByPid[pid] = ids;
    });

    const uncoveredJamInGroup = (group) => {
        const pid     = group[0].pembelajaran_id;
        const covered = coveredByPid[pid];
        if (!covered || covered.size === 0) return group;
        return group.filter((j) => !covered.has(Number(j.id)));
    };

    // Pecah jadwal berdasarkan status piket yang berurutan
    const splitByStatus = (jadwals) => {
        if (!jadwals.length) return [];
        const groups = [];
        let cur = { status: piketRecords[jadwals[0].id]?.status_guru ?? null, jadwals: [jadwals[0]] };
        for (let i = 1; i < jadwals.length; i++) {
            const st = piketRecords[jadwals[i].id]?.status_guru ?? null;
            if (st === cur.status) {
                cur.jadwals.push(jadwals[i]);
            } else {
                groups.push(cur);
                cur = { status: st, jadwals: [jadwals[i]] };
            }
        }
        groups.push(cur);
        return groups;
    };

    const toggleJadwalId = (jadwalId) => {
        setForm((p) => {
            const ids = p.jadwal_ids.includes(jadwalId)
                ? p.jadwal_ids.filter((id) => id !== jadwalId)
                : [...p.jadwal_ids, jadwalId];
            return { ...p, jadwal_ids: ids };
        });
    };

    // group = array jadwal dengan pembelajaran_id yang sama, sudah di-sort jam_ke
    const openIsiJurnal = (group) => {
        const first = group[0];
        const pid   = first.pembelajaran_id;
        const related = group.map((j) => ({ id: j.id, jam_ke: j.jam_ke, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai }));
        // Pre-select hanya JP yang sudah Hadir
        const hadirIds = group.filter((j) => piketRecords[j.id]?.status_guru === 'Hadir').map((j) => j.id);

        setForm({
            ...initForm(),
            pembelajaran_id: pid,
            jadwal_id: first.id,
            jadwal_ids: hadirIds,
            _pertemuan_ke: (pertemuanKe[pid] ?? 0) + 1,
            _jumlah_hadir: absensiCounts[pid] ?? 0,
            _mapel: first.pembelajaran?.mata_pelajaran?.nama,
            _mapel_id: first.pembelajaran?.mata_pelajaran?.id ?? null,
            _rombel: first.pembelajaran?.rombel?.nama + (first.pembelajaran?.jurusan ? ` | ${first.pembelajaran.jurusan.kode}` : ''),
            _relatedJadwal: related,
        });
        setEditItem(null);
        setFormError('');
        setShowModal(true);
    };

    const openEditJurnal = (jurnal) => {
        setForm({
            ...initForm(),
            pembelajaran_id: jurnal.pembelajaran_id,
            jadwal_id: jurnal.jadwal_ids?.[0] ?? '',
            materi_pokok: jurnal.materi_pokok ?? '',
            uraian_materi: jurnal.uraian_materi ?? '',
            capaian_ids: (jurnal.capaian_pembelajaran ?? []).map((c) => c.id),
            metode: Array.isArray(jurnal.metode) ? jurnal.metode : (jurnal.metode ? [jurnal.metode] : ['Ceramah']),
            media_type: jurnal.media_type ?? '',
            media_ref_id: jurnal.media_ref_id ?? '',
            media_url: jurnal.media_url ?? '',
            catatan: jurnal.catatan ?? '',
            _pertemuan_ke: jurnal.pertemuan_ke,
            _jumlah_hadir: jurnal.jumlah_hadir ?? 0,
            _mapel: jurnal.pembelajaran?.mata_pelajaran?.nama,
            _mapel_id: jurnal.pembelajaran?.mata_pelajaran?.id ?? null,
            _rombel: jurnal.pembelajaran?.rombel?.nama + (jurnal.pembelajaran?.jurusan ? ` | ${jurnal.pembelajaran.jurusan.kode}` : ''),
        });
        setEditItem(jurnal);
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
        setForm(initForm());
        setFormError('');
    };

    const submit = () => {
        // Validasi: jika ada checklist, minimal 1 harus dipilih
        if (!editItem && form._relatedJadwal?.length > 1 && form.jadwal_ids.length === 0) {
            setFormError('Pilih minimal 1 jam yang dicakup jurnal ini.');
            return;
        }

        setSubmitting(true);
        setFormError('');

        const hasFile = !!form.media_file;

        // Bersihkan field private (_*) sebelum dikirim
        const { _pertemuan_ke, _jumlah_hadir, _mapel, _mapel_id, _rombel, _relatedJadwal, ...payload } = form;

        const opts = {
            forceFormData: hasFile,
            onSuccess: closeModal,
            onError: (errs) => setFormError(Object.values(errs)[0] ?? 'Terjadi kesalahan.'),
            onFinish: () => setSubmitting(false),
        };

        if (editItem) {
            router.post(`/guru/jurnal/${editItem.id}`, { ...payload, _method: 'PUT' }, opts);
        } else {
            router.post('/guru/jurnal', payload, opts);
        }
    };

    const tglFormatted = new Date(tanggalHariIni + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const semuaGroup    = groupByPembelajaran(jadwalHariIni);
    // belumIsiItems: dipecah per status piket (Izin-JPs dan Hadir-JPs tampil terpisah)
    const belumIsiItems = semuaGroup.flatMap((g) => {
        const uncovered = uncoveredJamInGroup(g);
        if (!uncovered.length) return [];
        return splitByStatus(uncovered).map((split) => ({
            fullGroup: g,
            uncovered: split.jadwals,
            piketSt: split.status,
        }));
    }).sort((a, b) => (a.uncovered[0]?.jam_ke ?? 0) - (b.uncovered[0]?.jam_ke ?? 0));
    const sudahIsiCount = jadwalHariIni.filter((j) => (coveredByPid[j.pembelajaran_id] ?? new Set()).has(Number(j.id))).length;
    const totalJPCount  = jadwalHariIni.length;

    return (
        <AppLayout title="Jurnal Mengajar">
            {/* Header hari ini */}
            <div className="mb-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Jadwal Mengajar Hari Ini</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tglFormatted}</p>
                </div>
            </div>

            {/* Hint pembelajaran belum terjadwal */}
            {pembelajaranTanpaJadwal > 0 && (
                <div className="mb-4 p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 flex items-start gap-3">
                    <Info className="h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-sky-800 dark:text-sky-300">
                        <span className="font-semibold">{pembelajaranTanpaJadwal} pembelajaran</span> belum memiliki jadwal dan tidak muncul di daftar ini.
                        Hubungi admin untuk menambahkan jadwal di menu <span className="font-medium">Jadwal Pelajaran</span>.
                    </p>
                </div>
            )}

            {/* Jadwal hari ini */}
            <div className="mb-6">
                {jadwalHariIni.length === 0 ? (
                    <Card>
                        <CardBody>
                            <div className="text-center py-10 text-gray-400">
                                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Tidak ada jadwal mengajar hari ini.</p>
                            </div>
                        </CardBody>
                    </Card>
                ) : (
                    <div>
                        {/* Counter progres per JP */}
                        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <CheckCircle className={`h-4 w-4 ${sudahIsiCount === totalJPCount ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`} />
                            <span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{sudahIsiCount}</span>
                                {' / '}{totalJPCount} JP sudah terisi jurnal hari ini
                            </span>
                        </div>

                        {belumIsiItems.length === 0 && (
                            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5 text-center">
                                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Semua JP hari ini sudah terisi jurnal!</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Lihat di menu Riwayat Jurnal.</p>
                            </div>
                        )}

                        {belumIsiItems.length > 0 && (
                            <div className="space-y-3">
                                {belumIsiItems.map(({ fullGroup, uncovered, piketSt }, idx) => {
                                    const first        = fullGroup[0];
                                    const pid          = first.pembelajaran_id;
                                    const firstUncov   = uncovered[0];
                                    const lastUncov    = uncovered[uncovered.length - 1];
                                    const piketBelumIsi = !piketSt;
                                    const absenSekolah = ['Sakit', 'Izin', 'Alpha', 'Tugas_Sekolah'].includes(piketSt);
                                    const hadir        = absensiCounts[pid] ?? 0;
                                    const mapel        = first.pembelajaran?.mata_pelajaran?.nama ?? '–';
                                    const rombel       = first.pembelajaran?.rombel?.nama ?? '–';
                                    const jamLabel     = formatJamKe(uncovered);
                                    const multiJam     = uncovered.length > 1;

                                    return (
                                        <div key={`${pid}_${piketSt ?? 'null'}_${idx}`} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                                            <div className="flex items-start gap-4">
                                                {/* Jam badge — hanya jam yang belum terisi */}
                                                <div className="shrink-0 text-center">
                                                    <div className={`rounded-xl bg-sky-100 dark:bg-sky-900/40 flex flex-col items-center justify-center h-12 ${multiJam ? 'px-2.5' : 'w-12'}`}>
                                                        <span className="text-xs font-bold text-sky-700 dark:text-sky-300 leading-none">JP</span>
                                                        <span className={`font-black text-sky-700 dark:text-sky-300 leading-none ${multiJam ? 'text-sm' : 'text-lg'}`}>
                                                            {multiJam ? uncovered.map((j) => j.jam_ke).join('–') : firstUncov.jam_ke}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-snug">{mapel}</h3>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                                            {firstUncov.jam_mulai?.substring(0,5)} – {lastUncov.jam_selesai?.substring(0,5)}
                                                            {multiJam && (
                                                                <span className="ml-1 text-xs text-sky-500 dark:text-sky-400">({jamLabel})</span>
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                                            {rombel}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3.5 w-3.5 shrink-0" />
                                                            {hadir} hadir
                                                        </span>
                                                    </div>
                                                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                                        {piketSt && (
                                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PIKET_COLOR[piketSt]}`}>
                                                                {PIKET_LABEL[piketSt] ?? piketSt}
                                                            </span>
                                                        )}
                                                        {absenSekolah ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                                <Lock className="h-3 w-3" /> Tidak Mengajar
                                                            </span>
                                                        ) : piketBelumIsi ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                                <Lock className="h-3 w-3" /> Menunggu Presensi
                                                            </span>
                                                        ) : (
                                                            <Button size="sm" icon={FileText} onClick={() => openIsiJurnal(uncovered)}>
                                                                Isi Jurnal
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Isi / Edit Jurnal */}
            <Modal
                show={showModal}
                onClose={closeModal}
                title={editItem ? `Edit Jurnal — Pertemuan ke-${form._pertemuan_ke}` : `Isi Jurnal — Pertemuan ke-${form._pertemuan_ke}`}
                size="xl"
            >
                <div className="space-y-4">
                    {/* Info otomatis */}
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-sm">
                        <div className="text-center px-3 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-400">Pertemuan</p>
                            <p className="text-xl font-black text-sky-600 dark:text-sky-400">{form._pertemuan_ke}</p>
                        </div>
                        <div className="text-center px-3 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-400">Siswa Hadir</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{form._jumlah_hadir}</p>
                        </div>
                        <div className="flex-1 text-gray-600 dark:text-gray-400 text-sm">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{form._mapel}</p>
                            <p className="text-xs">{form._rombel}</p>
                        </div>
                    </div>

                    {/* Checklist jam — tampil hanya jika ada > 1 jadwal untuk pembelajaran yang sama */}
                    {!editItem && form._relatedJadwal?.length > 1 && (
                        <div className="p-3 rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30">
                            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-2.5">
                                <ListChecks className="h-3.5 w-3.5" />
                                Pilih jam yang dicakup jurnal ini
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {form._relatedJadwal.map((j) => {
                                    const checked  = form.jadwal_ids.includes(j.id);
                                    const isHadir  = piketRecords[j.id]?.status_guru === 'Hadir';
                                    return (
                                        <button
                                            key={j.id}
                                            type="button"
                                            onClick={() => isHadir && toggleJadwalId(j.id)}
                                            disabled={!isHadir}
                                            title={!isHadir ? 'Menunggu presensi Hadir dari Piket' : undefined}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                                !isHadir
                                                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
                                                    : checked
                                                        ? 'bg-sky-600 border-sky-600 text-white'
                                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-sky-400'
                                            }`}
                                        >
                                            <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${checked && isHadir ? 'bg-white border-white' : 'border-current'}`}>
                                                {checked && isHadir && <CheckCircle className="h-3 w-3 text-sky-600" />}
                                            </span>
                                            JP {j.jam_ke}
                                            <span className="opacity-70">{j.jam_mulai?.substring(0,5)}</span>
                                            {!isHadir && <Lock className="h-3 w-3 opacity-50" />}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.jadwal_ids.length === 0 && (
                                <p className="text-xs text-red-500 mt-2">Pilih minimal 1 jam.</p>
                            )}
                        </div>
                    )}

                    {formError && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {formError}
                        </div>
                    )}

                    <Input label="Materi Pokok" value={form.materi_pokok} onChange={(e) => setField('materi_pokok', e.target.value)} required />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Metode Pembelajaran</p>
                            <div className="flex flex-wrap gap-2">
                                {METODE.map((m) => {
                                    const checked = Array.isArray(form.metode) && form.metode.includes(m);
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                                const cur = Array.isArray(form.metode) ? form.metode : [];
                                                const next = checked ? cur.filter(v => v !== m) : [...cur, m];
                                                setField('metode', next.length > 0 ? next : cur);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                                                checked
                                                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    );
                                })}
                            </div>
                            {Array.isArray(form.metode) && form.metode.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Pilih minimal satu metode.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media / Alat</label>
                            <select
                                value={form.media_type}
                                onChange={(e) => {
                                    setField('media_type', e.target.value);
                                    setField('media_ref_id', '');
                                    setField('media_url', '');
                                    setField('media_file', null);
                                    setField('media_judul', '');
                                }}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="">— Tidak menggunakan media —</option>
                                {MEDIA_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <MediaPicker
                                mediaType={form.media_type}
                                form={form}
                                setField={setField}
                                lists={lists}
                            />
                        </div>
                    </div>

                    <Textarea label="Uraian Materi" value={form.uraian_materi} onChange={(e) => setField('uraian_materi', e.target.value)} rows={3} required />
                    <CapaianMultiSelect
                        value={form.capaian_ids}
                        onChange={(ids) => setField('capaian_ids', ids)}
                        options={form._mapel_id
                            ? capaianList.filter((c) => c.mata_pelajaran_id === form._mapel_id)
                            : capaianList}
                        mapelNama={form._mapel}
                    />
                    <Textarea label="Catatan Tambahan (opsional)" value={form.catatan} onChange={(e) => setField('catatan', e.target.value)} rows={2} />

                    <div className="flex justify-end gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="button" loading={submitting} icon={CheckCircle} onClick={submit}>
                            Simpan Jurnal
                        </Button>
                    </div>
                </div>
            </Modal>

        </AppLayout>
    );
}
