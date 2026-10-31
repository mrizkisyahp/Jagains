import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Scale,
    Clock,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    FileText,
    Image,
    Users,
    Building2,
    Loader2,
    Calendar,
    ShieldAlert,
    ExternalLink,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { DetailPerkaraAudit, JenisKeputusanAuditor } from '@/types/auditor';
import { getPemicuBadge } from './KartuEskalasi';

interface ModalKeputusanAuditorProps {
    open: boolean;
    onClose: () => void;
    eskalasiId: number | null;
    onSuccess?: () => void;
}

export default function ModalKeputusanAuditor({
    open,
    onClose,
    eskalasiId,
    onSuccess,
}: ModalKeputusanAuditorProps) {
    const [detail, setDetail] = useState<DetailPerkaraAudit | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tabAktif, setTabAktif] = useState<'berkas' | 'sidang'>('berkas');

    // State Formulir Keputusan
    const [jenis, setJenis] = useState<JenisKeputusanAuditor>('PERINTAH');
    const [perintah, setPerintah] = useState('');
    const [alasan, setAlasan] = useState('');
    const [tenggat, setTenggat] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ambil detail berkas perkara saat modal dibuka
    useEffect(() => {
        if (!open || !eskalasiId) {
            setDetail(null);
            return;
        }

        setIsLoading(true);
        fetch(`/auditor/antrean/${eskalasiId}`)
            .then((res) => {
                if (!res.ok) throw new Error('Gagal memuat berkas perkara eskalasi.');
                return res.json();
            })
            .then((data: DetailPerkaraAudit) => {
                setDetail(data);
                // Atur nilai default keputusan sesuai pemicu
                if (data.eskalasi.pemicu === 'SLA') {
                    setJenis('PERINTAH');
                } else {
                    setJenis('PERBAIKAN_SAH');
                }
            })
            .catch((err) => {
                toast.error(err.message);
                onClose();
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [open, eskalasiId]);

    const handleClose = () => {
        setPerintah('');
        setAlasan('');
        setTenggat('');
        setTabAktif('berkas');
        onClose();
    };

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail) return;

        setIsSubmitting(true);

        const payload: Record<string, unknown> = {
            jenis,
        };

        if (jenis === 'PERINTAH') {
            payload.perintah = perintah.trim();
            payload.tenggat = tenggat;
        } else if (jenis === 'PERBAIKAN_SAH') {
            payload.alasan = alasan.trim();
        } else if (jenis === 'KERJAKAN_ULANG') {
            payload.alasan = alasan.trim();
            payload.perintah = perintah.trim() || alasan.trim();
            payload.tenggat = tenggat;
        }

        router.post(
            `/auditor/antrean/${detail.eskalasi.id}/putuskan`,
            payload as any,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Keputusan sidang Auditor berhasil ditetapkan.');
                    handleClose();
                    onSuccess?.();
                },
                onError: (errors) => {
                    const errorMsg = Object.values(errors)[0] || 'Terjadi kesalahan saat memproses keputusan.';
                    toast.error(errorMsg as string);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const isSla = detail?.eskalasi.pemicu === 'SLA';
    const isFormValid = isSla
        ? perintah.trim().length >= 10 && tenggat !== ''
        : jenis === 'PERBAIKAN_SAH'
        ? alasan.trim().length >= 10
        : alasan.trim().length >= 10 && tenggat !== '';

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0 sm:max-h-[88vh]">
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                    <DialogHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-400">
                                    {detail?.laporan.nomor_tiket || 'Memuat...'}
                                </span>
                                {detail && (
                                    <Badge variant="outline" className={getPemicuBadge(detail.eskalasi.pemicu).classes}>
                                        {getPemicuBadge(detail.eskalasi.pemicu).label}
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs text-zinc-500 font-numeric">
                                Sidang Majelis Auditor Independen
                            </span>
                        </div>
                        <DialogTitle className="mt-1 font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {detail?.laporan.judul || 'Berkas Perkara Eskalasi'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Telaah berkas perkara sengketa fisik atau keterlambatan SLA untuk menetapkan keputusan akhir auditor.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Navigation Tabs */}
                    <div className="mt-4 flex gap-2 border-b border-zinc-200 pb-1 text-xs dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setTabAktif('berkas')}
                            className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 font-medium transition-all ${
                                tabAktif === 'berkas'
                                    ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            <FileText className="size-3.5" />
                            <span>1. Telaah Berkas Perkara</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTabAktif('sidang')}
                            className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 font-medium transition-all ${
                                tabAktif === 'sidang'
                                    ? 'border-b-2 border-teal-800 text-teal-800 dark:border-teal-400 dark:text-teal-400 font-bold'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            <Scale className="size-3.5" />
                            <span>2. Sidang Putusan Auditor</span>
                        </button>
                    </div>
                </div>

                {isLoading || !detail ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <Loader2 className="size-8 animate-spin text-zinc-400" />
                        <p className="mt-3 text-sm text-zinc-500">Memuat berkas perkara audit dari arsip pusat...</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {/* TAB 1: TELAAH BERKAS PERKARA */}
                        {tabAktif === 'berkas' && (
                            <div className="space-y-6">
                                {/* Ringkasan Tiket */}
                                <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                                    <div>
                                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Instansi Pelaksana</span>
                                        <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {detail.laporan.instansi?.nama || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Lokasi Wilayah</span>
                                        <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            Kelurahan {detail.laporan.kelurahan?.nama || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Status Saat Ini</span>
                                        <p className="mt-0.5 font-mono text-sm font-semibold text-teal-800 dark:text-teal-400">
                                            {detail.laporan.status}
                                        </p>
                                    </div>
                                </div>

                                {/* Deskripsi Masalah */}
                                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-wider dark:text-zinc-100">
                                        <FileText className="size-3.5 text-zinc-500" />
                                        <span>Deskripsi Kerusakan Fisik (Pelapor Warga)</span>
                                    </h4>
                                    <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                                        {detail.laporan.keterangan}
                                    </p>
                                </div>

                                {/* Perbandingan Foto: Sebelum vs Sesudah */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-wider dark:text-zinc-100">
                                        <Image className="size-3.5 text-zinc-500" />
                                        <span>Dokumentasi Visual (Sebelum vs Sesudah)</span>
                                    </h4>
                                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                                            <div className="border-b border-zinc-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">
                                                Foto Awal (Kondisi Rusak)
                                            </div>
                                            {detail.foto_awal ? (
                                                <img
                                                    src={detail.foto_awal}
                                                    alt="Foto Awal"
                                                    className="aspect-video w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex aspect-video items-center justify-center text-xs text-zinc-400">
                                                    Tidak ada foto awal
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                                            <div className="border-b border-zinc-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">
                                                Foto Sesudah (Klaim Selesai Instansi)
                                            </div>
                                            {detail.foto_sesudah ? (
                                                <img
                                                    src={detail.foto_sesudah}
                                                    alt="Foto Sesudah"
                                                    className="aspect-video w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex aspect-video items-center justify-center text-xs text-zinc-400">
                                                    Belum ada foto sesudah
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Berita Acara Pelaksanaan Fisik */}
                                {detail.berita_acara && (
                                    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                                        <h4 className="flex items-center justify-between text-xs font-bold text-zinc-900 uppercase tracking-wider dark:text-zinc-100">
                                            <span className="flex items-center gap-2">
                                                <FileText className="size-3.5 text-zinc-500" />
                                                <span>Berita Acara Pekerjaan Instansi (Versi {detail.berita_acara.versi})</span>
                                            </span>
                                            <span className="font-mono text-[11px] font-normal text-zinc-400">
                                                {new Date(detail.berita_acara.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </h4>
                                        <div className="mt-3 space-y-2 text-xs">
                                            <div>
                                                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Kegiatan:</span>
                                                <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{detail.berita_acara.kegiatan}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Hasil:</span>
                                                <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{detail.berita_acara.hasil}</p>
                                            </div>
                                            {detail.berita_acara.hambatan && (
                                                <div>
                                                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">Hambatan Lapangan:</span>
                                                    <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{detail.berita_acara.hambatan}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Catatan Sanggahan Instansi (jika ada) */}
                                {detail.sengketa && detail.sengketa.jawaban === 'sanggah' && (
                                    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-violet-800 dark:text-violet-300">
                                            <ShieldAlert className="size-4 text-violet-600" />
                                            <span>Dokumen Sanggahan Resmi Instansi</span>
                                        </h4>
                                        <p className="mt-2 text-xs leading-relaxed text-violet-900 dark:text-violet-200">
                                            {detail.sengketa.alasan_sanggah}
                                        </p>
                                    </div>
                                )}

                                {/* Suara Penolakan Warga (Anonim ST-08) */}
                                {detail.suara_warga && detail.suara_warga.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-wider dark:text-zinc-100">
                                            <Users className="size-3.5 text-zinc-500" />
                                            <span>Rekaman Partisipasi & Alasan Penolakan Warga ({detail.suara_warga.length} Suara)</span>
                                        </h4>
                                        <div className="mt-2.5 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                                            {detail.suara_warga.map((s, idx) => (
                                                <div
                                                    key={s.id || idx}
                                                    className="flex flex-col gap-1 border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800/60"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5 font-medium">
                                                            {s.setuju ? (
                                                                <span className="text-emerald-600 font-semibold">● Setuju</span>
                                                            ) : (
                                                                <span className="text-rose-600 font-semibold">● Belum Sesuai (Tolak)</span>
                                                            )}
                                                            <span className="text-zinc-400">
                                                                (Jalur {s.jalur}, Bobot {s.bobot})
                                                            </span>
                                                        </span>
                                                        <span className="text-[11px] text-zinc-400 font-numeric">
                                                            {new Date(s.waktu).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                    {s.alasan && (
                                                        <p className="italic text-zinc-600 dark:text-zinc-400">
                                                            "{s.alasan}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Navigasi Lanjut ke Tab Putusan */}
                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setTabAktif('sidang')}
                                        className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                                    >
                                        <span>Lanjut ke Sidang Putusan</span>
                                        <Scale className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SIDANG PUTUSAN AUDITOR */}
                        {tabAktif === 'sidang' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {isSla ? (
                                    /* Skenario 1: Pemicu Keterlambatan SLA */
                                    <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                                        <div className="flex items-start gap-3">
                                            <Clock className="size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                            <div>
                                                <h4 className="font-display text-sm font-bold text-rose-900 dark:text-rose-200">
                                                    Penerbitan Perintah Tindak Lanjut SLA (BR-AUD-05)
                                                </h4>
                                                <p className="mt-1 text-xs text-rose-800/80 leading-relaxed dark:text-rose-300">
                                                    Tiket telah melewati batas jatuh tempo SLA resmi tahap <strong>{detail.eskalasi.tahap}</strong>. Sesuai aturan, status tiket tetap berjalan dan Auditor menetapkan instruksi wajib beserta tenggat waktu bagi instansi penanggung jawab.
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                Instruksi / Perintah Tertulis Auditor <span className="text-rose-500">*</span>
                                            </label>
                                            <Textarea
                                                value={perintah}
                                                onChange={(e) => setPerintah(e.target.value)}
                                                placeholder="Contoh: Dinas wajib segera menuntaskan penerbitan surat survei lapangan dan berkoordinasi dengan pengawas RW setempat..."
                                                rows={4}
                                                className="mt-1 text-xs"
                                                required
                                            />
                                            <p className="mt-1 text-[11px] text-zinc-400">
                                                Minimal 10 karakter. Perintah ini akan tampil secara publik pada detail tiket dan dikirim sebagai notifikasi resmi ke dinas.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                Tenggat Waktu Kepatuhan Perintah <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={tenggat}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setTenggat(e.target.value)}
                                                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs shadow-xs focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* Skenario 2: Pemicu Non-SLA (Sanggahan, Ronde 4x, Tanpa Kuorum 14 Hari) */
                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                                            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                                                Opsi Putusan Sidang (Final & Mengikat - BR-AUD-04)
                                            </h4>
                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setJenis('PERBAIKAN_SAH')}
                                                    className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-all ${
                                                        jenis === 'PERBAIKAN_SAH'
                                                            ? 'border-emerald-500 bg-emerald-50/70 shadow-xs dark:bg-emerald-950/30'
                                                            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className={`size-4 ${jenis === 'PERBAIKAN_SAH' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                                        <span className="font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                            1. Tetapkan Perbaikan Sah (T-19)
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                        Fisik perbaikan dinyatakan sah dan memenuhi spesifikasi teknis. Status tiket berubah menjadi <strong>TERTUTUP_AUDITOR</strong>.
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setJenis('KERJAKAN_ULANG')}
                                                    className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-all ${
                                                        jenis === 'KERJAKAN_ULANG'
                                                            ? 'border-amber-500 bg-amber-50/70 shadow-xs dark:bg-amber-950/30'
                                                            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <RotateCcw className={`size-4 ${jenis === 'KERJAKAN_ULANG' ? 'text-amber-600' : 'text-zinc-400'}`} />
                                                        <span className="font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                            2. Perintahkan Kerjakan Ulang (T-20)
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                        Pekerjaan fisik dinilai belum tuntas. Status tiket dikembalikan ke <strong>DIKERJAKAN</strong> dengan tenggat waktu baru.
                                                    </p>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Alasan Yuridis / Teknis */}
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                Alasan Pertimbangan Yuridis & Teknis Auditor <span className="text-rose-500">*</span>
                                            </label>
                                            <Textarea
                                                value={alasan}
                                                onChange={(e) => setAlasan(e.target.value)}
                                                placeholder="Uraikan dasar pertimbangan penetapan putusan ini berdasarkan telaah foto lapangan, berita acara, dan sanggahan..."
                                                rows={4}
                                                className="mt-1 text-xs"
                                                required
                                            />
                                            <p className="mt-1 text-[11px] text-zinc-400">
                                                Minimal 10 karakter. Alasan ini akan tercatat permanen di audit log dan tampil transparan kepada publik.
                                            </p>
                                        </div>

                                        {/* Input Tambahan Jika Kerjakan Ulang */}
                                        {jenis === 'KERJAKAN_ULANG' && (
                                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4 sm:grid-cols-2 dark:border-amber-900/40 dark:bg-amber-950/20">
                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Instruksi Khusus Perbaikan Ulang
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={perintah}
                                                        onChange={(e) => setPerintah(e.target.value)}
                                                        placeholder="Contoh: Lakukan pengelupasan aspal dan pemadatan ulang..."
                                                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs shadow-xs focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                        Tenggat Waktu Pengerjaan Ulang <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={tenggat}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => setTenggat(e.target.value)}
                                                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs shadow-xs focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer Aksi Form */}
                                <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setTabAktif('berkas')}
                                        disabled={isSubmitting}
                                        className="text-xs"
                                    >
                                        Kembali ke Berkas
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!isFormValid || isSubmitting}
                                        className="gap-2 bg-teal-800 text-white hover:bg-teal-900 active:scale-[0.99] dark:bg-teal-700 dark:hover:bg-teal-600 text-xs font-bold"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                <span>Menerbitkan Putusan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Scale className="size-4" />
                                                <span>Tetapkan Putusan Resmi</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
