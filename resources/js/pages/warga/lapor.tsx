import { ReactNode, useState, useEffect, lazy, Suspense } from 'react';
import { router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import CameraCapture from '@/components/laporan/CameraCapture';
const LocationPickerMap = lazy(() => import('@/components/laporan/LocationPickerMap'));
import SimilarReportsModal, { LaporanKandidat } from '@/components/laporan/SimilarReportsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Camera,
    MapPin,
    FileText,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Send,
    Loader2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface KategoriItem {
    id: number;
    nama: string;
    radius_gabung_m: number;
}

interface KuotaInfo {
    diizinkan: boolean;
    laporan_terakhir_1_jam: number;
    sisa_kuota: number;
    menit_tunggu: number | null;
    pesan: string | null;
}

interface LaporKerusakanPageProps {
    kategoriList: KategoriItem[];
    kuota: KuotaInfo;
}

export default function LaporKerusakanPage({ kategoriList, kuota }: LaporKerusakanPageProps) {
    const [isMounted, setIsMounted] = useState(false);
    // Form Wizard Step (1: Foto, 2: Lokasi, 3: Rincian Kerusakan)
    const [step, setStep] = useState<1 | 2 | 3>(1);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Form Data State
    const [foto, setFoto] = useState<string | null>(null);
    const [lintang, setLintang] = useState<number>(-6.402484); // Default Margonda Depok
    const [bujur, setBujur] = useState<number>(106.794240);
    const [akurasiGpsM, setAkurasiGpsM] = useState<number | null>(null);
    const [lokasiSumber, setLokasiSumber] = useState<'gps' | 'manual'>('manual');
    const [kelurahanNama, setKelurahanNama] = useState<string | null>(null);
    const [kategoriId, setKategoriId] = useState<string>('');
    const [keparahan, setKeparahan] = useState<'ringan' | 'sedang' | 'berat'>('sedang');
    const [keterangan, setKeterangan] = useState<string>('');

    // Modal & Loading States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);
    const [similarModalOpen, setSimilarModalOpen] = useState(false);
    const [kandidatSerupa, setKandidatSerupa] = useState<LaporanKandidat[]>([]);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);
    const [redirectCountdown, setRedirectCountdown] = useState<number>(4);

    const handleCloseSuccessModal = () => {
        setSuccessModalOpen(false);
        router.visit('/warga/riwayat');
    };

    useEffect(() => {
        if (!successModalOpen) return;

        setRedirectCountdown(4);
        const timer = setInterval(() => {
            setRedirectCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.visit('/warga/riwayat');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [successModalOpen]);

    // Handler Update Lokasi dari Peta
    const handleLocationChange = (
        lat: number,
        lng: number,
        akurasi: number | null,
        sumber: 'gps' | 'manual',
        kelurahan: string | null
    ) => {
        setLintang(lat);
        setBujur(lng);
        setAkurasiGpsM(akurasi);
        setLokasiSumber(sumber);
        setKelurahanNama(kelurahan);
    };

    // Validasi Sebelum Pindah Step
    const canProceedFromStep1 = foto !== null;
    const canProceedFromStep2 = kelurahanNama !== null;
    const canProceedFromStep3 =
        kategoriId !== '' &&
        keterangan.trim().length >= 10 &&
        kelurahanNama !== null &&
        foto !== null;

    // Evaluasi Cek Laporan Serupa (FR-LAP-05) atau Kirim Langsung
    const handleReviewAndSubmit = async () => {
        if (!canProceedFromStep3) return;

        setIsCheckingSimilar(true);
        try {
            const res = await fetch('/api/laporan/cek-serupa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    kategori_id: Number(kategoriId),
                    lintang,
                    bujur,
                    akurasi_gps_m: akurasiGpsM,
                }),
            });

            const data = await res.json();
            if (res.ok && data.ada_kandidat && data.kandidat.length > 0) {
                setKandidatSerupa(data.kandidat);
                setSimilarModalOpen(true);
            } else {
                await submitNewReport();
            }
        } catch {
            await submitNewReport();
        } finally {
            setIsCheckingSimilar(false);
        }
    };

    // Kirim Laporan Baru ke Server (FR-LAP-01)
    const submitNewReport = async () => {
        setIsSubmitting(true);
        setSimilarModalOpen(false);

        try {
            const res = await fetch('/warga/lapor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    kategori_id: Number(kategoriId),
                    keparahan,
                    keterangan,
                    lintang,
                    bujur,
                    akurasi_gps_m: akurasiGpsM,
                    lokasi_sumber: lokasiSumber,
                    foto,
                }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                setCreatedTicketNumber(data.nomor_tiket);
                setSuccessModalOpen(true);
                // Bersihkan formulir segera agar tidak dapat dikirim ulang dengan data/foto yang sama
                setFoto(null);
                setKeterangan('');
                setKategoriId('');
                setAkurasiGpsM(null);
                setLokasiSumber('manual');
                setKelurahanNama(null);
                setStep(1);
                toast.success('Laporan Berhasil Terkirim', `Tiket ${data.nomor_tiket} telah masuk dalam penanganan.`);
            } else {
                const errorMsg =
                    data.message ||
                    (data.errors ? Object.values(data.errors).flat().join(', ') : 'Gagal mengirimkan laporan.');
                toast.error('Pengiriman Laporan Gagal', errorMsg);
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server. Periksa koneksi internet Anda.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Opsi Mendukung Tiket Serupa yang Ada (FR-LAP-05 & FR-INT-01)
    const handleSupportExisting = async (laporanId: number) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/warga/lapor/dukung', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ laporan_id: laporanId }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                setSimilarModalOpen(false);
                toast.success('Dukungan Berhasil Ditambahkan', data.pesan);
                router.visit('/warga/riwayat');
            } else {
                toast.error('Gagal Memberikan Dukungan', data.pesan || 'Terjadi kesalahan sistem.');
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal memproses dukungan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <InternalLayout title="Tambah Laporan" breadcrumb="Warga > Tambah Laporan" fullWidth>
            <div className="w-full space-y-6 pb-20">
            {/* Header Halaman (Pertahankan Sisa Kuota Sesuai Permintaan) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
                <div>
                    <h1 className="font-display text-display-xs font-bold tracking-tight text-foreground sm:text-display-sm">
                        Tambah Laporan Baru
                    </h1>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-body-sm text-muted-foreground font-medium">Sisa Kuota:</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger className="cursor-help inline-flex items-center">
                                <Badge variant={kuota.sisa_kuota > 0 ? 'secondary' : 'destructive'} className="font-mono gap-1.5 px-3 py-1 text-caption-xs font-semibold rounded-full border">
                                    <Clock className="size-3.5" />
                                    {kuota.sisa_kuota} / 5 per Jam
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-caption-xs">
                                Sesuai Parameter P-17 (SRS FR-LAP-04), batas maksimal adalah 5 laporan per jam per akun untuk mencegah spam dan bot. Kuota ter-reset bertahap setiap 60 menit dari laporan tertua.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Peringatan Jika Kuota Habis (FR-LAP-04 & P-17) */}
            {!kuota.diizinkan && (
                <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="space-y-1 text-body-sm">
                        <p className="font-semibold">Batas Pelaporan Tercapai</p>
                        <p className="text-caption-xs">
                            {kuota.pesan || 'Anda telah mencapai batas 5 laporan per jam (Parameter P-17). Silakan tunggu hingga kuota tereset.'}
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* Segmented Step Bar (3 Tahap Sesuai Wireframe: Foto, Titik Lokasi, Detail) */}
            <div className="w-full rounded-2xl bg-muted/60 p-1.5 border border-border/40">
                <div className="grid grid-cols-3 gap-1.5">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className={`flex items-center justify-center py-3 px-4 rounded-xl text-body-sm transition-all cursor-pointer ${
                            step === 1
                                ? 'bg-card text-foreground shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 font-medium'
                        }`}
                    >
                        Foto
                    </button>

                    <button
                        type="button"
                        disabled={!canProceedFromStep1}
                        onClick={() => canProceedFromStep1 && setStep(2)}
                        className={`flex items-center justify-center py-3 px-4 rounded-xl text-body-sm transition-all ${
                            step === 2
                                ? 'bg-card text-foreground shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                        }`}
                    >
                        Titik Lokasi
                    </button>

                    <button
                        type="button"
                        disabled={!canProceedFromStep2}
                        onClick={() => canProceedFromStep2 && setStep(3)}
                        className={`flex items-center justify-center py-3 px-4 rounded-xl text-body-sm transition-all ${
                            step === 3
                                ? 'bg-card text-foreground shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                        }`}
                    >
                        Detail
                    </button>
                </div>
            </div>

            {/* Konten Tahapan Formulir */}
            <div>
                {/* TAHAP 1: FOTO KAMERA SESUAI WIREFRAME */}
                {step === 1 && (
                    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
                        <CameraCapture
                            foto={foto}
                            onFotoCaptured={(data) => setFoto(data)}
                            onFotoReset={() => setFoto(null)}
                            onNextStep={() => setStep(2)}
                        />
                    </div>
                )}

                {/* TAHAP 2: TITIK LOKASI SESUAI WIREFRAME */}
                {step === 2 && (
                    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
                        <div className="space-y-1">
                            <h2 className="font-display text-title-lg sm:text-display-xs font-bold text-foreground">
                                Pilih Titik Lokasi
                            </h2>
                            <p className="text-body-sm text-muted-foreground">
                                Pilih titik lokasi dengan menekan tombol cari GPS atau menitikkan secara manual di peta
                            </p>
                        </div>

                        {isMounted ? (
                            <Suspense
                                fallback={
                                    <div className="aspect-[16/10] sm:aspect-[16/9] max-h-[580px] w-full flex items-center justify-center bg-zinc-950 rounded-3xl text-white gap-2">
                                        <Loader2 className="size-6 animate-spin text-primary" />
                                        <span className="text-body-sm font-medium">Memuat peta lokasi...</span>
                                    </div>
                                }
                            >
                                <LocationPickerMap
                                    lintang={lintang}
                                    bujur={bujur}
                                    akurasiGpsM={akurasiGpsM}
                                    lokasiSumber={lokasiSumber}
                                    kelurahanNama={kelurahanNama}
                                    onChangeLocation={handleLocationChange}
                                    onPrevStep={() => setStep(1)}
                                    onNextStep={() => setStep(3)}
                                    canProceed={canProceedFromStep2}
                                />
                            </Suspense>
                        ) : (
                            <div className="aspect-[16/10] sm:aspect-[16/9] max-h-[580px] w-full flex items-center justify-center bg-zinc-950 rounded-3xl text-white gap-2">
                                <Loader2 className="size-6 animate-spin text-primary" />
                                <span className="text-body-sm font-medium">Memuat peta lokasi...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* TAHAP 3: DETAIL ADUAN SESUAI WIREFRAME */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
                            {/* Header Section */}
                            <div className="space-y-1">
                                <h2 className="font-display text-title-lg sm:text-display-xs font-bold text-foreground">
                                    Isi Formulir Detail Laporan
                                </h2>
                                <p className="text-body-sm text-muted-foreground">
                                    Isi formulir detail laporan secara jelas dan ringkas
                                </p>
                            </div>

                            {/* Baris 1: Pratinjau Foto (Kiri) & Info Wilayah / Koordinat (Kanan) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Kiri: Foto Thumbnail */}
                                <div className="relative overflow-hidden rounded-2xl bg-black aspect-[16/10] sm:aspect-[16/9] w-full flex items-center justify-center border border-border/50 shadow-sm">
                                    {foto ? (
                                        <img
                                            src={foto}
                                            alt="Bukti Foto Kerusakan"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-zinc-500 font-display font-semibold">Foto</span>
                                    )}
                                </div>

                                {/* Kanan: Wilayah Lokasi & Koordinat Lokasi */}
                                <div className="space-y-5 pt-1">
                                    <div className="space-y-1">
                                        <h3 className="text-body-sm font-bold text-foreground">
                                            Wilayah Lokasi
                                        </h3>
                                        <p className="text-body-sm text-muted-foreground leading-relaxed">
                                            {kelurahanNama || 'Belum terdeteksi'}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-body-sm font-bold text-foreground">
                                            Koordinat Lokasi
                                        </h3>
                                        <p className="text-body-sm font-mono text-muted-foreground">
                                            {lintang.toFixed(6)}, {bujur.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Baris 2: Kategori Kerusakan (Kiri) & Tingkat Keparahan (Kanan) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Kiri: Kategori Kerusakan */}
                                <div className="space-y-2">
                                    <Label htmlFor="kategori" className="text-body-sm font-bold text-foreground">
                                        Kategori Kerusakan
                                    </Label>
                                    <Select value={kategoriId} onValueChange={(val) => setKategoriId(val ?? '')}>
                                        <SelectTrigger
                                            id="kategori"
                                            className="w-full h-11 rounded-xl bg-muted/50 border-border/60 text-body-sm px-4"
                                        >
                                            <span className="flex-1 text-left">
                                                {kategoriList.find((k) => String(k.id) === kategoriId)?.nama || (
                                                    <span className="text-muted-foreground">-- Pilih Kategori Kerusakan --</span>
                                                )}
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kategoriList.map((kat) => (
                                                <SelectItem key={kat.id} value={String(kat.id)} className="text-body-sm">
                                                    {kat.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Kanan: Tingkat Keparahan */}
                                <div className="space-y-2">
                                    <Label className="text-body-sm font-bold text-foreground">
                                        Tingkat Keparahan
                                    </Label>
                                    <div className="w-full h-11 rounded-xl bg-muted/60 p-1 border border-border/40 grid grid-cols-3 gap-1">
                                        {(['ringan', 'sedang', 'berat'] as const).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setKeparahan(level)}
                                                className={`h-9 rounded-lg text-body-sm capitalize transition-all cursor-pointer flex items-center justify-center ${
                                                    keparahan === level
                                                        ? 'bg-foreground text-background shadow-sm font-bold'
                                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-background/50 font-medium'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Baris 3: Keterangan Detail Kerusakan */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="keterangan" className="text-body-sm font-bold text-foreground">
                                        Keterangan Detail Kerusakan
                                    </Label>
                                    <span
                                        className={`text-caption-xs ${
                                            keterangan.trim().length >= 10
                                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                                : 'text-muted-foreground font-medium'
                                        }`}
                                    >
                                        {keterangan.trim().length >= 10
                                            ? `✓ ${keterangan.length}/256 karakter`
                                            : `Minimal 10 karakter (${keterangan.length}/256)`}
                                    </span>
                                </div>
                                <Textarea
                                    id="keterangan"
                                    rows={5}
                                    maxLength={256}
                                    placeholder="Isi rincian kondisi kerusakan fisik di lokasi secara rinci..."
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    className="resize-none text-body-sm rounded-2xl bg-muted/30 border-border/60 p-4 focus-visible:ring-1"
                                />
                            </div>
                        </div>

                        {/* Bottom Action Bar Sesuai Wireframe: Di Luar Kartu */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setStep(2)}
                                disabled={isSubmitting || isCheckingSimilar}
                                className="w-full sm:w-auto h-11 px-5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-semibold text-body-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-101 active:scale-99"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Kembali Untuk Pilih Lokasi</span>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleReviewAndSubmit}
                                disabled={!canProceedFromStep3 || isSubmitting || isCheckingSimilar || !kuota.diizinkan}
                                className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-bold text-body-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-101 active:scale-99 disabled:opacity-40"
                            >
                                {isCheckingSimilar || isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>{isCheckingSimilar ? 'Memeriksa Aduan Serupa...' : 'Mencatat Tiket...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-4" />
                                        <span>Kirim Laporan</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
                </div>

            {/* Modal Aduan Serupa (FR-LAP-05) */}
            <SimilarReportsModal
                isOpen={similarModalOpen}
                onClose={() => setSimilarModalOpen(false)}
                kandidat={kandidatSerupa}
                onSupportExisting={handleSupportExisting}
                onProceedNewReport={submitNewReport}
                isSubmitting={isSubmitting}
            />

            {/* Modal Sukses Pembuatan Tiket */}
            <Dialog open={successModalOpen} onOpenChange={(open) => { if (!open) handleCloseSuccessModal(); }}>
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8 text-center">
                    <DialogHeader className="flex flex-col items-center">
                        <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                            <CheckCircle2 className="size-7" />
                        </div>
                        <DialogTitle className="text-lg">Laporan Berhasil Terkirim!</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Aduan Anda telah tercatat secara resmi dan masuk dalam antrean dinas penanggung jawab.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-4 p-4 rounded-xl border border-border bg-muted/40 space-y-1">
                        <p className="text-xs text-muted-foreground">Nomor Tiket Publik Anda:</p>
                        <p className="text-xl font-mono font-bold text-primary tracking-wide">
                            {createdTicketNumber}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Mengalihkan ke riwayat laporan dalam{' '}
                        <span className="font-semibold text-foreground">
                            {redirectCountdown}
                        </span>{' '}
                        detik...
                    </p>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center mt-3">
                        <Button
                            type="button"
                            onClick={handleCloseSuccessModal}
                            className="w-full sm:w-auto text-xs"
                        >
                            Lihat Riwayat Aduan Saya
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </InternalLayout>
    );
}
