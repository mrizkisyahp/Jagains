import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Camera,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Upload,
    SwitchCamera,
    Flashlight,
    RotateCcw,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface CameraCaptureProps {
    foto: string | null;
    onFotoCaptured: (base64Foto: string) => void;
    onFotoReset: () => void;
    onNextStep?: () => void;
}

export default function CameraCapture({
    foto,
    onFotoCaptured,
    onFotoReset,
    onNextStep,
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const [hasActiveStream, setHasActiveStream] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isLoadingCamera, setIsLoadingCamera] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
        'environment',
    );
    const [isTorchOn, setIsTorchOn] = useState(false);

    /**
     * Menghentikan semua tracks kamera dan melepaskan akses hardware browser.
     */
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch {
                    // Abaikan jika track sudah dihentikan sebelumnya
                }
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setHasActiveStream(false);
        setIsTorchOn(false);
    }, []);

    /**
     * Memulai akses kamera jika tab sedang dilihat dan belum ada foto yang diambil.
     */
    const startCamera = useCallback(
        async (preferredFacing: 'environment' | 'user' = facingMode) => {
            if (streamRef.current && streamRef.current.active) {
                return;
            }
            if (document.hidden || !isMountedRef.current || foto) {
                return;
            }

            setIsLoadingCamera(true);
            setCameraError(null);

            try {
                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {
                    throw new Error(
                        'Peramban Anda tidak mendukung akses kamera langsung.',
                    );
                }

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: preferredFacing },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                if (!isMountedRef.current || document.hidden || foto) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = mediaStream;
                setHasActiveStream(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err: unknown) {
                if (!isMountedRef.current) return;
                const error = err as Error;
                let pesan = 'Izin kamera ditolak atau kamera tidak terdeteksi.';
                if (
                    error.name === 'NotAllowedError' ||
                    error.name === 'PermissionDeniedError'
                ) {
                    pesan =
                        'Izin kamera ditolak. Sesuai ketentuan anti-manipulasi aduan, foto bukti wajib diambil langsung dari kamera gawai. Mohon aktifkan izin kamera pada browser.';
                } else if (error.name === 'NotFoundError') {
                    pesan =
                        'Kamera tidak ditemukan pada perangkat Anda. Silakan buka platform Jagains dari perangkat seluler atau perangkat ber-kamera.';
                }
                setCameraError(pesan);
            } finally {
                if (isMountedRef.current) {
                    setIsLoadingCamera(false);
                }
            }
        },
        [facingMode, foto],
    );

    const toggleFacingMode = async () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        stopCamera();
        await startCamera(nextMode);
    };

    const toggleTorch = async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (!track) return;

        try {
            const capabilities = (
                typeof track.getCapabilities === 'function'
                    ? track.getCapabilities()
                    : {}
            ) as { torch?: boolean };
            if (capabilities && capabilities.torch) {
                const nextTorch = !isTorchOn;
                await (
                    track as unknown as {
                        applyConstraints: (c: unknown) => Promise<void>;
                    }
                ).applyConstraints({
                    advanced: [{ torch: nextTorch }],
                });
                setIsTorchOn(nextTorch);
                toast.success(
                    'Lampu Kilat',
                    nextTorch
                        ? 'Lampu kilat dinyalakan'
                        : 'Lampu kilat dimatikan',
                );
            } else {
                toast.info(
                    'Lampu Kilat / Senter',
                    'Lampu kilat tidak didukung pada kamera perangkat ini.',
                );
            }
        } catch {
            toast.info(
                'Lampu Kilat / Senter',
                'Tidak dapat mengubah pengaturan lampu kilat.',
            );
        }
    };

    const captureSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.85);

        stopCamera();
        onFotoCaptured(base64Data);
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
                    const base64Data = canvas.toDataURL('image/jpeg', 0.85);
                    stopCamera();
                    onFotoCaptured(base64Data);
                }
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleRetake = () => {
        onFotoReset();
    };

    useEffect(() => {
        isMountedRef.current = true;

        if (!foto && !document.hidden) {
            startCamera();
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopCamera();
            } else {
                if (!foto) {
                    startCamera();
                }
            }
        };

        const handlePageHide = () => {
            stopCamera();
        };

        const unregisterInertiaStart = router.on('start', () => {
            stopCamera();
        });

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handlePageHide);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            isMountedRef.current = false;
            unregisterInertiaStart();
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            window.removeEventListener('beforeunload', handlePageHide);
            window.removeEventListener('pagehide', handlePageHide);
            stopCamera();
        };
    }, [foto, startCamera, stopCamera]);

    return (
        <div className="space-y-6">
            {/* Header Bagian Sesuai Wireframe */}
            <div>
                <h2 className="text-title-lg font-display font-bold text-foreground sm:text-display-xs">
                    Ambil Foto Bukti
                </h2>
                <p className="mt-1 text-body-sm text-muted-foreground">
                    Ambil foto bukti dengan menekan tombol kamera
                </p>
            </div>

            {/* Viewfinder Kamera Sesuai Wireframe (Persegi Panjang Hitam + Tombol Vertikal Kanan) */}
            {!foto && !cameraError && (
                <div className="relative flex aspect-[16/10] max-h-[580px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/40 bg-black shadow-md sm:aspect-[16/9]">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="size-full object-cover"
                        onLoadedMetadata={() => {
                            videoRef.current?.play().catch(() => {});
                        }}
                    />

                    {/* State Memuat Aliran Kamera */}
                    {isLoadingCamera && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/80 text-body-sm font-medium text-white">
                            <RefreshCw className="size-5 animate-spin" />
                            <span>Menghubungkan kamera...</span>
                        </div>
                    )}

                    {/* Fallback teks tengah jika kamera belum streaming */}
                    {!hasActiveStream && !isLoadingCamera && (
                        <div className="absolute inset-0 flex items-center justify-center text-title-md font-display font-semibold text-zinc-500">
                            Kamera
                        </div>
                    )}

                    {/* Floating Control Strip Vertikal di Sisi Kanan (Sesuai Wireframe) */}
                    <div className="absolute top-1/2 right-4 z-20 flex -translate-y-1/2 flex-col items-center gap-5 sm:right-6 sm:gap-6">
                        {/* 1. Ikon Atas: Putar / Ganti Kamera Depan/Belakang */}
                        <button
                            type="button"
                            onClick={toggleFacingMode}
                            disabled={isLoadingCamera}
                            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-black/60 active:scale-95 disabled:opacity-40 sm:size-12"
                            title="Putar Kamera (Depan / Belakang)"
                            aria-label="Putar Kamera"
                        >
                            <SwitchCamera className="size-5 sm:size-6" />
                        </button>

                        {/* 2. Tombol Tengah: Shutter Capture Squircle Putih dengan Ikon Kamera */}
                        <button
                            type="button"
                            onClick={captureSnapshot}
                            disabled={isLoadingCamera || !hasActiveStream}
                            className="flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 sm:size-16"
                            title="Ambil Foto Bukti"
                            aria-label="Ambil Foto Bukti"
                        >
                            <Camera className="size-7 text-black sm:size-8" />
                        </button>

                        {/* 3. Ikon Bawah: Flashlight / Senter Gawai */}
                        <button
                            type="button"
                            onClick={toggleTorch}
                            disabled={isLoadingCamera || !hasActiveStream}
                            className={cn(
                                'flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 shadow-md backdrop-blur-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40 sm:size-12',
                                isTorchOn
                                    ? 'bg-amber-400 text-black shadow-lg'
                                    : 'bg-black/40 text-white hover:bg-black/60',
                            )}
                            title="Lampu Kilat / Senter"
                            aria-label="Lampu Kilat / Senter"
                        >
                            <Flashlight className="size-5 sm:size-6" />
                        </button>
                    </div>

                    {/* Alternatif Unggah Berkas di Pojok Kiri Bawah Viewfinder */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-4 left-4 z-20 flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-caption-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white"
                        title="Unggah Foto dari Galeri / Berkas"
                    >
                        <Upload className="size-3.5" />
                        <span>Unggah Foto</span>
                    </button>
                </div>
            )}

            {/* Tampilan Pratinjau Jika Foto Sudah Terambil (Sesuai Wireframe) */}
            {foto && (
                <div className="relative flex aspect-[16/10] max-h-[580px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/40 bg-black shadow-md sm:aspect-[16/9]">
                    <img
                        src={foto}
                        alt="Pratinjau Foto Bukti Kerusakan"
                        className="size-full object-cover"
                    />

                    {/* Alternatif Ganti Berkas di Pojok Kiri Bawah Pratinjau */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-4 left-4 z-20 flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-caption-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white sm:bottom-6 sm:left-6"
                        title="Ganti Foto dari Berkas / Galeri"
                    >
                        <Upload className="size-3.5" />
                        <span>Ganti Berkas</span>
                    </button>

                    {/* Tombol Aksi di Sudut Kanan Bawah Sesuai Wireframe: [ Ambil Ulang ] dan [ Selanjutnya → ] */}
                    <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2.5 sm:right-6 sm:bottom-6 sm:gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleRetake}
                            className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 text-body-sm font-semibold text-zinc-950 shadow-xl transition-transform hover:scale-102 hover:bg-zinc-100 active:scale-98 sm:px-5"
                            title="Ambil Ulang Foto"
                        >
                            <RotateCcw className="size-4 text-zinc-950" />
                            <span>Ambil Ulang</span>
                        </Button>

                        {onNextStep && (
                            <Button
                                type="button"
                                onClick={onNextStep}
                                className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 text-body-sm font-bold text-zinc-950 shadow-xl transition-transform hover:scale-102 hover:bg-zinc-100 active:scale-98 sm:px-6"
                                title="Lanjut ke Titik Lokasi"
                            >
                                <span>Selanjutnya</span>
                                <ArrowRight className="size-4 text-zinc-950" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Alert Error Kamera (Jika Izin Ditolak / Perangkat Tanpa Kamera) */}
            {cameraError && !foto && (
                <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Kamera Tidak Dapat Diakses</AlertTitle>
                    <AlertDescription className="mt-1 space-y-3 text-body-sm">
                        <p>{cameraError}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startCamera()}
                                className="rounded-xl text-caption-xs font-semibold"
                            >
                                Coba Akses Kamera Lagi
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-1.5 rounded-xl text-caption-xs font-semibold"
                            >
                                <Upload className="size-3.5" />
                                <span>Pilih Foto dari Galeri</span>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Input Tersembunyi untuk Pemilihan Berkas & Canvas Snapshot */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
