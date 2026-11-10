import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    XCircle,
    MapPin,
    AlertTriangle,
    RotateCcw,
    RotateCw,
    Loader2,
    Upload,
    Maximize2,
    CheckSquare,
    Crosshair,
    ChevronRight,
    ArrowRight,
    Send,
    X,
    Shield,
    MapPinOff,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface VerifikasiProsesPageProps {
    detail: {
        laporan: {
            id: number;
            nomor_tiket: string;
            judul: string;
            keterangan: string;
            status: string;
            lintang: string | number;
            bujur: string | number;
            kelurahan?: { id: number; nama: string; tingkat?: string } | null;
            kategori?: { id: number; nama: string } | null;
            instansi?: { id: number; nama: string; singkatan?: string } | null;
            lampiran?: Array<{
                id: number;
                uuid: string;
                path: string;
                tahap: string;
            }>;
            berita_acara?: Array<{
                id: number;
                versi: number;
                kegiatan?: string;
                hasil?: string;
                hambatan?: string;
                catatan?: string;
                created_at: string;
                instansi?: { id: number; nama: string; singkatan?: string } | null;
            }>;
            ronde_verifikasi?: Array<{
                id: number;
                nomor: number;
                k: number;
                batas_waktu: string;
                lampiran_sesudah?: {
                    id: number;
                    path: string;
                } | null;
            }>;
        };
        ronde_aktif: {
            id: number;
            nomor: number;
            k: number;
            batas_waktu: string;
            lampiran_sesudah?: {
                id: number;
                path: string;
            } | null;
        } | null;
        target_k: number;
        suara_setuju_bobot: number;
        suara_tolak_bobot: number;
        ada_jalur_a_setuju: boolean;
        ada_jalur_a_tolak: boolean;
        sisa_hari: number;
        sudah_memberi_suara: boolean;
        bisa_memberi_suara: boolean;
        alasan_tidak_bisa: string | null;
        suara_user: {
            id?: number;
            setuju: boolean;
            jalur: 'A' | 'B';
            bobot: number;
            alasan: string | null;
            waktu?: string;
        } | null;
        daftar_suara_publik: Array<{
            id: number;
            setuju: boolean;
            jalur: 'A' | 'B';
            bobot: number;
            alasan: string | null;
            lampiran_foto: string | null;
            waktu: string;
        }>;
    };
    from?: string | null;
}

export default function VerifikasiProsesPage({ detail, from }: VerifikasiProsesPageProps) {
    const {
        laporan,
        ronde_aktif,
        target_k,
        suara_setuju_bobot,
        suara_tolak_bobot,
        sudah_memberi_suara,
        bisa_memberi_suara,
        alasan_tidak_bisa,
        suara_user,
        daftar_suara_publik,
    } = detail;

    // Tab halaman utama: 'detail' | 'riwayat'
    const [activeTab, setActiveTab] = useState<'detail' | 'riwayat'>('detail');

    // Deteksi konteks navigasi asal (apakah dari Detail Laporan, Riwayat, atau Verifikasi Kuorum)
    const { url } = usePage();
    const fromParam = useMemo(() => {
        try {
            const parsed = new URL(url, 'http://localhost');
            return parsed.searchParams.get('from');
        } catch {
            return null;
        }
    }, [url]);

    const origin = from || fromParam;
    const isFromVerifikasi = origin === 'verifikasi';
    const isFromRiwayat = origin === 'riwayat';
    const isFromTiket = origin === 'tiket' || (!isFromVerifikasi && !isFromRiwayat);

    const breadcrumbText = isFromVerifikasi
        ? `Warga > Verifikasi > #${laporan.nomor_tiket} > Hasil Pengerjaan`
        : `Warga > Riwayat Laporan > #${laporan.nomor_tiket} > Hasil Pengerjaan`;

    const backButtonLabel = isFromVerifikasi
        ? 'Kembali ke Antrean Verifikasi'
        : isFromRiwayat
        ? 'Kembali ke Riwayat Laporan'
        : `Kembali ke Detail Laporan #${laporan.nomor_tiket}`;

    const handleKembali = () => {
        if (isFromVerifikasi) {
            router.visit('/warga/verifikasi');
            return;
        }
        if (isFromRiwayat) {
            router.visit('/warga/riwayat');
            return;
        }
        router.visit(`/tiket/${laporan.nomor_tiket}`);
    };

    // Zoom foto modal
    const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

    // Modal Verifikasi Hasil Wizard states
    const [modalVerifikasiOpen, setModalVerifikasiOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<'foto' | 'penilaian'>('foto');

    // Form states
    const [jalur, setJalur] = useState<'A' | 'B'>('A');
    const [setuju, setSetuju] = useState<boolean | null>(null);
    const [alasan, setAlasan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardware states (Kamera & GPS Jalur A)
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
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

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

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

    const ambilPosisiWarga = useCallback(() => {
        if (!navigator.geolocation || !laporan) return;
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
                    Number(laporan.lintang),
                    Number(laporan.bujur),
                    lat,
                    lng
                );
                setJarakMeter(jarak);
                setGpsLoading(false);
                if (jarak <= 50.0) {
                    toast.success(`Lokasi GPS cocok (${jarak}m dari aduan).`);
                } else {
                    toast.warning(`Di luar radius (${jarak}m dari lokasi aduan, batas maksimal 50m).`);
                }
            },
            () => {
                setGpsLoading(false);
                toast.error('Gagal membaca GPS. Pastikan izin lokasi aktif atau klik "Lewati Tahap".');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [laporan, hitungJarak]);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Peramban tidak mendukung akses kamera.');
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
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
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err: unknown) {
            const errorMsg =
                err instanceof Error ? err.message : 'Izin kamera ditolak atau tidak tersedia.';
            setCameraError(errorMsg);
        }
    }, [facingMode]);

    useEffect(() => {
        if (
            modalVerifikasiOpen &&
            bisa_memberi_suara &&
            !sudah_memberi_suara &&
            wizardStep === 'foto' &&
            !capturedFoto
        ) {
            // Jika lokasi GPS sudah terdeteksi dan melebihi 50m, jangan nyalakan kamera
            if (jarakMeter !== null && jarakMeter > 50.0) {
                stopCamera();
            } else {
                startCamera();
            }

            if (jarakMeter === null) {
                ambilPosisiWarga();
            }
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [
        modalVerifikasiOpen,
        bisa_memberi_suara,
        sudah_memberi_suara,
        wizardStep,
        capturedFoto,
        facingMode,
        jarakMeter,
        startCamera,
        stopCamera,
        ambilPosisiWarga,
    ]);

    const toggleFacingMode = () => {
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

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
            setJalur('A');
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
                    setJalur('A');
                    stopCamera();

                    if (laporan && (jarakMeter === null || jarakMeter > 50)) {
                        setWargaLat(Number(laporan.lintang));
                        setWargaLng(Number(laporan.bujur));
                        setWargaAkurasi(5.0);
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

    const handleLewatiTahap = () => {
        stopCamera();
        setCapturedFoto(null);
        setJalur('B');
        setWizardStep('penilaian');
    };

    const handleLanjutKePenilaian = () => {
        setJalur('A');
        setWizardStep('penilaian');
    };

    const isGeofenceValid = jarakMeter !== null && jarakMeter <= 50.0;
    
    // Validasi form: jika di luar radius 50m saat Jalur A, kita tawarkan alihkan ke Jalur B
    const isReadySubmit =
        setuju !== null &&
        (setuju || (alasan.trim().length >= 10 && alasan.trim().length <= 256)) &&
        (jalur === 'B' || (capturedFoto !== null && isGeofenceValid));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Jika user masih di Jalur A tapi di luar radius geofence atau belum ada foto, otomatis alihkan ke Jalur B
        let finalJalur = jalur;
        if (finalJalur === 'A' && (!capturedFoto || !isGeofenceValid)) {
            toast.warning(
                !capturedFoto
                    ? 'Tanpa foto bukti langsung, suara Anda dicatat melalui verifikasi Jarak Jauh (Bobot 0.5).'
                    : `Lokasi Anda (${jarakMeter ?? '?'}m) di luar radius 50m. Suara dialihkan ke verifikasi Jarak Jauh (Bobot 0.5).`
            );
            finalJalur = 'B';
            setJalur('B');
        }

        if (setuju === null) {
            toast.error('Silakan tentukan penilaian: Sudah Sesuai atau Tidak Sesuai.');
            return;
        }

        if (setuju === false && alasan.trim().length < 10) {
            toast.error('Alasan penolakan wajib diisi minimal 10 karakter.');
            return;
        }

        setIsSubmitting(true);

        const payload: Record<string, unknown> = {
            setuju: setuju,
            jalur: finalJalur,
            alasan: setuju ? null : alasan.trim(),
            from: origin,
        };

        if (finalJalur === 'A') {
            payload.foto_base64 = capturedFoto;
            payload.latitude = wargaLat;
            payload.longitude = wargaLng;
            payload.akurasi_m = wargaAkurasi;
        }

        const postUrl = origin
            ? `/warga/verifikasi/${laporan.nomor_tiket}?from=${encodeURIComponent(origin)}`
            : `/warga/verifikasi/${laporan.nomor_tiket}`;

        router.post(postUrl, payload as any, {
            onSuccess: () => {
                setIsSubmitting(false);
                setModalVerifikasiOpen(false);
                toast.success('Suara verifikasi Anda berhasil dicatat!');
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Gagal mengirimkan suara verifikasi.');
            },
        });
    };

    const fotoAwal = laporan.lampiran?.find((l) => l.tahap === 'awal')?.path;
    const fotoSesudah =
        ronde_aktif?.lampiran_sesudah?.path ||
        laporan.ronde_verifikasi?.[0]?.lampiran_sesudah?.path;
    const beritaAcaraDinas = laporan.berita_acara?.[0];

    const persentaseKuorum =
        target_k > 0 ? Math.min(100, Math.round((suara_setuju_bobot / target_k) * 100)) : 0;

    const formatTanggal = (dateStr?: string) => {
        if (!dateStr) return '00 Nov 0000';
        try {
            const d = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(d);
        } catch {
            return dateStr;
        }
    };

    const formatWaktuLengkap = (dateStr?: string) => {
        if (!dateStr) return '00 Nov 0000, 00:00';
        try {
            const d = new Date(dateStr);
            const tgl = new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(d);
            const jam = new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).format(d);
            return `${tgl}, ${jam}`;
        } catch {
            return dateStr;
        }
    };

    return (
        <InternalLayout
            title="Detail Hasil Pengerjaan"
            breadcrumb={breadcrumbText}
        >
            <div className="w-full space-y-8 pb-28">
                <Head title={`Hasil Pengerjaan - Jagains`} />

                {/* Navigasi Atas: Tombol Kembali Kontekstual */}
                <div>
                    <button
                        type="button"
                        onClick={handleKembali}
                        className="inline-flex items-center gap-2 text-body-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{backButtonLabel}</span>
                    </button>
                </div>

            {/* Segmented Tabs Kapsul Sesuai Wireframe */}
            <div className="w-full rounded-2xl bg-muted/70 p-1 flex items-center">
                <button
                    type="button"
                    onClick={() => setActiveTab('detail')}
                    className={cn(
                        'flex-1 py-2.5 px-4 rounded-xl text-center text-body-sm font-semibold transition-all cursor-pointer',
                        activeTab === 'detail'
                            ? 'bg-background text-foreground shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    Detail Hasil Pengerjaan
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('riwayat')}
                    className={cn(
                        'flex-1 py-2.5 px-4 rounded-xl text-center text-body-sm font-semibold transition-all cursor-pointer',
                        activeTab === 'riwayat'
                            ? 'bg-background text-foreground shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    Riwayat Verifikasi Warga
                </button>
            </div>

            {/* ===================== TAB 1: DETAIL HASIL PENGERJAAN ===================== */}
            {activeTab === 'detail' && (
                <div className="space-y-8">
                    {/* Bagian 1: Perbandingan Pengerjaan */}
                    <section className="space-y-4">
                        <h2 className="font-display text-display-xs sm:text-display-sm font-bold text-foreground">
                            Perbandingan Pengerjaan
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Card Sebelum */}
                            <div
                                onClick={() => {
                                    if (fotoAwal) {
                                        setPreviewImage({
                                            src: `/storage/${fotoAwal}`,
                                            title: 'Foto Sebelum Pengerjaan',
                                        });
                                    }
                                }}
                                className={cn(
                                    'relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-zinc-950 flex items-center justify-center transition-all shadow-xs',
                                    fotoAwal ? 'cursor-pointer group' : ''
                                )}
                            >
                                {fotoAwal ? (
                                    <>
                                        <img
                                            src={`/storage/${fotoAwal}`}
                                            alt="Foto Sebelum Pengerjaan"
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />
                                        <span className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-3 py-1 text-caption-xs font-bold text-white backdrop-blur-xs">
                                            Sebelum
                                        </span>
                                        <div className="absolute top-3 right-3 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                                            <Maximize2 className="size-4" />
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-body-base sm:text-body-lg font-semibold text-zinc-400">
                                        Sebelum
                                    </span>
                                )}
                            </div>

                            {/* Card Sesudah */}
                            <div
                                onClick={() => {
                                    if (fotoSesudah) {
                                        setPreviewImage({
                                            src: `/storage/${fotoSesudah}`,
                                            title: 'Foto Sesudah Pengerjaan',
                                        });
                                    }
                                }}
                                className={cn(
                                    'relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-zinc-950 flex items-center justify-center transition-all shadow-xs',
                                    fotoSesudah ? 'cursor-pointer group' : ''
                                )}
                            >
                                {fotoSesudah ? (
                                    <>
                                        <img
                                            src={`/storage/${fotoSesudah}`}
                                            alt="Foto Sesudah Pengerjaan"
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />
                                        <span className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-3 py-1 text-caption-xs font-bold text-white backdrop-blur-xs">
                                            Sesudah
                                        </span>
                                        <div className="absolute top-3 right-3 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                                            <Maximize2 className="size-4" />
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-body-base sm:text-body-lg font-semibold text-zinc-400">
                                        Sesudah
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Bagian 2: Berita Acara */}
                    <section className="space-y-6 pt-2">
                        {/* Header Berita Acara & Versi */}
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-display-xs sm:text-display-sm font-bold text-foreground">
                                Berita Acara
                            </h2>
                            {beritaAcaraDinas && (
                                <span className="text-body-sm font-semibold text-muted-foreground">
                                    Versi {beritaAcaraDinas.versi}
                                </span>
                            )}
                        </div>

                        {beritaAcaraDinas ? (
                            <>
                                {/* Baris 1: Tanggal Pelaksanaan & Penanggung Jawab */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-start">
                                    <div>
                                        <h4 className="text-body-sm sm:text-body-base font-bold text-foreground">
                                            Tanggal Pelaksanaan
                                        </h4>
                                        <p className="text-body-sm sm:text-body-base text-muted-foreground mt-1">
                                            {formatTanggal(beritaAcaraDinas.created_at)}
                                        </p>
                                    </div>
                                    <div className="md:text-right">
                                        <h4 className="text-body-sm sm:text-body-base font-bold text-foreground">
                                            Penanggung Jawab
                                        </h4>
                                        <p className="text-body-sm sm:text-body-base text-muted-foreground mt-1">
                                            {beritaAcaraDinas.instansi?.nama ||
                                                laporan.instansi?.nama ||
                                                'Dinas Penanggung Jawab'}
                                        </p>
                                    </div>
                                </div>

                                {/* Baris 2: Kegiatan & Hasil Capaian */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-start">
                                    <div>
                                        <h4 className="text-body-sm sm:text-body-base font-bold text-foreground">
                                            Kegiatan yang Dilaksanakan di Lapangan
                                        </h4>
                                        <p className="text-body-sm leading-relaxed text-muted-foreground mt-2 whitespace-pre-line">
                                            {beritaAcaraDinas.kegiatan ||
                                                'Pekerjaan penanganan fisik sarana dan prasarana umum.'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-body-sm sm:text-body-base font-bold text-foreground">
                                            Hasil Capaian Pekerjaan
                                        </h4>
                                        <p className="text-body-sm leading-relaxed text-muted-foreground mt-2 whitespace-pre-line">
                                            {beritaAcaraDinas.hasil ||
                                                'Perbaikan fisik selesai dan siap diverifikasi oleh warga.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Baris 3: Kendala Lapangan */}
                                <div>
                                    <h4 className="text-body-sm sm:text-body-base font-bold text-foreground">
                                        Kendala Lapangan
                                    </h4>
                                    <p className="text-body-sm leading-relaxed text-muted-foreground mt-2 whitespace-pre-line">
                                        {beritaAcaraDinas.hambatan ||
                                            beritaAcaraDinas.catatan ||
                                            'Tidak ada kendala lapangan yang dilaporkan.'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center space-y-1.5">
                                <p className="text-body-sm font-semibold text-foreground">
                                    Belum Ada Dokumen Berita Acara
                                </p>
                                <p className="text-caption-xs text-muted-foreground">
                                    Dinas pelaksana ({laporan.instansi?.nama || 'terkait'}) belum menerbitkan lembar Berita Acara untuk pengerjaan ini.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* ===================== TAB 2: RIWAYAT VERIFIKASI WARGA ===================== */}
            {activeTab === 'riwayat' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Kolom Kiri: Daftar Verifikasi (lg:col-span-8) */}
                    <div className="lg:col-span-8 space-y-4">
                        <h2 className="font-display text-display-xs sm:text-display-sm font-bold text-foreground">
                            Daftar Verifikasi
                        </h2>

                        {daftar_suara_publik && daftar_suara_publik.length > 0 ? (
                            <div className="space-y-3">
                                {daftar_suara_publik.map((suara, idx) => (
                                    <div
                                        key={suara.id}
                                        className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 flex items-center justify-between gap-4 shadow-2xs transition-all hover:border-border"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            {/* Thumbnail Foto / Kotak Gelap */}
                                            <div
                                                onClick={() => {
                                                    if (suara.lampiran_foto) {
                                                        setPreviewImage({
                                                            src: suara.lampiran_foto,
                                                            title: `Foto Verifikasi Warga #${idx + 1}`,
                                                        });
                                                    }
                                                }}
                                                className={cn(
                                                    'size-14 sm:size-16 rounded-xl bg-zinc-950 flex-shrink-0 flex items-center justify-center overflow-hidden border border-border/60',
                                                    suara.lampiran_foto ? 'cursor-pointer hover:opacity-90' : ''
                                                )}
                                            >
                                                {suara.lampiran_foto ? (
                                                    <img
                                                        src={suara.lampiran_foto}
                                                        alt={`Foto Warga #${idx + 1}`}
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="size-full bg-zinc-950" />
                                                )}
                                            </div>

                                            {/* Info Identitas Anonim & Waktu */}
                                            <div className="min-w-0">
                                                <h4 className="font-display text-body-sm sm:text-body-base font-bold text-foreground">
                                                    Warga #{idx + 1}
                                                </h4>
                                                <p className="text-caption-xs text-muted-foreground mt-0.5">
                                                    Waktu: {formatWaktuLengkap(suara.waktu)}
                                                </p>
                                                {suara.alasan && (
                                                    <p className="text-caption-xs italic text-muted-foreground mt-1 line-clamp-1">
                                                        &quot;{suara.alasan}&quot;
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Penilaian di Kanan */}
                                        <div className="flex-shrink-0">
                                            {suara.setuju ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3.5 py-1.5 text-caption-xs font-semibold text-foreground">
                                                    <span>Sudah Sesuai</span>
                                                    <CheckCircle2 className="size-3.5 text-foreground" />
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3.5 py-1.5 text-caption-xs font-semibold text-destructive">
                                                    <span>Belum Sesuai</span>
                                                    <XCircle className="size-3.5 text-destructive" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* State Kosong */
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
                                <h3 className="font-display text-body-base font-bold text-foreground">
                                    Belum Ada Verifikasi Warga
                                </h3>
                                <p className="text-caption-xs text-muted-foreground max-w-sm mx-auto">
                                    Belum ada suara verifikasi warga yang masuk untuk tiket ini.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Kolom Kanan: Card Capaian Kuorum (lg:col-span-4) */}
                    <div className="lg:col-span-4 sticky top-6">
                        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6 shadow-xs">
                            {/* Baris Atas: Donut Chart & Statistik Pemilih */}
                            <div className="flex items-center gap-5">
                                {/* Circular Progress Indicator */}
                                <div className="relative size-24 shrink-0 flex items-center justify-center">
                                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            className="stroke-muted"
                                            strokeWidth="12"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            className="stroke-foreground"
                                            strokeWidth="12"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={
                                                251.2 - (251.2 * Math.min(100, persentaseKuorum)) / 100
                                            }
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-body-sm font-bold text-foreground">
                                        {persentaseKuorum}%
                                    </div>
                                </div>

                                {/* Statistik Angka */}
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div>
                                        <span className="block text-caption-xs font-bold text-foreground">
                                            Total Pemilih
                                        </span>
                                        <span className="text-body-sm font-semibold text-muted-foreground">
                                            {daftar_suara_publik?.length ?? 0} Suara
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="block text-caption-xs font-bold text-foreground">
                                                Setuju
                                            </span>
                                            <span className="text-caption-xs sm:text-body-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                +{suara_setuju_bobot}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-caption-xs font-bold text-foreground">
                                                Tidak Setuju
                                            </span>
                                            <span className="text-caption-xs sm:text-body-sm font-semibold text-destructive">
                                                -{suara_tolak_bobot}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Garis Pemisah */}
                            <div className="border-t border-border/70" />

                            {/* Bagian Bawah: Capaian Kuorum */}
                            <div className="space-y-3">
                                <h3 className="font-display text-body-sm font-bold text-foreground">
                                    Capaian Kuorum
                                </h3>

                                <div className="flex items-center justify-between gap-2 text-caption-xs">
                                    <span className="rounded-full bg-muted/80 px-3 py-1 font-semibold text-muted-foreground">
                                        {persentaseKuorum >= 100 ? 'Kuorum Tercapai' : 'Sedang Berlangsung'}
                                    </span>
                                    <span className="text-muted-foreground font-medium">
                                        Batas Akhir: {formatTanggal(ronde_aktif?.batas_waktu)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== FLOATING ACTION BUTTON (KANAN BAWAH) ===================== */}
            <div className="fixed bottom-6 right-6 sm:right-10 z-30">
                <Button
                    type="button"
                    onClick={() => {
                        setWizardStep('foto');
                        setModalVerifikasiOpen(true);
                    }}
                    className="h-12 px-5 sm:px-6 rounded-2xl bg-background border border-border text-foreground hover:bg-muted shadow-lg hover:shadow-xl font-bold text-body-sm gap-2.5 cursor-pointer transition-all"
                >
                    <span>{sudah_memberi_suara ? 'Suara Anda Telah Dicatat' : 'Verifikasi Hasil'}</span>
                    <CheckSquare className="size-4 text-foreground" />
                </Button>
            </div>

            {/* ===================== MODAL VERIFIKASI HASIL (CARD WIZARD 2 TAHAP) ===================== */}
            <Dialog open={modalVerifikasiOpen} onOpenChange={setModalVerifikasiOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="w-[calc(100vw-2rem)] sm:w-[760px] sm:max-w-[760px] p-6 sm:p-8 rounded-3xl bg-background border border-border/80 shadow-2xl transition-all duration-200"
                >
                    {/* Header: Tombol Tutup di Kiri Atas */}
                    <div>
                        <button
                            type="button"
                            onClick={() => {
                                stopCamera();
                                setModalVerifikasiOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <X className="size-4" />
                            <span>Tutup</span>
                        </button>
                    </div>

                    <DialogHeader className="p-0">
                        <DialogTitle className="font-display text-display-xs sm:text-display-sm font-bold text-foreground text-left">
                            Verifikasi Hasil
                        </DialogTitle>
                    </DialogHeader>

                    {/* Jika Sudah Memberikan Suara */}
                    {sudah_memberi_suara ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2 mt-2">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-body-base">
                                <CheckCircle2 className="size-5" />
                                <span>Anda Sudah Memberikan Suara untuk Tiket Ini</span>
                            </div>
                            <p className="text-body-sm text-foreground/80 leading-relaxed">
                                Pilihan Anda:{' '}
                                <strong>
                                    {suara_user?.setuju ? '✓ Setuju (Sudah Sesuai)' : '✕ Menolak (Tidak Sesuai)'}
                                </strong>{' '}
                                melalui metode <strong>{suara_user?.jalur === 'A' ? 'Jarak Dekat dengan Foto' : 'Jarak Jauh'}</strong> (Bobot {suara_user?.bobot}).
                                {suara_user?.alasan && (
                                    <span className="block mt-1 italic text-muted-foreground">
                                        &quot;{suara_user.alasan}&quot;
                                    </span>
                                )}
                            </p>
                        </div>
                    ) : !bisa_memberi_suara ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2 mt-2">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-body-base">
                                <AlertTriangle className="size-5" />
                                <span>Tidak Dapat Memberikan Suara</span>
                            </div>
                            <p className="text-body-sm text-foreground/80 leading-relaxed">
                                {alasan_tidak_bisa ?? 'Anda tidak memenuhi kriteria untuk memberikan suara pada tiket ini.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5 w-full">
                            {/* Stepper / Segmented Tabs di Dalam Card Modal */}
                            <div className="w-full rounded-2xl bg-muted/80 p-1 flex items-center">
                                <button
                                    type="button"
                                    onClick={() => setWizardStep('foto')}
                                    className={cn(
                                        'flex-1 py-2 px-3 rounded-xl text-center text-body-sm font-semibold transition-all cursor-pointer',
                                        wizardStep === 'foto'
                                            ? 'bg-background text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Foto Bukti Hasil (Opsional)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWizardStep('penilaian')}
                                    className={cn(
                                        'flex-1 py-2 px-3 rounded-xl text-center text-body-sm font-semibold transition-all cursor-pointer',
                                        wizardStep === 'penilaian'
                                            ? 'bg-background text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Penilaian Pengerjaan
                                </button>
                            </div>

                            {/* TAHAP 1: FOTO BUKTI HASIL (OPSIONAL) */}
                            {wizardStep === 'foto' && (
                                <div className="space-y-4">
                                    <p className="text-body-sm text-muted-foreground leading-relaxed">
                                        Foto hasil yang Kamu temui sebagai bukti verifikasi. Kamu dapat melewati tahapan ini, dengan catatan bobot verifikasimu akan berkurang
                                    </p>

                                    {capturedFoto ? (
                                        /* Foto Terambil (Wireframe 2) */
                                        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 border border-border/80 flex items-center justify-center">
                                            <img
                                                src={capturedFoto}
                                                alt="Foto Hasil Bukti"
                                                className="size-full object-cover"
                                            />
                                            {/* Tombol Ambil Ulang & Selanjutnya di Kanan Bawah */}
                                            <div className="absolute bottom-4 right-4 sm:right-5 flex items-center gap-2.5">
                                                <Button
                                                    type="button"
                                                    onClick={handleRetake}
                                                    className="h-10 px-4 rounded-xl bg-background border border-border text-foreground hover:bg-muted font-semibold text-body-sm gap-2 shadow-md cursor-pointer"
                                                >
                                                    <RotateCcw className="size-4" />
                                                    <span>Ambil Ulang</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handleLanjutKePenilaian}
                                                    className="h-10 px-4 rounded-xl bg-background border border-border text-foreground hover:bg-muted font-semibold text-body-sm gap-2 shadow-md cursor-pointer"
                                                >
                                                    <span>Selanjutnya</span>
                                                    <ArrowRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : jarakMeter !== null && !isGeofenceValid ? (
                                        /* Kondisi GPS Melebihi Batas: Card peringatan proporsional, kamera TIDAK dinyalakan & tanpa box 16:9 hitam */
                                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="size-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                                                    <MapPinOff className="size-5" />
                                                </div>
                                                <div className="space-y-1.5 flex-1">
                                                    <h4 className="font-bold text-body-base text-amber-900 dark:text-amber-200">
                                                        Radius GPS Melebihi Batas ({jarakMeter} meter dari lokasi aduan)
                                                    </h4>
                                                    <p className="text-body-sm text-foreground/80 leading-relaxed">
                                                        Verifikasi jarak dekat dengan foto (Bobot 1.0) memerlukan jarak maksimal 50 meter dari lokasi aduan. Kamera tidak diaktifkan karena Anda berada di luar radius. Anda dapat memperbarui lokasi GPS atau lanjut ke <strong>Verifikasi Jarak Jauh (Bobot 0.5)</strong> tanpa foto.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-amber-500/20">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={ambilPosisiWarga}
                                                    disabled={gpsLoading}
                                                    className="rounded-xl h-10 px-4 text-body-sm font-semibold gap-2 border-border/80 cursor-pointer"
                                                >
                                                    {gpsLoading ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <Crosshair className="size-4" />
                                                    )}
                                                    <span>{gpsLoading ? 'Mendeteksi GPS...' : 'Perbarui Lokasi GPS'}</span>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    onClick={handleLewatiTahap}
                                                    className="rounded-xl h-10 px-5 text-body-sm font-bold bg-foreground text-background hover:bg-foreground/90 gap-2 cursor-pointer shadow-xs"
                                                >
                                                    <span>Lanjut ke Verifikasi Jarak Jauh (Bobot 0.5)</span>
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Live Viewfinder Kamera (Wireframe 1) - Aktif saat dalam radius atau GPS masih proses deteksi */
                                        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 border border-border/80 flex items-center justify-center">
                                            <video
                                                ref={videoRef}
                                                playsInline
                                                muted
                                                className="size-full object-cover"
                                            />

                                            {/* Status Teks Lokasi di Bagian Atas Viewfinder */}
                                            <div className="absolute top-4 left-4 right-16 text-center pointer-events-none">
                                                <p
                                                    className={cn(
                                                        'text-caption-xs sm:text-body-xs px-3 py-1.5 rounded-xl backdrop-blur-xs inline-block max-w-md font-medium',
                                                        isGeofenceValid
                                                            ? 'text-white bg-emerald-700/80'
                                                            : 'text-white/90 bg-black/60'
                                                    )}
                                                >
                                                    {gpsLoading
                                                        ? 'Mencari koordinat lokasi GPS...'
                                                        : isGeofenceValid
                                                        ? `✓ Lokasi GPS terverifikasi (${jarakMeter}m dari aduan)`
                                                        : 'Lokasi tidak terdeteksi, tidak dapat mengambil foto. Tekan tombol di samping untuk mengambil lokasi secara otomatis'}
                                                </p>
                                            </div>

                                            {cameraError && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/85 text-white space-y-2">
                                                    <AlertTriangle className="size-7 text-amber-400" />
                                                    <p className="text-caption-xs text-muted-foreground max-w-sm">
                                                        {cameraError}
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={startCamera}
                                                        className="text-caption-xs gap-1 rounded-xl"
                                                    >
                                                        <RotateCcw className="size-3" /> Coba Nyalakan
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Control Bar Strip di Sisi Kanan Viewfinder Sesuai Wireframe */}
                                            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-10">
                                                {/* Tombol Ambil Lokasi GPS (Crosshair) */}
                                                <button
                                                    type="button"
                                                    onClick={ambilPosisiWarga}
                                                    disabled={gpsLoading}
                                                    title="Ambil Lokasi Otomatis"
                                                    className={cn(
                                                        'size-10 rounded-full flex items-center justify-center transition-all cursor-pointer',
                                                        isGeofenceValid
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-white text-black hover:bg-white/90'
                                                    )}
                                                >
                                                    {gpsLoading ? (
                                                        <Loader2 className="size-5 animate-spin text-black" />
                                                    ) : (
                                                        <Crosshair className="size-5" />
                                                    )}
                                                </button>

                                                {/* Tombol Ganti Kamera Depan/Belakang */}
                                                <button
                                                    type="button"
                                                    onClick={toggleFacingMode}
                                                    title="Putar Kamera"
                                                    className="size-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                                                >
                                                    <RotateCw className="size-5" />
                                                </button>

                                                {/* Tombol Shutter Ambil Foto (Kamera) */}
                                                <button
                                                    type="button"
                                                    onClick={handleSnap}
                                                    disabled={Boolean(cameraError)}
                                                    title="Jepret Foto"
                                                    className="size-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    <Camera className="size-6" />
                                                </button>

                                                {/* Tombol Cadangan Unggah File */}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    title="Unggah Foto dari Galeri"
                                                    className="size-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                                                >
                                                    <Upload className="size-4" />
                                                </button>
                                            </div>

                                            {/* Tombol Lewati Tahap di Kanan Bawah Sesuai Wireframe */}
                                            <div className="absolute bottom-4 right-4 sm:right-5">
                                                <Button
                                                    type="button"
                                                    onClick={handleLewatiTahap}
                                                    className="h-10 px-4 rounded-xl bg-background border border-border text-foreground hover:bg-muted font-semibold text-body-sm gap-2 shadow-md cursor-pointer"
                                                >
                                                    <span>Lewati Tahap</span>
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAHAP 2: PENILAIAN PENGERJAAN (Wireframe 3) */}
                            {wizardStep === 'penilaian' && (
                                <form onSubmit={handleSubmit} className="space-y-6 w-full">
                                    <div>
                                        <h3 className="font-display text-body-base sm:text-body-lg font-bold text-foreground">
                                            Apakah Pengerjaan Sudah Sesuai?
                                        </h3>
                                    </div>

                                    {/* Dua Pilihan Card: Sudah Sesuai vs Tidak Sesuai */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Opsi Sudah Sesuai */}
                                        <div
                                            onClick={() => setSetuju(true)}
                                            className={cn(
                                                'cursor-pointer rounded-2xl border-2 p-5 sm:p-6 space-y-3 transition-all h-full min-h-[140px] flex flex-col justify-start',
                                                setuju === true
                                                    ? 'border-foreground bg-muted/30 shadow-xs'
                                                    : 'border-transparent bg-muted/40 hover:bg-muted/60'
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <CheckCircle2 className="size-7 text-foreground" />
                                                <h4 className="font-display text-body-base sm:text-body-lg font-bold text-foreground">
                                                    Sudah Sesuai
                                                </h4>
                                            </div>
                                            <p className="text-body-sm text-muted-foreground leading-relaxed">
                                                Pekerjaan selesai dan fasilitas kembali berfungsi baik.
                                            </p>
                                        </div>

                                        {/* Opsi Tidak Sesuai */}
                                        <div
                                            onClick={() => setSetuju(false)}
                                            className={cn(
                                                'cursor-pointer rounded-2xl border-2 p-5 sm:p-6 space-y-3 transition-all h-full min-h-[140px] flex flex-col justify-start',
                                                setuju === false
                                                    ? 'border-destructive bg-destructive/10 shadow-xs'
                                                    : 'border-transparent bg-muted/40 hover:bg-muted/60'
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 text-foreground">
                                                <XCircle className="size-7" />
                                                <h4 className="font-display text-body-base sm:text-body-lg font-bold text-foreground">
                                                    Tidak Sesuai
                                                </h4>
                                            </div>
                                            <p className="text-body-sm text-muted-foreground leading-relaxed">
                                                Masih ada kerusakan atau perbaikan belum tuntas.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Input Alasan jika Tidak Sesuai */}
                                    {setuju === false && (
                                        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 space-y-2">
                                            <label className="text-caption-xs font-bold text-foreground flex items-center justify-between">
                                                <span>Alasan Penolakan (Wajib Diisi)</span>
                                                <span
                                                    className={cn(
                                                        'text-[11px] font-mono',
                                                        alasan.trim().length >= 10 && alasan.trim().length <= 256
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-destructive font-bold'
                                                    )}
                                                >
                                                    Min. 10 karakter ({alasan.trim().length}/256)
                                                </span>
                                            </label>
                                            <Textarea
                                                rows={3}
                                                placeholder="Jelaskan secara spesifik kerusakan fisik yang masih tersisa..."
                                                value={alasan}
                                                onChange={(e) => setAlasan(e.target.value)}
                                                maxLength={256}
                                                className="resize-none bg-background text-body-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Informasi & Penanganan Status Radius GPS Langsung di Card */}
                                    {jalur === 'A' && !isGeofenceValid ? (
                                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <div className="space-y-1 text-caption-xs sm:text-body-sm flex-1">
                                                    <p className="font-bold text-amber-800 dark:text-amber-300">
                                                        {jarakMeter !== null
                                                            ? `Lokasi GPS Melebihi Radius (${jarakMeter}m dari lokasi aduan)`
                                                            : 'Koordinat Lokasi GPS Belum Terverifikasi'}
                                                    </p>
                                                    <p className="text-muted-foreground leading-relaxed">
                                                        Verifikasi jarak dekat dengan foto (Bobot 1.0) memerlukan jarak maksimal 50 meter. Anda dapat beralih ke <strong>Verifikasi Jarak Jauh (Bobot 0.5)</strong> agar suara Anda dapat langsung dikirimkan sekarang.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setWizardStep('foto');
                                                        handleRetake();
                                                    }}
                                                    className="rounded-xl text-caption-xs h-8 gap-1.5 cursor-pointer"
                                                >
                                                    <RotateCcw className="size-3" />
                                                    <span>Cek GPS Lagi</span>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        setJalur('B');
                                                        toast.info('Beralih ke verifikasi Jarak Jauh (Bobot 0.5).');
                                                    }}
                                                    className="rounded-xl text-caption-xs font-bold h-8 bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <span>Alihkan ke Verifikasi Jarak Jauh (Bobot 0.5)</span>
                                                    <ArrowRight className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : jalur === 'B' ? (
                                        <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-2.5 flex items-center justify-between text-caption-xs text-muted-foreground">
                                            <span className="flex items-center gap-2">
                                                <Shield className="size-3.5 text-primary" />
                                                <span>Metode Verifikasi: <strong>Jarak Jauh</strong></span>
                                            </span>
                                            <span className="font-semibold text-foreground">Bobot: 0.5</span>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 flex items-center justify-between text-caption-xs text-emerald-700 dark:text-emerald-400">
                                            <span className="flex items-center gap-2 font-medium">
                                                <CheckCircle2 className="size-4 shrink-0" />
                                                <span>Metode Verifikasi: <strong>Jarak Dekat dengan Foto ({jarakMeter}m)</strong></span>
                                            </span>
                                            <span className="font-bold">Bobot: 1.0 (Penuh)</span>
                                        </div>
                                    )}

                                    {/* Tombol Aksi Bawah: Verifikasi */}
                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={
                                                setuju === null ||
                                                (setuju === false && alasan.trim().length < 10) ||
                                                isSubmitting
                                            }
                                            className={cn(
                                                'h-11 px-6 rounded-xl font-bold text-body-sm gap-2.5 transition-all shadow-xs cursor-pointer',
                                                setuju !== null && (setuju === true || alasan.trim().length >= 10) && !isSubmitting
                                                    ? 'bg-foreground text-background hover:bg-foreground/90 shadow-md'
                                                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    <span>Memproses...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Verifikasi</span>
                                                    <Send className="size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden Input & Canvas untuk Kamera */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Modal Zoom Foto */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-3xl p-4 sm:p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-body-base font-bold">
                            {previewImage?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {previewImage && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-border">
                            <img
                                src={previewImage.src}
                                alt={previewImage.title}
                                className="h-auto max-h-[75vh] w-full object-contain bg-black"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            </div>
        </InternalLayout>
    );
}
