import { useState } from 'react';
import { ArrowLeft, FilePlus, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { formatInstansiMessage } from '@/components/instansi/InstansiStatusBadge';
import { beritaAcara as beritaAcaraRoute } from '@/routes/instansi/tiket';
import type { BeritaAcaraItem } from '@/types/tiket';

interface KelolaBeritaAcaraViewProps {
    beritaAcara: BeritaAcaraItem[];
    instansiNama: string;
    laporanId: number;
    nomorTiket: string;
    onKembali: () => void;
    onSuccess: () => void;
}

const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function KelolaBeritaAcaraView({
    beritaAcara,
    instansiNama,
    laporanId,
    nomorTiket,
    onKembali,
    onSuccess,
}: KelolaBeritaAcaraViewProps) {
    const [mode, setMode] = useState<'view' | 'form'>(
        beritaAcara.length === 0 ? 'view' : 'view',
    );
    const [formTitle, setFormTitle] = useState<
        'Buat Berita Acara' | 'Ubah Berita Acara'
    >('Buat Berita Acara');

    // Selected version in view mode (default to latest version)
    const [selectedVersi, setSelectedVersi] = useState<number>(() => {
        if (beritaAcara.length === 0) return 1;
        return Math.max(...beritaAcara.map((b) => b.versi));
    });

    // Form state
    const [kegiatan, setKegiatan] = useState('');
    const [hasil, setHasil] = useState('');
    const [kendala, setKendala] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const currentItem =
        beritaAcara.find((b) => b.versi === selectedVersi) || beritaAcara[0];

    // Buka formulir baru (Wireframe - 42)
    const handleBukaFormBaru = () => {
        setFormTitle('Buat Berita Acara');
        setKegiatan('');
        setHasil('');
        setKendala('');
        setErrors({});
        setMode('form');
    };

    // Buka formulir edit/ubah dari versi terpilih (Wireframe - 42)
    const handleBukaFormUbah = () => {
        setFormTitle('Ubah Berita Acara');
        setKegiatan(currentItem?.kegiatan || '');
        setHasil(currentItem?.hasil || '');
        setKendala(currentItem?.hambatan || '');
        setErrors({});
        setMode('form');
    };

    // Submit simpan Berita Acara
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errs: Record<string, string> = {};
        if (kegiatan.trim().length < 10) {
            errs.kegiatan = 'Kegiatan yang dilaksanakan minimal 10 karakter.';
        }
        if (hasil.trim().length < 10) {
            errs.hasil = 'Hasil capaian pekerjaan minimal 10 karakter.';
        }
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(
                'Periksa Isian',
                'Pastikan kegiatan dan hasil diisi minimal 10 karakter.',
            );
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const res = await fetch(beritaAcaraRoute.url(laporanId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    kegiatan: kegiatan.trim(),
                    hasil: hasil.trim(),
                    hambatan: kendala.trim() || undefined,
                }),
            });

            const data = (await res.json()) as {
                sukses?: boolean;
                pesan?: string;
                message?: string;
                berita_acara?: { versi: number };
                errors?: Record<string, string[]>;
            };

            if (res.ok && data.sukses) {
                toast.success(
                    'Berita Acara Disimpan',
                    formatInstansiMessage(data.pesan),
                );
                setMode('view');
                if (data.berita_acara?.versi) {
                    setSelectedVersi(data.berita_acara.versi);
                }
                onSuccess();
            } else {
                toast.error(
                    'Gagal Menyimpan',
                    formatInstansiMessage(data.message) ||
                        'Terjadi kesalahan sistem.',
                );
            }
        } catch {
            toast.error('Terjadi Kesalahan', 'Gagal menghubungi server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // TAMPILAN 1: FORMULIR BUAT / UBAH (Wireframe - 42)
    // ==========================================
    if (mode === 'form') {
        return (
            <div className="space-y-6 pb-24">
                {/* Navigasi Kembali ke Kelola Berita Acara */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => setMode('view')}
                        className="h-9 cursor-pointer gap-1.5 px-0 text-body-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali ke Kelola Berita Acara</span>
                    </Button>
                </div>

                {/* Judul Formulir */}
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {formTitle}
                </h1>

                {/* Baris Metadata: Tanggal Pelaksanaan (Kiri) & Penanggung Jawab (Kanan) */}
                <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 text-body-sm sm:flex-row sm:items-center">
                    <div>
                        <span className="block font-bold text-foreground">
                            Tanggal Pelaksanaan
                        </span>
                        <span className="text-muted-foreground">
                            {formatDate(new Date())}
                        </span>
                    </div>

                    <div className="sm:text-right">
                        <span className="block font-bold text-foreground">
                            Penanggung Jawab
                        </span>
                        <span className="text-muted-foreground">
                            {instansiNama ||
                                'Dinas Lingkungan Hidup dan Kebersihan Kota Depok'}
                        </span>
                    </div>
                </div>

                {/* Form Input Textarea Sesuai Wireframe - 42 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Baris 1: Dua Kolom Berdampingan */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Kolom Kiri: Kegiatan yang Dilaksanakan */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="kegiatan"
                                    className="text-body-sm font-bold text-foreground"
                                >
                                    Kegiatan yang Dilaksanakan di Lapangan
                                </label>
                                <span className="text-caption-xs text-muted-foreground">
                                    {kegiatan.length}/256
                                </span>
                            </div>
                            <Textarea
                                id="kegiatan"
                                maxLength={256}
                                rows={6}
                                value={kegiatan}
                                onChange={(e) => setKegiatan(e.target.value)}
                                placeholder="Contoh: Pembongkaran aspal rusak, pemadatan agregat dasar, dan pemasangan lapis penetrasi..."
                                className="resize-none rounded-2xl border-border/80 bg-card p-4 text-body-sm leading-relaxed"
                            />
                            {errors.kegiatan && (
                                <p className="text-caption-xs font-medium text-destructive">
                                    {errors.kegiatan}
                                </p>
                            )}
                        </div>

                        {/* Kolom Kanan: Hasil Capaian Pekerjaan */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="hasil"
                                    className="text-body-sm font-bold text-foreground"
                                >
                                    Hasil Capaian Pekerjaan
                                </label>
                                <span className="text-caption-xs text-muted-foreground">
                                    {hasil.length}/256
                                </span>
                            </div>
                            <Textarea
                                id="hasil"
                                maxLength={256}
                                rows={6}
                                value={hasil}
                                onChange={(e) => setHasil(e.target.value)}
                                placeholder="Contoh: Aspal sepanjang 15 meter telah tertutup rata dan siap dilakukan pemadatan akhir..."
                                className="resize-none rounded-2xl border-border/80 bg-card p-4 text-body-sm leading-relaxed"
                            />
                            {errors.hasil && (
                                <p className="text-caption-xs font-medium text-destructive">
                                    {errors.hasil}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Baris 2: Satu Kolom Penuh Kendala Lapangan */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="kendala"
                                className="text-body-sm font-bold text-foreground"
                            >
                                Kendala Lapangan{' '}
                                <span className="text-caption-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </label>
                            <span className="text-caption-xs text-muted-foreground">
                                {kendala.length}/256
                            </span>
                        </div>
                        <Textarea
                            id="kendala"
                            maxLength={256}
                            rows={4}
                            value={kendala}
                            onChange={(e) => setKendala(e.target.value)}
                            placeholder="Contoh: Cuaca hujan gerimis di sore hari sempat memperlambat proses pengeringan aspal hotmix..."
                            className="resize-none rounded-2xl border-border/80 bg-card p-4 text-body-sm leading-relaxed"
                        />
                    </div>

                    {/* Tombol Sticky Action Bawah Kanan (Sesuai Wireframe - 42) */}
                    <div className="fixed right-4 bottom-4 z-40 flex items-center rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 bg-white px-6 font-semibold text-zinc-950 shadow-xs hover:bg-zinc-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-zinc-950" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <span>{formTitle}</span>
                                    <FilePlus className="size-4 text-zinc-900" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    // ==========================================
    // TAMPILAN 2: BELUM ADA BERITA ACARA (Wireframe - 41)
    // ==========================================
    if (beritaAcara.length === 0) {
        return (
            <div className="space-y-6 pb-16">
                {/* Navigasi Kembali ke Detail Laporan */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={onKembali}
                        className="h-9 cursor-pointer gap-1.5 px-0 text-body-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali</span>
                    </Button>
                </div>

                {/* Tampilan Kosong Sesuai Wireframe - 41 */}
                <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-body-base font-medium text-foreground">
                        Belum ada berita acara
                    </p>
                    <Button
                        type="button"
                        onClick={handleBukaFormBaru}
                        className="h-11 cursor-pointer gap-2.5 rounded-2xl border border-border/80 bg-white px-6 font-semibold text-zinc-950 shadow-md transition-all hover:bg-zinc-100"
                    >
                        <span>Buat Berita Acara</span>
                        <FilePlus className="size-4 text-zinc-900" />
                    </Button>
                </div>
            </div>
        );
    }

    // ==========================================
    // TAMPILAN 3: LIHAT DETAIL BERITA ACARA (Wireframe - 44)
    // ==========================================
    return (
        <div className="space-y-6 pb-24">
            {/* Navigasi Kembali ke Detail Laporan */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onKembali}
                    className="h-9 cursor-pointer gap-1.5 px-0 text-body-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    <span>Kembali</span>
                </Button>
            </div>

            {/* Dropdown Pemilih Versi Sesuai Wireframe - 44 [Versi 1 ⌄] */}
            <div className="pt-1">
                <Select
                    value={String(selectedVersi)}
                    onValueChange={(val) => setSelectedVersi(Number(val))}
                >
                    <SelectTrigger className="h-10 w-32 cursor-pointer rounded-2xl border border-border/80 bg-white text-body-sm font-semibold text-zinc-950 shadow-xs">
                        <SelectValue placeholder={`Versi ${selectedVersi}`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        {beritaAcara.map((item) => (
                            <SelectItem
                                key={item.versi}
                                value={String(item.versi)}
                                className="cursor-pointer font-medium"
                            >
                                Versi {item.versi}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Baris Metadata: Tanggal Pelaksanaan (Kiri) & Penanggung Jawab (Kanan) */}
            <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 text-body-sm sm:flex-row sm:items-center">
                <div>
                    <span className="block font-bold text-foreground">
                        Tanggal Pelaksanaan
                    </span>
                    <span className="text-muted-foreground">
                        {currentItem
                            ? formatDate(currentItem.created_at)
                            : formatDate(new Date())}
                    </span>
                </div>

                <div className="sm:text-right">
                    <span className="block font-bold text-foreground">
                        Penanggung Jawab
                    </span>
                    <span className="text-muted-foreground">
                        {currentItem?.instansi_nama ||
                            instansiNama ||
                            'Dinas Lingkungan Hidup dan Kebersihan Kota Depok'}
                    </span>
                </div>
            </div>

            {/* Konten Rincian Berita Acara Sesuai Wireframe - 44 */}
            <div className="space-y-6">
                {/* Baris 1: Dua Kolom Berdampingan */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Kolom Kiri: Kegiatan yang Dilaksanakan di Lapangan */}
                    <div className="space-y-2">
                        <h3 className="text-body-sm font-bold text-foreground">
                            Kegiatan yang Dilaksanakan di Lapangan
                        </h3>
                        <div className="min-h-[140px] rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                            <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                                {currentItem?.kegiatan || '-'}
                            </p>
                        </div>
                    </div>

                    {/* Kolom Kanan: Hasil Capaian Pekerjaan */}
                    <div className="space-y-2">
                        <h3 className="text-body-sm font-bold text-foreground">
                            Hasil Capaian Pekerjaan
                        </h3>
                        <div className="min-h-[140px] rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                            <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                                {currentItem?.hasil || '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Baris 2: Satu Kolom Penuh Kendala Lapangan */}
                <div className="space-y-2">
                    <h3 className="text-body-sm font-bold text-foreground">
                        Kendala Lapangan
                    </h3>
                    <div className="min-h-[100px] rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                        <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                            {currentItem?.hambatan ||
                                'Tidak ada kendala yang dilaporkan.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tombol Sticky Action Bawah Kanan (Sesuai Wireframe - 44) */}
            <div className="fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6">
                <Button
                    type="button"
                    onClick={handleBukaFormUbah}
                    className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 bg-white px-5 font-semibold text-zinc-950 shadow-xs hover:bg-zinc-100"
                >
                    <span>Ubah Berita Acara</span>
                    <FileText className="size-4" />
                </Button>
            </div>
        </div>
    );
}
