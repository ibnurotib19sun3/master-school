import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, FileArchive as ArchiveIcon, Loader2, CheckSquare, Square, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toCanvas } from 'html-to-image';
import JSZip from 'jszip';

function fieldValue(field, siswa, sekolah) {
    if (field.type === 'text') {
        return field.content || '';
    }
    if (field.key === 'sekolah') {
        return null; // dirender khusus (logo + teks), lihat SekolahBlock
    }
    return siswa[field.key] ?? '';
}

function slugify(text) {
    return (text || 'siswa').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Berapa kartu muat dalam 1 halaman kertas, berdasarkan ukuran kertas, margin, ukuran
// kartu, dan jarak antar kartu — dipakai supaya "Unduh Preview" dipecah per halaman
// persis seperti hasil cetak fisik, bukan satu gambar raksasa tak berujung.
function computeCardsPerPage(template) {
    const availW = template.kertas_lebar_mm - 2 * template.margin_mm;
    const availH = template.kertas_tinggi_mm - 2 * template.margin_mm;
    const cols = Math.max(1, Math.floor((availW + template.jarak_x_mm) / (template.lebar_mm + template.jarak_x_mm)));
    const rows = Math.max(1, Math.floor((availH + template.jarak_y_mm) / (template.tinggi_mm + template.jarak_y_mm)));
    return cols * rows;
}

function chunk(list, size) {
    const pages = [];
    for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
    return pages.length > 0 ? pages : [[]];
}

// html2canvas menggambar ulang DOM lewat interpretasi CSS-nya sendiri, jadi
// background/gradient bisa tampak pecah walau preview di layar tajam. html-to-image
// membungkus DOM sebagai SVG <foreignObject> lalu dirender native oleh browser —
// hasilnya identik dengan yang tampil di layar. pixelRatio 4 ≈ 384dpi untuk cetak.
// filter membuang elemen ber-class "no-print" (tombol pilih/unduh di atas kartu) —
// karena capture ini membaca DOM asli, tombol yang sedang di-hover/aktif (mis. saat
// diklik, atau kartu yang sedang dicentang) bisa ikut ter-render kalau tidak dibuang.
const excludeOverlayControls = (node) => !(node.classList && node.classList.contains('no-print'));

// Kalau ada <img> (foto siswa/background/logo) yang belum selesai dimuat saat capture
// dijalankan, hasilnya bisa kosong/salah tempat — tunggu semua gambar siap dulu.
// Lembar penuh (20+ kartu) jauh lebih rawan kena race condition ini dibanding 1 kartu.
async function waitForImages(container) {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }));
}

async function captureNode(node, pixelRatio) {
    await waitForImages(node);
    // Tunggu 2 frame supaya layout benar-benar settle sebelum di-capture (mencegah
    // kartu yang baru saja di-render belum sempat "diukur" browser).
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return toCanvas(node, { pixelRatio, backgroundColor: '#ffffff', cacheBust: true, filter: excludeOverlayControls });
}

function SekolahBlock({ field, sekolah }) {
    return (
        <div
            className="absolute flex items-center gap-[1.5mm]"
            style={{ left: `${field.x}mm`, top: `${field.y}mm`, width: `${field.width}mm`, justifyContent: field.align === 'center' ? 'center' : field.align === 'right' ? 'flex-end' : 'flex-start' }}
        >
            {sekolah.logo_url && <img src={sekolah.logo_url} alt="" style={{ height: '6mm', width: '6mm', objectFit: 'contain' }} />}
            <p className="font-bold uppercase leading-none truncate" style={{ fontSize: `${field.fontSize}pt`, color: field.color, fontStyle: field.italic ? 'italic' : 'normal', textDecoration: field.underline ? 'underline' : 'none' }}>
                {sekolah.nama_instansi || sekolah.nama_sekolah}
            </p>
        </div>
    );
}

function KartuSiswaCard({ template, siswa, sekolah }) {
    const fields = template.fields ?? [];
    const foto = template.foto_layout ?? { x: 2, y: 4, width: 18, height: 18 };

    return (
        <div
            className="relative overflow-hidden shrink-0 break-inside-avoid"
            style={{
                width: `${template.lebar_mm}mm`,
                height: `${template.tinggi_mm}mm`,
                backgroundImage: template.background_url ? `url(${template.background_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: template.background_url ? undefined : '#ffffff',
                border: template.background_url ? undefined : '1px solid #d1d5db',
                borderRadius: '3mm',
            }}
        >
            <img
                src={siswa.foto_url}
                alt={siswa.nama}
                className={`absolute object-cover border border-white shadow ${template.bingkai_foto === 'lingkaran' ? 'rounded-full' : 'rounded-[2mm]'}`}
                style={{ left: `${foto.x}mm`, top: `${foto.y}mm`, width: `${foto.width}mm`, height: `${foto.height}mm` }}
            />

            {fields.map((field) => {
                if (field.type === 'image') {
                    if (!field.image_url) return null;
                    return (
                        <img key={field.id} src={field.image_url} alt="" className="absolute object-contain"
                            style={{ left: `${field.x}mm`, top: `${field.y}mm`, width: `${field.width}mm`, height: `${field.height || field.width}mm` }} />
                    );
                }
                if (field.type === 'data' && field.key === 'sekolah') {
                    return <SekolahBlock key={field.id} field={field} sekolah={sekolah} />;
                }
                const val = fieldValue(field, siswa, sekolah);
                if (!val) return null;
                return (
                    <p
                        key={field.id}
                        className="absolute truncate"
                        style={{
                            left: `${field.x}mm`, top: `${field.y}mm`, width: `${field.width}mm`,
                            textAlign: field.align, fontSize: `${field.fontSize}pt`,
                            fontWeight: field.bold ? 700 : 400, fontStyle: field.italic ? 'italic' : 'normal',
                            textDecoration: field.underline ? 'underline' : 'none', color: field.color || '#111827',
                            lineHeight: 1.15,
                        }}
                    >
                        {val}
                    </p>
                );
            })}
        </div>
    );
}

/* ── Overlay loading proses unduh (mengikuti pola di halaman Pengumpulan) ──
   pct=null artinya indeterminate (satu file, tidak ada tahapan untuk dihitung). */
function DownloadProgressOverlay({ pct = null, done, total, title, subtitle }) {
    const indeterminate = pct === null;
    const finished = !indeterminate && pct >= 100;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-80 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors ${finished ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
                        <ArchiveIcon className={`h-5 w-5 ${finished ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`} />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {finished ? 'Selesai!' : (title ?? 'Menyiapkan ZIP…')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {finished ? 'File sedang diunduh' : (subtitle ?? `${done} dari ${total} kartu diproses`)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${finished ? 'bg-emerald-500' : 'bg-sky-500'}`}
                            style={{ width: indeterminate ? '100%' : `${pct}%` }}
                        >
                            {!finished && (
                                <div className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.4s linear infinite',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {finished ? 'Download dimulai…' : 'Harap tunggu…'}
                        </span>
                        {!indeterminate && (
                            <span className={`text-sm font-bold tabular-nums ${finished ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                {pct}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

export default function KartuSiswaCetak({ template, siswaList, sekolah }) {
    const [format, setFormat] = useState('png');
    const [downloadingId, setDownloadingId] = useState(null);
    const [zipProgress, setZipProgress] = useState(null); // { done, total }
    const [previewProgress, setPreviewProgress] = useState(null); // { done, total } | null | 'indeterminate'
    const [selected, setSelected] = useState(() => new Set());
    const cardRefs = useRef({});
    const pageRefs = useRef([]);

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpg' ? 'jpg' : 'png';
    const jpegQuality = 1; // kualitas maksimal — hindari artefak blok JPEG pada tepi warna tajam

    const cardsPerPage = computeCardsPerPage(template);
    const pages = chunk(siswaList, cardsPerPage);

    const fileName = (siswa) => `kartu-${slugify(siswa.nama)}-${slugify(siswa.nis) || siswa.id}.${ext}`;

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected((prev) => (prev.size === siswaList.length ? new Set() : new Set(siswaList.map((s) => s.id))));
    };

    const downloadOne = async (siswa) => {
        const node = cardRefs.current[siswa.id];
        if (!node) return;
        setDownloadingId(siswa.id);
        try {
            const canvas = await captureNode(node, 4);
            const url = canvas.toDataURL(mime, jpegQuality);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName(siswa);
            a.click();
        } catch (e) {
            alert('Gagal mengunduh kartu ' + siswa.nama + ': ' + e.message);
        } finally {
            setDownloadingId(null);
        }
    };

    const downloadZip = async (list, zipName) => {
        setZipProgress({ done: 0, total: list.length });
        try {
            const zip = new JSZip();
            for (let i = 0; i < list.length; i++) {
                const siswa = list[i];
                const node = cardRefs.current[siswa.id];
                if (node) {
                    const canvas = await captureNode(node, 4);
                    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, jpegQuality));
                    if (blob) zip.file(fileName(siswa), blob);
                }
                setZipProgress({ done: i + 1, total: list.length });
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = zipName;
            a.click();
        } catch (e) {
            alert('Gagal membuat ZIP: ' + e.message);
        } finally {
            setZipProgress(null);
        }
    };

    // Preview mengikuti pagination yang sama seperti hasil cetak fisik: kalau kartu
    // tidak muat dalam 1 halaman kertas, dipecah jadi beberapa gambar (halaman-1,
    // halaman-2, dst) dibungkus ZIP — bukan 1 gambar raksasa yang terus memanjang.
    const downloadPreview = async () => {
        if (pageRefs.current.length === 0) return;
        try {
            if (pages.length <= 1) {
                setPreviewProgress('indeterminate');
                const node = pageRefs.current[0];
                const canvas = await captureNode(node, 3);
                const url = canvas.toDataURL(mime, jpegQuality);
                const a = document.createElement('a');
                a.href = url;
                a.download = `preview-kartu-siswa-${slugify(template.nama)}.${ext}`;
                a.click();
            } else {
                setPreviewProgress({ done: 0, total: pages.length });
                const zip = new JSZip();
                for (let i = 0; i < pages.length; i++) {
                    const node = pageRefs.current[i];
                    if (node) {
                        const canvas = await captureNode(node, 3);
                        const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, jpegQuality));
                        if (blob) zip.file(`halaman-${i + 1}.${ext}`, blob);
                    }
                    setPreviewProgress({ done: i + 1, total: pages.length });
                }
                const content = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = `preview-kartu-siswa-${slugify(template.nama)}.zip`;
                a.click();
            }
        } catch (e) {
            alert('Gagal mengunduh preview: ' + e.message);
        } finally {
            setPreviewProgress(null);
        }
    };

    const hasSelection = selected.size > 0;
    const handleZipClick = () => {
        if (hasSelection) {
            downloadZip(siswaList.filter((s) => selected.has(s.id)), `kartu-siswa-${slugify(template.nama)}-terpilih.zip`);
        } else {
            downloadZip(siswaList, `kartu-siswa-${slugify(template.nama)}.zip`);
        }
    };

    return (
        <>
            <Head title="Cetak Kartu Siswa" />
            <style>{`
                @media print {
                    @page { size: ${template.kertas_lebar_mm}mm ${template.kertas_tinggi_mm}mm; margin: 0; }
                    body { margin: 0; }
                    .no-print { display: none !important; }
                    .kartu-page { break-after: page; }
                    .kartu-page:last-child { break-after: auto; }
                }
            `}</style>

            <div className="no-print sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <Link href="/admin/kartu-siswa" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <button onClick={toggleSelectAll}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-600">
                    {selected.size === siswaList.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    {siswaList.length} kartu — {template.nama} · {pages.length} halaman{hasSelection && ` (${selected.size} dipilih)`}
                </button>
                <div className="flex items-center gap-2">
                    <select value={format} onChange={(e) => setFormat(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                    </select>
                    <button onClick={handleZipClick} disabled={!!zipProgress}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${hasSelection ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        <ArchiveIcon className="h-4 w-4" />
                        {hasSelection ? `Unduh Terpilih (${selected.size})` : 'Unduh Semua (ZIP)'}
                    </button>
                    <button onClick={downloadPreview} disabled={!!previewProgress}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60">
                        {previewProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        Unduh Preview
                    </button>
                    <button onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                        <Printer className="h-4 w-4" /> Cetak
                    </button>
                </div>
            </div>

            {pages.map((pageSiswa, pageIdx) => (
                <div key={pageIdx}>
                    {pages.length > 1 && (
                        <p className="no-print text-center text-xs text-gray-400 dark:text-gray-500 mt-4 mb-1">
                            Halaman {pageIdx + 1} dari {pages.length}
                        </p>
                    )}
                    <div
                        ref={(el) => (pageRefs.current[pageIdx] = el)}
                        className="kartu-page mx-auto bg-white"
                        style={{
                            width: `${template.kertas_lebar_mm}mm`,
                            minHeight: `${template.kertas_tinggi_mm}mm`,
                            padding: `${template.margin_mm}mm`,
                        }}
                    >
                        <div
                            className="flex flex-wrap"
                            style={{ gap: `${template.jarak_y_mm}mm ${template.jarak_x_mm}mm` }}
                        >
                            {pageSiswa.map((s) => {
                                const isSelected = selected.has(s.id);
                                return (
                                    <div key={s.id} ref={(el) => (cardRefs.current[s.id] = el)} className="relative group">
                                        <KartuSiswaCard template={template} siswa={s} sekolah={sekolah} />
                                        <button
                                            onClick={() => toggleSelect(s.id)}
                                            title="Pilih kartu ini"
                                            className={`no-print absolute top-1 left-1 z-10 p-1.5 rounded-full transition-opacity ${
                                                isSelected ? 'bg-sky-600 text-white opacity-100' : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80'
                                            }`}
                                        >
                                            {isSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => downloadOne(s)}
                                            disabled={downloadingId === s.id}
                                            title={`Unduh kartu ${s.nama}`}
                                            className="no-print absolute top-1 right-1 z-10 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 disabled:opacity-100"
                                        >
                                            {downloadingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            {zipProgress && (
                <DownloadProgressOverlay
                    pct={Math.round((zipProgress.done / zipProgress.total) * 100)}
                    done={zipProgress.done}
                    total={zipProgress.total}
                />
            )}
            {previewProgress === 'indeterminate' && (
                <DownloadProgressOverlay title="Menyiapkan preview…" subtitle="Merender 1 halaman" />
            )}
            {previewProgress && previewProgress !== 'indeterminate' && (
                <DownloadProgressOverlay
                    pct={Math.round((previewProgress.done / previewProgress.total) * 100)}
                    done={previewProgress.done}
                    total={previewProgress.total}
                    title="Menyiapkan preview…"
                    subtitle={`${previewProgress.done} dari ${previewProgress.total} halaman diproses`}
                />
            )}
        </>
    );
}
