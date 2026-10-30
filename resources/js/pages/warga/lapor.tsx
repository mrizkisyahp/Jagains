import { ReactNode, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import CameraCapture from '@/components/laporan/CameraCapture';
import LocationPickerMap from '@/components/laporan/LocationPickerMap';
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
    // Form Wizard Step (1: Foto, 2: Lokasi, 3: Rincian Kerusakan)
    const [step, setStep] = useState<1 | 2 | 3>(1);

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
        <div className="w-full space-y-6 pb-12">
            {/* Header & Kuota Pelaporan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Laporkan Kerusakan Fasilitas
                    </h1>
                    <p className="text-body-sm text-muted-foreground mt-1">
                        Transparan, terlacak SLA, dan diverifikasi langsung oleh kuorum warga setempat.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-body-sm text-muted-foreground">Sisa Kuota:</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger className="cursor-help inline-flex items-center">
                                <Badge variant={kuota.sisa_kuota > 0 ? 'secondary' : 'destructive'} className="font-mono gap-1.5 px-3 py-1">
                                    <Clock className="size-3.5" />
                                    {kuota.sisa_kuota} / 5 per Jam
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                Sesuai Parameter P-17 (SRS FR-LAP-04), batas maksimal adalah 5 laporan per jam per akun untuk mencegah spam dan bot. Kuota ter-reset bertahap setiap 60 menit dari laporan tertua.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Peringatan Jika Kuota Habis (FR-LAP-04 & P-17) */}
            {!kuota.diizinkan && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="space-y-1 text-body-sm">
                        <p className="font-semibold">Batas Pelaporan Tercapai</p>
                        <p className="text-caption-xs">
                            {kuota.pesan || 'Anda telah mencapai batas 5 laporan per jam (Parameter P-17). Silakan tunggu hingga kuota tereset.'}
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* Wizard Stepper Progress Bar */}
            <div className="grid grid-cols-3 gap-2.5">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        step === 1
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    }`}
                >
                    <div className={`size-7 rounded-full flex items-center justify-center text-caption-xs font-bold ${
                        foto ? 'bg-emerald-600 text-white' : step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                        {foto ? <CheckCircle2 className="size-4" /> : '1'}
                    </div>
                    <span className="text-body-sm font-semibold truncate">1. Foto Kamera</span>
                </button>

                <button
                    type="button"
                    disabled={!canProceedFromStep1}
                    onClick={() => canProceedFromStep1 && setStep(2)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                        step === 2
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                            : 'border-border bg-card text-muted-foreground disabled:opacity-50 cursor-pointer'
                    }`}
                >
                    <div className={`size-7 rounded-full flex items-center justify-center text-caption-xs font-bold ${
                        kelurahanNama ? 'bg-emerald-600 text-white' : step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                        {kelurahanNama ? <CheckCircle2 className="size-4" /> : '2'}
                    </div>
                    <span className="text-body-sm font-semibold truncate">2. Titik Peta</span>
                </button>

                <button
                    type="button"
                    disabled={!canProceedFromStep2}
                    onClick={() => canProceedFromStep2 && setStep(3)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                        step === 3
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                            : 'border-border bg-card text-muted-foreground disabled:opacity-50 cursor-pointer'
                    }`}
                >
                    <div className={`size-7 rounded-full flex items-center justify-center text-caption-xs font-bold ${
                        step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                        3
                    </div>
                    <span className="text-body-sm font-semibold truncate">3. Detail Aduan</span>
                </button>
            </div>

            {/* Konten Wizard */}
            <Card className="border border-border shadow-xs rounded-2xl">
                <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* TAHAP 1: KAMERA LANGSUNG */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <CameraCapture
                                foto={foto}
                                onFotoCaptured={(data) => setFoto(data)}
                                onFotoReset={() => setFoto(null)}
                            />

                            <div className="flex justify-end pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedFromStep1}
                                    className="gap-2"
                                >
                                    Lanjut ke Penentuan Titik Lokasi
                                    <ArrowRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TAHAP 2: LOKASI PETA & GPS */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <LocationPickerMap
                                lintang={lintang}
                                bujur={bujur}
                                akurasiGpsM={akurasiGpsM}
                                lokasiSumber={lokasiSumber}
                                kelurahanNama={kelurahanNama}
                                onChangeLocation={handleLocationChange}
                            />

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="size-4" />
                                    Kembali ke Foto
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    disabled={!canProceedFromStep2}
                                    className="gap-2"
                                >
                                    Lanjut ke Rincian Kerusakan
                                    <ArrowRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TAHAP 3: DETAIL ADUAN */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {/* Kategori Kerusakan */}
                            <div className="space-y-2">
                                <Label htmlFor="kategori" className="text-body-medium font-semibold text-foreground">
                                    Kategori Fasilitas Publik <span className="text-destructive">*</span>
                                </Label>
                                <Select value={kategoriId} onValueChange={(val) => setKategoriId(val ?? '')}>
                                    <SelectTrigger id="kategori" className="w-full h-11 text-body-base">
                                        <span className="flex-1 text-left text-body-sm">
                                            {kategoriList.find((k) => String(k.id) === kategoriId)?.nama || (
                                                <span className="text-muted-foreground">-- Pilih Kategori Fasilitas Publik --</span>
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

                            {/* Tingkat Keparahan (SRS AS-06, default: sedang) */}
                            <div className="space-y-2">
                                <Label className="text-body-medium font-semibold text-foreground">Tingkat Keparahan</Label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {(['ringan', 'sedang', 'berat'] as const).map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setKeparahan(level)}
                                            className={`h-11 rounded-xl border text-body-sm font-semibold capitalize transition-all cursor-pointer ${
                                                keparahan === level
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                    : 'border-border bg-card text-foreground hover:bg-muted/60'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Uraian Keterangan Kerusakan */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="keterangan" className="text-body-medium font-semibold text-foreground">
                                        Keterangan Detail Kerusakan <span className="text-destructive">*</span>
                                    </Label>
                                    <span className={`text-caption-xs ${keterangan.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive font-medium'}`}>
                                        {keterangan.trim().length >= 10
                                            ? `✓ ${keterangan.trim().length} karakter (memenuhi syarat min. 10)`
                                            : `Minimal 10 karakter (kurang ${10 - keterangan.trim().length} lagi)`}
                                    </span>
                                </div>
                                <Textarea
                                    id="keterangan"
                                    rows={4}
                                    placeholder="Jelaskan kondisi kerusakan fisik di lokasi secara rinci, patokan jalan, atau dampak terhadap warga sekitar..."
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    className="resize-none text-body-base rounded-xl"
                                />
                            </div>

                            {/* Ringkasan Metadata Aduan */}
                            <div className="p-4 rounded-xl border border-border bg-muted/40 text-body-sm space-y-2">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Wilayah Target:</span>
                                    <span className="font-semibold text-foreground text-right">{kelurahanNama}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Koordinat Titik:</span>
                                    <span className="font-mono text-foreground">{lintang.toFixed(6)}, {bujur.toFixed(6)}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Bukti Foto:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tersimpan dari Kamera</span>
                                </div>
                            </div>

                            {/* Aksi Navigasi & Kirim */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(2)}
                                    disabled={isSubmitting || isCheckingSimilar}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="size-4" />
                                    Kembali ke Titik Peta
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleReviewAndSubmit}
                                    disabled={!canProceedFromStep3 || isSubmitting || isCheckingSimilar || !kuota.diizinkan}
                                    className="gap-2 font-semibold px-6"
                                >
                                    {isCheckingSimilar || isSubmitting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            {isCheckingSimilar ? 'Memeriksa Aduan Serupa...' : 'Mencatat Tiket...'}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="size-4" />
                                            Kirim Laporan Aduan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                <DialogContent className="sm:max-w-md text-center py-6">
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
    );
}

LaporKerusakanPage.layout = (page: ReactNode) => (
    <InternalLayout title="Laporkan Kerusakan" breadcrumb="Warga > Laporkan Kerusakan">
        {page}
    </InternalLayout>
);
