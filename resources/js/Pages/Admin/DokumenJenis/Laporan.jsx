import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardBody, CardTitle } from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import { ClipboardCheck, CheckCircle2, XCircle, Copy, Check, FileStack } from 'lucide-react';
import { useState } from 'react';

function buildWaMessage(jenis, siswa) {
    const belum  = siswa.filter((s) => !s.uploaded);
    const sudah  = siswa.filter((s) => s.uploaded);
    const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let msg = `📋 *Laporan Dokumen Siswa*\n📄 Jenis: *${jenis.nama}*\n📅 ${tanggal}\n\n`;
    msg += `✅ Sudah upload: ${sudah.length}/${siswa.length}\n`;
    msg += `❌ Belum upload: ${belum.length}/${siswa.length}\n`;

    if (belum.length > 0) {
        msg += `\n*Daftar yang belum upload:*\n`;
        belum.forEach((s, i) => {
            msg += `${i + 1}. ${s.nama} — ${s.rombel ?? '-'} (NIS ${s.nis})\n`;
        });
    }

    return msg;
}

export default function DokumenJenisLaporan({ jenisList, jenis, rombelList, siswa, filters }) {
    const [rombelId, setRombelId] = useState(filters.rombel_id ?? '');
    const [copied, setCopied] = useState(false);

    const applyFilter = (jenisId, rombel) => {
        router.get('/admin/dokumen-jenis/laporan', {
            jenis_id: jenisId || undefined,
            rombel_id: rombel || undefined,
        }, { preserveState: true, replace: true });
    };

    const sudah = siswa.filter((s) => s.uploaded).length;
    const belum = siswa.length - sudah;

    const copyToWhatsapp = async () => {
        if (!jenis) return;
        const text = buildWaMessage(jenis, siswa);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AppLayout title="Laporan Dokumen Siswa">
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-sky-500" /> Laporan Dokumen Siswa
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Lihat siswa yang sudah/belum unggah dokumen tertentu, dan salin laporannya ke WhatsApp.
                    </p>
                </div>

                <Card>
                    <CardBody className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-56">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jenis Dokumen</label>
                                <select value={jenis?.id ?? ''} onChange={(e) => applyFilter(e.target.value, rombelId)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    {jenisList.length === 0 && <option value="">Belum ada jenis dokumen</option>}
                                    {jenisList.map((j) => (
                                        <option key={j.id} value={j.id}>{j.nama}{!j.is_aktif ? ' (nonaktif)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-44">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rombel</label>
                                <select value={rombelId} onChange={(e) => { setRombelId(e.target.value); applyFilter(jenis?.id, e.target.value); }}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="">Semua Rombel</option>
                                    {rombelList.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                                </select>
                            </div>
                            {jenis && (
                                <button onClick={copyToWhatsapp}
                                    className={`ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                        copied ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    }`}>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Tersalin!' : 'Salin ke WhatsApp'}
                                </button>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {!jenis ? (
                    <Card><CardBody className="py-16 text-center text-sm text-gray-400">
                        <FileStack className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Belum ada jenis dokumen yang diatur.
                    </CardBody></Card>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{siswa.length}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Total Siswa</p>
                            </CardBody></Card>
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{sudah}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Sudah Upload</p>
                            </CardBody></Card>
                            <Card><CardBody className="p-4 text-center">
                                <p className="text-2xl font-black text-amber-500">{belum}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Belum Upload</p>
                            </CardBody></Card>
                        </div>

                        <Card>
                            <CardHeader><CardTitle>Daftar Siswa — {jenis.nama}</CardTitle></CardHeader>
                            <CardBody className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Nama</th>
                                                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">NIS</th>
                                                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Rombel</th>
                                                <th className="px-4 py-3 text-left font-medium w-32">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {siswa.length === 0 ? (
                                                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Tidak ada siswa.</td></tr>
                                            ) : siswa.map((s) => (
                                                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{s.nama}</td>
                                                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.nis}</td>
                                                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.rombel ?? '–'}</td>
                                                    <td className="px-4 py-3">
                                                        {s.uploaded ? (
                                                            <Badge color="green"><CheckCircle2 className="h-3 w-3 inline mr-1" />Sudah</Badge>
                                                        ) : (
                                                            <Badge color="yellow"><XCircle className="h-3 w-3 inline mr-1" />Belum</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
