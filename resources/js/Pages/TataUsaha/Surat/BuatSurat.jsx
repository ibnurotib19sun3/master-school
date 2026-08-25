import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import {
    FileText, CalendarDays, Award, ClipboardList,
    Megaphone, UserCheck, Printer, Save, ChevronLeft,
    Eye, EyeOff, Building2,
} from 'lucide-react';
import { useState, useRef } from 'react';

/* ─── Helpers ─── */
const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const bulanIndo = ['','Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];

function fmtTanggal(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()} ${bulanIndo[d.getMonth()+1]} ${d.getFullYear()}`;
}

function autoNomor(seq, kode, dateStr) {
    if (!dateStr) dateStr = new Date().toISOString().substring(0, 10);
    const d = new Date(dateStr);
    return `${seq}/${kode}/SMK/${ROMAN[d.getMonth()+1]}/${d.getFullYear()}`;
}

/* ─── Template definitions ─── */
const TEMPLATES = [
    {
        id: 'undangan',
        label: 'Surat Undangan',
        kode: 'Und',
        kategori: 'Undangan',
        icon: CalendarDays,
        color: 'indigo',
        desc: 'Mengundang pihak tertentu untuk hadir pada kegiatan sekolah',
        fields: [
            { key: 'kepada',        label: 'Kepada (Nama / Jabatan)',  type: 'text',     required: true },
            { key: 'acara',         label: 'Nama Kegiatan / Acara',    type: 'text',     required: true },
            { key: 'hari',          label: 'Hari',                     type: 'text',     placeholder: 'Senin' },
            { key: 'tanggal_acara', label: 'Tanggal Kegiatan',         type: 'date',     required: true },
            { key: 'pukul',         label: 'Pukul',                    type: 'text',     placeholder: '08.00 WIB', required: true },
            { key: 'tempat',        label: 'Tempat',                   type: 'text',     required: true },
        ],
        perihal: (v) => `Undangan ${v.acara || '...'}`,
        body: (v, s) => `
Dalam rangka ${v.acara || '…'}, kami mengundang Bapak/Ibu/Sdr. untuk hadir pada:

    Hari, Tanggal : ${v.hari ? v.hari + ', ' : ''}${fmtTanggal(v.tanggal_acara) || '…'}
    Pukul         : ${v.pukul || '…'} WIB
    Tempat        : ${v.tempat || '…'}

Mengingat pentingnya kegiatan tersebut, kami mohon Bapak/Ibu/Sdr. berkenan hadir tepat waktu. Atas perhatian dan kehadiran Bapak/Ibu/Sdr., kami ucapkan terima kasih.`,
    },
    {
        id: 'keterangan',
        label: 'Surat Keterangan Aktif',
        kode: 'Ket',
        kategori: 'Dinas',
        icon: Award,
        color: 'green',
        desc: 'Menerangkan bahwa seseorang adalah siswa aktif di sekolah',
        fields: [
            { key: 'nama_siswa',  label: 'Nama Lengkap Siswa', type: 'text', required: true },
            { key: 'kelas',       label: 'Kelas',              type: 'text', required: true, placeholder: 'XII RPL 1' },
            { key: 'nis',         label: 'NIS',                type: 'text' },
            { key: 'nisn',        label: 'NISN',               type: 'text' },
            { key: 'tahun_pelajaran', label: 'Tahun Pelajaran', type: 'text', required: true, placeholder: '2025/2026' },
            { key: 'keperluan',   label: 'Keperluan',          type: 'text', required: true, placeholder: 'Melamar Beasiswa' },
        ],
        perihal: () => 'Keterangan Siswa Aktif',
        body: (v, s) => `
Yang bertanda tangan di bawah ini, Kepala ${s.nama_sekolah || 'SMK'}, menerangkan bahwa:

    Nama Lengkap : ${v.nama_siswa || '…'}
    Kelas        : ${v.kelas || '…'}
    NIS          : ${v.nis || '–'}
    NISN         : ${v.nisn || '–'}

Adalah benar siswa aktif di ${s.nama_sekolah || 'SMK'} pada tahun pelajaran ${v.tahun_pelajaran || '…'}.

Surat keterangan ini dibuat untuk keperluan ${v.keperluan || '…'} dan mohon kiranya dapat dipergunakan sebagaimana mestinya.`,
    },
    {
        id: 'permohonan',
        label: 'Surat Permohonan',
        kode: 'Per',
        kategori: 'Permohonan',
        icon: ClipboardList,
        color: 'blue',
        desc: 'Permohonan bantuan, izin, atau kerja sama kepada instansi lain',
        fields: [
            { key: 'kepada',          label: 'Kepada (Nama / Jabatan)',  type: 'text', required: true },
            { key: 'instansi_tujuan', label: 'Instansi / Lembaga Tujuan', type: 'text', required: true },
            { key: 'isi_permohonan',  label: 'Isi Permohonan',           type: 'textarea', required: true,
              placeholder: 'Tuliskan isi permohonan secara singkat dan jelas...' },
        ],
        perihal: (v) => v.isi_permohonan ? v.isi_permohonan.substring(0, 60) : 'Permohonan',
        body: (v, s) => `
Dengan hormat,

Sehubungan dengan kebutuhan ${s.nama_sekolah || 'sekolah kami'}, bersama surat ini kami mengajukan permohonan kepada Bapak/Ibu Pimpinan ${v.instansi_tujuan || '…'} perihal:

${v.isi_permohonan || '…'}

Besar harapan kami agar permohonan ini dapat dikabulkan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.`,
    },
    {
        id: 'pemberitahuan',
        label: 'Surat Pemberitahuan',
        kode: 'Pbt',
        kategori: 'Pemberitahuan',
        icon: Megaphone,
        color: 'yellow',
        desc: 'Memberitahukan informasi atau kebijakan kepada pihak terkait',
        fields: [
            { key: 'kepada',            label: 'Kepada',             type: 'text', required: true },
            { key: 'isi_pemberitahuan', label: 'Isi Pemberitahuan',  type: 'textarea', required: true,
              placeholder: 'Tuliskan isi pemberitahuan...' },
        ],
        perihal: (v) => v.isi_pemberitahuan ? v.isi_pemberitahuan.substring(0, 60) : 'Pemberitahuan',
        body: (v) => `
Dengan hormat,

Bersama surat ini kami sampaikan pemberitahuan sebagai berikut:

${v.isi_pemberitahuan || '…'}

Demikian pemberitahuan ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.`,
    },
    {
        id: 'tugas',
        label: 'Surat Tugas',
        kode: 'Tgs',
        kategori: 'Dinas',
        icon: UserCheck,
        color: 'purple',
        desc: 'Memberikan tugas atau penugasan resmi kepada pegawai/guru',
        fields: [
            { key: 'nama',          label: 'Nama Lengkap',    type: 'text', required: true },
            { key: 'jabatan',       label: 'Jabatan / NIP',   type: 'text', required: true },
            { key: 'tugas',         label: 'Tugas / Kegiatan', type: 'text', required: true,
              placeholder: 'Mengikuti Pelatihan Guru...' },
            { key: 'dari_tanggal',  label: 'Dari Tanggal',    type: 'date', required: true },
            { key: 'sampai_tanggal',label: 'Sampai Tanggal',  type: 'date', required: true },
            { key: 'tempat',        label: 'Tempat Kegiatan', type: 'text', required: true },
        ],
        perihal: (v) => v.tugas ? `Penugasan: ${v.tugas}` : 'Surat Tugas',
        body: (v, s) => `
Yang bertanda tangan di bawah ini, Kepala ${s.nama_sekolah || 'SMK'}, menugaskan kepada:

    Nama    : ${v.nama || '…'}
    Jabatan : ${v.jabatan || '…'}

Untuk melaksanakan tugas: ${v.tugas || '…'}

    Dari Tanggal  : ${fmtTanggal(v.dari_tanggal) || '…'}
    Sampai Tanggal: ${fmtTanggal(v.sampai_tanggal) || '…'}
    Tempat        : ${v.tempat || '…'}

Demikian surat tugas ini dibuat untuk dapat dilaksanakan dengan penuh tanggung jawab.`,
    },
    {
        id: 'rekomendasi',
        label: 'Surat Rekomendasi',
        kode: 'Rek',
        kategori: 'Dinas',
        icon: FileText,
        color: 'rose',
        desc: 'Memberikan rekomendasi atau referensi kepada seseorang',
        fields: [
            { key: 'nama',             label: 'Nama yang Direkomendasikan', type: 'text', required: true },
            { key: 'kelas_jabatan',    label: 'Kelas / Jabatan',            type: 'text', required: true },
            { key: 'keperluan',        label: 'Keperluan Rekomendasi',      type: 'text', required: true,
              placeholder: 'Melamar Kerja / Beasiswa / Studi Lanjut' },
            { key: 'isi_rekomendasi',  label: 'Isi / Alasan Rekomendasi',   type: 'textarea',
              placeholder: 'Tuliskan alasan atau isi rekomendasi...' },
        ],
        perihal: (v) => `Rekomendasi ${v.keperluan || ''}`,
        body: (v, s) => `
Yang bertanda tangan di bawah ini, Kepala ${s.nama_sekolah || 'SMK'}, dengan ini merekomendasikan:

    Nama          : ${v.nama || '…'}
    Kelas/Jabatan : ${v.kelas_jabatan || '…'}

Untuk keperluan ${v.keperluan || '…'}.

${v.isi_rekomendasi ? v.isi_rekomendasi + '\n\n' : ''}Yang bersangkutan adalah pribadi yang baik, disiplin, dan bertanggung jawab. Kami dengan sepenuh hati merekomendasikan yang bersangkutan dan semoga dapat dipertimbangkan sebagaimana mestinya.`,
    },
];

const COLOR_CLASS = {
    indigo: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    blue:   'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    purple: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    rose:   'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
};
const ICON_CLASS = {
    indigo: 'text-sky-500', green: 'text-emerald-500', blue: 'text-sky-500',
    yellow: 'text-amber-500',  purple: 'text-violet-500', rose: 'text-rose-500',
};

/* ─── Letter Preview (printable) ─── */
function LetterPreview({ sekolah, nomor, tanggal, tpl, values }) {
    if (!tpl) return (
        <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-3">
            <FileText className="h-16 w-16" />
            <p className="text-sm">Pilih template untuk melihat pratinjau</p>
        </div>
    );

    const kepada   = values.kepada || tpl.fields.find(f => f.key === 'kepada') ? values.kepada : null;
    const bodyText = tpl.body(values, sekolah);
    const perihal  = tpl.perihal(values, sekolah);

    return (
        <div id="print-area" className="bg-white text-gray-900 font-serif text-[13px] leading-relaxed px-10 py-8 min-h-full">
            {/* KOP Surat */}
            <div className="flex items-center gap-4 pb-3 border-b-2 border-gray-800 mb-5">
                {/* Logo */}
                <div className="h-20 w-20 shrink-0 flex items-center justify-center">
                    {sekolah.logo_url
                        ? <img src={sekolah.logo_url} alt="Logo" className="h-full w-full object-contain" />
                        : <div className="h-full w-full rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <Building2 className="h-9 w-9 text-gray-400" />
                          </div>
                    }
                </div>
                {/* Teks KOP */}
                <div className="flex-1 text-center">
                    {sekolah.yayasan_dinas && (
                        <p className="text-[11px] font-normal text-gray-600 uppercase tracking-wide leading-tight">
                            {sekolah.yayasan_dinas}
                        </p>
                    )}
                    <p className="text-[18px] font-bold uppercase tracking-wider leading-tight mt-0.5">
                        {sekolah.nama_sekolah || 'SMK'}
                    </p>
                    {sekolah.alamat && (
                        <p className="text-[11px] text-gray-600 mt-0.5">
                            {sekolah.alamat}
                            {sekolah.kecamatan ? `, Kec. ${sekolah.kecamatan}` : ''}
                            {sekolah.kota ? `, ${sekolah.kota}` : ''}
                        </p>
                    )}
                    <div className="flex justify-center gap-4 text-[11px] text-gray-600 mt-0.5 flex-wrap">
                        {sekolah.telepon       && <span>Telp. {sekolah.telepon}</span>}
                        {sekolah.email_sekolah && <span>Email: {sekolah.email_sekolah}</span>}
                        {sekolah.website       && <span>{sekolah.website}</span>}
                        {sekolah.npsn          && <span>NPSN: {sekolah.npsn}</span>}
                    </div>
                </div>
                {/* Spacer kanan untuk simetri */}
                <div className="w-20 shrink-0 hidden print:block" />
            </div>

            {/* Nomor & Jenis */}
            <div className="text-center mb-5">
                <p className="text-[14px] font-bold uppercase tracking-widest underline underline-offset-2">
                    {tpl.label.toUpperCase()}
                </p>
                <p className="text-[12px] text-gray-700 mt-1">Nomor: {nomor || '…'}</p>
            </div>

            {/* Kepada */}
            {kepada && (
                <div className="mb-4">
                    <p>Kepada Yth.</p>
                    <p className="font-semibold">{kepada}</p>
                    <p>di Tempat</p>
                </div>
            )}

            {/* Perihal */}
            <table className="mb-4 text-[13px]">
                <tbody>
                    <tr><td className="pr-4 align-top">Perihal</td><td className="pr-2 align-top">:</td><td className="font-semibold">{perihal}</td></tr>
                </tbody>
            </table>

            {/* Salam */}
            <p className="mb-3">Assalamu'alaikum Wr. Wb. / Salam Sejahtera,</p>

            {/* Body */}
            <div className="whitespace-pre-line mb-6 leading-7">{bodyText}</div>

            {/* Penutup */}
            <p className="mb-6">Demikian surat ini kami sampaikan. Atas perhatian Bapak/Ibu/Sdr., kami ucapkan terima kasih.</p>

            {/* TTD */}
            <div className="flex justify-end">
                <div className="text-center min-w-[200px]">
                    <p>{sekolah.kota || '…'}, {fmtTanggal(tanggal)}</p>
                    <p className="mt-0.5">Kepala Sekolah,</p>
                    <div className="h-16" />
                    <p className="font-bold underline">{sekolah.kepala_sekolah_nama || '…'}</p>
                    {sekolah.nip_kepala && <p className="text-[12px]">NIP. {sekolah.nip_kepala}</p>}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function BuatSurat({ sekolah, today, nextNo }) {
    const [step,    setStep]    = useState('template'); // 'template' | 'form'
    const [tplId,   setTplId]   = useState(null);
    const [values,  setValues]  = useState({});
    const [nomor,   setNomor]   = useState('');
    const [tanggal, setTanggal] = useState(today);
    const [tab,     setTab]     = useState('form'); // mobile tab: 'form' | 'preview'
    const [saving,  setSaving]  = useState(false);

    const tpl = TEMPLATES.find(t => t.id === tplId);

    const selectTemplate = (id) => {
        const t = TEMPLATES.find(t => t.id === id);
        setTplId(id);
        setValues({});
        setNomor(autoNomor(nextNo, t.kode, today));
        setStep('form');
        setTab('form');
    };

    const setValue = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

    const handlePrint = () => {
        const style = `
            @media print {
                body > * { display: none !important; }
                #print-wrapper { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; }
                #print-area { box-shadow: none !important; }
            }
        `;
        const el = document.getElementById('print-wrapper');
        if (!el) return;
        const styleTag = document.createElement('style');
        styleTag.textContent = style;
        document.head.appendChild(styleTag);
        window.print();
        setTimeout(() => document.head.removeChild(styleTag), 1000);
    };

    const handleSimpan = () => {
        if (!tpl) return;
        setSaving(true);
        router.post('/tatausaha/buat-surat/simpan', {
            nomor_surat: nomor,
            perihal:     tpl.perihal(values, sekolah),
            tujuan:      values.kepada || values.instansi_tujuan || values.nama || '–',
            tgl_surat:   tanggal,
            tgl_keluar:  tanggal,
            kategori:    tpl.kategori,
            status:      'Terkirim',
            keterangan:  `Dibuat via generator surat — template: ${tpl.label}`,
        }, { onFinish: () => setSaving(false) });
    };

    /* ── Step 1: Pilih Template ── */
    if (step === 'template') {
        return (
            <AppLayout title="Buat Surat">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pilih Template Surat</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sistem akan otomatis membuat format surat sesuai template yang dipilih</p>
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
                                </button>
                            );
                        })}
                    </div>
                </div>
            </AppLayout>
        );
    }

    /* ── Step 2: Form + Preview ── */
    return (
        <AppLayout title={`Buat Surat — ${tpl?.label}`}>
            {/* Print wrapper (hidden, shown only when printing) */}
            <div id="print-wrapper" className="hidden">
                <LetterPreview sekolah={sekolah} nomor={nomor} tanggal={tanggal} tpl={tpl} values={values} />
            </div>

            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <button onClick={() => setStep('template')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                    <ChevronLeft className="h-4 w-4" /> Ganti Template
                </button>
                <div className="flex items-center gap-2">
                    {/* Mobile tab toggle */}
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
                        Simpan ke Arsip
                    </Button>
                </div>
            </div>

            {/* Layout: form (left) + preview (right) */}
            <div className="flex gap-6">
                {/* ── FORM ── */}
                <div className={`w-full lg:w-[380px] lg:shrink-0 space-y-4 ${tab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            {tpl?.label}
                        </p>

                        {/* Nomor & Tanggal */}
                        <div>
                            <Input label="Nomor Surat (bisa diubah)" value={nomor} onChange={(e) => setNomor(e.target.value)} />
                        </div>
                        <div>
                            <Input label="Tanggal Surat" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                        </div>

                        {/* Dynamic fields */}
                        {tpl?.fields.map((field) => (
                            <div key={field.key}>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        label={field.label}
                                        value={values[field.key] ?? ''}
                                        onChange={(e) => setValue(field.key, e.target.value)}
                                        rows={3}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                    />
                                ) : (
                                    <Input
                                        label={field.label}
                                        type={field.type}
                                        value={values[field.key] ?? ''}
                                        onChange={(e) => setValue(field.key, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Info identitas sekolah */}
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                        <p className="font-semibold mb-1">Header surat menggunakan data sekolah:</p>
                        <p><span className="font-medium">Nama:</span> {sekolah.nama_sekolah || '–'}</p>
                        <p><span className="font-medium">Kepala Sekolah:</span> {sekolah.kepala_sekolah_nama || '–'}</p>
                        {!sekolah.kepala_sekolah_nama && (
                            <p className="mt-1 text-amber-600 dark:text-amber-500">
                                ⚠ Lengkapi identitas di menu <strong>Pengaturan Sekolah</strong> (admin).
                            </p>
                        )}
                    </div>
                </div>

                {/* ── PREVIEW ── */}
                <div className={`flex-1 min-w-0 ${tab === 'form' ? 'hidden lg:block' : 'block'}`}>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-hidden" style={{ minHeight: '600px' }}>
                        <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-300 dark:border-gray-700">
                            <div className="flex gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-amber-400" />
                                <div className="h-3 w-3 rounded-full bg-green-400" />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Pratinjau Surat</span>
                        </div>
                        <div className="overflow-auto" style={{ maxHeight: '75vh' }}>
                            <div className="shadow-lg m-4 rounded">
                                <LetterPreview sekolah={sekolah} nomor={nomor} tanggal={tanggal} tpl={tpl} values={values} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
