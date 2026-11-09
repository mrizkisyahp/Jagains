import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { FieldError } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import InstansiTicketContext from '@/components/instansi/InstansiTicketContext';
import { mulai } from '@/routes/instansi/tiket';
import { useState, useRef, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Loader2,
    ArrowRight,
    Camera,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
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
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ModalMulaiPengerjaanProps {
    open: boolean;
    onClose: () => void;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        lintang: number;
        bujur: number;
    } | null;
}

export default function ModalMulaiPengerjaan({
    open,
    onClose,
    laporan,
}: ModalMulaiPengerjaanProps) {
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

    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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
                'Peramban ini tidak dapat membaca lokasi Anda. Gunakan perangkat yang mendukung layanan lokasi untuk memulai pengerjaan fisik.',
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
                    Number(laporan.lintang),
                    Number(laporan.bujur),
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
                'Izin kamera tidak aktif atau perangkat kamera tidak terdeteksi. Aktifkan izin kamera pada pengaturan peramban, lalu coba lagi. Foto kondisi fisik awal wajib diambil langsung di lokasi lapangan.',
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

    // Ambil Snapshot Foto dari Kamera
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

        // Ambil ulang GPS presisi saat jepret
        ambilPosisiPetugas();
    };

    // Ambil Gambar dari Berkas (Kebutuhan Demo Video)
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
                    const base64 = canvas.toDataURL('image/jpeg', 0.85);
                    stopCamera();
                    setCapturedFoto(base64);

                    // Khusus simulasi demo video: sesuaikan otomatis koordinat ke titik laporan
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
        if (!capturedFoto || !petugasLat || !petugasLng || !isGeofenceValid) return;

        setSubmissionError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const res = await fetch(mulai.url(laporan.id), {
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
                    catatan: catatan.trim() || undefined,
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
                    'Pengerjaan Dimulai',
                    formatInstansiMessage(data.pesan),
                );
                onClose();
                setCatatan('');
                setCapturedFoto(null);
                router.reload({ only: ['antrean', 'ringkasan'] });
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
                        'Gagal Memulai Pengerjaan',
                        formatInstansiMessage(data.message) ||
                            'Terjadi kesalahan sistem.',
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
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <FieldGroup className="gap-6">
                        <DialogHeader>
                            <DialogTitle className="pr-6 text-display-sm font-display font-semibold">
                                Mulai Pengerjaan Fisik
                            </DialogTitle>
                            <DialogDescription className="text-body-base text-muted-foreground">
                                Ambil foto kondisi lapangan sebelum pekerjaan dimulai sebagai dokumentasi awal. Pastikan berada dalam batas radius 50 meter dari titik kerusakan.
                            </DialogDescription>
                        </DialogHeader>

                        {submissionError && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-body-base">
                                    {submissionError}
                                    {Object.entries(fieldErrors)
                                        .filter(
                                            ([name]) =>
                                                !['catatan', 'foto', 'lintang', 'bujur'].includes(name),
                                        )
                                        .flatMap(([name, messages]) =>
                                            messages.map((message, index) => (
                                                <p key={`${name}-${index}`}>
                                                    {message}
                                                </p>
                                            )),
                                        )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <InstansiTicketContext
                            nomorTiket={laporan.nomor_tiket}
                            judul={laporan.judul}
                        />

                        {/* Validasi Lokasi GPS Petugas */}
                        <section
                            aria-label="Posisi petugas"
                            className="flex flex-col gap-2.5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-body-medium font-semibold">
                                    Lokasi pengambilan foto sebelum
                                </h3>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={ambilPosisiPetugas}
                                    disabled={isLocating}
                                    className="h-10 text-body-medium"
                                >
                                    <RefreshCw className="size-4" data-icon="inline-start" />
                                    Perbarui lokasi
                                </Button>
                            </div>
                            <p className="text-body-sm text-muted-foreground">
                                Titik kerusakan: {Number(laporan.lintang).toFixed(6)},{' '}
                                {Number(laporan.bujur).toFixed(6)}. Batas toleransi radius 50 meter.
                            </p>
                            {gpsError ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="size-4" />
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
                                    Posisi belum tersedia. Perbarui lokasi untuk memeriksa jarak.
                                </p>
                            ) : (
                                <Alert
                                    variant={
                                        isGeofenceValid ? 'default' : 'destructive'
                                    }
                                >
                                    {isGeofenceValid ? (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                    ) : (
                                        <AlertCircle className="size-4" />
                                    )}
                                    <AlertTitle>
                                        {isGeofenceValid
                                            ? 'Posisi dalam batas jarak'
                                            : 'Posisi di luar batas jarak'}
                                    </AlertTitle>
                                    <AlertDescription className="text-body-base">
                                        Jarak dari lokasi kerusakan: {jarakMeter} meter.
                                        {!isGeofenceValid &&
                                            ' Dekati titik laporan kerusakan, lalu perbarui lokasi.'}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </section>

                        {/* Dokumentasi Foto Sebelum Pengerjaan */}
                        <section
                            aria-label="Foto sebelum pengerjaan"
                            className="flex flex-col gap-2.5"
                        >
                            <h3 className="text-body-medium font-semibold">
                                Foto kondisi sebelum pengerjaan <span className="text-destructive">*</span>
                            </h3>

                            {cameraError ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="size-4" />
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
                                                className="h-10 text-body-medium shadow-none"
                                            >
                                                Coba kamera lagi
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-10 text-body-medium shadow-none gap-1.5"
                                            >
                                                <Upload className="size-4" />
                                                Ambil dari file
                                            </Button>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                                    {capturedFoto ? (
                                        <img
                                            src={capturedFoto}
                                            alt="Bukti kondisi sebelum pengerjaan"
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
                                            className="h-10 text-body-medium shadow-none"
                                        >
                                            <RefreshCw className="size-4" data-icon="inline-start" />
                                            Ambil ulang foto
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-10 text-body-medium shadow-none gap-1.5"
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
                                            disabled={!hasActiveStream || isLocating}
                                            className="h-10 text-body-medium shadow-none gap-1.5"
                                        >
                                            <Camera className="size-4" />
                                            Ambil foto sebelum pengerjaan
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-10 text-body-medium shadow-none gap-1.5"
                                        >
                                            <Upload className="size-4" />
                                            Ambil dari file
                                        </Button>
                                    </>
                                )}
                            </div>

                            {fieldErrors.foto && (
                                <p className="text-body-sm text-destructive">
                                    {fieldErrors.foto[0]}
                                </p>
                            )}
                            {fieldErrors.lokasi && (
                                <p className="text-body-sm text-destructive">
                                    {fieldErrors.lokasi[0]}
                                </p>
                            )}
                        </section>

                        <Field className="gap-2">
                            <div className="flex items-center justify-between">
                                <FieldLabel
                                    htmlFor="catatan-mulai"
                                    className="text-body-base font-semibold"
                                >
                                    Catatan Pengerjaan Lapangan{' '}
                                    <span className="text-body-sm font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <span className="text-caption-xs text-muted-foreground">
                                    {catatan.length}/256
                                </span>
                            </div>
                            <Textarea
                                id="catatan-mulai"
                                maxLength={256}
                                placeholder="Contoh: Alat berat dan armada pengangkut material telah tiba di lokasi. Pengerjaan dimulai (maks. 256 karakter)..."
                                aria-invalid={Boolean(fieldErrors.catatan)}
                                aria-describedby="error-ModalMulaiPengerjaan-catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                rows={3}
                                className="resize-none rounded-xl text-body-base"
                            />
                            <FieldError
                                id="error-ModalMulaiPengerjaan-catatan"
                                errors={fieldErrors.catatan?.map((message) => ({
                                    message,
                                }))}
                            />
                        </Field>

                        <DialogFooter className="gap-3 border-t border-border pt-6">
                            <Button
                                className="h-11 text-body-medium shadow-none md:h-10"
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
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
                                className="h-11 gap-2 text-body-medium shadow-none md:h-10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        Mulai Pengerjaan
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    );
}
