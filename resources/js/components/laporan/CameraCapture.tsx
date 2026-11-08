import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Camera, RefreshCw, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CameraCaptureProps {
    foto: string | null;
    onFotoCaptured: (base64Foto: string) => void;
    onFotoReset: () => void;
}

export default function CameraCapture({ foto, onFotoCaptured, onFotoReset }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const [hasActiveStream, setHasActiveStream] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isLoadingCamera, setIsLoadingCamera] = useState(false);

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
    }, []);

    /**
     * Memulai akses kamera jika tab sedang dilihat dan belum ada foto yang diambil.
     */
    const startCamera = useCallback(async () => {
        if (streamRef.current && streamRef.current.active) {
            return;
        }
        if (document.hidden || !isMountedRef.current || foto) {
            return;
        }

        setIsLoadingCamera(true);
        setCameraError(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Peramban Anda tidak mendukung akses kamera langsung.');
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' }, // Utamakan kamera belakang pada ponsel
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            // Jika selama proses inisialisasi tab diminimalkan, komponen unmounted, atau foto sudah terisi
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
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                pesan =
                    'Izin kamera ditolak. Sesuai ketentuan anti-manipulasi aduan (FR-LAP-02), foto bukti wajib diambil langsung dari kamera gawai. Mohon aktifkan izin kamera pada browser.';
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
    }, [foto]);

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
                const canvas = canvasRef.current || document.createElement('canvas');
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

        // Inisialisasi awal saat komponen dimuat dan tab sedang aktif
        if (!foto && !document.hidden) {
            startCamera();
        }

        // Hentikan kamera jika tab berpindah atau browser diminimalkan (Page Visibility API)
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

        // Hentikan kamera secara proaktif ketika Inertia SPA mulai berpindah halaman
        const unregisterInertiaStart = router.on('start', () => {
            stopCamera();
        });

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handlePageHide);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            isMountedRef.current = false;
            unregisterInertiaStart();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handlePageHide);
            window.removeEventListener('pagehide', handlePageHide);
            stopCamera();
        };
    }, [foto, startCamera, stopCamera]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="font-display text-body-medium font-bold text-foreground">Foto Bukti Kamera Langsung</h3>
                    <p className="text-body-sm text-muted-foreground mt-0.5">
                        Wajib diambil langsung dari kamera aplikasi di lokasi kerusakan. Galeri/file upload dilarang (ST-16).
                    </p>
                </div>
                {foto && (
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-caption-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Foto Tersimpan
                    </span>
                )}
            </div>

            {/* Viewfinder Kamera Aktif */}
            {!foto && !cameraError && (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-950 aspect-[4/3] max-w-3xl mx-auto flex items-center justify-center shadow-inner">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => {
                            videoRef.current?.play().catch(() => {});
                        }}
                    />

                    {/* Overlay Grid Kamera */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-white" />
                        <div className="border-r border-white" />
                        <div />
                    </div>

                    {/* Tombol Jepret & Ambil dari File */}
                    <div className="absolute bottom-5 inset-x-0 flex flex-wrap justify-center gap-2.5 px-4">
                        <Button
                            type="button"
                            size="lg"
                            onClick={captureSnapshot}
                            disabled={isLoadingCamera || !hasActiveStream}
                            className="rounded-full shadow-xl h-14 px-7 gap-2 font-display font-semibold"
                        >
                            <Camera className="size-5" />
                            Ambil Foto
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full shadow-xl h-14 px-6 gap-2 font-display font-semibold bg-background/90 hover:bg-background text-foreground backdrop-blur-sm border border-border"
                        >
                            <Upload className="size-5" />
                            Ambil dari File
                        </Button>
                    </div>
                </div>
            )}

            {/* Tampilan Hasil Foto */}
            {foto && (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-border bg-slate-900 aspect-[4/3] max-w-3xl mx-auto flex items-center justify-center">
                        <img
                            src={foto}
                            alt="Pratinjau Foto Kerusakan"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-2"
                        >
                            <Upload className="size-4" />
                            Ganti dari File
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRetake}
                            className="gap-2"
                        >
                            <RefreshCw className="size-4" />
                            Ambil Ulang dari Kamera
                        </Button>
                    </div>
                </div>
            )}

            {/* Alert Error Kamera */}
            {cameraError && !foto && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Kamera Tidak Dapat Diakses</AlertTitle>
                    <AlertDescription className="text-xs space-y-2 mt-1">
                        <p>{cameraError}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={startCamera}
                                className="text-xs"
                            >
                                Coba Akses Kamera Lagi
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs gap-1.5"
                            >
                                <Upload className="size-3.5" />
                                Ambil dari File
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Hidden File Input & Canvas untuk Snapshot */}
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
