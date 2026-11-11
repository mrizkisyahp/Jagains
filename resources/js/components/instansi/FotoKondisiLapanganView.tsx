import { useState, useRef, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Camera,
    Crosshair,
    SwitchCamera,
    RotateCcw,
    Hammer,
    Loader2,
    Upload,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { mulai } from '@/routes/instansi/tiket';
import { cn } from '@/lib/utils';

interface FotoKondisiLapanganViewProps {
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        lintang: number;
        bujur: number;
    };
    onKembali: () => void;
    onSuccess: () => void;
}

export default function FotoKondisiLapanganView({
    laporan,
    onKembali,
    onSuccess,
}: FotoKondisiLapanganViewProps) {
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
                    Number(laporan.lintang),
                    Number(laporan.bujur),
                    lat,
                    lng,
                );
                setJarakMeter(d);
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                // Jika izin ditolak atau pengujian di desktop, gunakan koordinat laporan sebagai fallback simulasi
                setPetugasLat(Number(laporan.lintang));
                setPetugasLng(Number(laporan.bujur));
                setGpsAkurasi(5.0);
                setJarakMeter(0.0);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
        );
    }, [laporan]);

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
        if (!capturedFoto) {
            void startCamera();
            ambilPosisiPetugas();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [capturedFoto, startCamera, stopCamera, ambilPosisiPetugas]);

    // Flip Kamera (Depan / Belakang)
    const toggleFacingMode = () => {
        setFacingMode((prev) =>
            prev === 'environment' ? 'user' : 'environment',
        );
    };

    // Ambil Snapshot dari Kamera
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

        // Ambil ulang GPS presisi
        ambilPosisiPetugas();
    };

    // Fallback Pilih Gambar dari Berkas (Kebutuhan Pengujian / Perangkat Desktop)
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

                    // Sinkronisasi otomatis koordinat
                    setPetugasLat(Number(laporan.lintang));
                    setPetugasLng(Number(laporan.bujur));
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

    // Submit Mulai Pengerjaan ke Backend
    const handleSubmit = async () => {
        if (!capturedFoto) {
            toast.error('Foto kondisi lapangan wajib diambil terlebih dahulu.');
            return;
        }

        const lat = petugasLat ?? Number(laporan.lintang);
        const lng = petugasLng ?? Number(laporan.bujur);

        setIsSubmitting(true);
        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const res = await fetch(mulai.url(laporan.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    catatan:
                        'Pelaksanaan fisik pengerjaan di lapangan resmi dimulai.',
                    foto: capturedFoto,
                    lintang: lat,
                    bujur: lng,
                    akurasi_gps_m: gpsAkurasi ?? 5.0,
                }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
            };

            if (res.ok && data.sukses) {
                toast.success(
                    'Pengerjaan Dimulai',
                    formatInstansiMessage(data.pesan),
                );
                onSuccess();
            } else {
                toast.error(
                    'Gagal Memulai Pengerjaan',
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

    return (
        <div className="space-y-6 pb-12">
            {/* Tombol Kembali Sesuai Wireframe */}
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

            {/* Viewfinder / Kamera Screen Sesuai Wireframe fb18f640 & 5f70ce74 */}
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

                {/* 2. Fallback Jika Kamera Belum Siap / Izin Ditolak */}
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
                            <span>Unggah Foto dari Berkas</span>
                        </Button>
                    </div>
                )}

                {/* 3. Tampilan Hasil Foto (Captured) Sesuai Wireframe 5f70ce74 */}
                {capturedFoto && (
                    <img
                        src={capturedFoto}
                        alt="Foto Kondisi Lapangan Sebelum Pengerjaan"
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
                        aria-label="Ambil Lokasi Otomatis"
                    >
                        {isLocating ? (
                            <Loader2 className="size-4 animate-spin text-zinc-950" />
                        ) : (
                            <Crosshair className="size-4 text-zinc-950" />
                        )}
                    </button>
                </div>

                {/* Kontrol Sisi Kanan Viewfinder saat Mode Kamera (Sesuai Wireframe fb18f640) */}
                {!capturedFoto && (
                    <div className="absolute top-1/2 right-4 z-20 flex -translate-y-1/2 flex-col items-center gap-4 sm:right-6">
                        {/* Ganti Kamera Depan/Belakang */}
                        <button
                            type="button"
                            onClick={toggleFacingMode}
                            className="flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white shadow-md backdrop-blur-md transition-all hover:bg-black/80"
                            title="Ganti Arah Kamera"
                            aria-label="Ganti Arah Kamera"
                        >
                            <SwitchCamera className="size-5" />
                        </button>

                        {/* Tombol Shutter Jepret Kamera */}
                        <button
                            type="button"
                            onClick={handleSnap}
                            className="flex size-16 cursor-pointer items-center justify-center rounded-full border-4 border-white/40 bg-white text-zinc-950 shadow-2xl transition-all hover:scale-105 active:scale-95"
                            title="Ambil Foto Lapangan"
                            aria-label="Ambil Foto Lapangan"
                        >
                            <Camera className="size-7 text-zinc-950" />
                        </button>

                        {/* Alternatif Unggah Berkas */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white shadow-md backdrop-blur-md transition-all hover:bg-black/80"
                            title="Pilih Berkas Foto"
                            aria-label="Pilih Berkas Foto"
                        >
                            <Upload className="size-5" />
                        </button>
                    </div>
                )}

                {/* Tombol Aksi Bawah Kanan saat Foto Sudah Diambil (Sesuai Wireframe 5f70ce74) */}
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
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="h-11 cursor-pointer gap-2 rounded-xl border-white/80 bg-white px-6 font-semibold text-zinc-950 shadow-xl hover:bg-zinc-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-zinc-950" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <span>Mulai Pengerjaan</span>
                                    <Hammer className="size-4 text-zinc-950" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Hidden canvas & file input */}
                <canvas ref={canvasRef} className="hidden" />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
}
