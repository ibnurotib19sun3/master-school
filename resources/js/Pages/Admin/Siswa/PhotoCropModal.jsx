import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import Modal from '@/Components/ui/Modal';
import Button from '@/Components/ui/Button';
import { ZoomIn } from 'lucide-react';

function createImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', reject);
        img.crossOrigin = 'anonymous';
        img.src = src;
    });
}

// Ekstrak area crop dari gambar ASLI (bukan dari ukuran tampilan editor) supaya
// resolusi foto tetap tinggi — penting untuk kualitas cetak kartu tanda siswa.
async function getCroppedBlob(imageSrc, cropPixels) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        image,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, cropPixels.width, cropPixels.height
    );
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

export default function PhotoCropModal({ show, imageSrc, onCancel, onConfirm }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    // Reset tiap kali gambar baru dibuka — kalau tidak, area crop dari foto SEBELUMNYA
    // bisa nyangkut kalau user buka editor ini dua kali berturut-turut (ganti foto lagi
    // sebelum simpan), yang menyebabkan hasil crop salah/kosong untuk foto yang baru.
    useEffect(() => {
        if (show) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setError('');
        }
    }, [show, imageSrc]);

    const onCropComplete = useCallback((_area, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleConfirm = async () => {
        // react-easy-crop baru memanggil onCropComplete setelah gambar selesai dimuat &
        // di-layout — kalau tombol ini diklik sebelum itu, jangan diam saja (sebelumnya
        // tidak terjadi apa-apa tanpa pesan apapun), tunggu sebentar lalu coba lagi.
        if (!croppedAreaPixels) {
            setError('Foto masih dimuat, coba lagi sebentar…');
            return;
        }
        setError('');
        setProcessing(true);
        try {
            const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
            if (!blob) throw new Error('Gagal memproses gambar.');
            onConfirm(blob);
        } catch (e) {
            setError('Gagal memproses foto: ' + e.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={show} onClose={onCancel} title="Sesuaikan Foto Siswa" size="md">
            <div className="space-y-4">
                <div className="relative h-80 w-full rounded-xl overflow-hidden bg-gray-900">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="rect"
                            showGrid={true}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        type="range" min={1} max={3} step={0.01} value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-sky-600"
                    />
                </div>
                <p className="text-xs text-gray-400">Geser dan perbesar untuk memilih bagian foto yang akan dipakai.</p>
                {error && <p className="text-xs text-red-500">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>
                    <Button type="button" onClick={handleConfirm} loading={processing}>Gunakan Foto Ini</Button>
                </div>
            </div>
        </Modal>
    );
}
