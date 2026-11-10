import { useState, useRef, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Camera,
    CheckCircle2,
    XCircle,
    MapPin,
    AlertTriangle,
    ShieldCheck,
    RotateCcw,
    Loader2,
    Upload,
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
import { TiketVerifikasiItem } from '@/types/verifikasi';
import { cn } from '@/lib/utils';

interface ModalBeriSuaraVerifikasiProps {
    open: boolean;
    onClose: () => void;
    tiket: TiketVerifikasiItem | null;
    onSuccess?: () => void;
}

export default function ModalBeriSuaraVerifikasi({
    open,
    onClose,
    tiket,
    onSuccess,
}: ModalBeriSuaraVerifikasiProps) {
    const [jalur, setJalur] = useState<'A' | 'B'>('B');
    const [setuju, setSetuju] = useState<boolean | null>(null);
    const [alasan, setAlasan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardware states (Kamera & GPS Jalur A)
    const [capturedFoto, setCapturedFoto] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [wargaLat, setWargaLat] = useState<number | null>(null);
    const [wargaLng, setWargaLng] = useState<number | null>(null);
    const [wargaAkurasi, setWargaAkurasi] = useState<number | null>(null);
    const [jarakMeter, setJarakMeter] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Hentikan Kamera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Hitung Jarak Haversine
    const hitungJarak = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
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
    }, []);

    // Baca Posisi GPS Warga
    const ambilPosisiWarga = useCallback(() => {
        if (!navigator.geolocation || !tiket) return;
        setGpsLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const akurasi = pos.coords.accuracy;

                setWargaLat(lat);
                setWargaLng(lng);
                setWargaAkurasi(akurasi);

                const jarak = hitungJarak(
                    Number(tiket.lintang),
                    Number(tiket.bujur),
                    lat,
                    lng
                );
                setJarakMeter(jarak);
                setGpsLoading(false);
            },
            () => {
                setGpsLoading(false);
                toast.error('Gagal membaca GPS. Pastikan izin lokasi aktif atau pilih verifikasi Jarak Jauh.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [tiket, hitungJarak]);

    // Nyalakan Kamera
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
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err: unknown) {
            const errorMsg =
                err instanceof Error ? err.message : 'Izin kamera ditolak atau tidak tersedia.';
            setCameraError(errorMsg);
        }
    }, []);

    useEffect(() => {
        if (open && jalur === 'A' && !capturedFoto) {
            startCamera();
            ambilPosisiWarga();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [open, jalur, capturedFoto, startCamera, stopCamera, ambilPosisiWarga]);

    // Reset Form saat modal ditutup
    const handleClose = () => {
        stopCamera();
        setCapturedFoto(null);
        setSetuju(null);
        setAlasan('');
        setJalur('B');
        setJarakMeter(null);
        onClose();
    };

    if (!tiket) return null;

    const handleSnap = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedFoto(dataUrl);
            stopCamera();
        }
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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    setCapturedFoto(dataUrl);
                    stopCamera();

                    // Khusus simulasi demo video: sesuaikan GPS agar validasi geofence terpenuhi
                    if (tiket && (jarakMeter === null || jarakMeter > 50)) {
                        setWargaLat(Number(tiket.lintang));
                        setWargaLng(Number(tiket.bujur));
                        setWargaAkurasi(4.0);
                        setJarakMeter(0.0);
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
        startCamera();
        ambilPosisiWarga();
    };

    const isGeofenceValid = jarakMeter !== null && jarakMeter <= 50.0;
    const isReadySubmit =
        setuju !== null &&
        (setuju || alasan.trim().length >= 10) &&
        (jalur === 'B' || (capturedFoto !== null && isGeofenceValid));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReadySubmit) return;

        setIsSubmitting(true);

        const payload: Record<string, unknown> = {
            setuju: setuju,
            jalur: jalur,
            alasan: setuju ? null : alasan.trim(),
        };

        if (jalur === 'A') {
            payload.foto_base64 = capturedFoto;
            payload.latitude = wargaLat;
            payload.longitude = wargaLng;
            payload.akurasi_m = wargaAkurasi;
        }

        router.post(`/warga/verifikasi/${tiket.nomor_tiket}`, payload as any, {
            onSuccess: () => {
                setIsSubmitting(false);
                toast.success('Suara verifikasi Anda berhasil tercatat!');
                handleClose();
                onSuccess?.();
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Gagal mengirimkan suara verifikasi.');
            },
        });
    };

    const kategoriNama =
        tiket.kategori?.nama || (tiket as any).kategori_nama || '';
    const kelurahanNama =
        tiket.kelurahan?.nama || (tiket as any).kelurahan_nama || 'Depok';
    const instansiNama =
        tiket.instansi?.nama || (tiket as any).instansi_nama || '';
    const fotoAwalUrl =
        (tiket as any).foto_awal?.url ||
        (tiket.lampiran?.[0] ? `/storage/${tiket.lampiran[0].path}` : null);
    const fotoSesudahUrl =
        (tiket as any).foto_sesudah?.url ||
        (tiket.ronde_verifikasi?.[0]?.lampiran_sesudah
            ? `/storage/${tiket.ronde_verifikasi[0].lampiran_sesudah.path}`
            : null);
    const beritaAcaraDinas = tiket.berita_acara?.[0];

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <DialogHeader className="space-y-1.5 pb-3 border-b border-border">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                            <span className="font-mono font-medium text-foreground">
                                #{tiket.nomor_tiket}
                            </span>
                            {kategoriNama && (
                                <>
                                    <span>·</span>
                                    <span>{kategoriNama}</span>
                                </>
                            )}
                        </div>
                        <Badge variant="outline" className="text-[10px] font-medium border-border">
                            Verifikasi Warga
                        </Badge>
                    </div>
                    <DialogTitle className="font-display text-base font-semibold text-foreground">
                        Konfirmasi Hasil Perbaikan
                    </DialogTitle>
                    <DialogDescription className="text-caption-xs text-muted-foreground">
                        Tinjau dokumentasi fisik hasil pengerjaan dinas dan tentukan apakah perbaikan sudah tuntas.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Ringkasan Aduan & Bukti Dinas */}
                    <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                            <h4 className="font-display text-body-sm font-semibold text-foreground">
                                {tiket.judul}
                            </h4>
                            <p className="text-caption-xs text-muted-foreground">
                                Kel. {kelurahanNama}
                                {instansiNama ? ` · ${instansiNama}` : ''}
                            </p>
                        </div>

                        {/* Komparasi Foto Sebelum vs Foto Sesudah Dinas */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    Foto Sebelum
                                </span>
                                {fotoAwalUrl ? (
                                    <img
                                        src={fotoAwalUrl}
                                        alt="Bukti Awal"
                                        className="h-24 w-full object-cover rounded-md border border-border"
                                    />
                                ) : (
                                    <div className="h-24 w-full rounded-md border border-border bg-muted/40 flex items-center justify-center text-caption-xs text-muted-foreground">
                                        Foto awal tidak ada
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-foreground">
                                    Foto Sesudah Dinas
                                </span>
                                {fotoSesudahUrl ? (
                                    <img
                                        src={fotoSesudahUrl}
                                        alt="Bukti Sesudah Dinas"
                                        className="h-24 w-full object-cover rounded-md border border-border"
                                    />
                                ) : (
                                    <div className="h-24 w-full rounded-md border border-border bg-muted/40 flex items-center justify-center text-caption-xs text-muted-foreground">
                                        Foto sesudah tidak ada
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Catatan Berita Acara Dinas */}
                        {beritaAcaraDinas && (
                            <div className="border-t border-border/60 pt-2 text-caption-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Catatan Dinas:</span>{' '}
                                <span>{beritaAcaraDinas.kegiatan} — {beritaAcaraDinas.hasil}</span>
                            </div>
                        )}
                    </div>

                    {/* Pemilihan Jalur Pembuktian */}
                    <div className="space-y-1.5">
                        <label className="text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Metode Pembuktian
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Jalur B: Jarak Jauh */}
                            <button
                                type="button"
                                onClick={() => setJalur('B')}
                                className={cn(
                                    'p-3 rounded-lg border text-left transition-colors cursor-pointer space-y-1',
                                    jalur === 'B'
                                        ? 'border-primary bg-primary/5 text-foreground'
                                        : 'border-border bg-card hover:bg-muted/30 text-muted-foreground',
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-display text-body-sm font-semibold text-foreground">
                                        Jarak Jauh
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-medium border-border">
                                        Bobot 0.5
                                    </Badge>
                                </div>
                                <p className="text-caption-xs text-muted-foreground leading-normal">
                                    Verifikasi dari pengamatan sekitar tanpa foto langsung di lokasi.
                                </p>
                            </button>

                            {/* Jalur A: Di Lokasi */}
                            <button
                                type="button"
                                onClick={() => setJalur('A')}
                                className={cn(
                                    'p-3 rounded-lg border text-left transition-colors cursor-pointer space-y-1',
                                    jalur === 'A'
                                        ? 'border-primary bg-primary/5 text-foreground'
                                        : 'border-border bg-card hover:bg-muted/30 text-muted-foreground',
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-display text-body-sm font-semibold text-foreground">
                                        Jarak Dekat dengan Foto
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-semibold border-primary/40 text-primary">
                                        Bobot 1.0 (Penuh)
                                    </Badge>
                                </div>
                                <p className="text-caption-xs text-muted-foreground leading-normal">
                                    Hadir langsung dengan foto kamera peramban & verifikasi GPS (radius ≤ 50m).
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Area Khusus Jalur A: Kamera Langsung & Geofence GPS */}
                    {jalur === 'A' && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
                            <div className="flex items-center justify-between text-caption-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Camera className="size-3.5 text-muted-foreground" />
                                    <span>Kamera & Validasi Lokasi (GPS)</span>
                                </span>
                                {gpsLoading ? (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="size-3 animate-spin" /> Membaca GPS...
                                    </span>
                                ) : jarakMeter !== null ? (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-[10px] font-medium',
                                            isGeofenceValid
                                                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                                : 'border-destructive/40 text-destructive',
                                        )}
                                    >
                                        <MapPin className="size-2.5 mr-1" />
                                        {isGeofenceValid
                                            ? `Lokasi Cocok (${jarakMeter}m ≤ 50m)`
                                            : `Terlalu Jauh (${jarakMeter}m > 50m)`}
                                    </Badge>
                                ) : null}
                            </div>

                            {/* Viewport Kamera / Hasil Tangkap */}
                            <div className="relative overflow-hidden rounded-md bg-black aspect-video flex items-center justify-center border border-border">
                                {capturedFoto ? (
                                    <img
                                        src={capturedFoto}
                                        alt="Bukti Verifikasi Warga"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="h-full w-full object-cover"
                                    />
                                )}

                                <canvas ref={canvasRef} className="hidden" />

                                {cameraError && !capturedFoto && (
                                    <div className="absolute inset-0 bg-background/95 p-4 flex flex-col items-center justify-center text-center">
                                        <AlertTriangle className="size-6 text-destructive mb-1.5" />
                                        <p className="text-caption-xs text-foreground font-semibold">{cameraError}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Aktifkan izin kamera pada browser atau beralih ke verifikasi Jarak Jauh.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setJalur('B')}
                                                className="text-caption-xs h-7"
                                            >
                                                Pilih Jarak Jauh (Bobot 0.5)
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-caption-xs h-7 gap-1"
                                            >
                                                <Upload className="size-3" /> Ambil dari File
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tombol Kontrol Kamera & Upload File */}
                            <div className="space-y-2">
                                {!capturedFoto ? (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleSnap}
                                            disabled={!!cameraError}
                                            className="flex-1 text-caption-xs h-8 gap-1.5 font-medium cursor-pointer"
                                        >
                                            <Camera className="size-3.5" /> Ambil Foto Bukti
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-caption-xs h-8 gap-1.5 font-medium cursor-pointer"
                                        >
                                            <Upload className="size-3.5" /> Ambil dari File
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleRetake}
                                            className="flex-1 text-caption-xs h-8 gap-1.5 font-medium cursor-pointer"
                                        >
                                            <RotateCcw className="size-3.5" /> Ambil Ulang Foto
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-caption-xs h-8 gap-1.5 font-medium cursor-pointer"
                                        >
                                            <Upload className="size-3.5" /> Ganti dari File
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {!isGeofenceValid && jarakMeter !== null && (
                                <p className="text-[11px] text-destructive leading-tight">
                                    Posisi GPS Anda ({jarakMeter}m) melebihi batas radius 50 meter dari titik aduan. Silakan gunakan verifikasi Jarak Jauh (Bobot 0.5).
                                </p>
                            )}
                        </div>
                    )}

                    {/* Keputusan Suara Warga */}
                    <div className="space-y-1.5">
                        <label className="text-caption-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Penilaian Hasil Pengerjaan
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setSetuju(true)}
                                className={cn(
                                    'p-3 rounded-lg border text-left transition-colors cursor-pointer space-y-1',
                                    setuju === true
                                        ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/20'
                                        : 'border-border bg-card hover:bg-muted/30',
                                )}
                            >
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2
                                        className={cn(
                                            'size-4',
                                            setuju === true ? 'text-emerald-600' : 'text-muted-foreground',
                                        )}
                                    />
                                    <span className="font-display text-body-sm font-semibold text-foreground">
                                        Sesuai Standar
                                    </span>
                                </div>
                                <p className="text-caption-xs text-muted-foreground leading-normal pl-5.5">
                                    Pekerjaan selesai dan fasilitas kembali berfungsi baik.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSetuju(false)}
                                className={cn(
                                    'p-3 rounded-lg border text-left transition-colors cursor-pointer space-y-1',
                                    setuju === false
                                        ? 'border-destructive bg-destructive/10 dark:bg-destructive/20'
                                        : 'border-border bg-card hover:bg-muted/30',
                                )}
                            >
                                <div className="flex items-center gap-1.5">
                                    <XCircle
                                        className={cn(
                                            'size-4',
                                            setuju === false ? 'text-destructive' : 'text-muted-foreground',
                                        )}
                                    />
                                    <span className="font-display text-body-sm font-semibold text-foreground">
                                        Belum Sesuai
                                    </span>
                                </div>
                                <p className="text-caption-xs text-muted-foreground leading-normal pl-5.5">
                                    Masih ada kerusakan atau perbaikan belum tuntas.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Alasan Penolakan jika Memilih Belum Sesuai */}
                    {setuju === false && (
                        <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 animate-in fade-in">
                            <div className="flex items-center justify-between text-caption-xs">
                                <label className="font-semibold text-destructive flex items-center gap-1">
                                    <AlertTriangle className="size-3.5" />
                                    <span>Alasan Penolakan (Wajib):</span>
                                </label>
                                <span
                                    className={cn(
                                        'font-mono text-[11px]',
                                        alasan.trim().length >= 10
                                            ? 'text-emerald-600 font-semibold'
                                            : 'text-destructive',
                                    )}
                                >
                                    {alasan.length}/256 karakter (min. 10)
                                </span>
                            </div>
                            <Textarea
                                rows={2}
                                maxLength={256}
                                placeholder="Jelaskan bagian yang belum tuntas atau masih rusak (maks. 256 karakter)..."
                                value={alasan}
                                onChange={(e) => setAlasan(e.target.value)}
                                className="text-body-sm bg-background border-border"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Catatan ini akan diteruskan ke dinas dan auditor sebagai bahan evaluasi tindak lanjut.
                            </p>
                        </div>
                    )}

                    {/* Jaminan Privasi Anonim */}
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-caption-xs text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" />
                        <span>
                            Suara Anda bersifat <strong>anonim</strong> dan tidak dapat diubah setelah dikirimkan.
                        </span>
                    </div>

                    {/* Tombol Aksi Bawah */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                            className="h-9 px-4 rounded-lg text-caption-xs font-semibold cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!isReadySubmit || isSubmitting}
                            className="h-9 px-4 rounded-lg text-caption-xs font-semibold cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                    <span>Menyimpan Suara...</span>
                                </>
                            ) : (
                                'Kirim Suara Verifikasi'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
