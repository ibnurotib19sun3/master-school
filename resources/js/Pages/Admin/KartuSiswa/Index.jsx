import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { Input, Select } from '@/Components/ui/Input';
import ActionButton from '@/Components/ui/ActionButton';
import LayoutEditor from './LayoutEditor';
import CardPreview from './CardPreview';
import {
    BadgeCheck, Plus, Edit, Trash2, Image as ImageIcon, Printer,
    RectangleVertical, RectangleHorizontal, X,
} from 'lucide-react';
import { useRef, useState } from 'react';

const KERTAS_PRESET = {
    A4:     { w: 210,   h: 297 },
    F4:     { w: 215,   h: 330 },
    Letter: { w: 215.9, h: 279.4 },
    Custom: null,
};

const round1 = (n) => Math.round(n * 10) / 10;

const defaultFotoLayout = (lebarMm) => {
    const w = round1(Math.min(20, lebarMm * 0.35));
    return { x: round1((lebarMm - w) / 2), y: 4, width: w, height: w };
};

const defaultNamaField = (lebarMm, fotoBottom) => ({
    id: 'nama', type: 'data', key: 'nama', content: '',
    x: 2, y: round1(fotoBottom + 2), width: round1(lebarMm - 4), align: 'center',
    fontSize: 9, bold: true, italic: false, underline: false, color: '#111827',
});

const DEFAULT_LEBAR = 54;
const DEFAULT_TINGGI = 85.6;
const initialFotoLayout = defaultFotoLayout(DEFAULT_LEBAR);

export default function KartuSiswaIndex({ templates, rombelList, fieldOptions }) {
    const [showModal, setShowModal]   = useState(false);
    const [editItem, setEditItem]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [bgPreview, setBgPreview]   = useState(null);
    const [formErrorMsg, setFormErrorMsg] = useState('');
    const bgInputRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedRombel, setSelectedRombel]     = useState('');
    const [printing, setPrinting] = useState(false);
    const [orientTab, setOrientTab] = useState('portrait');

    const filteredTemplates = templates.filter((t) => (t.orientasi ?? 'portrait') === orientTab);

    const form = useForm({
        nama: '', lebar_mm: DEFAULT_LEBAR, tinggi_mm: DEFAULT_TINGGI, orientasi: 'portrait', bingkai_foto: 'kotak',
        foto_layout: initialFotoLayout,
        fields: [defaultNamaField(DEFAULT_LEBAR, initialFotoLayout.y + initialFotoLayout.height)],
        kertas: 'A4', kertas_lebar_mm: 210, kertas_tinggi_mm: 297,
        margin_mm: 10, jarak_x_mm: 5, jarak_y_mm: 5, background: null, hapus_background: false,
    });

    const closeModal = () => {
        setShowModal(false); setEditItem(null); setBgPreview(null); setFormErrorMsg('');
        form.reset(); if (bgInputRef.current) bgInputRef.current.value = '';
    };

    const openAdd = () => { form.reset(); setEditItem(null); setBgPreview(null); setFormErrorMsg(''); setShowModal(true); };

    const openEdit = (t) => {
        setEditItem(t);
        setFormErrorMsg('');
        form.setData({
            nama: t.nama, lebar_mm: t.lebar_mm, tinggi_mm: t.tinggi_mm, orientasi: t.orientasi, bingkai_foto: t.bingkai_foto ?? 'kotak',
            foto_layout: t.foto_layout ?? defaultFotoLayout(t.lebar_mm), fields: t.fields ?? [],
            kertas: t.kertas, kertas_lebar_mm: t.kertas_lebar_mm, kertas_tinggi_mm: t.kertas_tinggi_mm,
            margin_mm: t.margin_mm, jarak_x_mm: t.jarak_x_mm, jarak_y_mm: t.jarak_y_mm, background: null, hapus_background: false,
        });
        setBgPreview(t.background_url);
        setShowModal(true);
    };

    const toggleOrientasi = (o) => {
        if (o === form.data.orientasi) return;
        form.setData((d) => ({ ...d, orientasi: o, lebar_mm: d.tinggi_mm, tinggi_mm: d.lebar_mm }));
    };

    const resetLayout = () => {
        const lebarMm = Number(form.data.lebar_mm) || DEFAULT_LEBAR;
        const foto = defaultFotoLayout(lebarMm);
        const lain = form.data.fields.filter((f) => !(f.type === 'data' && f.key === 'nama'));
        const rebuilt = [
            defaultNamaField(lebarMm, foto.y + foto.height),
            ...lain.map((f, i) => ({
                ...f, x: 2, width: round1(lebarMm - 4), align: 'center',
                y: round1(foto.y + foto.height + 2 + (i + 1) * 4.2),
            })),
        ];
        form.setData((d) => ({ ...d, foto_layout: foto, fields: rebuilt }));
    };

    const handleKertasChange = (val) => {
        const preset = KERTAS_PRESET[val];
        form.setData((d) => ({
            ...d, kertas: val,
            ...(preset ? { kertas_lebar_mm: preset.w, kertas_tinggi_mm: preset.h } : {}),
        }));
    };

    const handleBgChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        form.setData((d) => ({ ...d, background: file, hapus_background: false }));
        setBgPreview(URL.createObjectURL(file));
    };

    const removeBg = () => {
        form.setData((d) => ({ ...d, background: null, hapus_background: true }));
        setBgPreview(null);
        if (bgInputRef.current) bgInputRef.current.value = '';
    };

    const submit = (e) => {
        e.preventDefault();
        setFormErrorMsg('');
        const url = editItem ? `/admin/kartu-siswa/template/${editItem.id}` : '/admin/kartu-siswa/template';
        form.post(url, {
            forceFormData: true,
            onSuccess: closeModal,
            onError: (errors) => {
                const first = Object.values(errors)[0];
                setFormErrorMsg(first || 'Gagal menyimpan template. Periksa kembali isian Anda.');
            },
        });
    };

    const cetak = () => {
        if (!selectedTemplate || !selectedRombel) return;
        setPrinting(true);
        router.post('/admin/kartu-siswa/cetak', {
            template_id: selectedTemplate, rombel_id: selectedRombel,
        }, { onFinish: () => setPrinting(false) });
    };

    return (
        <AppLayout title="Cetak Kartu Siswa">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-sky-500" /> Cetak Kartu Tanda Siswa
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Kelola template kartu (ukuran, background, field data) lalu cetak per rombel
                    </p>
                </div>

                {/* Cetak */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Printer className="h-4 w-4 text-gray-400" /> Cetak Kartu</CardTitle></CardHeader>
                    <CardBody>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-56">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Template</label>
                                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="">— Pilih template —</option>
                                    {templates.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                </select>
                            </div>
                            <div className="min-w-56">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rombel</label>
                                <select value={selectedRombel} onChange={(e) => setSelectedRombel(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="">— Pilih rombel —</option>
                                    {rombelList.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                                </select>
                            </div>
                            <Button icon={Printer} disabled={!selectedTemplate || !selectedRombel || printing} loading={printing} onClick={cetak}>
                                Lanjut ke Preview Cetak
                            </Button>
                        </div>
                        {templates.length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">Belum ada template. Buat template terlebih dahulu di bawah.</p>
                        )}
                    </CardBody>
                </Card>

                {/* Templates */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Template Kartu ({templates.length})</CardTitle>
                        <Button icon={Plus} onClick={openAdd}>Buat Template</Button>
                    </CardHeader>
                    <div className="px-4 pt-3 flex gap-2 border-b border-gray-100 dark:border-gray-800">
                        {[
                            { key: 'portrait', label: 'Portrait', Icon: RectangleVertical },
                            { key: 'landscape', label: 'Landscape', Icon: RectangleHorizontal },
                        ].map(({ key, label, Icon }) => {
                            const count = templates.filter((t) => (t.orientasi ?? 'portrait') === key).length;
                            const active = orientTab === key;
                            return (
                                <button key={key} type="button" onClick={() => setOrientTab(key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        active
                                            ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}>
                                    <Icon className="h-3.5 w-3.5" /> {label} <span className="text-xs text-gray-400">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                    <CardBody className={filteredTemplates.length ? 'p-0' : ''}>
                        {filteredTemplates.length === 0 ? (
                            <div className="py-14 text-center text-gray-400 dark:text-gray-500">
                                <BadgeCheck className="h-9 w-9 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Belum ada template kartu {orientTab === 'portrait' ? 'portrait' : 'landscape'}.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                {filteredTemplates.map((t) => {
                                    const scale = Math.min(88 / t.tinggi_mm, 220 / t.lebar_mm);
                                    return (
                                        <div key={t.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                                            <div className="h-28 bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                                                <CardPreview template={t} fieldOptions={fieldOptions} scale={scale} />
                                                <span className="absolute bottom-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/60 text-white">
                                                    {t.lebar_mm} × {t.tinggi_mm} mm
                                                </span>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{t.nama}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{t.kertas} · jarak {t.jarak_x_mm}×{t.jarak_y_mm}mm</p>
                                                <div className="flex gap-1.5 mt-2.5">
                                                    <ActionButton icon={Edit} onClick={() => openEdit(t)} title="Edit" color="sky" />
                                                    <ActionButton icon={Trash2} onClick={() => setDeleteTarget(t)} title="Hapus" color="rose" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Modal template */}
            <Modal show={showModal} onClose={closeModal} title={editItem ? 'Edit Template' : 'Buat Template Kartu'} size="xl">
                <form onSubmit={submit} className="space-y-4">
                    {formErrorMsg && (
                        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                            {formErrorMsg}
                        </div>
                    )}
                    <Input label="Nama Template" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} error={form.errors.nama} required />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Orientasi</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => toggleOrientasi('portrait')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.data.orientasi === 'portrait' ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                <RectangleVertical className="h-4 w-4" /> Portrait
                            </button>
                            <button type="button" onClick={() => toggleOrientasi('landscape')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.data.orientasi === 'landscape' ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                <RectangleHorizontal className="h-4 w-4" /> Landscape
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Lebar Kartu (mm)" type="number" step="0.1" value={form.data.lebar_mm} onChange={(e) => form.setData('lebar_mm', e.target.value)} error={form.errors.lebar_mm} required />
                        <Input label="Tinggi Kartu (mm)" type="number" step="0.1" value={form.data.tinggi_mm} onChange={(e) => form.setData('tinggi_mm', e.target.value)} error={form.errors.tinggi_mm} required />
                    </div>

                    {/* Background */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Background Kartu</label>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => bgInputRef.current?.click()}
                                className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-400 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                {bgPreview ? <img src={bgPreview} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-300" />}
                            </button>
                            <div className="flex-1">
                                <p className="text-xs text-gray-400">Gambar akan diregangkan menutupi seluruh kartu.</p>
                                {bgPreview && (
                                    <button type="button" onClick={removeBg} className="mt-1 inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
                                        <X className="h-3 w-3" /> Hapus background
                                    </button>
                                )}
                            </div>
                            <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
                        </div>
                    </div>

                    {/* Bingkai foto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bingkai Foto Siswa</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => form.setData('bingkai_foto', 'kotak')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.data.bingkai_foto === 'kotak' ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                <span className="h-4 w-4 rounded-[3px] border-2 border-current" /> Kotak Rounded
                            </button>
                            <button type="button" onClick={() => form.setData('bingkai_foto', 'lingkaran')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.data.bingkai_foto === 'lingkaran' ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                <span className="h-4 w-4 rounded-full border-2 border-current" /> Lingkaran
                            </button>
                        </div>
                    </div>

                    {/* Tata letak */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tata Letak Kartu <span className="font-normal text-gray-400">(Nama selalu tampil)</span>
                            </label>
                            <button type="button" onClick={resetLayout} className="text-xs font-medium text-sky-600 hover:underline">
                                Reset Posisi
                            </button>
                        </div>
                        <LayoutEditor
                            lebarMm={form.data.lebar_mm}
                            tinggiMm={form.data.tinggi_mm}
                            bgPreview={bgPreview}
                            bingkaiFoto={form.data.bingkai_foto}
                            fotoLayout={form.data.foto_layout}
                            fields={form.data.fields}
                            fieldOptions={fieldOptions}
                            onChangeFotoLayout={(v) => form.setData('foto_layout', v)}
                            onChangeFields={(v) => form.setData('fields', v)}
                        />
                    </div>

                    <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 pt-2">Pengaturan Cetak</p>
                    <Select label="Ukuran Kertas" value={form.data.kertas} onChange={(e) => handleKertasChange(e.target.value)}>
                        {Object.keys(KERTAS_PRESET).map((k) => <option key={k} value={k}>{k}</option>)}
                    </Select>
                    {form.data.kertas === 'Custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Lebar Kertas (mm)" type="number" step="0.1" value={form.data.kertas_lebar_mm} onChange={(e) => form.setData('kertas_lebar_mm', e.target.value)} />
                            <Input label="Tinggi Kertas (mm)" type="number" step="0.1" value={form.data.kertas_tinggi_mm} onChange={(e) => form.setData('kertas_tinggi_mm', e.target.value)} />
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Margin (mm)" type="number" step="0.1" value={form.data.margin_mm} onChange={(e) => form.setData('margin_mm', e.target.value)} />
                        <Input label="Jarak Horizontal (mm)" type="number" step="0.1" value={form.data.jarak_x_mm} onChange={(e) => form.setData('jarak_x_mm', e.target.value)} />
                        <Input label="Jarak Vertikal (mm)" type="number" step="0.1" value={form.data.jarak_y_mm} onChange={(e) => form.setData('jarak_y_mm', e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={form.processing}>{editItem ? 'Simpan Perubahan' : 'Buat Template'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={!!deleteTarget}
                title="Hapus Template"
                message={`Template "${deleteTarget?.nama}" akan dihapus permanen.`}
                onConfirm={() => { router.delete(`/admin/kartu-siswa/template/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
