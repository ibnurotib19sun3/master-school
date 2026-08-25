import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import {
    ShieldCheck, Search, QrCode, Stamp,
    CheckCircle, XCircle, FileText, ExternalLink, Copy, Download, Paperclip,
    Move, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PDFDocument } from 'pdf-lib';

const fmt = (val) => val
    ? new Date(val + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '–';

const STATUS_COLOR = { Draft: 'yellow', Terkirim: 'green' };
const tahunList    = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

/* ── QR Placer Modal ─────────────────────────────────────────────── */
// A4 paper: 210×297mm. Preview width fixed at PAPER_W px.
const PAPER_W = 380;
const PAPER_H = Math.round(PAPER_W * 297 / 210); // ~537px

const PRESETS = [
    { label: 'Kanan Bawah', x: 78, y: 88 },
    { label: 'Kiri Bawah',  x: 10, y: 88 },
    { label: 'Tengah Bawah',x: 44, y: 88 },
    { label: 'Kanan Atas',  x: 78, y:  4 },
];

function QrPlacerModal({ item, onClose, initialConfigs = {} }) {
    const qrSvgRef = useRef(null);
    const paperRef = useRef(null);
    const dragging   = useRef(false);
    const dragOffset = useRef({ dx: 0, dy: 0 });

    const isPdf   = item.file_url?.toLowerCase().endsWith('.pdf');
    const isImage = item.file_url && /\.(jpe?g|png|webp)$/i.test(item.file_url);

    // Restore saved positions if provided
    const firstInitPage = Object.keys(initialConfigs).map(Number).sort((a, b) => a - b)[0] ?? null;

    // pageConfigs: { [pageNum]: { x, y, qrSize } } — saved positions per page
    const [pageConfigs,  setPageConfigs]  = useState(initialConfigs);
    const [pageCount,    setPageCount]    = useState(isPdf ? 0 : 1);
    // activePage: page currently being edited (null = none selected yet)
    const [activePage,   setActivePage]   = useState(isImage ? 1 : firstInitPage);

    // editing state for the active page — seeded from initialConfigs if available
    const [pos,    setPos]    = useState(() => {
        const cfg = initialConfigs[firstInitPage];
        return cfg ? { x: cfg.x, y: cfg.y } : { x: 75, y: 85 };
    });
    const [qrSize, setQrSize] = useState(() => initialConfigs[firstInitPage]?.qrSize ?? 36);
    const [isDragging, setIsDragging] = useState(false);
    const [downloading,setDownloading]= useState(false);
    const [copied,     setCopied]     = useState(false);

    // Responsive paper width — capped at PAPER_W, shrinks on small screens
    const paperWrapRef = useRef(null);
    const dispWRef     = useRef(PAPER_W);
    const [dispW, setDispW] = useState(PAPER_W);
    const dispH = Math.round(dispW * 297 / 210);

    useEffect(() => {
        const wrap = paperWrapRef.current;
        if (!wrap) return;
        const update = () => {
            const w = Math.min(PAPER_W, Math.floor(wrap.offsetWidth));
            if (w > 0) { dispWRef.current = w; setDispW(w); }
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, []);

    // Load PDF page count
    useEffect(() => {
        if (!isPdf || !item.file_url) return;
        fetch(item.file_url)
            .then((r) => r.arrayBuffer())
            .then((bytes) => PDFDocument.load(bytes, { ignoreEncryption: true }))
            .then((doc) => setPageCount(doc.getPages().length))
            .catch(() => setPageCount(1));
    }, [item.file_url, isPdf]);

    // Switch to a page: auto-save current then load target
    const openPage = (n) => {
        // auto-save current page before switching
        if (activePage !== null) {
            setPageConfigs((prev) => ({ ...prev, [activePage]: { x: pos.x, y: pos.y, qrSize } }));
        }
        setActivePage(n);
        const saved = pageConfigs[n];
        setPos(saved ? { x: saved.x, y: saved.y } : { x: 75, y: 85 });
        setQrSize(saved?.qrSize ?? 36);
    };

    const savePage = () => {
        if (activePage === null) return;
        const next = { ...pageConfigs, [activePage]: { x: pos.x, y: pos.y, qrSize } };
        setPageConfigs(next);
        try { localStorage.setItem(`tte_config_${item.id}`, JSON.stringify(next)); } catch {}
    };

    const removePage = (n) => {
        setPageConfigs((prev) => {
            const next = { ...prev };
            delete next[n];
            try {
                Object.keys(next).length > 0
                    ? localStorage.setItem(`tte_config_${item.id}`, JSON.stringify(next))
                    : localStorage.removeItem(`tte_config_${item.id}`);
            } catch {}
            return next;
        });
        if (activePage === n) setActivePage(null);
    };

    const savedPageNums = Object.keys(pageConfigs).map(Number).sort((a, b) => a - b);

    // ── drag ──────────────────────────────────────────────────────
    const startDrag = useCallback((clientX, clientY) => {
        const paper = paperRef.current;
        if (!paper) return;
        const rect = paper.getBoundingClientRect();
        const dW = dispWRef.current;
        const dH = Math.round(dW * 297 / 210);
        dragging.current   = true;
        setIsDragging(true);
        dragOffset.current = {
            dx: clientX - rect.left - (pos.x / 100) * dW,
            dy: clientY - rect.top  - (pos.y / 100) * dH,
        };
    }, [pos]);

    const moveDrag = useCallback((clientX, clientY) => {
        if (!dragging.current) return;
        const paper = paperRef.current;
        if (!paper) return;
        const rect = paper.getBoundingClientRect();
        const dW   = dispWRef.current;
        const dH   = Math.round(dW * 297 / 210);
        const dQr  = Math.round(qrSize * (dW / PAPER_W));
        const rawX = clientX - rect.left - dragOffset.current.dx;
        const rawY = clientY - rect.top  - dragOffset.current.dy;
        setPos({
            x: Math.round(Math.min(Math.max(rawX, 0), dW - dQr) / dW * 100),
            y: Math.round(Math.min(Math.max(rawY, 0), dH - dQr) / dH * 100),
        });
    }, [qrSize]);

    const endDrag = useCallback(() => {
        dragging.current = false;
        setIsDragging(false);
    }, []);

    useEffect(() => {
        const onMove = (e) => moveDrag(
            e.touches ? e.touches[0].clientX : e.clientX,
            e.touches ? e.touches[0].clientY : e.clientY,
        );
        const onUp = () => endDrag();
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend',  onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup',   onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend',  onUp);
        };
    }, [moveDrag, endDrag]);

    // ── copy ─────────────────────────────────────────────────────
    const handleCopy = () => {
        navigator.clipboard.writeText(item.verifikasi_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── render QR SVG → PNG bytes (canvas) ───────────────────────
    const qrToPngBytes = () => new Promise((resolve, reject) => {
        const svgEl = qrSvgRef.current?.querySelector('svg');
        if (!svgEl) return reject(new Error('SVG not found'));

        const SIZE   = 400;
        const svgStr = new XMLSerializer().serializeToString(svgEl);
        const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url    = URL.createObjectURL(blob);
        const img    = new Image();

        img.onload = () => {
            const canvas  = document.createElement('canvas');
            canvas.width  = SIZE;
            canvas.height = SIZE;
            const ctx     = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, SIZE, SIZE);
            ctx.drawImage(img, 0, 0, SIZE, SIZE);
            URL.revokeObjectURL(url);
            canvas.toBlob((b) => {
                b.arrayBuffer().then(resolve).catch(reject);
            }, 'image/png');
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
        img.src = url;
    });

    // ── download: merge QR onto original file as PDF ─────────────
    const handleDownload = async () => {
        if (!item.file_url) return;

        // Build final configs: include unsaved active page changes too
        const finalConfigs = activePage !== null
            ? { ...pageConfigs, [activePage]: { x: pos.x, y: pos.y, qrSize } }
            : { ...pageConfigs };

        const configuredPages = Object.keys(finalConfigs).map(Number).sort((a, b) => a - b);
        if (configuredPages.length === 0) {
            alert('Belum ada halaman yang dikonfigurasi. Pilih halaman dan atur posisi QR terlebih dahulu.');
            return;
        }

        setDownloading(true);
        try {
            const qrBytes  = await qrToPngBytes();
            const filename = `TTE-${(item.nomor_surat ?? 'surat').replace(/[/\\:*?"<>|]/g, '-')}.pdf`;
            let pdfDoc;

            if (isPdf) {
                const existingBytes = await fetch(item.file_url).then((r) => r.arrayBuffer());
                pdfDoc = await PDFDocument.load(existingBytes, { ignoreEncryption: true });
                const qrImage = await pdfDoc.embedPng(qrBytes);
                const pages   = pdfDoc.getPages();

                for (const pageNum of configuredPages) {
                    const page = pages[pageNum - 1];
                    if (!page) continue;
                    const cfg = finalConfigs[pageNum];
                    const { width, height } = page.getSize();
                    const qrPts = cfg.qrSize * (width / PAPER_W);
                    page.drawImage(qrImage, {
                        x:      (cfg.x / 100) * width,
                        y:      height - (cfg.y / 100) * height - qrPts,
                        width:  qrPts,
                        height: qrPts,
                    });
                }
            } else if (isImage) {
                const cfg  = finalConfigs[1] ?? { x: pos.x, y: pos.y, qrSize };
                const A4_W = 595.28, A4_H = 841.89;
                pdfDoc = await PDFDocument.create();
                const page     = pdfDoc.addPage([A4_W, A4_H]);
                const imgBytes = await fetch(item.file_url).then((r) => r.arrayBuffer());
                const docImage = item.file_url.toLowerCase().endsWith('.png')
                    ? await pdfDoc.embedPng(imgBytes)
                    : await pdfDoc.embedJpg(imgBytes);
                const { width: iw, height: ih } = docImage.scale(1);
                const scale = Math.min(A4_W / iw, A4_H / ih);
                page.drawImage(docImage, { x: (A4_W - iw * scale) / 2, y: (A4_H - ih * scale) / 2, width: iw * scale, height: ih * scale });
                const qrImage = await pdfDoc.embedPng(qrBytes);
                const qrPts   = cfg.qrSize * (A4_W / PAPER_W);
                page.drawImage(qrImage, {
                    x: (cfg.x / 100) * A4_W,
                    y: A4_H - (cfg.y / 100) * A4_H - qrPts,
                    width: qrPts, height: qrPts,
                });
            } else {
                return;
            }

            const pdfBytes = await pdfDoc.save();
            const pdfUrl   = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
            const a        = Object.assign(document.createElement('a'), { href: pdfUrl, download: filename });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        } catch (err) {
            console.error('PDF merge error:', err);
            alert('Gagal membuat PDF: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    const qrPxLeft   = (pos.x / 100) * dispW;
    const qrPxTop    = (pos.y / 100) * dispH;
    const dispQrSize = Math.round(qrSize * (dispW / PAPER_W));
    const isSaved  = activePage !== null && !!pageConfigs[activePage] &&
        pageConfigs[activePage].x === pos.x &&
        pageConfigs[activePage].y === pos.y &&
        pageConfigs[activePage].qrSize === qrSize;

    return (
        <Modal show onClose={onClose} title="Tempatkan QR pada Surat" size="xl">
            <div className="flex flex-col gap-4">

                {/* Info surat */}
                <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-2.5 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-sky-700 dark:text-sky-300 truncate">{item.nomor_surat}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.perihal} · {item.tujuan}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {item.file_url && (
                            <a href={item.file_url} target="_blank" rel="noreferrer"
                                className="text-xs text-gray-400 hover:text-sky-600 transition-colors flex items-center gap-1">
                                <Paperclip className="h-3.5 w-3.5" /> Buka surat asli
                            </a>
                        )}
                        <button onClick={handleCopy}
                            className="text-xs text-gray-400 hover:text-sky-600 transition-colors flex items-center gap-1">
                            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Disalin' : 'Salin link'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">

                    {/* ── LEFT: Paper Preview ───────────────────────────── */}
                    <div ref={paperWrapRef} className="flex flex-col items-center gap-2 w-full lg:shrink-0" style={{ maxWidth: PAPER_W }}>
                        {activePage !== null ? (
                            <>
                                <div className="flex items-center justify-between w-full">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        Halaman <span className="text-sky-600 dark:text-sky-400">{activePage}</span>
                                        <span className="font-normal"> · seret QR untuk memindahkan</span>
                                    </p>
                                    {isSaved && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                            <CheckCircle className="h-3 w-3" /> Tersimpan
                                        </span>
                                    )}
                                </div>

                                {/* Paper */}
                                <div
                                    ref={paperRef}
                                    className="relative bg-white border border-gray-300 shadow-md select-none overflow-hidden"
                                    style={{ width: dispW, height: dispH, cursor: isDragging ? 'grabbing' : 'default' }}
                                >
                                    {/* Actual file preview */}
                                    {isPdf && item.file_url && (
                                        <embed
                                            key={`pdf-p${activePage}`}
                                            src={`${item.file_url}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`}
                                            type="application/pdf"
                                            className="absolute inset-0 w-full h-full border-0"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}
                                    {isImage && item.file_url && (
                                        <img
                                            src={item.file_url}
                                            alt="Surat"
                                            className="absolute inset-0 w-full h-full object-contain"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}
                                    {!isPdf && !isImage && (
                                        <>
                                            <div className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    backgroundImage:
                                                        'linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),' +
                                                        'linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)',
                                                    backgroundSize: '18px 18px',
                                                }} />
                                            <div className="absolute inset-0 px-8 pt-10 space-y-1.5 pointer-events-none">
                                                {[55,40,40,0,30,50,50,50,0,50,50,50,0,50,50].map((w, i) => (
                                                    w === 0
                                                        ? <div key={i} className="h-2.5" />
                                                        : <div key={i} className="h-1.5 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {/* Drag capture overlay — keeps cursor + prevents embed interaction while dragging */}
                                    {isDragging && (
                                        <div className="absolute inset-0 z-10" style={{ cursor: 'grabbing' }} />
                                    )}

                                    {/* Saved positions of OTHER pages (faint) */}
                                    {Object.entries(pageConfigs)
                                        .filter(([n]) => Number(n) !== activePage)
                                        .map(([n, cfg]) => {
                                            const gSz = Math.round(cfg.qrSize * (dispW / PAPER_W));
                                            return (
                                                <div key={n} className="absolute pointer-events-none opacity-20"
                                                    style={{
                                                        left: (cfg.x / 100) * dispW,
                                                        top:  (cfg.y / 100) * dispH,
                                                        width: gSz, height: gSz,
                                                        border: '1px dashed #6366f1',
                                                        borderRadius: 2,
                                                    }}>
                                                    <span style={{ fontSize: 7, color: '#6366f1', padding: 1 }}>p{n}</span>
                                                </div>
                                            );
                                        })
                                    }

                                    {/* Draggable QR */}
                                    <div
                                        ref={qrSvgRef}
                                        className="absolute z-20"
                                        style={{
                                            left: qrPxLeft, top: qrPxTop, width: dispQrSize,
                                            cursor: isDragging ? 'grabbing' : 'grab',
                                            userSelect: 'none', touchAction: 'none',
                                        }}
                                        onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
                                        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                                    >
                                        <div className="absolute inset-0 border border-dashed border-sky-500/70 rounded pointer-events-none z-30" />
                                        <QRCodeSVG
                                            value={item.verifikasi_url}
                                            size={dispQrSize}
                                            level="M"
                                            fgColor="#000000"
                                            includeMargin={false}
                                            style={{ display: 'block' }}
                                        />
                                    </div>

                                    {!isDragging && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-gray-300 pointer-events-none z-20">
                                            <Move className="h-3 w-3" />
                                            <span style={{ fontSize: 8 }}>Seret QR</span>
                                        </div>
                                    )}
                                </div>

                                {/* Simpan posisi */}
                                <div className="flex items-center gap-2 w-full">
                                    <p className="text-[10px] text-gray-400 flex-1">
                                        {Math.round(pos.x)}% kiri · {Math.round(pos.y)}% atas · ≈{Math.round(qrSize * 210 / PAPER_W)}mm
                                    </p>
                                    <button
                                        onClick={savePage}
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                            isSaved
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-sky-600 text-white hover:bg-sky-700'
                                        }`}>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        {isSaved ? 'Sudah Disimpan' : `Simpan Hal. ${activePage}`}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30 w-full"
                                style={{ height: 200 }}>
                                <QrCode className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-xs text-gray-400 text-center px-6">
                                    Pilih nomor halaman di sebelah kanan untuk mulai mengatur posisi QR
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Controls ───────────────────────────────── */}
                    <div className="flex-1 space-y-4 min-w-0">

                        {/* Page selector — PDF only */}
                        {isPdf && (
                            <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                    Pilih Halaman
                                    {pageCount === 0 && <span className="font-normal text-gray-400"> · memuat...</span>}
                                    {pageCount > 0 && <span className="font-normal text-gray-400"> · {pageCount} halaman</span>}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {pageCount > 0 && Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
                                        const saved  = !!pageConfigs[n];
                                        const active = activePage === n;
                                        return (
                                            <button key={n} onClick={() => openPage(n)}
                                                title={saved ? `Halaman ${n} — sudah dikonfigurasi` : `Halaman ${n}`}
                                                className={`relative text-xs w-8 h-8 rounded-lg border font-semibold transition-colors ${
                                                    active
                                                        ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300 dark:ring-sky-700'
                                                        : saved
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}>
                                                {n}
                                                {saved && !active && (
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle className="h-2 w-2 text-white" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {savedPageNums.length > 0 && (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5">
                                        {savedPageNums.length} halaman dikonfigurasi: {savedPageNums.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Controls — only when a page is active */}
                        {activePage !== null && (
                            <>
                                {/* Preset positions */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Posisi Cepat</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {PRESETS.map((p) => (
                                            <button key={p.label}
                                                onClick={() => setPos({ x: p.x, y: p.y })}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors text-left ${
                                                    pos.x === p.x && pos.y === p.y
                                                        ? 'bg-sky-600 text-white border-sky-600'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* QR Size */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Ukuran QR</p>
                                        <span className="text-xs text-gray-400 font-mono">≈ {Math.round(qrSize * 210 / PAPER_W)} mm</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setQrSize((s) => Math.max(16, s - 4))}
                                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                        <input type="range" min={16} max={100} step={4} value={qrSize}
                                            onChange={(e) => setQrSize(Number(e.target.value))}
                                            className="flex-1 accent-sky-600" />
                                        <button onClick={() => setQrSize((s) => Math.min(100, s + 4))}
                                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                        <span>~9mm</span><span>~55mm</span>
                                    </div>
                                </div>

                                {/* Manual position */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Posisi Manual</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400 block mb-0.5">Dari Kiri (%)</label>
                                            <input type="number" min={0} max={95} value={Math.round(pos.x)}
                                                onChange={(e) => setPos((p) => ({ ...p, x: Math.min(95, Math.max(0, Number(e.target.value))) }))}
                                                className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 block mb-0.5">Dari Atas (%)</label>
                                            <input type="number" min={0} max={95} value={Math.round(pos.y)}
                                                onChange={(e) => setPos((p) => ({ ...p, y: Math.min(95, Math.max(0, Number(e.target.value))) }))}
                                                className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Remove page config */}
                                {pageConfigs[activePage] && (
                                    <button onClick={() => removePage(activePage)}
                                        className="w-full text-xs text-red-500 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        Hapus QR dari Halaman {activePage}
                                    </button>
                                )}
                            </>
                        )}

                        {/* Download */}
                        {item.file_url ? (
                            <>
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading || savedPageNums.length === 0 && activePage === null}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors">
                                    <Download className="h-4 w-4" />
                                    {downloading ? 'Memproses PDF...' : 'Unduh PDF dengan TTE'}
                                </button>
                                <p className="text-[10px] text-gray-400 text-center -mt-2">
                                    {savedPageNums.length > 0
                                        ? `QR akan disisipkan di halaman: ${savedPageNums.join(', ')}${activePage && !pageConfigs[activePage] ? ` + ${activePage}` : ''}`
                                        : 'Konfigurasi posisi lalu simpan minimal satu halaman'}
                                </p>
                            </>
                        ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-center">
                                Surat ini belum memiliki file lampiran
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

/* ── Simple QR Info Modal (for non-placer view) ──────────────────── */
function QrInfoModal({ item, onClose, onPlaceQr }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.verifikasi_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal show onClose={onClose} title="QR Code TTE" size="md">
            <div className="space-y-5">
                <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3">
                    <p className="font-mono text-sm font-bold text-sky-700 dark:text-sky-300">{item.nomor_surat}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.perihal}</p>
                    <p className="text-xs text-gray-500 mt-1">Tujuan: {item.tujuan}</p>
                </div>

                <div className="flex flex-col items-center gap-3 py-3">
                    <div className="p-4 bg-white rounded-2xl border-2 border-sky-200 dark:border-sky-700 shadow-sm">
                        <QRCodeSVG value={item.verifikasi_url} size={160} level="M" fgColor="#1e3a8a" includeMargin={false} />
                    </div>
                    <p className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 tracking-widest bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                        {item.kode_tte}
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                        Ditandatangani: <strong>{item.tte_at}</strong><br />
                        Oleh: <strong>{item.tte_oleh_nama}</strong>
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                    <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{item.verifikasi_url}</span>
                    <button onClick={handleCopy} className="shrink-0 text-gray-400 hover:text-sky-600 transition-colors p-1">
                        {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a href={item.verifikasi_url} target="_blank" rel="noreferrer"
                        className="shrink-0 text-gray-400 hover:text-sky-600 transition-colors p-1">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>

                <div className="flex gap-2 justify-end flex-wrap pt-1">
                    {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Paperclip className="h-3.5 w-3.5" /> Lihat File
                        </a>
                    )}
                    <button onClick={() => { onClose(); onPlaceQr(); }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                        <Move className="h-3.5 w-3.5" /> Bubuhkan TTE
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function TteIndex({ surat, filters }) {
    const { props } = usePage();
    const roles     = props.auth?.user?.roles ?? [];
    const canTte    = roles.includes('kepala_sekolah');
    const canBatal  = roles.includes('super_admin') || roles.includes('kepala_sekolah');

    const [qrItem,       setQrItem]       = useState(null);
    const [placerItem,   setPlacerItem]   = useState(null);
    const [placerInitial,setPlacerInitial]= useState({});
    const [konfirm,      setKonfirm]      = useState(null);
    const [toast,        setToast]        = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const copyNomor = (nomor) => {
        navigator.clipboard.writeText(nomor).then(() => showToast(`Disalin: ${nomor}`));
    };

    const getSavedConfig = (itemId) => {
        try {
            const raw = localStorage.getItem(`tte_config_${itemId}`);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };

    const openPlacer = (item) => {
        setPlacerInitial(getSavedConfig(item.id) ?? {});
        setPlacerItem(item);
    };

    const setFilter = (key, val) =>
        router.get('/tatausaha/tte', { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });

    const doTte = () => {
        router.post(`/tatausaha/surat-keluar/${konfirm.item.id}/tte`, {}, {
            onSuccess: () => setKonfirm(null),
        });
    };

    const doBatal = () => {
        router.delete(`/tatausaha/surat-keluar/${konfirm.item.id}/tte`, {
            onSuccess: () => setKonfirm(null),
        });
    };

    const sudahTte = surat.data.filter((s) => s.kode_tte).length;
    const belumTte = surat.data.filter((s) => !s.kode_tte).length;

    return (
        <AppLayout title="Manajemen TTE">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-sky-600" />
                        Tanda Tangan Elektronik (TTE)
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Kelola TTE surat keluar · kode QR untuk verifikasi keaslian
                    </p>
                </div>
                {!roles.includes('super_admin') && !roles.includes('kepala_sekolah') && (
                    <a href="/tatausaha/surat-keluar"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-700 px-3 py-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                        <FileText className="h-3.5 w-3.5" /> Kembali ke Surat Keluar
                    </a>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Surat', val: surat.total, cls: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Sudah TTE',   val: sudahTte,   cls: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Belum TTE',   val: belumTte,   cls: 'text-amber-600 dark:text-amber-400' },
                ].map(({ label, val, cls }) => (
                    <Card key={label}><CardBody className="p-4 text-center">
                        <p className={`text-2xl font-black ${cls}`}>{val}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                    </CardBody></Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2">
                            <Stamp className="h-4 w-4 text-sky-500" />
                            Daftar Surat Keluar
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    defaultValue={filters.search}
                                    onChange={(e) => setFilter('search', e.target.value)}
                                    placeholder="Cari nomor / perihal..."
                                    className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 w-44 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                            <select
                                value={filters.status_tte ?? ''}
                                onChange={(e) => setFilter('status_tte', e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="">Semua TTE</option>
                                <option value="sudah">Sudah TTE</option>
                                <option value="belum">Belum TTE</option>
                            </select>
                            <select
                                value={filters.tahun ?? ''}
                                onChange={(e) => setFilter('tahun', e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="">Semua Tahun</option>
                                {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nomor Surat</th>
                                    <th className="px-4 py-3 text-left">Perihal / Tujuan</th>
                                    <th className="px-4 py-3 text-left hidden md:table-cell">Tgl Keluar</th>
                                    <th className="px-4 py-3 text-left hidden lg:table-cell">Status Surat</th>
                                    <th className="px-4 py-3 text-center">Status TTE</th>
                                    <th className="px-4 py-3 text-left hidden lg:table-cell">Penanda Tangan</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {surat.data.length === 0 && (
                                    <tr><td colSpan={7} className="px-4 py-16 text-center">
                                        <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm text-gray-400">Belum ada surat keluar.</p>
                                    </td></tr>
                                )}
                                {surat.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 group/copy">
                                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{item.nomor_surat}</span>
                                                <button onClick={() => copyNomor(item.nomor_surat)}
                                                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 p-0.5 rounded">
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-50">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.perihal || <span className="text-gray-400 italic text-xs">—</span>}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.tujuan}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden md:table-cell text-xs">{fmt(item.tgl_keluar)}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <Badge color={STATUS_COLOR[item.status] ?? 'gray'}>{item.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.kode_tte ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                                    <CheckCircle className="h-3 w-3" /> Sudah TTE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full">
                                                    Belum
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                                            {item.tte_oleh_nama
                                                ? <><strong>{item.tte_oleh_nama}</strong><br /><span className="text-gray-400">{item.tte_at}</span></>
                                                : <span className="text-gray-300 dark:text-gray-600">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <TteActions
                                                item={item}
                                                canTte={canTte}
                                                canBatal={canBatal}
                                                hasSavedConfig={!!getSavedConfig(item.id)}
                                                onTte={() => setKonfirm({ item, action: 'tte' })}
                                                onBatal={() => setKonfirm({ item, action: 'batal' })}
                                                onQr={() => setQrItem(item)}
                                                onPlaceQr={() => openPlacer(item)}
                                                onDownloadSaved={() => openPlacer(item)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                        {surat.data.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Belum ada surat keluar.</p>
                            </div>
                        )}
                        {surat.data.map((item) => (
                            <div key={item.id} className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <p className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.nomor_surat}</p>
                                        <button onClick={() => copyNomor(item.nomor_surat)}
                                            className="shrink-0 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 p-0.5 rounded transition-colors">
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                    {item.kode_tte ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <CheckCircle className="h-3.5 w-3.5" /> TTE
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 shrink-0">Belum TTE</span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">{item.perihal || '—'}</p>
                                <p className="text-xs text-gray-500 mb-2">Tujuan: {item.tujuan} · {fmt(item.tgl_keluar)}</p>
                                {item.kode_tte && (
                                    <p className="text-xs text-gray-400 mb-2">{item.tte_oleh_nama} · {item.tte_at}</p>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    <TteActions
                                        item={item}
                                        canTte={canTte}
                                        canBatal={canBatal}
                                        hasSavedConfig={!!getSavedConfig(item.id)}
                                        onTte={() => setKonfirm({ item, action: 'tte' })}
                                        onBatal={() => setKonfirm({ item, action: 'batal' })}
                                        onQr={() => setQrItem(item)}
                                        onPlaceQr={() => openPlacer(item)}
                                        onDownloadSaved={() => openPlacer(item, true)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {surat.last_page > 1 && (
                        <div className="flex justify-center gap-1 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            {surat.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${link.active ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'} ${!link.url ? 'opacity-40 cursor-default' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* QR Info Modal */}
            {qrItem && (
                <QrInfoModal
                    item={qrItem}
                    onClose={() => setQrItem(null)}
                    onPlaceQr={() => setPlacerItem(qrItem)}
                />
            )}

            {/* QR Placer Modal */}
            {placerItem && (
                <QrPlacerModal
                    item={placerItem}
                    initialConfigs={placerInitial}
                    onClose={() => { setPlacerItem(null); setPlacerInitial({}); }}
                />
            )}

            {/* Konfirmasi TTE */}
            <ConfirmDialog
                show={konfirm?.action === 'tte'}
                title="Tanda Tangani Surat"
                message={`Anda akan menandatangani surat "${konfirm?.item?.nomor_surat}" secara elektronik. Tindakan ini tidak dapat diubah kecuali oleh Admin.`}
                confirmLabel="Ya, Tandatangani"
                onConfirm={doTte}
                onCancel={() => setKonfirm(null)}
            />

            {/* Konfirmasi Batalkan TTE */}
            <ConfirmDialog
                show={konfirm?.action === 'batal'}
                title="Batalkan TTE"
                message={`TTE pada surat "${konfirm?.item?.nomor_surat}" akan dibatalkan dan kode QR tidak berlaku lagi.`}
                confirmLabel="Ya, Batalkan TTE"
                confirmVariant="danger"
                onConfirm={doBatal}
                onCancel={() => setKonfirm(null)}
            />

            {/* Toast */}
            <Toast message={toast} />
        </AppLayout>
    );
}

/* Toast notification */
function Toast({ message }) {
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
            message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}>
            <div className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                {message}
            </div>
        </div>
    );
}

/* Icon-only button with CSS tooltip (hover + focus-visible) */
function IBtn({ onClick, label, icon: Icon, color }) {
    const colors = {
        indigo:  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800/40',
        violet:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40',
        red:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40',
    };
    return (
        <div className="relative group/tip">
            <button onClick={onClick}
                className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors ${colors[color]}`}>
                <Icon className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-gray-800 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 group-hover/tip:opacity-100 focus-within:opacity-100 transition-opacity z-50">
                {label}
            </span>
        </div>
    );
}

function TteActions({ item, canTte, canBatal, hasSavedConfig, onTte, onBatal, onQr, onPlaceQr, onDownloadSaved }) {
    return (
        <div className="flex items-center gap-1 justify-center flex-nowrap">
            {item.kode_tte ? (
                <>
                    <IBtn onClick={onQr}           label="Lihat QR"      icon={QrCode}     color="indigo"  />
                    <IBtn onClick={onPlaceQr}      label="Bubuhkan TTE"  icon={Move}       color="violet"  />
                    <IBtn onClick={onDownloadSaved} label="Unduh PDF TTE" icon={Download}   color="emerald" />
                    {canBatal && (
                        <IBtn onClick={onBatal}    label="Batal TTE"     icon={XCircle}    color="red"     />
                    )}
                </>
            ) : (
                canTte && (
                    <IBtn onClick={onTte}          label="Tandatangani"  icon={ShieldCheck} color="emerald" />
                )
            )}
        </div>
    );
}
