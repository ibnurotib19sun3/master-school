import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import RichEditor from '@/Components/ui/RichEditor';
import {
    FileText, CalendarDays, Award, ClipboardList,
    Megaphone, UserCheck, Printer, Save, ChevronLeft,
    Eye, Building2, Search, X, Check, RefreshCw,
    GraduationCap, Users, UserCog, Loader2, FolderArchive,
    CheckCircle2, Link2, Sparkles,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

/* ─── Helpers ─── */
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const bulanIndo = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function fmtTanggal(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()} ${bulanIndo[d.getMonth() + 1]} ${d.getFullYear()}`;
}

/* Sama persis dengan buildNomor() di halaman Surat Keluar (dan PengaturanSurat::
   formatNomor() di backend) — termasuk opsi gabungan kode_jenis_dept/kode_dept_jenis
   — supaya nomor di sini selalu konsisten dengan arsip Surat Keluar. */
function buildNomor(fmt, seq, kodeJenis, kodeDept, dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const sep = fmt?.separator || '/';
    kodeJenis = kodeJenis || '';
    kodeDept = kodeDept || '';
    const map = {
        prefix: fmt?.prefix_kode || '',
        seq: String(seq).padStart(3, '0'),
        kode_jenis: kodeJenis,
        kode_dept: kodeDept,
        kode_jenis_dept: kodeJenis && kodeDept ? `${kodeJenis}.${kodeDept}` : (kodeJenis || kodeDept),
        kode_dept_jenis: kodeDept && kodeJenis ? `${kodeDept}.${kodeJenis}` : (kodeDept || kodeJenis),
        bulan_romawi: ROMAN[d.getMonth() + 1],
        tahun: String(d.getFullYear()),
    };
    const bagian = fmt?.format_bagian || ['seq', 'kode_jenis', 'kode_dept', 'bulan_romawi', 'tahun'];
    return bagian.map((p) => map[p] || '').filter(Boolean).join(sep) || '';
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Format rincian data / biodata dengan tabel berstruktur rapi:
   - Kolom label dengan lebar proporsional
   - Kolom titik dua (:) sejajar rapi secara vertikal (alignment sempurna)
   - Kolom nilai dengan teks tebal/jelas
   Didukung oleh CustomTable pada RichEditor sehingga tidak akan dibuang saat parsing */
function kv(rows) {
    const trs = rows.map(([label, val]) => `<tr><td style="width: 175px; vertical-align: top; padding: 2px 4px 2px 0;">${esc(label)}</td><td style="width: 16px; vertical-align: top; padding: 2px 0; text-align: center;">:</td><td style="vertical-align: top; padding: 2px 0 2px 4px;"><strong>${val ? esc(val) : '…'}</strong></td></tr>`).join('');
    return `<table style="width: 100%; margin: 8px 0 12px 18px; border-collapse: collapse; border: none;"><tbody>${trs}</tbody></table>`;
}

/* ─── Template definitions ───
   penerimaTipe: null = tidak pakai picker data (isian manual semua), atau array
   tipe yang diizinkan (guru/siswa/tatausaha). applyPenerima memetakan hasil picker
   (merge fields dari server) ke field template yang relevan. */
const TEMPLATES = [
    {
        id: 'bebas', label: 'Surat Bebas / Kustom', kode: 'Um', kategori: 'Dinas',
        icon: Sparkles, color: 'blue',
        desc: 'Format surat dinas bebas tanpa isian form kaku — isi langsung di editor kanvas A4',
        penerimaTipe: ['guru', 'siswa', 'tatausaha'],
        applyPenerima: (m) => ({ kepada: m.nama }),
        fields: [
            { key: 'perihal', label: 'Perihal Surat', type: 'text', required: true, placeholder: 'Misal: Pemberitahuan Kegiatan / Surat Pengantar...' },
            { key: 'kepada', label: 'Kepada (Nama / Instansi Tujuan)', type: 'text', required: true, placeholder: 'Bapak/Ibu...' },
        ],
        perihal: (v) => v.perihal || 'Surat Dinas',
        tujuanDefault: (v) => v.kepada || '',
        body: (v, s) => `
<p>Dengan hormat,</p>
<p>Sehubungan dengan ${v.perihal ? '<strong>' + esc(v.perihal) + '</strong>' : 'hal tersebut di atas'}, bersama surat ini kami sampaikan bahwa:</p>
<p><em>(Tuliskan isi surat Anda secara bebas di sini...)</em></p>
<p>Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>`,
    },
    {
        id: 'undangan', label: 'Surat Undangan', kode: 'Und', kategori: 'Undangan',
        icon: CalendarDays, color: 'indigo',
        desc: 'Mengundang pihak tertentu untuk hadir pada kegiatan sekolah',
        penerimaTipe: null,
        fields: [
            { key: 'kepada', label: 'Kepada (Nama / Jabatan)', type: 'text', required: true },
            { key: 'acara', label: 'Nama Kegiatan / Acara', type: 'text', required: true },
            { key: 'hari', label: 'Hari', type: 'text', placeholder: 'Senin' },
            { key: 'tanggal_acara', label: 'Tanggal Kegiatan', type: 'date', required: true },
            { key: 'pukul', label: 'Pukul', type: 'text', placeholder: '08.00 WIB', required: true },
            { key: 'tempat', label: 'Tempat', type: 'text', required: true },
        ],
        perihal: (v) => `Undangan ${v.acara || '...'}`,
        tujuanDefault: (v) => v.kepada || '',
        body: (v) => `
<p>Dalam rangka <strong>${esc(v.acara) || '…'}</strong>, kami mengundang Bapak/Ibu/Sdr. untuk hadir pada:</p>
${kv([['Hari, Tanggal', (v.hari ? esc(v.hari) + ', ' : '') + (fmtTanggal(v.tanggal_acara) || '')], ['Pukul', (esc(v.pukul) || '') + ' WIB'], ['Tempat', esc(v.tempat)]])}
<p>Mengingat pentingnya kegiatan tersebut, kami mohon Bapak/Ibu/Sdr. berkenan hadir tepat waktu. Atas perhatian dan kehadiran Bapak/Ibu/Sdr., kami ucapkan terima kasih.</p>`,
    },
    {
        id: 'keterangan', label: 'Surat Keterangan Aktif', kode: 'Ket', kategori: 'Dinas',
        icon: Award, color: 'green',
        desc: 'Menerangkan bahwa seseorang adalah siswa aktif di sekolah',
        penerimaTipe: ['siswa'],
        applyPenerima: (m) => ({ nama_siswa: m.nama, kelas: m.kelas, nis: m.nip_nis }),
        fields: [
            { key: 'nama_siswa', label: 'Nama Lengkap Siswa', type: 'text', required: true },
            { key: 'kelas', label: 'Kelas', type: 'text', required: true, placeholder: 'XII RPL 1' },
            { key: 'nis', label: 'NIS', type: 'text' },
            { key: 'nisn', label: 'NISN', type: 'text' },
            { key: 'tahun_pelajaran', label: 'Tahun Pelajaran', type: 'text', required: true, placeholder: '2025/2026' },
            { key: 'keperluan', label: 'Keperluan', type: 'text', required: true, placeholder: 'Melamar Beasiswa' },
        ],
        perihal: () => 'Keterangan Siswa Aktif',
        tujuanDefault: (v) => v.nama_siswa || '',
        body: (v, s) => `
<p>Yang bertanda tangan di bawah ini, Kepala ${esc(s.nama_sekolah) || 'SMK'}, menerangkan bahwa:</p>
${kv([['Nama Lengkap', esc(v.nama_siswa)], ['Kelas', esc(v.kelas)], ['NIS', esc(v.nis) || '–'], ['NISN', esc(v.nisn) || '–']])}
<p>Adalah benar siswa aktif di ${esc(s.nama_sekolah) || 'SMK'} pada tahun pelajaran ${esc(v.tahun_pelajaran) || '…'}.</p>
<p>Surat keterangan ini dibuat untuk keperluan ${esc(v.keperluan) || '…'} dan mohon kiranya dapat dipergunakan sebagaimana mestinya.</p>`,
    },
    {
        id: 'permohonan', label: 'Surat Permohonan', kode: 'Per', kategori: 'Permohonan',
        icon: ClipboardList, color: 'blue',
        desc: 'Permohonan bantuan, izin, atau kerja sama kepada instansi lain',
        penerimaTipe: null,
        fields: [
            { key: 'kepada', label: 'Kepada (Nama / Jabatan)', type: 'text', required: true },
            { key: 'instansi_tujuan', label: 'Instansi / Lembaga Tujuan', type: 'text', required: true },
            { key: 'isi_permohonan', label: 'Isi Permohonan', type: 'textarea', required: true, placeholder: 'Tuliskan isi permohonan secara singkat dan jelas...' },
        ],
        perihal: (v) => v.isi_permohonan ? v.isi_permohonan.substring(0, 60) : 'Permohonan',
        tujuanDefault: (v) => v.kepada || '',
        body: (v, s) => `
<p>Dengan hormat,</p>
<p>Sehubungan dengan kebutuhan ${esc(s.nama_sekolah) || 'sekolah kami'}, bersama surat ini kami mengajukan permohonan kepada Bapak/Ibu Pimpinan ${esc(v.instansi_tujuan) || '…'} perihal:</p>
<p>${esc(v.isi_permohonan) || '…'}</p>
<p>Besar harapan kami agar permohonan ini dapat dikabulkan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>`,
    },
    {
        id: 'pemberitahuan', label: 'Surat Pemberitahuan', kode: 'Pbt', kategori: 'Pemberitahuan',
        icon: Megaphone, color: 'yellow',
        desc: 'Memberitahukan informasi atau kebijakan kepada pihak terkait',
        penerimaTipe: null,
        fields: [
            { key: 'kepada', label: 'Kepada', type: 'text', required: true },
            { key: 'isi_pemberitahuan', label: 'Isi Pemberitahuan', type: 'textarea', required: true, placeholder: 'Tuliskan isi pemberitahuan...' },
        ],
        perihal: (v) => v.isi_pemberitahuan ? v.isi_pemberitahuan.substring(0, 60) : 'Pemberitahuan',
        tujuanDefault: (v) => v.kepada || '',
        body: (v) => `
<p>Dengan hormat,</p>
<p>Bersama surat ini kami sampaikan pemberitahuan sebagai berikut:</p>
<p>${esc(v.isi_pemberitahuan) || '…'}</p>
<p>Demikian pemberitahuan ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.</p>`,
    },
    {
        id: 'tugas', label: 'Surat Tugas', kode: 'Tgs', kategori: 'Dinas',
        icon: UserCheck, color: 'purple',
        desc: 'Memberikan tugas atau penugasan resmi kepada pegawai/guru',
        penerimaTipe: ['guru', 'tatausaha'],
        applyPenerima: (m) => ({ nama: m.nama, jabatan: `${m.jabatan}${m.nip_nis && m.nip_nis !== '-' ? ' / NIP. ' + m.nip_nis : ''}` }),
        fields: [
            { key: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
            { key: 'jabatan', label: 'Jabatan / NIP', type: 'text', required: true },
            { key: 'tugas', label: 'Tugas / Kegiatan', type: 'text', required: true, placeholder: 'Mengikuti Pelatihan Guru...' },
            { key: 'dari_tanggal', label: 'Dari Tanggal', type: 'date', required: true },
            { key: 'sampai_tanggal', label: 'Sampai Tanggal', type: 'date', required: true },
            { key: 'tempat', label: 'Tempat Kegiatan', type: 'text', required: true },
        ],
        perihal: (v) => v.tugas ? `Penugasan: ${v.tugas}` : 'Surat Tugas',
        tujuanDefault: (v) => v.nama || '',
        body: (v, s) => `
<p>Yang bertanda tangan di bawah ini, Kepala ${esc(s.nama_sekolah) || 'SMK'}, menugaskan kepada:</p>
${kv([['Nama', esc(v.nama)], ['Jabatan', esc(v.jabatan)]])}
<p>Untuk melaksanakan tugas: ${esc(v.tugas) || '…'}</p>
${kv([['Dari Tanggal', fmtTanggal(v.dari_tanggal)], ['Sampai Tanggal', fmtTanggal(v.sampai_tanggal)], ['Tempat', esc(v.tempat)]])}
<p>Demikian surat tugas ini dibuat untuk dapat dilaksanakan dengan penuh tanggung jawab.</p>`,
    },
    {
        id: 'rekomendasi', label: 'Surat Rekomendasi', kode: 'Rek', kategori: 'Dinas',
        icon: FileText, color: 'rose',
        desc: 'Memberikan rekomendasi atau referensi kepada seseorang',
        penerimaTipe: ['guru', 'siswa', 'tatausaha'],
        applyPenerima: (m) => ({ nama: m.nama, kelas_jabatan: m.kelas !== '-' ? m.kelas : m.jabatan }),
        fields: [
            { key: 'nama', label: 'Nama yang Direkomendasikan', type: 'text', required: true },
            { key: 'kelas_jabatan', label: 'Kelas / Jabatan', type: 'text', required: true },
            { key: 'keperluan', label: 'Keperluan Rekomendasi', type: 'text', required: true, placeholder: 'Melamar Kerja / Beasiswa / Studi Lanjut' },
            { key: 'isi_rekomendasi', label: 'Isi / Alasan Rekomendasi', type: 'textarea', placeholder: 'Tuliskan alasan atau isi rekomendasi...' },
        ],
        perihal: (v) => `Rekomendasi ${v.keperluan || ''}`,
        tujuanDefault: (v) => v.nama || '',
        body: (v, s) => `
<p>Yang bertanda tangan di bawah ini, Kepala ${esc(s.nama_sekolah) || 'SMK'}, dengan ini merekomendasikan:</p>
${kv([['Nama', esc(v.nama)], ['Kelas/Jabatan', esc(v.kelas_jabatan)]])}
<p>Untuk keperluan ${esc(v.keperluan) || '…'}.</p>
<p>${v.isi_rekomendasi ? esc(v.isi_rekomendasi) + '</p><p>' : ''}Yang bersangkutan adalah pribadi yang baik, disiplin, dan bertanggung jawab. Kami dengan sepenuh hati merekomendasikan yang bersangkutan dan semoga dapat dipertimbangkan sebagaimana mestinya.</p>`,
    },
];

const COLOR_CLASS = {
    indigo: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    blue: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    purple: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
};
const ICON_CLASS = {
    indigo: 'text-sky-500', green: 'text-emerald-500', blue: 'text-sky-500',
    yellow: 'text-amber-500', purple: 'text-violet-500', rose: 'text-rose-500',
};
const TIPE_LABEL = { guru: 'Guru', siswa: 'Siswa', tatausaha: 'Tata Usaha' };
const TIPE_ICON = { guru: GraduationCap, siswa: Users, tatausaha: UserCog };

/* ─── Picker "Isi dari Data PTK/Siswa" ───
   Terintegrasi langsung dengan data Guru/Siswa/Tatausaha yang sudah ada di sistem —
   staf TU tinggal cari & pilih, tidak perlu mengetik ulang nama/NIP/NIS/jabatan. */
function PenerimaPicker({ allowedTipe, onApply }) {
    const [tipe, setTipe] = useState(allowedTipe[0]);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [picked, setPicked] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => { setPicked(null); setResults([]); setQ(''); }, [tipe]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (!open) return;
            setLoading(true);
            fetch(`/tatausaha/buat-surat/cari-orang?tipe=${tipe}&q=${encodeURIComponent(q)}`)
                .then((r) => r.json())
                .then((data) => setResults(data))
                .finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [tipe, q, open]);

    return (
        <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/10 p-3.5 space-y-2.5">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Isi dari Data {allowedTipe.length > 1 ? 'PTK/Siswa' : TIPE_LABEL[allowedTipe[0]]}
            </p>

            {allowedTipe.length > 1 && (
                <div className="flex gap-1.5">
                    {allowedTipe.map((t) => {
                        const Icon = TIPE_ICON[t];
                        return (
                            <button key={t} type="button" onClick={() => setTipe(t)}
                                className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                    tipe === t ? 'bg-sky-600 border-sky-600 text-white' : 'border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                                }`}>
                                <Icon className="h-3 w-3" /> {TIPE_LABEL[t]}
                            </button>
                        );
                    })}
                </div>
            )}

            {picked ? (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{picked.nama}</p>
                        <p className="text-[11px] text-gray-400 truncate">{picked.sub}</p>
                    </div>
                    <button type="button" onClick={() => { setPicked(null); setOpen(true); }} title="Ganti"
                        className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            value={q}
                            onFocus={() => setOpen(true)}
                            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                            placeholder={`Cari nama ${TIPE_LABEL[tipe].toLowerCase()}...`}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    {open && (
                        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                            {loading ? (
                                <div className="px-3 py-3 text-xs text-gray-400 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Mencari...</div>
                            ) : results.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-gray-400">Tidak ditemukan.</div>
                            ) : results.map((r) => (
                                <button key={r.id} type="button"
                                    onClick={() => { setPicked(r); setOpen(false); onApply(tipe, r); }}
                                    className="w-full text-left px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{r.nama}</p>
                                    <p className="text-[11px] text-gray-400">{r.sub}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function buildKopHtml(s) {
    return `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:12px;border-bottom:2px solid #1f2937;margin-bottom:20px;">
        ${s.logo_url ? `<img src="${s.logo_url}" style="height:80px;width:80px;object-fit:contain;flex-shrink:0;" />` : ''}
        <div style="flex:1;text-align:center;">
            ${s.yayasan_dinas ? `<p style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.5px;">${esc(s.yayasan_dinas)}</p>` : ''}
            <p style="font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">${esc(s.nama_sekolah) || 'SMK'}</p>
            ${s.alamat ? `<p style="font-size:11px;color:#555;margin-top:2px;">${esc(s.alamat)}${s.kecamatan ? ', Kec. ' + esc(s.kecamatan) : ''}${s.kota ? ', ' + esc(s.kota) : ''}</p>` : ''}
            <p style="font-size:11px;color:#555;margin-top:2px;">
                ${[s.telepon && `Telp. ${esc(s.telepon)}`, s.email_sekolah && `Email: ${esc(s.email_sekolah)}`, s.website && esc(s.website), s.npsn && `NPSN: ${esc(s.npsn)}`].filter(Boolean).join(' &middot; ')}
            </p>
        </div>
    </div>`;
}

function doPrint({ sekolah, tplLabel, nomor, tujuan, perihal, isiSurat, tanggal }) {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
    <title>${esc(tplLabel || 'Surat')}</title>
    <style>
        * { box-sizing:border-box; }
        @page { size: A4; margin: 20mm 18mm; }
        body { font-family: Georgia, 'Times New Roman', serif; font-size:13px; line-height:1.6; color:#111827; padding:40px 48px; }
        table { border-collapse: collapse; }
        td { font-family: inherit; font-size: inherit; }
        @media print { body { padding:0; } }
    </style></head><body>
    ${buildKopHtml(sekolah)}
    <div style="text-align:center;margin-bottom:20px;">
        <p style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;text-decoration:underline;text-underline-offset:2px;">${esc(tplLabel || 'Surat')}</p>
        <p style="font-size:12px;color:#374151;margin-top:4px;">Nomor: ${esc(nomor) || '…'}</p>
    </div>
    <table style="margin-bottom:16px;border-collapse:collapse;width:100%;">
        <tbody>
            <tr>
                <td style="width:85px;vertical-align:top;padding:2px 0;">Perihal</td>
                <td style="width:18px;vertical-align:top;padding:2px 0;text-align:center;">:</td>
                <td style="vertical-align:top;padding:2px 0;font-weight:600;">${esc(perihal)}</td>
            </tr>
            <tr>
                <td style="width:85px;vertical-align:top;padding:2px 0;">Kepada</td>
                <td style="width:18px;vertical-align:top;padding:2px 0;text-align:center;">:</td>
                <td style="vertical-align:top;padding:2px 0;">
                    Yth. <strong>${esc(tujuan) || '…'}</strong><br/>
                    <span style="color:#555;font-size:12px;">di Tempat</span>
                </td>
            </tr>
        </tbody>
    </table>
    <p style="margin-bottom:12px;">Assalamu'alaikum Wr. Wb. / Salam Sejahtera,</p>
    <div style="margin-bottom:24px;">${isiSurat || ''}</div>
    <p style="margin-bottom:24px;">Demikian surat ini kami sampaikan. Atas perhatian Bapak/Ibu/Sdr., kami ucapkan terima kasih.</p>
    <div style="display:flex;justify-content:flex-end;">
        <div style="text-align:left;min-width:240px;">
            <p>${esc(sekolah.kota) || '…'}, ${fmtTanggal(tanggal)}</p>
            <p style="margin-top:4px;">Kepala Sekolah,</p>
            <div style="height:72px;"></div>
            <p style="font-weight:700;text-decoration:underline;">${esc(sekolah.kepala_sekolah_nama) || '…'}</p>
            ${sekolah.nip_kepala ? `<p style="font-size:12px;margin-top:2px;">NIPY. ${esc(sekolah.nip_kepala)}</p>` : ''}
        </div>
    </div>
    </body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
}

/* ─── Main Page ─── */
export default function BuatSurat({
    sekolah, today, editing, kode_departemen, kode_jenis, format_nomor, next_seq,
    surat_keluar_drafts = [],
}) {
    const [step, setStep] = useState(editing ? 'compose' : 'template');
    const [tplId, setTplId] = useState(editing?.template_kode ?? null);
    const [values, setValues] = useState({});
    const [kodeJenisId, setKodeJenisId] = useState(kode_jenis[0]?.id ?? null);
    const [kodeDeptId, setKodeDeptId] = useState(kode_departemen[0]?.id ?? null);
    const [nomor, setNomor] = useState(editing?.nomor_surat ?? '');
    const [nomorEdited, setNomorEdited] = useState(!!editing);
    const [tanggal, setTanggal] = useState(editing?.tgl_surat ?? today);
    const [tujuan, setTujuan] = useState(editing?.tujuan ?? '');
    const [perihalManual, setPerihalManual] = useState(editing?.perihal ?? '');
    const [status, setStatus] = useState(editing?.status ?? 'Terkirim');
    const [keterangan, setKeterangan] = useState(editing?.keterangan ?? '');
    const [isiSurat, setIsiSurat] = useState(editing?.isi_surat ?? '');
    const [editorKey, setEditorKey] = useState(0);
    const [penerima, setPenerima] = useState(editing?.penerima_tipe ? { tipe: editing.penerima_tipe, id: editing.penerima_id } : null);
    const [tab, setTab] = useState('form');
    const [saving, setSaving] = useState(false);
    const generatedOnce = useRef(!!editing);

    // ── Integrasi Fleksibel dengan Data Surat Keluar ──
    const [linkedSuratKeluar, setLinkedSuratKeluar] = useState(editing ?? null);
    const [skModalOpen, setSkModalOpen] = useState(false);
    const [skSearch, setSkSearch] = useState('');
    const [skDraftOnly, setSkDraftOnly] = useState(false);
    const [skResults, setSkResults] = useState(surat_keluar_drafts);
    const [skLoading, setSkLoading] = useState(false);

    const tpl = TEMPLATES.find((t) => t.id === tplId);
    const perihal = tpl ? tpl.perihal(values, sekolah) : perihalManual;
    const kodeJenis = kode_jenis.find((j) => j.id === kodeJenisId) ?? null;
    const kodeDept = kode_departemen.find((d) => d.id === kodeDeptId) ?? null;
    const showDept = (format_nomor?.format_bagian ?? []).some((p) => ['kode_dept', 'kode_jenis_dept', 'kode_dept_jenis'].includes(p));

    // Pencarian live data Surat Keluar
    useEffect(() => {
        if (!skModalOpen) return;
        const t = setTimeout(() => {
            setSkLoading(true);
            fetch(`/tatausaha/buat-surat/cari-surat-keluar?q=${encodeURIComponent(skSearch)}&draft_only=${skDraftOnly ? 1 : 0}`)
                .then((r) => r.json())
                .then((data) => setSkResults(data))
                .catch(() => {})
                .finally(() => setSkLoading(false));
        }, 250);
        return () => clearTimeout(t);
    }, [skSearch, skDraftOnly, skModalOpen]);

    const selectTemplate = (id) => {
        setTplId(id);
        setValues({});
        setPenerima(null);
        if (!linkedSuratKeluar) {
            setTujuan('');
            setNomorEdited(false);
        }
        setIsiSurat('');
        generatedOnce.current = false;
        setStep('compose');
        setTab('form');
    };

    const setValue = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

    // Nomor otomatis mengikuti jenis/departemen/tanggal — persis seperti nomor
    // builder di Surat Keluar — kecuali kalau sudah diedit manual atau ditautkan ke surat keluar.
    useEffect(() => {
        if (nomorEdited || linkedSuratKeluar) return;
        setNomor(buildNomor(format_nomor, next_seq, kodeJenis?.kode, kodeDept?.kode, tanggal));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kodeJenisId, kodeDeptId, tanggal, nomorEdited, tplId, linkedSuratKeluar]);

    const handleNomorChange = (v) => {
        setNomorEdited(true);
        setNomor(v);
    };

    const resetNomor = () => {
        setNomorEdited(false);
        setLinkedSuratKeluar(null);
        setNomor(buildNomor(format_nomor, next_seq, kodeJenis?.kode, kodeDept?.kode, tanggal));
    };

    // Handler memilih data Surat Keluar dari picker modal
    const pilihDariSuratKeluar = (sk) => {
        setLinkedSuratKeluar(sk);
        setNomor(sk.nomor_surat);
        setNomorEdited(true);
        if (sk.tujuan && sk.tujuan !== '-') setTujuan(sk.tujuan);
        if (sk.perihal && sk.perihal !== '-') setPerihalManual(sk.perihal);
        if (sk.tgl_surat) setTanggal(sk.tgl_surat);
        if (sk.status) setStatus(sk.status);
        if (sk.template_kode && !tplId) {
            setTplId(sk.template_kode);
        }
        // Jika surat yang dipilih sudah ada isinya dan saat ini editor masih kosong, muat isinya
        if (sk.has_isi && !isiSurat) {
            fetch(`/tatausaha/buat-surat/cari-surat-keluar?q=${encodeURIComponent(sk.nomor_surat)}`)
                .then((r) => r.json())
                .then((data) => {
                    const found = data.find((d) => d.id === sk.id);
                    if (found?.isi_surat) {
                        setIsiSurat(found.isi_surat);
                        setEditorKey((k) => k + 1);
                    }
                })
                .catch(() => {});
        }
        setSkModalOpen(false);
    };

    const lepasTautanSuratKeluar = () => {
        setLinkedSuratKeluar(null);
        setNomorEdited(false);
        setNomor(buildNomor(format_nomor, next_seq, kodeJenis?.kode, kodeDept?.kode, tanggal));
    };

    const applyPenerima = (tipe, result) => {
        setPenerima({ tipe, id: result.id });
        if (tpl?.applyPenerima) {
            setValues((prev) => ({ ...prev, ...tpl.applyPenerima(result.merge) }));
        }
        setTujuan(result.nama);
    };

    const terapkanKeSurat = useCallback(() => {
        if (!tpl) return;
        setIsiSurat(tpl.body(values, sekolah));
        setEditorKey((k) => k + 1);
        generatedOnce.current = true;
    }, [tpl, values, sekolah]);

    // Auto-generate sekali saat template baru dipilih (kalau belum ada penerima yang perlu diisi dulu)
    useEffect(() => {
        if (tpl && !tpl.penerimaTipe && !generatedOnce.current && !isiSurat) {
            terapkanKeSurat();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tplId]);

    const handlePrint = () => {
        doPrint({ sekolah, tplLabel: tpl?.label, nomor, tujuan, perihal, isiSurat, tanggal });
    };

    const handleSimpan = () => {
        setSaving(true);
        const payload = {
            nomor_surat: nomor,
            perihal,
            tujuan: tujuan || '–',
            tgl_surat: tanggal,
            tgl_keluar: tanggal,
            kategori: tpl?.kategori ?? 'Umum',
            status,
            keterangan: keterangan || (tpl ? `Dibuat via generator surat — template: ${tpl.label}` : null),
            isi_surat: isiSurat,
            penerima_tipe: penerima?.tipe ?? null,
            penerima_id: penerima?.id ?? null,
            template_kode: tplId,
            surat_keluar_id: linkedSuratKeluar?.id ?? null,
        };
        if (editing) {
            router.put(`/tatausaha/buat-surat/${editing.id}`, payload, { onFinish: () => setSaving(false) });
        } else {
            router.post('/tatausaha/buat-surat/simpan', payload, { onFinish: () => setSaving(false) });
        }
    };

    /* ── Step 1: Pilih Template ── */
    if (step === 'template') {
        return (
            <AppLayout title="Buat Surat">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                Pilih Template Surat
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Pilih template surat dinas atau gunakan Surat Bebas — nomor surat bisa dibuat baru atau diambil dari agenda Surat Keluar.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                selectTemplate('bebas');
                                setSkModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold text-xs hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors shadow-2xs self-start sm:self-auto"
                        >
                            <FolderArchive className="h-4 w-4" />
                            Isi Surat dari Agenda Surat Keluar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TEMPLATES.map((t) => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id} onClick={() => selectTemplate(t.id)}
                                    className={`text-left rounded-2xl border-2 p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[.98] ${COLOR_CLASS[t.color]}`}>
                                    <div className={`mb-3 ${ICON_CLASS[t.color]}`}>
                                        <Icon className="h-7 w-7" />
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t.label}</p>
                                    <p className="text-xs leading-relaxed opacity-80">{t.desc}</p>
                                    {t.penerimaTipe && (
                                        <p className="text-[10px] mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 font-medium">
                                            <Search className="h-2.5 w-2.5" /> Terintegrasi data {t.penerimaTipe.map((x) => TIPE_LABEL[x]).join('/')}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </AppLayout>
        );
    }

    /* ── Step 2: Form + Editor/Preview ── */
    return (
        <AppLayout title={`Buat Surat — ${tpl?.label ?? 'Bebas'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <button onClick={() => (editing ? router.visit('/tatausaha/surat-keluar') : setStep('template'))}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                    <ChevronLeft className="h-4 w-4" /> {editing ? 'Kembali ke Arsip' : 'Ganti Template'}
                </button>
                <div className="flex items-center gap-2">
                    <div className="flex lg:hidden rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button onClick={() => setTab('form')} className={`px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'form' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            Form
                        </button>
                        <button onClick={() => setTab('preview')} className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${tab === 'preview' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <Eye className="h-3.5 w-3.5" /> Pratinjau
                        </button>
                    </div>
                    <button onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Printer className="h-4 w-4" /> Cetak
                    </button>
                    <Button icon={Save} onClick={handleSimpan} loading={saving}>
                        {editing || linkedSuratKeluar ? 'Simpan ke Arsip Surat Keluar' : 'Simpan ke Arsip'}
                    </Button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* ── FORM ── */}
                <div className={`w-full lg:w-[400px] lg:shrink-0 space-y-4 ${tab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                {tpl?.label ?? 'Surat Bebas'}
                            </p>
                            {linkedSuratKeluar && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                                    <Link2 className="h-3 w-3" /> Tertaut Arsip
                                </span>
                            )}
                        </div>

                        <Input label="Tanggal Surat" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />

                        {/* ── Box Penomoran Surat (Sangat Fleksibel) ── */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                    Penomoran Surat
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setSkModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors shadow-2xs"
                                >
                                    <FolderArchive className="h-3.5 w-3.5" />
                                    Ambil dari Surat Keluar
                                </button>
                            </div>

                            {/* Banner jika surat tertaut ke record Surat Keluar yang sudah ada */}
                            {linkedSuratKeluar && (
                                <div className="flex items-start justify-between gap-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-2.5 text-xs">
                                    <div className="flex items-start gap-2 min-w-0">
                                        <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sky-800 dark:text-sky-200 truncate">
                                                Menggunakan Nomor Surat Keluar
                                            </p>
                                            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-mono truncate">
                                                #{linkedSuratKeluar.nomor_surat}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                Surat ini akan memperbarui record di arsip Surat Keluar.
                                            </p>
                                        </div>
                                    </div>
                                    {!editing && (
                                        <button
                                            type="button"
                                            onClick={lepasTautanSuratKeluar}
                                            title="Lepas tautan dan kembali ke nomor otomatis"
                                            className="shrink-0 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Dropdowns hanya jika mode nomor otomatis */}
                            {!linkedSuratKeluar && (
                                <>
                                    {kode_jenis.length > 0 && (
                                        <Select label="Jenis Surat (untuk kode nomor)" value={kodeJenisId ?? ''} onChange={(e) => { setKodeJenisId(Number(e.target.value)); setNomorEdited(false); }}>
                                            {kode_jenis.map((j) => <option key={j.id} value={j.id}>{j.nama} ({j.kode})</option>)}
                                        </Select>
                                    )}
                                    {showDept && kode_departemen.length > 0 && (
                                        <Select label="Departemen / Bidang" value={kodeDeptId ?? ''} onChange={(e) => { setKodeDeptId(Number(e.target.value)); setNomorEdited(false); }}>
                                            {kode_departemen.map((d) => <option key={d.id} value={d.id}>{d.nama} ({d.kode})</option>)}
                                        </Select>
                                    )}
                                </>
                            )}

                            {/* Input Nomor Surat (Bisa Diedit Manual Kapan Saja) */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Nomor Surat (Bisa Diedit Manual)
                                    </span>
                                    {nomorEdited && !linkedSuratKeluar && (
                                        <button type="button" onClick={resetNomor} className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-800 dark:text-sky-400 transition-colors">
                                            <RefreshCw className="h-3 w-3" /> Reset otomatis
                                        </button>
                                    )}
                                </div>
                                <input
                                    value={nomor}
                                    onChange={(e) => handleNomorChange(e.target.value)}
                                    placeholder="Nomor surat..."
                                    className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                                        nomorEdited
                                            ? 'border-amber-400 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-900/10 text-gray-900 dark:text-gray-100'
                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                    }`}
                                />
                            </div>
                        </div>

                        {tpl?.penerimaTipe && (
                            <PenerimaPicker allowedTipe={tpl.penerimaTipe} onApply={applyPenerima} />
                        )}

                        {tpl?.fields.map((field) => (
                            <div key={field.key}>
                                {field.type === 'textarea' ? (
                                    <Textarea label={field.label} value={values[field.key] ?? ''} onChange={(e) => setValue(field.key, e.target.value)} rows={3} required={field.required} placeholder={field.placeholder} />
                                ) : (
                                    <Input label={field.label} type={field.type} value={values[field.key] ?? ''} onChange={(e) => setValue(field.key, e.target.value)} required={field.required} placeholder={field.placeholder} />
                                )}
                            </div>
                        ))}

                        {tpl && (
                            <Button icon={RefreshCw} variant="secondary" className="w-full justify-center" onClick={terapkanKeSurat}>
                                {generatedOnce.current ? 'Perbarui Isi Surat dari Form' : 'Buat Isi Surat'}
                            </Button>
                        )}

                        <Input label="Tujuan (Kepada Yth.)" value={tujuan} onChange={(e) => setTujuan(e.target.value)} />

                        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="Terkirim">Terkirim</option>
                            <option value="Draft">Draft</option>
                        </Select>

                        <Textarea label="Catatan Arsip (opsional)" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2} />
                    </div>

                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                        <p className="font-semibold mb-1">Header surat menggunakan data instansi/sekolah:</p>
                        <p><span className="font-medium">Instansi:</span> {sekolah.nama_sekolah || '–'}</p>
                        {sekolah.sub_nama && <p><span className="font-medium">Sub Nama:</span> {sekolah.sub_nama}</p>}
                        <p><span className="font-medium">Kepala Sekolah:</span> {sekolah.kepala_sekolah_nama || '–'}</p>
                        {!sekolah.kepala_sekolah_nama && (
                            <p className="mt-1 text-amber-600 dark:text-amber-500">⚠ Lengkapi identitas di menu <strong>Pengaturan Sekolah</strong> (admin).</p>
                        )}
                    </div>
                </div>

                {/* ── PREVIEW / EDITOR ── */}
                <div className={`flex-1 min-w-0 ${tab === 'form' ? 'hidden lg:block' : 'block'}`}>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                        <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-300 dark:border-gray-700">
                            <div className="flex gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-amber-400" />
                                <div className="h-3 w-3 rounded-full bg-green-400" />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Isi surat bisa diedit langsung di bawah ini (tersedia tombol perataan & tabel biodata rapi)</span>
                        </div>
                        <div className="overflow-auto p-4" style={{ maxHeight: '92vh' }}>
                            {/* Lebar dipatok ~A4 (210mm) supaya pratinjau benar-benar merepresentasikan
                            ukuran kertas cetak, bukan cuma melebar mengikuti panel kanan. */}
                            <div className="bg-white text-gray-900 font-serif text-[13px] leading-relaxed px-10 py-8 shadow-lg rounded mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm' }}>
                                {/* KOP Surat */}
                                <div className="flex items-center gap-4 pb-3 border-b-2 border-gray-800 mb-5">
                                    <div className="h-20 w-20 shrink-0 flex items-center justify-center">
                                        {sekolah.logo_url
                                            ? <img src={sekolah.logo_url} alt="Logo" className="h-full w-full object-contain" />
                                            : <div className="h-full w-full rounded-full border-2 border-gray-400 flex items-center justify-center"><Building2 className="h-9 w-9 text-gray-400" /></div>}
                                    </div>
                                    <div className="flex-1 text-center">
                                        {sekolah.yayasan_dinas && <p className="text-[11px] font-normal text-gray-600 uppercase tracking-wide leading-tight">{sekolah.yayasan_dinas}</p>}
                                        <p className="text-[18px] font-bold uppercase tracking-wider leading-tight mt-0.5">{sekolah.nama_sekolah || 'SMK'}</p>
                                        {sekolah.sub_nama && <p className="text-[12px] font-semibold text-gray-700 mt-0.5">{sekolah.sub_nama}</p>}
                                        {sekolah.alamat && (
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                {sekolah.alamat}
                                            </p>
                                        )}
                                        <div className="flex justify-center gap-4 text-[11px] text-gray-600 mt-0.5 flex-wrap">
                                            {sekolah.telepon && <span>Telp. {sekolah.telepon}</span>}
                                            {sekolah.email_sekolah && <span>Email: {sekolah.email_sekolah}</span>}
                                            {sekolah.website && <span>{sekolah.website}</span>}
                                            {sekolah.npsn && <span>NPSN: {sekolah.npsn}</span>}
                                        </div>
                                    </div>
                                    <div className="w-20 shrink-0" />
                                </div>

                                <div className="text-center mb-5">
                                    <p className="text-[14px] font-bold uppercase tracking-widest underline underline-offset-2">{(tpl?.label ?? 'SURAT').toUpperCase()}</p>
                                    <p className="text-[12px] text-gray-700 mt-1">Nomor: {nomor || '…'}</p>
                                </div>

                                {/* Perihal & Kepada dengan posisi titik dua (:) sejajar rata */}
                                <table className="mb-4 text-[13px] border-collapse w-full">
                                    <tbody>
                                        <tr>
                                            <td className="align-top py-0.5" style={{ width: '85px' }}>Perihal</td>
                                            <td className="align-top py-0.5 text-center" style={{ width: '18px' }}>:</td>
                                            <td className="align-top py-0.5 font-semibold text-gray-900">{perihal}</td>
                                        </tr>
                                        <tr>
                                            <td className="align-top py-0.5" style={{ width: '85px' }}>Kepada</td>
                                            <td className="align-top py-0.5 text-center" style={{ width: '18px' }}>:</td>
                                            <td className="align-top py-0.5 text-gray-800">
                                                Yth. <strong>{tujuan || '…'}</strong>
                                                <br />
                                                <span className="text-[12px] text-gray-500">di Tempat</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <p className="mb-3">Assalamu'alaikum Wr. Wb. / Salam Sejahtera,</p>

                                {/* Isi surat — RICH EDITOR dengan Text Alignment & Table Biodata */}
                                <div className="mb-4 -mx-2">
                                    <RichEditor key={editorKey} value={isiSurat} onChange={setIsiSurat} placeholder="Tulis atau pilih template untuk mengisi surat ini..." />
                                </div>

                                <p className="mb-6">Demikian surat ini kami sampaikan. Atas perhatian Bapak/Ibu/Sdr., kami ucapkan terima kasih.</p>

                                {/* Tanggal Surat dan Tanda Tangan: Posisi di kanan, namun teks rata kiri menyesuaikan nama kepala sekolah */}
                                <div className="flex justify-end">
                                    <div className="text-left min-w-[240px]">
                                        <p>{sekolah.kota || '…'}, {fmtTanggal(tanggal)}</p>
                                        <p className="mt-1">Kepala Sekolah,</p>
                                        <div className="h-20" />
                                        <p className="font-bold underline">{sekolah.kepala_sekolah_nama || '…'}</p>
                                        {sekolah.nip_kepala && <p className="text-[12px] text-gray-700 mt-0.5">NIPY. {sekolah.nip_kepala}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal Pilih dari Arsip Surat Keluar ── */}
            {skModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                                    <FolderArchive className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                        Pilih dari Arsip Surat Keluar
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pilih nomor surat yang sudah tercatat/booking di agenda Surat Keluar agar langsung terhubung.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSkModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    value={skSearch}
                                    onChange={(e) => setSkSearch(e.target.value)}
                                    placeholder="Cari nomor surat, perihal, atau tujuan..."
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSkDraftOnly(false)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                        !skDraftOnly
                                            ? 'bg-sky-600 border-sky-600 text-white'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Semua Surat Keluar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSkDraftOnly(true)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                        skDraftOnly
                                            ? 'bg-sky-600 border-sky-600 text-white'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Hanya Draft / Belum Ada Isi (Booking)
                                </button>
                            </div>
                        </div>

                        {/* List Results */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {skLoading ? (
                                <div className="py-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                                    <span>Mencari data surat keluar...</span>
                                </div>
                            ) : skResults.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-400">
                                    Tidak ada data surat keluar yang cocok.
                                </div>
                            ) : (
                                skResults.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-all group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                    {item.nomor_surat}
                                                </span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    item.status === 'Draft'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                {item.has_isi ? (
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                        Sudah ada isi
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/50 px-1.5 py-0.5 rounded">
                                                        Belum ada isi (Siap diisi)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                <span className="text-gray-400">Perihal:</span> {item.perihal}
                                            </p>
                                            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                                                <span>Tujuan: {item.tujuan}</span>
                                                <span>·</span>
                                                <span>Tanggal: {fmtTanggal(item.tgl_surat)}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => pilihDariSuratKeluar(item)}
                                            className="shrink-0 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                                        >
                                            Pilih & Tautkan
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex justify-end">
                            <Button variant="secondary" onClick={() => setSkModalOpen(false)}>
                                Batal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
