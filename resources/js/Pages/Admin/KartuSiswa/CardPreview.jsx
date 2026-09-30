import { Image as ImageIcon } from 'lucide-react';

function fieldLabel(field, fieldOptions) {
    if (field.type === 'text') return field.content || 'Teks';
    if (field.key === 'nama') return 'Nama Siswa';
    return fieldOptions[field.key] ?? field.key;
}

/**
 * Render statis (non-interaktif) tata letak kartu dari data template — dipakai
 * untuk thumbnail di daftar template maupun sebagai dasar kanvas LayoutEditor.
 */
export default function CardPreview({ template, fieldOptions, scale, bgOverride }) {
    const lebar = Number(template.lebar_mm) || 54;
    const tinggi = Number(template.tinggi_mm) || 85.6;
    const foto = template.foto_layout ?? { x: 2, y: 4, width: 18, height: 18 };
    const fields = template.fields ?? [];
    const bgUrl = bgOverride !== undefined ? bgOverride : template.background_url;

    return (
        <div
            className="relative overflow-hidden shrink-0 select-none"
            style={{
                width: lebar * scale,
                height: tinggi * scale,
                backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: bgUrl ? undefined : '#f9fafb',
            }}
        >
            <div
                className={`absolute flex items-center justify-center bg-white/70 border border-gray-300 overflow-hidden ${
                    template.bingkai_foto === 'lingkaran' ? 'rounded-full' : 'rounded-[2px]'
                }`}
                style={{ left: foto.x * scale, top: foto.y * scale, width: foto.width * scale, height: foto.height * scale }}
            >
                <ImageIcon className="h-3 w-3 text-gray-400" />
            </div>

            {fields.map((f) => f.type === 'image' ? (
                f.image_url ? (
                    <img key={f.id} src={f.image_url} alt=""
                        className="absolute object-contain"
                        style={{ left: f.x * scale, top: f.y * scale, width: f.width * scale, height: (f.height || f.width) * scale }} />
                ) : null
            ) : (
                <p
                    key={f.id}
                    className="absolute truncate"
                    style={{
                        left: f.x * scale, top: f.y * scale, width: f.width * scale,
                        textAlign: f.align, fontSize: Math.max(4, (f.fontSize * scale) / 2.4),
                        fontWeight: f.bold ? 700 : 400, fontStyle: f.italic ? 'italic' : 'normal',
                        textDecoration: f.underline ? 'underline' : 'none', color: f.color || '#111827',
                        lineHeight: 1.15,
                    }}
                >
                    {fieldLabel(f, fieldOptions)}
                </p>
            ))}
        </div>
    );
}
