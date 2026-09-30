import { useRef, useState } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
    Trash2, Plus, Image as ImageIcon, Type as TypeIcon,
} from 'lucide-react';

const PX_PER_MM = 3.6;
const SNAP_THRESHOLD_MM = 1.2;
const round1 = (n) => Math.round(n * 10) / 10;

// Tinggi elemen teks tidak tersimpan eksplisit — perkirakan dari ukuran font
// (1pt ≈ 0.353mm, dikali ~1.2 untuk line-height) supaya bisa dipakai garis bantu.
const estimateHeight = (f) => (f.type === 'image' ? Number(f.height || f.width) : Number(f.fontSize) * 0.42);

// Nilai numerik dari server/props kadang berupa string (mis. dari data lama) — pakai
// Number() di sini supaya "2" + 5 tidak tergabung jadi teks "25" alih-alih dijumlahkan 7.
function elementBounds(id, fotoLayout, fields) {
    if (id === 'foto') return { x: Number(fotoLayout.x), y: Number(fotoLayout.y), width: Number(fotoLayout.width), height: Number(fotoLayout.height) };
    const f = fields.find((f) => f.id === id);
    if (!f) return null;
    return { x: Number(f.x), y: Number(f.y), width: Number(f.width), height: estimateHeight(f) };
}

function ToggleBtn({ active, onClick, title, children }) {
    return (
        <button type="button" title={title} onClick={onClick}
            className={`p-1.5 rounded-md border transition-colors ${
                active
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            {children}
        </button>
    );
}

/**
 * Editor tata letak kartu siswa: elemen (foto, field data, teks bebas) bisa
 * digeser (drag) langsung di atas preview kartu berukuran mm yang diskalakan.
 * Ukuran, warna, font, dan alignment diatur lewat panel di samping elemen terpilih.
 */
export default function LayoutEditor({
    lebarMm, tinggiMm, bgPreview, bingkaiFoto,
    fotoLayout, fields, fieldOptions,
    onChangeFotoLayout, onChangeFields,
}) {
    const [selectedId, setSelectedId] = useState(null);
    const [guides, setGuides] = useState({ x: null, y: null });
    const dragRef = useRef(null);
    const imageInputRef = useRef(null);
    const replaceImageInputRef = useRef(null);

    const lebar = Number(lebarMm) || 54;
    const tinggi = Number(tinggiMm) || 85.6;
    const scale = PX_PER_MM;

    const availableToAdd = Object.entries(fieldOptions).filter(
        ([key]) => !fields.some((f) => f.type === 'data' && f.key === key)
    );

    const updateField = (id, patch) => {
        onChangeFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    };

    const removeField = (id) => {
        onChangeFields(fields.filter((f) => f.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const addDataField = (key, label) => {
        const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newField = {
            id, type: 'data', key, content: '',
            x: 2, y: round1(Number(fotoLayout.y) + Number(fotoLayout.height) + 2 + fields.length * 4.2),
            width: round1(lebar - 4), align: 'center', fontSize: 7,
            bold: false, italic: false, underline: false, color: '#111827',
        };
        onChangeFields([...fields, newField]);
        setSelectedId(id);
    };

    const addTextField = () => {
        const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newField = {
            id, type: 'text', key: null, content: 'Teks baru',
            x: 2, y: round1(Number(fotoLayout.y) + Number(fotoLayout.height) + 2 + fields.length * 4.2),
            width: round1(lebar - 4), align: 'center', fontSize: 7,
            bold: false, italic: false, underline: false, color: '#111827',
        };
        onChangeFields([...fields, newField]);
        setSelectedId(id);
    };

    const handleAddImage = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const size = round1(Math.min(20, lebar * 0.3));
        const newField = {
            id, type: 'image', key: null, content: null, image: file, image_url: URL.createObjectURL(file),
            x: 2, y: 2, width: size, height: size, align: 'left', fontSize: 7,
            bold: false, italic: false, underline: false, color: '#111827',
        };
        onChangeFields([...fields, newField]);
        setSelectedId(id);
    };

    const handleReplaceImage = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !selectedId) return;
        updateField(selectedId, { image: file, image_url: URL.createObjectURL(file), remove_image: false });
    };

    const startDrag = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedId(id);
        const orig = id === 'foto' ? fotoLayout : fields.find((f) => f.id === id);
        if (!orig) return;
        dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: Number(orig.x), origY: Number(orig.y) };

        // Target snap: pusat kartu + tepi/pusat elemen lain — supaya foto/teks mudah
        // dirapikan pas di tengah atau sejajar elemen lain tanpa menebak angka mm.
        const others = ['foto', ...fields.map((f) => f.id)]
            .filter((otherId) => otherId !== id)
            .map((otherId) => elementBounds(otherId, fotoLayout, fields))
            .filter(Boolean);
        const targetsX = [lebar / 2, ...others.flatMap((o) => [o.x, o.x + o.width / 2, o.x + o.width])];
        const targetsY = [tinggi / 2, ...others.flatMap((o) => [o.y, o.y + o.height / 2, o.y + o.height])];

        const onMove = (ev) => {
            const st = dragRef.current;
            if (!st) return;
            const dxMm = (ev.clientX - st.startX) / scale;
            const dyMm = (ev.clientY - st.startY) / scale;
            let newX = Math.max(0, Math.min(lebar, st.origX + dxMm));
            let newY = Math.max(0, Math.min(tinggi, st.origY + dyMm));

            const { width, height } = elementBounds(st.id, fotoLayout, fields) ?? { width: 0, height: 0 };
            let guideX = null;
            let guideY = null;

            for (const edge of [newX, newX + width / 2, newX + width]) {
                const hit = targetsX.find((t) => Math.abs(t - edge) < SNAP_THRESHOLD_MM);
                if (hit !== undefined) { newX += hit - edge; guideX = hit; break; }
            }
            for (const edge of [newY, newY + height / 2, newY + height]) {
                const hit = targetsY.find((t) => Math.abs(t - edge) < SNAP_THRESHOLD_MM);
                if (hit !== undefined) { newY += hit - edge; guideY = hit; break; }
            }
            setGuides({ x: guideX, y: guideY });

            if (st.id === 'foto') {
                onChangeFotoLayout({ ...fotoLayout, x: round1(newX), y: round1(newY) });
            } else {
                onChangeFields(fields.map((f) => (f.id === st.id ? { ...f, x: round1(newX), y: round1(newY) } : f)));
            }
        };
        const onUp = () => {
            dragRef.current = null;
            setGuides({ x: null, y: null });
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const selectedField = fields.find((f) => f.id === selectedId);
    const isNamaField = selectedField?.type === 'data' && selectedField.key === 'nama';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-gray-400">Geser foto/teks langsung di preview — garis bantu merah muncul saat sejajar tengah kartu/elemen lain. Klik elemen untuk mengatur gaya tulisan.</p>
                <div className="flex items-center gap-1.5">
                    <div className="relative group">
                        <button type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 disabled:opacity-40"
                            disabled={availableToAdd.length === 0}>
                            <Plus className="h-3.5 w-3.5" /> Tambah Data
                        </button>
                        {availableToAdd.length > 0 && (
                            <div className="hidden group-hover:block group-focus-within:block absolute right-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                                {availableToAdd.map(([key, label]) => (
                                    <button key={key} type="button" onClick={() => addDataField(key, label)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-sky-900/30">
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="button" onClick={addTextField}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
                        <TypeIcon className="h-3.5 w-3.5" /> Tambah Teks
                    </button>
                    <button type="button" onClick={() => imageInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700">
                        <ImageIcon className="h-3.5 w-3.5" /> Tambah Gambar
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
                    <input ref={replaceImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceImage} />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Canvas */}
                <div
                    onMouseDown={() => setSelectedId(null)}
                    className="relative shrink-0 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 select-none"
                    style={{
                        width: lebar * scale,
                        height: tinggi * scale,
                        backgroundImage: bgPreview ? `url(${bgPreview})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: bgPreview ? undefined : '#f9fafb',
                    }}
                >
                    {/* Foto */}
                    <div
                        onMouseDown={(e) => startDrag(e, 'foto')}
                        className={`absolute flex items-center justify-center bg-white/70 border-2 cursor-move overflow-hidden ${
                            bingkaiFoto === 'lingkaran' ? 'rounded-full' : 'rounded-[4px]'
                        } ${selectedId === 'foto' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-dashed border-gray-400'}`}
                        style={{
                            left: fotoLayout.x * scale, top: fotoLayout.y * scale,
                            width: fotoLayout.width * scale, height: fotoLayout.height * scale,
                        }}
                    >
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Fields */}
                    {fields.map((f) => f.type === 'image' ? (
                        <div key={f.id}
                            onMouseDown={(e) => startDrag(e, f.id)}
                            className={`absolute cursor-move overflow-hidden ${selectedId === f.id ? 'outline outline-1 outline-sky-500' : ''}`}
                            style={{ left: f.x * scale, top: f.y * scale, width: f.width * scale, height: (f.height || f.width) * scale }}
                        >
                            {f.image_url ? (
                                <img src={f.image_url} alt="" className="h-full w-full object-contain" draggable={false} />
                            ) : (
                                <div className="h-full w-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                    <ImageIcon className="h-3 w-3 text-violet-400" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div key={f.id}
                            onMouseDown={(e) => startDrag(e, f.id)}
                            className={`absolute px-0.5 cursor-move truncate ${selectedId === f.id ? 'outline outline-1 outline-sky-500 bg-sky-50/40' : ''}`}
                            style={{
                                left: f.x * scale, top: f.y * scale, width: f.width * scale,
                                textAlign: f.align, fontSize: (f.fontSize * scale) / 2.4,
                                fontWeight: f.bold ? 700 : 400, fontStyle: f.italic ? 'italic' : 'normal',
                                textDecoration: f.underline ? 'underline' : 'none', color: f.color || '#111827',
                                lineHeight: 1.15,
                            }}
                        >
                            {f.type === 'text' ? (f.content || 'Teks') : (f.key === 'nama' ? 'Nama Siswa' : fieldOptions[f.key] ?? f.key)}
                        </div>
                    ))}

                    {/* Garis bantu snap saat digeser */}
                    {guides.x !== null && (
                        <div className="absolute top-0 bottom-0 w-px bg-pink-500 pointer-events-none" style={{ left: guides.x * scale }} />
                    )}
                    {guides.y !== null && (
                        <div className="absolute left-0 right-0 h-px bg-pink-500 pointer-events-none" style={{ top: guides.y * scale }} />
                    )}
                </div>

                {/* Panel elemen terpilih */}
                <div className="flex-1 min-w-[14rem]">
                    {selectedId === 'foto' ? (
                        <div className="space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Foto Siswa</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Lebar (mm)</label>
                                    <input type="number" step="0.5" value={fotoLayout.width}
                                        onChange={(e) => onChangeFotoLayout({ ...fotoLayout, width: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Tinggi (mm)</label>
                                    <input type="number" step="0.5" value={fotoLayout.height}
                                        onChange={(e) => onChangeFotoLayout({ ...fotoLayout, height: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                            </div>
                        </div>
                    ) : selectedField?.type === 'image' ? (
                        <div className="space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Gambar</p>
                                <button type="button" onClick={() => removeField(selectedField.id)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {selectedField.image_url && (
                                <img src={selectedField.image_url} alt="" className="h-20 w-full object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
                            )}
                            <button type="button" onClick={() => replaceImageInputRef.current?.click()}
                                className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700">
                                Ganti Gambar
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Lebar (mm)</label>
                                    <input type="number" step="0.5" value={selectedField.width}
                                        onChange={(e) => updateField(selectedField.id, { width: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Tinggi (mm)</label>
                                    <input type="number" step="0.5" value={selectedField.height || selectedField.width}
                                        onChange={(e) => updateField(selectedField.id, { height: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                            </div>
                        </div>
                    ) : selectedField ? (
                        <div className="space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {selectedField.type === 'text' ? 'Teks Bebas' : (fieldOptions[selectedField.key] ?? selectedField.key)}
                                </p>
                                {!isNamaField && (
                                    <button type="button" onClick={() => removeField(selectedField.id)} className="text-red-500 hover:text-red-600">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {selectedField.type === 'text' && (
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Isi Teks</label>
                                    <input type="text" value={selectedField.content}
                                        onChange={(e) => updateField(selectedField.id, { content: e.target.value })}
                                        maxLength={255}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Perataan</label>
                                <div className="flex gap-1.5">
                                    <ToggleBtn active={selectedField.align === 'left'} onClick={() => updateField(selectedField.id, { align: 'left' })} title="Rata Kiri"><AlignLeft className="h-3.5 w-3.5" /></ToggleBtn>
                                    <ToggleBtn active={selectedField.align === 'center'} onClick={() => updateField(selectedField.id, { align: 'center' })} title="Rata Tengah"><AlignCenter className="h-3.5 w-3.5" /></ToggleBtn>
                                    <ToggleBtn active={selectedField.align === 'right'} onClick={() => updateField(selectedField.id, { align: 'right' })} title="Rata Kanan"><AlignRight className="h-3.5 w-3.5" /></ToggleBtn>
                                    <span className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                                    <ToggleBtn active={selectedField.bold} onClick={() => updateField(selectedField.id, { bold: !selectedField.bold })} title="Tebal"><Bold className="h-3.5 w-3.5" /></ToggleBtn>
                                    <ToggleBtn active={selectedField.italic} onClick={() => updateField(selectedField.id, { italic: !selectedField.italic })} title="Miring"><Italic className="h-3.5 w-3.5" /></ToggleBtn>
                                    <ToggleBtn active={selectedField.underline} onClick={() => updateField(selectedField.id, { underline: !selectedField.underline })} title="Garis Bawah"><UnderlineIcon className="h-3.5 w-3.5" /></ToggleBtn>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Ukuran Font (pt)</label>
                                    <input type="number" min="5" max="40" value={selectedField.fontSize}
                                        onChange={(e) => updateField(selectedField.id, { fontSize: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-1">Lebar Kotak (mm)</label>
                                    <input type="number" step="0.5" value={selectedField.width}
                                        onChange={(e) => updateField(selectedField.id, { width: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Warna</label>
                                <input type="color" value={selectedField.color || '#111827'}
                                    onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                                    className="h-8 w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center p-6 text-center text-xs text-gray-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            Klik foto atau salah satu teks di preview untuk mengatur posisi & gayanya.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
