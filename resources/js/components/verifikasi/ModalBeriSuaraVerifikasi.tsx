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
    Sparkles,
    Eye,
    Loader2,
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
                toast.error('Gagal membaca GPS. Pastikan izin lokasi aktif atau pilih Jalur B.');
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

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-1 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {tiket.nomor_tiket}
                        </Badge>
                        <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[11px]">
                            Tahap Verifikasi Warga
                        </Badge>
                    </div>
                    <DialogTitle className="font-display text-lg font-bold text-foreground">
                        Konfirmasi Verifikasi Hasil Perbaikan
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Kedaulatan penutupan tiket berada di tangan warga. Tentukan apakah klaim perbaikan dinas sudah sesuai standar atau belum.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-3">
                    {/* Ringkasan Aduan & Bukti Dinas */}
                    <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className="font-display text-sm font-bold text-foreground">{tiket.judul}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tiket.deskripsi}</p>
                            </div>
                            <span className="shrink-0 text-[11px] font-semibold text-primary">
                                Kel. {tiket.kelurahan?.nama}
                            </span>
                        </div>

                        {/* Komparasi Foto Sebelum vs Foto Sesudah Dinas */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                    <Eye className="size-3" /> Foto Kerusakan Awal
                                </span>
                                {tiket.lampiran?.[0] ? (
                                    <img
                                        src={`/storage/${tiket.lampiran[0].path}`}
                                        alt="Bukti Awal"
                                        className="h-28 w-full object-cover rounded-xl border border-border"
                                    />
                                ) : (
                                    <div className="h-28 w-full rounded-xl bg-muted/60 flex items-center justify-center text-[10px] text-muted-foreground">
                                        Foto awal tidak tersedia
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                                    <ShieldCheck className="size-3" /> Foto Selesai Dinas
                                </span>
                                {tiket.ronde_verifikasi?.[0]?.lampiran_sesudah ? (
                                    <img
                                        src={`/storage/${tiket.ronde_verifikasi[0].lampiran_sesudah.path}`}
                                        alt="Bukti Sesudah Dinas"
                                        className="h-28 w-full object-cover rounded-xl border border-primary/30"
                                    />
                                ) : (
                                    <div className="h-28 w-full rounded-xl bg-muted/60 flex items-center justify-center text-[10px] text-muted-foreground">
                                        Foto sesudah tidak tersedia
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Berita Acara Terakhir */}
                        {tiket.berita_acara?.[0] && (
                            <div className="rounded-xl bg-card p-3 border border-border/60 text-xs space-y-1">
                                <p className="font-semibold text-foreground text-[11px]">
                                    Berita Acara Dinas (Versi {tiket.berita_acara[0].versi}):
                                </p>
                                <p className="text-muted-foreground text-[11px] italic">
                                    &ldquo;{tiket.berita_acara[0].kegiatan}. Hasil: {tiket.berita_acara[0].hasil}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pemilihan Jalur Bukti */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground">
                            Pilih Jalur Pembuktian Suara:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setJalur('B')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                    jalur === 'B'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:border-primary/40'
                                }`}
                            >
                                <div className="flex items-center justify-between pb-1">
                                    <span className="font-display text-sm font-bold text-foreground">Jalur B (Jarak Jauh)</span>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        Bobot 0.5
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Verifikasi dari rumah/pengamatan sekitar tanpa perlu memotret di lokasi fisik.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setJalur('A')}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                    jalur === 'A'
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:border-primary/40'
                                }`}
                            >
                                <div className="flex items-center justify-between pb-1">
                                    <span className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="size-3.5 text-primary" /> Jalur A (Di Lokasi)
                                    </span>
                                    <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                                        Bobot 1.0 (Penuh)
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Hadir langsung di lokasi, foto via kamera peramban, dan GPS diverifikasi dalam radius 50m.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Area Khusus Jalur A: Kamera Langsung & Geofence GPS */}
                    {jalur === 'A' && (
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-display text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Camera className="size-4 text-primary" /> Kamera Lapangan & Validasi GPS
                                </span>
                                {gpsLoading ? (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="size-3 animate-spin" /> Membaca GPS...
                                    </span>
                                ) : jarakMeter !== null ? (
                                    <Badge
                                        className={`text-[10px] font-semibold ${
                                            isGeofenceValid
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                                : 'bg-destructive/15 text-destructive border-destructive/30'
                                        }`}
                                    >
                                        <MapPin className="size-3 mr-1" />
                                        {isGeofenceValid
                                            ? `Lokasi Cocok (${jarakMeter}m ≤ 50m)`
                                            : `Terlalu Jauh (${jarakMeter}m > 50m)`}
                                    </Badge>
                                ) : null}
                            </div>

                            {/* Viewport Kamera / Hasil Tangkap */}
                            <div className="relative overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center border border-border">
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
                                    <div className="absolute inset-0 bg-background/90 p-4 flex flex-col items-center justify-center text-center">
                                        <AlertTriangle className="size-8 text-destructive mb-2" />
                                        <p className="text-xs text-foreground font-semibold">{cameraError}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Silakan aktifkan izin kamera atau beralih ke Jalur B.
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setJalur('B')}
                                            className="mt-3 text-xs"
                                        >
                                            Gunakan Jalur B Saja
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Tombol Kontrol Kamera */}
                            <div className="flex items-center justify-between pt-1">
                                {!capturedFoto ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSnap}
                                        disabled={!!cameraError}
                                        className="w-full text-xs gap-1.5"
                                    >
                                        <Camera className="size-3.5" /> Ambil Foto Bukti Lapangan
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="w-full text-xs gap-1.5"
                                    >
                                        <RotateCcw className="size-3.5" /> Foto Ulang
                                    </Button>
                                )}
                            </div>

                            {!isGeofenceValid && jarakMeter !== null && (
                                <p className="text-[11px] text-destructive leading-tight">
                                    Koordinat GPS Anda berada di luar radius toleransi 50 meter dari titik kerusakan. Anda hanya dapat menggunakan Jalur B jika tidak berada di lokasi.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Keputusan Suara Warga */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-foreground">
                            Bagaimana Penilaian Anda atas Hasil Perbaikan?
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setSetuju(true)}
                                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                    setuju === true
                                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                                        : 'border-border/80 bg-card hover:border-emerald-500/40'
                                }`}
                            >
                                <CheckCircle2 className={`size-5 ${setuju === true ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                <span className="font-display text-sm font-bold text-foreground">Perbaikan Sudah Sesuai</span>
                                <span className="text-[10px] text-muted-foreground">Fasilitas publik kembali berfungsi baik</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSetuju(false)}
                                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                    setuju === false
                                        ? 'border-destructive bg-destructive/10 ring-2 ring-destructive/30'
                                        : 'border-border/80 bg-card hover:border-destructive/40'
                                }`}
                            >
                                <XCircle className={`size-5 ${setuju === false ? 'text-destructive' : 'text-muted-foreground'}`} />
                                <span className="font-display text-sm font-bold text-foreground">Belum Sesuai / Rusak</span>
                                <span className="text-[10px] text-muted-foreground">Pekerjaan asal-asalan / belum tuntas</span>
                            </button>
                        </div>
                    </div>

                    {/* Alasan Penolakan jika Memilih Belum Sesuai */}
                    {setuju === false && (
                        <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-destructive flex items-center gap-1">
                                    <AlertTriangle className="size-3.5" /> Uraikan Alasan Penolakan Anda (Wajib):
                                </label>
                                <span
                                    className={`text-[10px] font-mono ${
                                        alasan.trim().length >= 10 ? 'text-emerald-600 font-semibold' : 'text-destructive'
                                    }`}
                                >
                                    {alasan.trim().length} / 10 karakter minimum
                                </span>
                            </div>
                            <Textarea
                                rows={3}
                                placeholder="Contoh: Aspal masih bergelombang dan tipis, lubang di sisi kiri trotoar belum ditambal..."
                                value={alasan}
                                onChange={(e) => setAlasan(e.target.value)}
                                className="text-xs bg-background"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Alasan penolakan Anda akan dipublikasikan secara transparan pada tiket untuk evaluasi dinas & auditor tanpa memuat nama Anda.
                            </p>
                        </div>
                    )}

                    {/* Jaminan Privasi */}
                    <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary shrink-0" />
                        <span>
                            Suara Anda bersifat <strong>rahasia dan anonim</strong>. Identitas Anda tidak pernah ditampilkan pada publikasi hasil voting. Suara yang telah dikirim tidak dapat diubah (AS-01).
                        </span>
                    </div>

                    {/* Tombol Aksi Bawah */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!isReadySubmit || isSubmitting}
                            className="text-xs font-bold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Menyimpan Suara...
                                </>
                            ) : (
                                'Kirim Konfirmasi Suara'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
