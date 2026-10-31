import { useState, useRef, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Camera,
    RefreshCw,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    Navigation,
    FileText,
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
import { Badge } from '@/components/ui/badge';
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
}

export default function ModalAjukanSelesai({
    open,
    onClose,
    onOpenBeritaAcara,
    laporan,
}: ModalAjukanSelesaiProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasActiveStream, setHasActiveStream] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [capturedFoto, setCapturedFoto] = useState<string | null>(null);

    // Koordinat GPS Petugas & Validasi Jarak Geofence 50m
    const [petugasLat, setPetugasLat] = useState<number | null>(null);
    const [petugasLng, setPetugasLng] = useState<number | null>(null);
    const [gpsAkurasi, setGpsAkurasi] = useState<number | null>(null);
    const [jarakMeter, setJarakMeter] = useState<number | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Rumus Haversine Distance (Meter)
    const hitungJarakHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
        if (!navigator.geolocation || !laporan) return;

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = Number(pos.coords.latitude.toFixed(6));
                const lng = Number(pos.coords.longitude.toFixed(6));
                const akurasi = Number(pos.coords.accuracy.toFixed(1));

                setPetugasLat(lat);
                setPetugasLng(lng);
                setGpsAkurasi(akurasi);

                const d = hitungJarakHaversine(laporan.lintang, laporan.bujur, lat, lng);
                setJarakMeter(d);
                setIsLocating(false);
            },
            (err) => {
                console.warn('GPS Error:', err);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
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
                'Izin kamera tidak aktif atau perangkat kamera tidak terdeteksi. Sesuai ketentuan anti-manipulasi aduan (FR-TIK-08 & ST-16), foto hasil perbaikan wajib diambil langsung dari kamera di lokasi fisik.'
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
            startCamera();
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

    const handleRetake = () => {
        setCapturedFoto(null);
        startCamera();
        ambilPosisiPetugas();
    };

    const isGeofenceValid = jarakMeter !== null && jarakMeter <= 50.0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!capturedFoto || !petugasLat || !petugasLng || !isGeofenceValid) return;

        if (laporan && laporan.total_berita_acara === 0) {
            toast.error('Berita Acara Diperlukan', 'Harap terbitkan minimal satu Berita Acara pengerjaan sebelum mengajukan penyelesaian fisik.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/instansi/tiket/${laporan.id}/selesai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    foto: capturedFoto,
                    lintang: petugasLat,
                    bujur: petugasLng,
                    akurasi_gps_m: gpsAkurasi,
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                toast.success('Pengajuan Selesai Berhasil', data.pesan);
                onClose();
                setCapturedFoto(null);
                router.reload({ only: ['antrean', 'ringkasan'] });
            } else {
                toast.error('Gagal Mengajukan Selesai', data.message || 'Terjadi kesalahan validasi.');
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[95vh] flex flex-col p-6">
                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-0">
                    <DialogHeader className="shrink-0">
                        <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                            <ShieldCheck className="size-5" />
                        </div>
                        <DialogTitle className="text-body-large font-bold">Ajukan Selesai Fisik (FR-TIK-08)</DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Wajib foto kamera langsung di lokasi fisik dengan verifikasi geofence GPS radius <span className="font-semibold text-foreground">&le; 50 meter</span> dari titik kerusakan awal (Parameter P-12).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        {/* Peringatan jika belum ada Berita Acara */}
                        {laporan.total_berita_acara === 0 && (
                            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200 text-body-sm space-y-2">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-caption-sm text-amber-900 dark:text-amber-300">
                                            Berita Acara Belum Diterbitkan
                                        </p>
                                        <p className="text-caption-xs text-muted-foreground leading-relaxed">
                                            Instansi wajib menerbitkan minimal satu Berita Acara pelaksanaan kerja sebelum mengajukan penyelesaian fisik (FR-TIK-07).
                                        </p>
                                    </div>
                                </div>
                                {onOpenBeritaAcara && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            onClose();
                                            onOpenBeritaAcara();
                                        }}
                                        className="w-full h-8 text-caption-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        <FileText className="size-3.5" />
                                        Buat Berita Acara Sekarang
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Ringkasan Metadata Lokasi Awal */}
                        <div className="p-3 bg-muted/40 rounded-xl border border-border text-body-sm space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-caption-xs text-muted-foreground">Nomor Tiket:</span>
                                <span className="font-mono font-bold text-foreground">{laporan.nomor_tiket}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-caption-xs text-muted-foreground">Koordinat Awal:</span>
                                <span className="font-mono text-caption-xs text-foreground">
                                    {laporan.lintang.toFixed(6)}, {laporan.bujur.toFixed(6)}
                                </span>
                            </div>
                        </div>

                        {/* Indikator Validasi Geofence GPS Lapangan */}
                        <div className="p-3 rounded-xl border space-y-2 transition-colors bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-body-sm font-semibold">
                                    <Navigation className="size-4 text-primary" />
                                    <span>Status Geofence Lokasi (Maks 50m)</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={ambilPosisiPetugas}
                                    disabled={isLocating}
                                    className="h-7 px-2 text-caption-xs gap-1"
                                >
                                    <RefreshCw className={`size-3 ${isLocating ? 'animate-spin' : ''}`} />
                                    Perbarui GPS
                                </Button>
                            </div>

                            {jarakMeter === null ? (
                                <p className="text-caption-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" />
                                    Sedang menyinkronkan koordinat GPS Anda dengan titik laporan...
                                </p>
                            ) : isGeofenceValid ? (
                                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-start gap-2 text-caption-xs">
                                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Lokasi Terverifikasi ({jarakMeter} meter)</p>
                                        <p>Posisi Anda memenuhi syarat geofence (&le; 50m). Bukti foto sah diambil di lokasi fisik.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2 text-caption-xs">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Di Luar Radius Toleransi ({jarakMeter} meter)</p>
                                        <p>
                                            Jarak Anda terlalu jauh dari titik laporan ({jarakMeter}m &gt; 50m). Silakan dekati lokasi fisik kerusakan untuk mengajukan selesai.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Jendela Kamera Langsung / Tampilan Foto Bukti */}
                        <div className="space-y-2">
                            <div className="relative aspect-video bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center border border-border">
                                {capturedFoto ? (
                                    <img src={capturedFoto} alt="Bukti Sesudah Perbaikan" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className={`w-full h-full object-cover ${hasActiveStream ? 'block' : 'hidden'}`}
                                        />
                                        {!hasActiveStream && !cameraError && (
                                            <div className="text-center text-neutral-400 text-body-sm space-y-2">
                                                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                                                <p>Menghubungkan ke kamera gawai...</p>
                                            </div>
                                        )}
                                        {cameraError && (
                                            <div className="p-4 text-center text-destructive text-body-sm space-y-2 max-w-xs">
                                                <AlertCircle className="size-6 mx-auto" />
                                                <p className="text-caption-xs">{cameraError}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="flex justify-center">
                                {capturedFoto ? (
                                    <Button type="button" variant="outline" size="sm" onClick={handleRetake} className="gap-1.5">
                                        <RefreshCw className="size-3.5" />
                                        Ambil Ulang Foto
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSnap}
                                        disabled={!hasActiveStream || isLocating}
                                        className="gap-1.5 font-semibold"
                                    >
                                        <Camera className="size-4" />
                                        Jepret Foto Bukti Sesudah
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border shrink-0">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !capturedFoto || !isGeofenceValid}
                            className="gap-2 font-semibold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Mengajukan...
                                </>
                            ) : (
                                <>
                                    Ajukan Selesai Fisik
                                    <ShieldCheck className="size-4" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
