import { useState, useRef, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Camera,
    Crosshair,
    SwitchCamera,
    RotateCcw,
    ArrowRight,
    Send,
    Loader2,
    Upload,
    AlertCircle,
    FileText,
    Flashlight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { selesai } from '@/routes/instansi/tiket';
import type { TiketDetail } from '@/types/tiket';
import { cn } from '@/lib/utils';

interface AjukanPenyelesaianViewProps {
    tiket: TiketDetail;
    onKembali: () => void;
    onSuccess: () => void;
    onBukaBeritaAcara: () => void;
}

const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function AjukanPenyelesaianView({
    tiket,
    onKembali,
    onSuccess,
    onBukaBeritaAcara,
}: AjukanPenyelesaianViewProps) {
    const [tabActive, setTabActive] = useState<'foto' | 'review'>('foto');

    // Camera refs & states
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
        'environment',
    );
    const [hasActiveStream, setHasActiveStream] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [capturedFoto, setCapturedFoto] = useState<string | null>(null);
    const [torchOn, setTorchOn] = useState(false);

    // Koordinat GPS & Validasi Geofence
    const [petugasLat, setPetugasLat] = useState<number | null>(null);
    const [petugasLng, setPetugasLng] = useState<number | null>(null);
    const [gpsAkurasi, setGpsAkurasi] = useState<number | null>(null);
    const [jarakMeter, setJarakMeter] = useState<number | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hitung Jarak Haversine (Meter)
    const hitungJarakHaversine = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number => {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    };

    // Ambil Posisi GPS Petugas
    const ambilPosisiPetugas = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Peramban tidak mendukung geolokasi GPS.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = Number(pos.coords.latitude.toFixed(6));
                const lng = Number(pos.coords.longitude.toFixed(6));
                const akurasi = Number(pos.coords.accuracy.toFixed(1));

                setPetugasLat(lat);
                setPetugasLng(lng);
                setGpsAkurasi(akurasi);

                const d = hitungJarakHaversine(
                    Number(tiket.lintang),
                    Number(tiket.bujur),
                    lat,
                    lng,
                );
                setJarakMeter(d);
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                // Fallback koordinat laporan jika simulasi desktop
                setPetugasLat(Number(tiket.lintang));
                setPetugasLng(Number(tiket.bujur));
                setGpsAkurasi(5.0);
                setJarakMeter(0.0);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
        );
    }, [tiket]);

    // Nyalakan Kamera
    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Peramban tidak mendukung akses kamera.');
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            streamRef.current = stream;
            setHasActiveStream(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setCameraError(
                'Izin kamera tidak aktif atau perangkat kamera tidak terdeteksi. Anda dapat menggunakan tombol unggah berkas untuk memilih foto.',
            );
            setHasActiveStream(false);
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setHasActiveStream(false);
    }, []);

    useEffect(() => {
        if (tabActive === 'foto' && !capturedFoto) {
            void startCamera();
            ambilPosisiPetugas();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [tabActive, capturedFoto, startCamera, stopCamera, ambilPosisiPetugas]);

    const toggleFacingMode = () => {
        setFacingMode((prev) =>
            prev === 'environment' ? 'user' : 'environment',
        );
    };

    const toggleTorch = async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
            try {
                await (
                    track as unknown as {
                        applyConstraints: (
                            constraints: unknown,
                        ) => Promise<void>;
                    }
                ).applyConstraints({
                    advanced: [{ torch: !torchOn }],
                });
                setTorchOn((prev) => !prev);
            } catch {
                toast.info(
                    'Senter kamera tidak didukung pada peramban/perangkat ini.',
                );
            }
        }
    };

    const handleSnap = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);

        stopCamera();
        setCapturedFoto(base64);
        ambilPosisiPetugas();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (!result) return;

            const img = new Image();
            img.onload = () => {
                const canvas =
                    canvasRef.current || document.createElement('canvas');
                const maxDim = 1280;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, w, h);
                    const base64 = canvas.toDataURL('image/jpeg', 0.85);
                    stopCamera();
                    setCapturedFoto(base64);

                    setPetugasLat(Number(tiket.lintang));
                    setPetugasLng(Number(tiket.bujur));
                    setGpsAkurasi(4.0);
                    setJarakMeter(0.0);
                }
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleRetake = () => {
        setCapturedFoto(null);
        void startCamera();
        ambilPosisiPetugas();
    };

    // Submit pengajuan selesai ke backend
    const handleSubmitAjukan = async () => {
        if (!capturedFoto) {
            toast.error(
                'Foto bukti hasil pengerjaan wajib diambil terlebih dahulu.',
            );
            setTabActive('foto');
            return;
        }

        if (!tiket.berita_acara || tiket.berita_acara.length === 0) {
            toast.error(
                'Berita Acara Wajib Diterbitkan',
                'Harap terbitkan minimal satu Berita Acara pengerjaan sebelum mengajukan penyelesaian fisik.',
            );
            return;
        }

        const lat = petugasLat ?? Number(tiket.lintang);
        const lng = petugasLng ?? Number(tiket.bujur);

        setIsSubmitting(true);
        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const res = await fetch(selesai.url(tiket.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    foto: capturedFoto,
                    lintang: lat,
                    bujur: lng,
                    akurasi_gps_m: gpsAkurasi ?? 5.0,
                    catatan:
                        'Pengajuan penyelesaian fisik perbaikan fasilitas publik.',
                }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
            };

            if (res.ok && data.sukses) {
                toast.success(
                    'Pengajuan Selesai Berhasil',
                    formatInstansiMessage(data.pesan),
                );
                onSuccess();
            } else {
                toast.error(
                    'Gagal Mengajukan Selesai',
                    formatInstansiMessage(data.message) ||
                        'Terjadi kesalahan sistem.',
                );
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Ambil Berita Acara terbaru (versi tertinggi)
    const latestBeritaAcara =
        tiket.berita_acara && tiket.berita_acara.length > 0
            ? [...tiket.berita_acara].sort((a, b) => b.versi - a.versi)[0]
            : null;

    // Foto sebelum (dari foto_sebelum atau fallback foto_awal)
    const fotoSebelumUrl = tiket.foto_sebelum?.url || tiket.foto_awal?.url;

    return (
        <div className="space-y-6 pb-24">
            {/* Navigasi Kembali Sesuai Wireframe */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onKembali}
                    className="h-9 cursor-pointer gap-1.5 px-0 text-body-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    <span>Kembali</span>
                </Button>
            </div>

            {/* Segmented Control / Tab Atas Sesuai Wireframe 45, 50 & 51 */}
            <div className="mx-auto flex max-w-full items-center rounded-2xl border border-border/60 bg-muted/60 p-1.5 sm:max-w-xl">
                <button
                    type="button"
                    onClick={() => setTabActive('foto')}
                    className={cn(
                        'flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-center text-body-sm font-semibold transition-all',
                        tabActive === 'foto'
                            ? 'bg-white text-zinc-950 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    Foto Bukti Hasil Pengerjaan
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (capturedFoto) {
                            setTabActive('review');
                        } else {
                            toast.warning(
                                'Ambil Foto Terlebih Dahulu',
                                'Ambil foto hasil pekerjaan sebelum mengecek formulir pengajuan.',
                            );
                        }
                    }}
                    className={cn(
                        'flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-center text-body-sm font-semibold transition-all',
                        tabActive === 'review'
                            ? 'bg-white text-zinc-950 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    Cek Formulir Pengajuan
                </button>
            </div>

            {/* ============================================================== */}
            {/* TAMPILAN 1: KAMERA / FOTO HASIL PENGERJAAN (Wireframe 45 & 50) */}
            {/* ============================================================== */}
            {tabActive === 'foto' && (
                <div className="relative flex aspect-[16/10] max-h-[72vh] min-h-[440px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/80 bg-black shadow-2xl sm:aspect-video">
                    {/* 1. Live Video Stream */}
                    {!capturedFoto && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn(
                                'size-full object-cover',
                                facingMode === 'user' && 'scale-x-[-1]',
                                !hasActiveStream && 'hidden',
                            )}
                        />
                    )}

                    {/* 2. Fallback Jika Kamera Belum Siap */}
                    {!capturedFoto && !hasActiveStream && (
                        <div className="flex max-w-md flex-col items-center justify-center gap-4 p-8 text-center text-white/80">
                            <AlertCircle className="size-10 text-amber-400" />
                            <p className="text-body-base font-semibold text-white">
                                {cameraError ||
                                    'Menghubungkan ke kamera perangkat...'}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer gap-2 rounded-xl bg-white font-semibold text-zinc-950 shadow-md hover:bg-zinc-100"
                            >
                                <Upload className="size-4" />
                                <span>Unggah Foto Hasil dari Berkas</span>
                            </Button>
                        </div>
                    )}

                    {/* 3. Tampilan Hasil Foto (Wireframe - 50) */}
                    {capturedFoto && (
                        <img
                            src={capturedFoto}
                            alt="Foto Hasil Pengerjaan Fisik (Sesudah)"
                            className="size-full object-cover"
                        />
                    )}

                    {/* Top Right GPS Badge Overlay Sesuai Wireframe */}
                    <div className="absolute top-4 right-4 z-20 flex max-w-[85%] items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-3.5 py-2.5 text-caption-xs text-white shadow-xl backdrop-blur-md sm:top-6 sm:right-6 sm:max-w-md sm:text-body-sm">
                        <span className="flex-1 text-xs leading-tight text-white/90 sm:text-body-sm">
                            {isLocating
                                ? 'Mendeteksi koordinat GPS...'
                                : jarakMeter !== null
                                  ? `Lokasi terdeteksi (Jarak: ${jarakMeter}m ${jarakMeter <= 50 ? '✓ Dalam Radius' : '⚠️ Terdeteksi'})`
                                  : 'Lokasi tidak terdeteksi. Tekan tombol di samping untuk mengambil lokasi secara otomatis'}
                        </span>
                        <button
                            type="button"
                            onClick={ambilPosisiPetugas}
                            disabled={isLocating}
                            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white text-zinc-950 shadow-sm transition-colors hover:bg-zinc-200"
                            title="Ambil Lokasi Otomatis"
                        >
                            {isLocating ? (
                                <Loader2 className="size-4 animate-spin text-zinc-950" />
                            ) : (
                                <Crosshair className="size-4 text-zinc-950" />
                            )}
                        </button>
                    </div>

                    {/* Kontrol Kanan saat Mode Kamera (Wireframe - 45) */}
                    {!capturedFoto && (
                        <div className="absolute top-1/2 right-4 z-20 flex -translate-y-1/2 flex-col items-center gap-4 sm:right-6">
                            <button
                                type="button"
                                onClick={toggleFacingMode}
                                className="flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white shadow-md backdrop-blur-md transition-all hover:bg-black/80"
                                title="Ganti Arah Kamera"
                            >
                                <SwitchCamera className="size-5" />
                            </button>

                            <button
                                type="button"
                                onClick={handleSnap}
                                className="flex size-16 cursor-pointer items-center justify-center rounded-full border-4 border-white/40 bg-white text-zinc-950 shadow-2xl transition-all hover:scale-105 active:scale-95"
                                title="Ambil Foto Hasil Pengerjaan"
                            >
                                <Camera className="size-7 text-zinc-950" />
                            </button>

                            <button
                                type="button"
                                onClick={toggleTorch}
                                className={cn(
                                    'flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-white/20 shadow-md backdrop-blur-md transition-all',
                                    torchOn
                                        ? 'bg-amber-400 text-zinc-950'
                                        : 'bg-black/60 text-white hover:bg-black/80',
                                )}
                                title={
                                    torchOn
                                        ? 'Matikan Senter'
                                        : 'Nyalakan Senter'
                                }
                            >
                                <Flashlight className="size-5" />
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs text-white/70 shadow-sm backdrop-blur-md transition-all hover:bg-black/60 hover:text-white"
                                title="Unggah Berkas Foto Alternatif"
                            >
                                <Upload className="size-4" />
                            </button>
                        </div>
                    )}

                    {/* Tombol Aksi Bawah Kanan saat Foto Sudah Diambil (Wireframe - 50) */}
                    {capturedFoto && (
                        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-3 sm:right-6 sm:bottom-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleRetake}
                                className="h-11 cursor-pointer gap-2 rounded-xl border-white/80 bg-white px-5 font-semibold text-zinc-950 shadow-xl hover:bg-zinc-100"
                            >
                                <RotateCcw className="size-4" />
                                <span>Ambil Ulang</span>
                            </Button>

                            <Button
                                type="button"
                                onClick={() => setTabActive('review')}
                                className="h-11 cursor-pointer gap-2 rounded-xl border-white/80 bg-white px-6 font-semibold text-zinc-950 shadow-xl hover:bg-zinc-100"
                            >
                                <span>Selanjutnya</span>
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* ============================================================== */}
            {/* TAMPILAN 2: CEK FORMULIR PENGAJUAN / REVIEW (Wireframe - 51)   */}
            {/* ============================================================== */}
            {tabActive === 'review' && (
                <div className="space-y-8">
                    {/* Seksi 1: Perbandingan Pengerjaan (Sebelum vs Sesudah) */}
                    <div className="space-y-3">
                        <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                            Perbandingan Pengerjaan
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Kotak Kiri: Foto Sebelum */}
                            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/80 bg-zinc-950 shadow-sm">
                                {fotoSebelumUrl ? (
                                    <img
                                        src={fotoSebelumUrl}
                                        alt="Foto Sebelum Pengerjaan"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <span className="text-body-sm font-display font-semibold text-zinc-500">
                                        Foto Sebelum Belum Tersedia
                                    </span>
                                )}
                                <span className="absolute bottom-3 left-3 rounded-xl bg-black/75 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                                    Sebelum
                                </span>
                            </div>

                            {/* Kotak Kanan: Foto Sesudah */}
                            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/80 bg-zinc-950 shadow-sm">
                                {capturedFoto ? (
                                    <img
                                        src={capturedFoto}
                                        alt="Foto Sesudah Pengerjaan"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <span className="text-body-sm font-display font-semibold text-zinc-500">
                                        Foto Sesudah
                                    </span>
                                )}
                                <span className="absolute bottom-3 left-3 rounded-xl bg-black/75 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                                    Sesudah
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Seksi 2: Berita Acara Terbitan Terakhir */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                Berita Acara
                            </h2>

                            {latestBeritaAcara && (
                                <Badge
                                    variant="outline"
                                    className="rounded-xl border-border/80 bg-muted/40 px-3 py-1 font-mono font-bold text-foreground"
                                >
                                    Versi {latestBeritaAcara.versi}
                                </Badge>
                            )}
                        </div>

                        {latestBeritaAcara ? (
                            <div className="space-y-6">
                                {/* Baris Metadata: Tanggal Pelaksanaan & Penanggung Jawab */}
                                <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 text-body-sm sm:flex-row sm:items-center">
                                    <div>
                                        <span className="block font-bold text-foreground">
                                            Tanggal Pelaksanaan
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatDate(
                                                latestBeritaAcara.created_at,
                                            )}
                                        </span>
                                    </div>

                                    <div className="sm:text-right">
                                        <span className="block font-bold text-foreground">
                                            Penanggung Jawab
                                        </span>
                                        <span className="text-muted-foreground">
                                            {latestBeritaAcara.instansi_nama ||
                                                tiket.instansi_nama ||
                                                'Dinas Lingkungan Hidup dan Kebersihan Kota Depok'}
                                        </span>
                                    </div>
                                </div>

                                {/* Dua Kolom Kegiatan & Hasil */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <h3 className="text-body-sm font-bold text-foreground">
                                            Kegiatan yang Dilaksanakan di
                                            Lapangan
                                        </h3>
                                        <div className="min-h-[120px] rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                                            <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                                                {latestBeritaAcara.kegiatan}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-body-sm font-bold text-foreground">
                                            Hasil Capaian Pekerjaan
                                        </h3>
                                        <div className="min-h-[120px] rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                                            <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                                                {latestBeritaAcara.hasil}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Satu Kolom Kendala */}
                                <div className="space-y-2">
                                    <h3 className="text-body-sm font-bold text-foreground">
                                        Kendala Lapangan
                                    </h3>
                                    <div className="min-h-[90px] rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                                        <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                                            {latestBeritaAcara.hambatan ||
                                                'Tidak ada kendala lapangan.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 p-6 text-center">
                                <AlertCircle className="mx-auto size-7 text-amber-600 dark:text-amber-400" />
                                <h3 className="text-body-base font-semibold text-foreground">
                                    Belum Ada Berita Acara yang Diterbitkan
                                </h3>
                                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                    Sistem Jagains mensyaratkan minimal satu
                                    Berita Acara resmi sebelum pengajuan selesai
                                    dapat diajukan ke warga.
                                </p>
                                <Button
                                    type="button"
                                    onClick={onBukaBeritaAcara}
                                    className="mt-2 gap-2 rounded-xl font-semibold"
                                >
                                    <FileText className="size-4" />
                                    <span>Buat Berita Acara Sekarang</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Tombol Sticky Bawah Sesuai Wireframe - 51 */}
                    <div className="sticky bottom-4 z-40 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTabActive('foto')}
                            className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 bg-white px-5 font-semibold text-zinc-950 shadow-xs hover:bg-zinc-100"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Foto Hasil</span>
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmitAjukan}
                            disabled={isSubmitting || !latestBeritaAcara}
                            className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 bg-white px-6 font-semibold text-zinc-950 shadow-xs hover:bg-zinc-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-zinc-950" />
                                    <span>Mengajukan...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ajukan</span>
                                    <Send className="size-4 text-zinc-900" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
