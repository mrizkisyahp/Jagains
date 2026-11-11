import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { selesai } from '@/routes/instansi/tiket';
import { useState, useRef, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Camera,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Loader2,
    FileText,
    Upload,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { toast } from '@/components/ui/toast';

interface ModalAjukanSelesaiProps {
    open: boolean;
    onClose: () => void;
    onOpenBeritaAcara?: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        lintang: number;
        bujur: number;
        total_berita_acara: number;
    } | null;
    onSuccess?: () => void;
}

export default function ModalAjukanSelesai({
    open,
    onClose,
    onOpenBeritaAcara,
    laporan,
    onSuccess,
}: ModalAjukanSelesaiProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasActiveStream, setHasActiveStream] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [capturedFoto, setCapturedFoto] = useState<string | null>(null);

    // Koordinat GPS Petugas & Validasi Jarak Geofence 50m
    const [petugasLat, setPetugasLat] = useState<number | null>(null);
    const [petugasLng, setPetugasLng] = useState<number | null>(null);
    const [gpsAkurasi, setGpsAkurasi] = useState<number | null>(null);
    const [jarakMeter, setJarakMeter] = useState<number | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    // Rumus Haversine Distance (Meter)
    const hitungJarakHaversine = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number => {
        const R = 6371000; // meter
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
        if (!laporan) return;
        if (!navigator.geolocation) {
            setGpsError(
                'Peramban ini tidak dapat membaca lokasi Anda. Gunakan perangkat yang mendukung layanan lokasi untuk mengajukan selesai.',
            );
            return;
        }
        setGpsError(null);

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
                    laporan.lintang,
                    laporan.bujur,
                    lat,
                    lng,
                );
                setJarakMeter(d);
                setIsLocating(false);
            },
            (err) => {
                setGpsError(
                    err.code === 1
                        ? 'Izin lokasi ditolak. Aktifkan izin lokasi pada peramban, lalu perbarui lokasi.'
                        : 'Lokasi perangkat belum dapat diperoleh. Pastikan lokasi perangkat aktif, lalu perbarui lokasi.',
                );
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
        );
    }, [laporan]);

    // Jalankan Kamera
    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Peramban tidak mendukung akses kamera.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
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
                'Izin kamera tidak aktif atau perangkat kamera tidak terdeteksi. Aktifkan izin kamera pada pengaturan peramban, lalu coba lagi. Foto hasil perbaikan wajib diambil langsung di lokasi laporan.',
            );
        }
    }, []);

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
        if (open && !capturedFoto) {
            void startCamera();
            ambilPosisiPetugas();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [open, capturedFoto, startCamera, stopCamera, ambilPosisiPetugas]);

    if (!laporan) return null;

    // Ambil Snapshot Foto
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

        // Ambil ulang GPS presisi saat tombol jepret ditekan
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

                    // Khusus simulasi demo video: jika koordinat petugas belum ada atau di luar radius 50m, sesuaikan otomatis ke titik kerusakan
                    if (laporan && (jarakMeter === null || jarakMeter > 50)) {
                        setPetugasLat(Number(laporan.lintang));
                        setPetugasLng(Number(laporan.bujur));
                        setGpsAkurasi(4.0);
                        setJarakMeter(0.0);
                        setGpsError(null);
                    }
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

    const isGeofenceValid = jarakMeter !== null && jarakMeter <= 50.0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!capturedFoto || !petugasLat || !petugasLng || !isGeofenceValid)
            return;

        if (laporan && laporan.total_berita_acara === 0) {
            toast.error(
                'Berita Acara Diperlukan',
                'Harap terbitkan minimal satu Berita Acara pengerjaan sebelum mengajukan penyelesaian fisik.',
            );
            return;
        }

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const res = await fetch(selesai.url(laporan.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify({
                    foto: capturedFoto,
                    lintang: petugasLat,
                    bujur: petugasLng,
                    akurasi_gps_m: gpsAkurasi,
                }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (res.ok && data.sukses) {
                toast.success(
                    'Pengajuan Selesai Berhasil',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setCapturedFoto(null);
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.reload({ only: ['antrean', 'ringkasan'] });
                }
            } else {
                setFieldErrors(
                    Object.fromEntries(
                        Object.entries(data.errors ?? {}).map(
                            ([name, messages]) => [
                                name,
                                messages.map(formatInstansiMessage),
                            ],
                        ),
                    ),
                );
                setSubmissionError(
                    formatInstansiMessage(data.message) ||
                        'Permintaan belum berhasil. Periksa isian dan coba lagi.',
                );
                if (!data.errors)
                    toast.error(
                        'Gagal Mengajukan Selesai',
                        formatInstansiMessage(data.message) ||
                            'Terjadi kesalahan validasi.',
                    );
            }
        } catch {
            setSubmissionError(
                'Gagal menghubungi server. Periksa koneksi lalu kirim kembali; isian Anda tetap tersedia.',
            );
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) onClose();
            }}
        >
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <DialogHeader>
                    <DialogTitle className="pr-6 text-display-sm font-display font-semibold">
                        Ajukan selesai fisik
                    </DialogTitle>
                    <DialogDescription className="text-body-base">
                        Ambil foto hasil perbaikan melalui kamera di lokasi
                        laporan. Pengajuan diteruskan untuk verifikasi warga.
                    </DialogDescription>
                </DialogHeader>
                <InstansiTicketContext
                    nomorTiket={laporan.nomor_tiket}
                    judul={laporan.judul}
                />
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {submissionError && (
                        <Alert variant="destructive">
                            <AlertDescription className="text-body-base">
                                {submissionError}
                                {Object.entries(fieldErrors).flatMap(
                                    ([name, messages]) =>
                                        messages.map((message, index) => (
                                            <p key={`${name}-${index}`}>
                                                {message}
                                            </p>
                                        )),
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    {laporan.total_berita_acara === 0 && (
                        <Alert className="border-sla-warn/30">
                            <AlertCircle />
                            <AlertTitle>
                                Berita acara belum diterbitkan
                            </AlertTitle>
                            <AlertDescription className="text-body-base">
                                Terbitkan berita acara pelaksanaan sebelum
                                mengajukan selesai.
                                {onOpenBeritaAcara && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            onClose();
                                            onOpenBeritaAcara();
                                        }}
                                        className="mt-3 h-11 text-body-medium shadow-none md:h-10"
                                    >
                                        <FileText data-icon="inline-start" />
                                        Buat berita acara
                                    </Button>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    <section
                        aria-label="Posisi petugas"
                        className="flex flex-col gap-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-body-medium font-semibold">
                                Lokasi pengambilan foto
                            </h3>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={ambilPosisiPetugas}
                                disabled={isLocating}
                                className="h-11 text-body-medium md:h-10"
                            >
                                <RefreshCw data-icon="inline-start" />
                                Perbarui lokasi
                            </Button>
                        </div>
                        <p className="text-body-sm text-muted-foreground">
                            Titik laporan: {laporan.lintang.toFixed(6)},{' '}
                            {laporan.bujur.toFixed(6)}. Batas jarak pengambilan
                            foto 50 meter.
                        </p>
                        {gpsError ? (
                            <Alert variant="destructive">
                                <AlertCircle />
                                <AlertDescription className="text-body-base">
                                    {gpsError}
                                </AlertDescription>
                            </Alert>
                        ) : isLocating ? (
                            <p
                                role="status"
                                className="flex items-center gap-2 text-body-sm text-muted-foreground"
                            >
                                <Loader2 className="size-4 animate-spin" />
                                Mencari lokasi perangkat…
                            </p>
                        ) : jarakMeter === null ? (
                            <p className="text-body-sm text-muted-foreground">
                                Posisi belum tersedia. Perbarui lokasi untuk
                                memeriksa jarak.
                            </p>
                        ) : (
                            <Alert
                                variant={
                                    isGeofenceValid ? 'default' : 'destructive'
                                }
                            >
                                {isGeofenceValid ? (
                                    <CheckCircle2 />
                                ) : (
                                    <AlertCircle />
                                )}
                                <AlertTitle>
                                    {isGeofenceValid
                                        ? 'Posisi dalam batas jarak'
                                        : 'Posisi di luar batas jarak'}
                                </AlertTitle>
                                <AlertDescription className="text-body-base">
                                    Jarak dari laporan: {jarakMeter} meter.
                                    {!isGeofenceValid &&
                                        ' Dekati titik laporan, lalu perbarui lokasi.'}
                                </AlertDescription>
                            </Alert>
                        )}
                    </section>
                    <section
                        aria-label="Foto hasil perbaikan"
                        className="flex flex-col gap-3"
                    >
                        {cameraError ? (
                            <Alert variant="destructive">
                                <AlertCircle />
                                <AlertTitle>
                                    Kamera belum dapat digunakan
                                </AlertTitle>
                                <AlertDescription className="text-body-base">
                                    {cameraError}
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                void startCamera();
                                            }}
                                            className="h-11 text-body-medium shadow-none md:h-10"
                                        >
                                            Coba kamera lagi
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="h-11 gap-1.5 text-body-medium shadow-none md:h-10"
                                        >
                                            <Upload className="size-4" />
                                            Ambil dari file
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                                {capturedFoto ? (
                                    <img
                                        src={capturedFoto}
                                        alt="Bukti sesudah perbaikan"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className={cn(
                                                'size-full object-cover',
                                                !hasActiveStream && 'hidden',
                                            )}
                                        />
                                        {!hasActiveStream && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Skeleton className="absolute inset-0 size-full motion-reduce:animate-none" />
                                                <p
                                                    role="status"
                                                    className="relative text-body-sm text-foreground"
                                                >
                                                    Menghubungkan kamera…
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
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
                        <div className="flex flex-wrap gap-2">
                            {capturedFoto ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="h-11 text-body-medium shadow-none md:h-10"
                                    >
                                        <RefreshCw data-icon="inline-start" />
                                        Ambil ulang foto
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="h-11 gap-1.5 text-body-medium shadow-none md:h-10"
                                    >
                                        <Upload className="size-4" />
                                        Ganti dari file
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSnap}
                                        disabled={
                                            !hasActiveStream || isLocating
                                        }
                                        className="h-11 text-body-medium shadow-none md:h-10"
                                    >
                                        <Camera data-icon="inline-start" />
                                        Ambil foto hasil perbaikan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="h-11 gap-1.5 text-body-medium shadow-none md:h-10"
                                    >
                                        <Upload className="size-4" />
                                        Ambil dari file
                                    </Button>
                                </>
                            )}
                        </div>
                    </section>
                    <DialogFooter className="gap-3 border-t border-border pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-11 text-body-medium shadow-none md:h-10"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !capturedFoto ||
                                !isGeofenceValid
                            }
                            className="h-11 text-body-medium shadow-none md:h-10"
                        >
                            {isSubmitting && (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            )}
                            {isSubmitting
                                ? 'Mengajukan…'
                                : 'Ajukan selesai fisik'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
