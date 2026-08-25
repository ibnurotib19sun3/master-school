import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import { Input, Select, Textarea } from '@/Components/ui/Input';
import {
    Camera, Save, KeyRound, User,
    GraduationCap, BookOpen, CheckCircle, AlertCircle,
    ZoomIn, ZoomOut, Move, Eye, EyeOff,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

/* ─────────────────────────── Crop Modal ─────────────────────────── */
function CropModal({ src, file, onConfirm, onCancel }) {
    const CROP_SIZE   = 260; // px – ukuran lingkaran crop
    const OUTPUT_SIZE = 400; // px – ukuran output canvas

    const imgRef       = useRef(null);
    const containerRef = useRef(null);
    const [natSize, setNatSize]     = useState(null);
    const [zoom, setZoom]           = useState(1);
    const [offset, setOffset]       = useState({ x: 0, y: 0 });
    const [dragging, setDragging]   = useState(false);
    const dragOrigin                = useRef(null);

    // Hitung zoom minimum agar gambar selalu menutupi circle
    const minZoom = natSize
        ? Math.max(CROP_SIZE / natSize.w, CROP_SIZE / natSize.h)
        : 1;

    const clampOffset = (off, z, nw, nh) => {
        const imgW = nw * z;
        const imgH = nh * z;
        return {
            x: Math.min(0, Math.max(CROP_SIZE - imgW, off.x)),
            y: Math.min(0, Math.max(CROP_SIZE - imgH, off.y)),
        };
    };

    const onImgLoad = () => {
        const img  = imgRef.current;
        const nw   = img.naturalWidth;
        const nh   = img.naturalHeight;
        const initZ = Math.max(CROP_SIZE / nw, CROP_SIZE / nh);
        setNatSize({ w: nw, h: nh });
        setZoom(initZ);
        setOffset({
            x: (CROP_SIZE - nw * initZ) / 2,
            y: (CROP_SIZE - nh * initZ) / 2,
        });
    };

    const onZoomChange = (e) => {
        const newZ = parseFloat(e.target.value);
        if (!natSize) { setZoom(newZ); return; }
        // Zoom dari tengah gambar saat ini — tidak ada efek "tertarik"
        const dW = natSize.w * (newZ - zoom);
        const dH = natSize.h * (newZ - zoom);
        setOffset(clampOffset(
            { x: offset.x - dW / 2, y: offset.y - dH / 2 },
            newZ, natSize.w, natSize.h,
        ));
        setZoom(newZ);
    };

    /* ── Drag (mouse) ── */
    const onMouseDown = (e) => {
        e.preventDefault();
        setDragging(true);
        dragOrigin.current = { sx: e.clientX - offset.x, sy: e.clientY - offset.y };
    };
    const onMouseMove = (e) => {
        if (!dragging || !dragOrigin.current || !natSize) return;
        const raw = { x: e.clientX - dragOrigin.current.sx, y: e.clientY - dragOrigin.current.sy };
        setOffset(clampOffset(raw, zoom, natSize.w, natSize.h));
    };
    const onMouseUp = () => { setDragging(false); dragOrigin.current = null; };

    /* ── Drag (touch) — touch-action:none di container ── */
    const onTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        setDragging(true);
        dragOrigin.current = { sx: t.clientX - offset.x, sy: t.clientY - offset.y };
    };
    const onTouchMove = (e) => {
        if (!dragging || !dragOrigin.current || !natSize || e.touches.length !== 1) return;
        const t   = e.touches[0];
        const raw = { x: t.clientX - dragOrigin.current.sx, y: t.clientY - dragOrigin.current.sy };
        setOffset(clampOffset(raw, zoom, natSize.w, natSize.h));
    };
    const onTouchEnd = () => { setDragging(false); dragOrigin.current = null; };

    /* ── Konfirmasi: render ke canvas → blob → File ── */
    const handleConfirm = () => {
        if (!natSize || !imgRef.current) return;
        // Gunakan ukuran container aktual (sudah di-layout)
        const rect       = containerRef.current?.getBoundingClientRect();
        const actualSize = rect ? Math.round(rect.width) : CROP_SIZE;

        const canvas  = document.createElement('canvas');
        canvas.width  = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');

        // Area gambar asli yang tampak di circle
        const srcX = -offset.x / zoom;
        const srcY = -offset.y / zoom;
        const srcW = actualSize / zoom;
        const srcH = actualSize / zoom;

        // Clip lingkaran di canvas output
        ctx.beginPath();
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        canvas.toBlob(
            (blob) => onConfirm(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })),
            'image/jpeg',
            0.92,
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Sesuaikan Foto Profil</h3>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Move className="h-3 w-3" /> Geser foto untuk memilih bagian yang ditampilkan
                    </p>
                </div>

                {/* Crop circle */}
                <div className="flex flex-col items-center px-5 pb-4 gap-4">
                    <div
                        ref={containerRef}
                        style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
                        className={`relative overflow-hidden rounded-full border-4 border-sky-500 shadow-lg bg-gray-200 dark:bg-gray-700 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <img
                            ref={imgRef}
                            src={src}
                            alt="crop"
                            onLoad={onImgLoad}
                            draggable={false}
                            style={{
                                position: 'absolute',
                                left: offset.x,
                                top: offset.y,
                                width: natSize ? natSize.w * zoom : 'auto',
                                height: natSize ? natSize.h * zoom : 'auto',
                                userSelect: 'none',
                                pointerEvents: 'none',
                            }}
                        />
                        {/* Overlay guide ring */}
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/40 pointer-events-none" />
                    </div>

                    {/* Zoom slider */}
                    {natSize && (
                        <div className="w-full flex items-center gap-3">
                            <ZoomOut className="h-4 w-4 text-gray-400 shrink-0" />
                            <input
                                type="range"
                                min={minZoom}
                                max={minZoom * 4}
                                step={0.001}
                                value={zoom}
                                onChange={onZoomChange}
                                className="flex-1 accent-sky-600 h-1.5"
                            />
                            <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-5 pb-5">
                    <button type="button" onClick={onCancel}
                        className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Batal
                    </button>
                    <button type="button" onClick={handleConfirm}
                        className="flex-1 py-2.5 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 active:bg-sky-800 transition-colors">
                        Gunakan Foto
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────── Role Badge ─────────────────────────── */
function RoleBadge({ role }) {
    const map = {
        super_admin:       ['bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', 'Super Admin'],
        kepala_sekolah:    ['bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', 'Kepala Sekolah'],
        wakasek_kurikulum: ['bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', 'Wakasek Kurikulum'],
        wakasek_kesiswaan: ['bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300', 'Wakasek Kesiswaan'],
        guru:              ['bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', 'Guru'],
        guru_piket:        ['bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', 'Guru Piket'],
        siswa:             ['bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', 'Siswa'],
        tatausaha:         ['bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', 'Tata Usaha'],
        kepala_tatausaha:  ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', 'Kepala TU'],
    };
    const [cls, label] = map[role] ?? ['bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', role];
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
            {label}
        </span>
    );
}

/* ─────────────────────────── Section card ─────────────────────────── */
function Section({ title, icon: Icon, children }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-sky-500" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardBody className="pt-0">{children}</CardBody>
        </Card>
    );
}

/* ─────────────────────────── Read-only field ─────────────────────── */
function InfoField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{value || <span className="text-gray-400 italic">–</span>}</p>
        </div>
    );
}

/* ─────────────────────────── Page ─────────────────────────── */
export default function ProfileIndex({ user, guru, mataPelajaran = [] }) {
    const mapelMap  = Object.fromEntries(mataPelajaran.map((m) => [m.id, m.nama]));
    const avatarRef = useRef(null);

    const [avatarPreview,   setAvatarPreview]   = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError,     setAvatarError]     = useState(null);
    const [cropSrc,         setCropSrc]         = useState(null);
    const [cropFile,        setCropFile]        = useState(null);
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const togglePass = (key) => setShowPass((p) => ({ ...p, [key]: !p[key] }));

    /* ── Form profil ── */
    const profileForm = useForm({
        name:          user.name ?? '',
        email:         user.email ?? '',
        tanggal_lahir: user.tanggal_lahir
            ? (typeof user.tanggal_lahir === 'string' ? user.tanggal_lahir.substring(0, 10) : '')
            : '',
        alamat: user.alamat ?? '',
    });

    /* ── Form password ── */
    const passForm = useForm({
        current_password:      '',
        password:              '',
        password_confirmation: '',
    });

    /* ── Form nomor WA guru ── */
    const waForm = useForm({ nomor_wa: guru?.nomor_wa ?? '' });

    /* ── Pilih file → validasi → buka crop modal ── */
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setAvatarError('Ukuran foto maksimal 10MB.');
            if (avatarRef.current) avatarRef.current.value = '';
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setAvatarError('Format harus JPG, PNG, atau WebP.');
            if (avatarRef.current) avatarRef.current.value = '';
            return;
        }
        setAvatarError(null);
        setCropFile(file);
        setCropSrc(URL.createObjectURL(file));
    };

    /* ── Crop selesai → upload ── */
    const handleCropConfirm = (croppedFile) => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
        setCropFile(null);

        const preview = URL.createObjectURL(croppedFile);
        setAvatarPreview(preview);
        setUploadingAvatar(true);

        const fd = new FormData();
        fd.append('avatar', croppedFile);

        router.post('/profile/avatar', fd, {
            forceFormData: true,
            onSuccess: () => { setAvatarPreview(null); setAvatarError(null); },
            onError:   (errors) => { setAvatarPreview(null); setAvatarError(errors.avatar ?? 'Gagal mengunggah foto.'); },
            onFinish:  () => {
                setUploadingAvatar(false);
                URL.revokeObjectURL(preview);
                if (avatarRef.current) avatarRef.current.value = '';
            },
        });
    };

    /* ── Batal crop ── */
    const handleCropCancel = () => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
        setCropFile(null);
        if (avatarRef.current) avatarRef.current.value = '';
    };

    const submitProfile  = (e) => { e.preventDefault(); profileForm.put('/profile'); };
    const submitPassword = (e) => { e.preventDefault(); passForm.put('/profile/password', { onSuccess: () => passForm.reset() }); };
    const submitWa       = (e) => { e.preventDefault(); waForm.put('/profile/guru'); };

    const isGuru = Array.isArray(user.roles)
        ? user.roles.some((r) => (typeof r === 'string' ? r : r.name) === 'guru')
        : false;

    const displayAvatar = avatarPreview ?? user.avatar_url;

    return (
        <AppLayout title="Profil Saya">
            {/* Crop modal */}
            {cropSrc && (
                <CropModal
                    src={cropSrc}
                    file={cropFile}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}

            <div className="max-w-4xl mx-auto space-y-5">

                {/* ── Header profil ── */}
                <Card>
                    <CardBody>
                        {/* Responsive: mobile = row(avatar+btn | info), desktop = row(avatar+btn | info) */}
                        <div className="flex gap-4 sm:gap-5">

                            {/* Kolom kiri: avatar + tombol ganti */}
                            <div className="flex flex-col items-center gap-2.5 shrink-0">
                                <div className="relative">
                                    <img
                                        src={displayAvatar}
                                        alt={user.name}
                                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-md"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? '?')}&background=0284c7&color=fff&bold=true&size=96`;
                                        }}
                                    />
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={avatarRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => { setAvatarError(null); avatarRef.current?.click(); }}
                                    disabled={uploadingAvatar}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    Ganti Foto
                                </button>
                            </div>

                            {/* Kolom kanan: nama + email + badges */}
                            <div className="flex-1 min-w-0 py-1">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    {guru?.gelar_depan ? `${guru.gelar_depan} ` : ''}{user.name}{guru?.gelar_belakang ? `, ${guru.gelar_belakang}` : ''}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</p>

                                {/* Badges — flex-wrap, whitespace-nowrap per badge */}
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {(user.roles ?? []).map((r) => {
                                        const name = typeof r === 'string' ? r : r.name;
                                        return <RoleBadge key={name} role={name} />;
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Error & hint */}
                        {avatarError && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {avatarError}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-400">Format: JPG, PNG, WebP. Maksimal 10MB.</p>
                    </CardBody>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* ── Informasi Akun ── */}
                    <Section title="Informasi Akun" icon={User}>
                        <form onSubmit={submitProfile} className="space-y-4">
                            {/* Nama & Email — read-only */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</p>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                        {profileForm.data.name || <span className="italic">–</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</p>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                        {profileForm.data.email || <span className="italic">–</span>}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                    Nama dan email tidak dapat diubah. Hubungi admin jika perlu perubahan.
                                </p>
                            </div>
                            <Input
                                label="Tanggal Lahir"
                                type="date"
                                value={profileForm.data.tanggal_lahir}
                                onChange={(e) => profileForm.setData('tanggal_lahir', e.target.value)}
                            />
                            <Textarea
                                label="Alamat"
                                value={profileForm.data.alamat}
                                onChange={(e) => profileForm.setData('alamat', e.target.value)}
                                rows={2}
                            />
                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors disabled:opacity-60 shadow-sm"
                                >
                                    <Save className="h-4 w-4" />
                                    {profileForm.processing ? 'Menyimpan...' : 'Simpan Profil'}
                                </button>
                            </div>
                        </form>
                    </Section>

                    {/* ── Ganti Password ── */}
                    <Section title="Ganti Password" icon={KeyRound}>
                        <form onSubmit={submitPassword} className="space-y-4">
                            <Input
                                label="Password Saat Ini"
                                type={showPass.current ? 'text' : 'password'}
                                value={passForm.data.current_password}
                                onChange={(e) => passForm.setData('current_password', e.target.value)}
                                error={passForm.errors.current_password}
                                required
                                suffix={
                                    <button type="button" onClick={() => togglePass('current')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        {showPass.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                            />
                            <Input
                                label="Password Baru"
                                type={showPass.new ? 'text' : 'password'}
                                value={passForm.data.password}
                                onChange={(e) => passForm.setData('password', e.target.value)}
                                error={passForm.errors.password}
                                required
                                suffix={
                                    <button type="button" onClick={() => togglePass('new')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        {showPass.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                            />
                            <Input
                                label="Konfirmasi Password Baru"
                                type={showPass.confirm ? 'text' : 'password'}
                                value={passForm.data.password_confirmation}
                                onChange={(e) => passForm.setData('password_confirmation', e.target.value)}
                                error={passForm.errors.password_confirmation}
                                required
                                suffix={
                                    <button type="button" onClick={() => togglePass('confirm')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        {showPass.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                            />

                            {passForm.errors.message && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {passForm.errors.message}
                                </div>
                            )}

                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                                Password minimal 8 karakter. Setelah berhasil diubah, gunakan password baru untuk login berikutnya.
                            </div>

                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={passForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors disabled:opacity-60 shadow-sm"
                                >
                                    <KeyRound className="h-4 w-4" />
                                    {passForm.processing ? 'Menyimpan...' : 'Ubah Password'}
                                </button>
                            </div>
                        </form>
                    </Section>
                </div>

                {/* ── Data Kepegawaian (guru only) ── */}
                {isGuru && guru && (
                    <Section title="Data Kepegawaian" icon={GraduationCap}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5 mt-2">
                            <InfoField label="NIP/NIPY" value={guru.nip} />
                            <InfoField label="NUPTK" value={guru.nuptk} />
                            <InfoField
                                label="Nama Lengkap dengan Gelar"
                                value={[guru.gelar_depan, user.name, guru.gelar_belakang ? `, ${guru.gelar_belakang}` : ''].filter(Boolean).join(' ')}
                            />
                            <InfoField label="Status Kepegawaian" value={guru.status_kepegawaian} />
                            <InfoField label="Pendidikan Terakhir" value={guru.pendidikan_terakhir} />
                            <InfoField
                                label="Tanggal Masuk"
                                value={guru.tanggal_masuk
                                    ? new Date(guru.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : null}
                            />
                        </div>

                        {Array.isArray(guru.bidang_studi) && guru.bidang_studi.length > 0 && (
                            <div className="mb-5">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Bidang Studi</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {guru.bidang_studi.map((id) => (
                                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-medium whitespace-nowrap">
                                            <BookOpen className="h-3 w-3 shrink-0" /> {mapelMap[id] ?? id}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={submitWa}>
                            <div className="flex items-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex-1">
                                    <Input
                                        label="Nomor WhatsApp"
                                        value={waForm.data.nomor_wa}
                                        onChange={(e) => waForm.setData('nomor_wa', e.target.value)}
                                        error={waForm.errors.nomor_wa}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={waForm.processing}
                                    className="mb-0.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors disabled:opacity-60 shadow-sm whitespace-nowrap"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Simpan
                                </button>
                            </div>
                        </form>

                        <p className="mt-3 text-xs text-gray-400">
                            Data kepegawaian dikelola oleh admin. Hubungi admin untuk memperbarui data lainnya.
                        </p>
                    </Section>
                )}
            </div>
        </AppLayout>
    );
}
