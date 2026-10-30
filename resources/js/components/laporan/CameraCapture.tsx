import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Camera, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
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
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Foto Bukti Kamera Langsung</h3>
                    <p className="text-xs text-muted-foreground">
                        Wajib diambil langsung dari kamera aplikasi di lokasi kerusakan. Galeri/file upload dilarang (ST-16).
                    </p>
                </div>
                {foto && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="size-3.5" /> Foto Tersimpan
                    </span>
                )}
            </div>

            {/* Viewfinder Kamera Aktif */}
            {!foto && !cameraError && (
                <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-inner">
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

                    {/* Tombol Jepret */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <Button
                            type="button"
                            size="lg"
                            onClick={captureSnapshot}
                            disabled={isLoadingCamera || !hasActiveStream}
                            className="rounded-full shadow-lg h-14 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                            <Camera className="size-5" />
                            Ambil Foto
                        </Button>
                    </div>
                </div>
            )}

            {/* Tampilan Hasil Foto */}
            {foto && (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-border bg-slate-900 aspect-[4/3] flex items-center justify-center">
                        <img
                            src={foto}
                            alt="Pratinjau Foto Kerusakan"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRetake}
                            className="gap-2"
                        >
                            <RefreshCw className="size-4" />
                            Ambil Ulang Foto
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={startCamera}
                            className="mt-2 text-xs"
                        >
                            Coba Akses Kamera Lagi
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Hidden Canvas untuk Snapshot */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
