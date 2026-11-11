import { FormEvent, ReactNode, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { DetailPerkaraAudit, JenisKeputusanAuditor } from '@/types/auditor';
import { getPemicuBadge } from '@/components/auditor/KartuEskalasi';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Loader2,
    MapPin,
    RotateCcw,
    Scale,
    ShieldAlert,
    Users,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '@/components/ui/field';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface AuditorDetailPageProps {
    detail: DetailPerkaraAudit;
}

export default function AuditorDetailPage({ detail }: AuditorDetailPageProps) {
    // Stepper state: 1 = Telaah Berkas, 2 = Sidang Putusan
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Form state untuk sidang putusan
    const isSla = detail.eskalasi.pemicu === 'SLA';
    const [jenis, setJenis] = useState<JenisKeputusanAuditor>(
        isSla ? 'PERINTAH' : 'PERBAIKAN_SAH',
    );
    const [perintah, setPerintah] = useState('');
    const [alasan, setAlasan] = useState('');
    const [tenggat, setTenggat] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const badge = getPemicuBadge(detail.eskalasi.pemicu);
    const BadgeIcon = badge.icon;

    const formatTanggal = (isoString?: string | null) => {
        if (!isoString) {
            return '-';
        }
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const isFormValid = isSla
        ? perintah.trim().length >= 10 && tenggat !== ''
        : jenis === 'PERBAIKAN_SAH'
          ? alasan.trim().length >= 10
          : alasan.trim().length >= 10 && tenggat !== '';

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload: Record<string, unknown> = {
            jenis,
        };

        if (jenis === 'PERINTAH') {
            payload.perintah = perintah.trim();
            payload.tenggat = tenggat;
        } else if (jenis === 'PERBAIKAN_SAH') {
            payload.alasan = alasan.trim();
        } else if (jenis === 'KERJAKAN_ULANG') {
            payload.alasan = alasan.trim();
            payload.perintah = perintah.trim() || alasan.trim();
            payload.tenggat = tenggat;
        }

        router.post(
            `/auditor/antrean/${detail.eskalasi.id}/putuskan`,
            payload as any,
            {
                onSuccess: () => {
                    toast.success('Putusan resmi Auditor berhasil ditetapkan.');
                },
                onError: (errors) => {
                    const errorMsg =
                        Object.values(errors)[0] ||
                        'Terjadi kesalahan saat memproses keputusan sidang.';
                    toast.error(errorMsg as string);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    // Kalkulasi suara warga
    const totalSuara = detail.suara_warga?.length || 0;
    const suaraSetuju = detail.suara_warga?.filter((s) => s.setuju).length || 0;
    const suaraTolak = totalSuara - suaraSetuju;

    return (
        <div className="w-full min-w-0 space-y-6 pb-12">
            <Head
                title={`Telaah Perkara: ${detail.laporan.nomor_tiket} - Auditor`}
            />

            {/* Navigasi Balik & Header Perkara */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Link
                        href="/auditor/antrean"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke antrean eskalasi</span>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                                {detail.laporan.nomor_tiket}
                            </span>
                            <Badge
                                variant={badge.variant}
                                className="gap-1 text-caption-xs font-semibold"
                            >
                                <BadgeIcon className="size-3" />
                                {badge.label}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-caption-xs font-mono font-medium"
                            >
                                {detail.laporan.status}
                            </Badge>
                            {detail.laporan.kategori && (
                                <span className="text-caption-xs text-muted-foreground">
                                    • {detail.laporan.kategori.nama}
                                </span>
                            )}
                        </div>
                        <h2 className="text-display-xs font-display font-semibold tracking-tight text-foreground">
                            {detail.laporan.judul}
                        </h2>
                        <p className="text-caption-sm text-muted-foreground">
                            Sidang Majelis Auditor Independen Jabodetabek •
                            Masuk eskalasi pada{' '}
                            {formatTanggal(detail.eskalasi.created_at)}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <a
                            href={`/tiket/${detail.laporan.nomor_tiket}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                }),
                                'gap-1.5 text-xs',
                            )}
                        >
                            <ExternalLink className="size-3.5" />
                            <span>Lihat Tiket Publik</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Stepper Navigation */}
            <div className="rounded-xl border border-border bg-card p-2 sm:p-3">
                <nav
                    aria-label="Tahapan Sidang Auditor"
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                    {/* Langkah 1 */}
                    <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className={cn(
                            'group flex items-center gap-3.5 rounded-lg p-3 text-left transition-all',
                            currentStep === 1
                                ? 'border border-primary/30 bg-primary/10 shadow-2xs'
                                : 'border border-transparent hover:bg-muted/50',
                        )}
                    >
                        <div
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors',
                                currentStep === 1
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground group-hover:text-foreground',
                            )}
                        >
                            1
                        </div>
                        <div className="min-w-0">
                            <span
                                className={cn(
                                    'block text-body-sm font-semibold',
                                    currentStep === 1
                                        ? 'text-primary'
                                        : 'text-foreground',
                                )}
                            >
                                Telaah Berkas Perkara
                            </span>
                            <span className="block truncate text-caption-xs text-muted-foreground">
                                Verifikasi bukti fisik, laporan warga, dan
                                dokumen dinas
                            </span>
                        </div>
                    </button>

                    {/* Langkah 2 */}
                    <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className={cn(
                            'group flex items-center gap-3.5 rounded-lg p-3 text-left transition-all',
                            currentStep === 2
                                ? 'border border-primary/30 bg-primary/10 shadow-2xs'
                                : 'border border-transparent hover:bg-muted/50',
                        )}
                    >
                        <div
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors',
                                currentStep === 2
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground group-hover:text-foreground',
                            )}
                        >
                            2
                        </div>
                        <div className="min-w-0">
                            <span
                                className={cn(
                                    'block text-body-sm font-semibold',
                                    currentStep === 2
                                        ? 'text-primary'
                                        : 'text-foreground',
                                )}
                            >
                                Sidang Putusan Auditor
                            </span>
                            <span className="block truncate text-caption-xs text-muted-foreground">
                                Penetapan amar putusan resmi yang final dan
                                mengikat
                            </span>
                        </div>
                    </button>
                </nav>
            </div>

            {/* STEP 1: TELAAH BERKAS PERKARA */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    {/* Ringkasan Metadata Kasus */}
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="min-w-0 space-y-1">
                            <span className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Instansi Pelaksana
                            </span>
                            <div className="flex items-center gap-2">
                                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                                <span
                                    className="truncate text-body-sm font-semibold text-foreground"
                                    title={detail.laporan.instansi?.nama}
                                >
                                    {detail.laporan.instansi?.nama || '-'}
                                </span>
                            </div>
                            {detail.laporan.instansi?.singkatan && (
                                <span className="py-0.2 inline-block rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                                    {detail.laporan.instansi.singkatan}
                                </span>
                            )}
                        </div>

                        <div className="min-w-0 space-y-1">
                            <span className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Lokasi Wilayah
                            </span>
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate text-body-sm font-semibold text-foreground">
                                    Kelurahan{' '}
                                    {detail.laporan.kelurahan?.nama || '-'}
                                </span>
                            </div>
                            <span className="block font-mono text-[11px] text-muted-foreground">
                                {detail.laporan.lintang.toFixed(5)},{' '}
                                {detail.laporan.bujur.toFixed(5)}
                            </span>
                        </div>

                        <div className="min-w-0 space-y-1">
                            <span className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Status & Tahap
                            </span>
                            <p className="text-body-sm font-semibold text-foreground">
                                {detail.eskalasi.tahap
                                    ? `Tahap ${detail.eskalasi.tahap}`
                                    : 'Tahap Pelaksanaan'}
                            </p>
                            <span className="block text-caption-xs text-muted-foreground">
                                Sengketa Ronde Ke-
                                {detail.laporan.ronde_sengketa || 1}
                            </span>
                        </div>

                        <div className="min-w-0 space-y-1">
                            <span className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Keterlambatan SLA
                            </span>
                            {detail.eskalasi.hari_terlambat > 0 ? (
                                <div className="flex items-center gap-1.5 text-body-sm font-bold text-destructive">
                                    <Clock className="size-4 shrink-0" />
                                    <span>
                                        {detail.eskalasi.hari_terlambat} Hari
                                        Kerja
                                    </span>
                                </div>
                            ) : (
                                <span className="text-body-sm font-semibold text-foreground">
                                    Dalam Batas Toleransi
                                </span>
                            )}
                            <span className="block text-caption-xs text-muted-foreground">
                                {detail.laporan.sla_jatuh_tempo
                                    ? `Batas: ${formatTanggal(detail.laporan.sla_jatuh_tempo)}`
                                    : 'Batas SLA dinas'}
                            </span>
                        </div>
                    </div>

                    {/* Deskripsi Aduan Pelapor Warga */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <h3 className="flex items-center gap-2 text-caption-xs font-bold tracking-wider text-foreground uppercase">
                            <FileText className="size-4 text-muted-foreground" />
                            <span>Deskripsi Aduan Pelapor Warga</span>
                        </h3>
                        <p className="mt-2.5 text-body-sm leading-relaxed text-muted-foreground">
                            {detail.laporan.keterangan ||
                                'Tidak ada deskripsi rinci dari pelapor.'}
                        </p>
                    </div>

                    {/* Dokumentasi Visual Lapangan: Komparasi Sebelum vs Sesudah */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <h3 className="flex items-center gap-2 text-caption-xs font-bold tracking-wider text-foreground uppercase">
                                <ImageIcon className="size-4 text-muted-foreground" />
                                <span>
                                    Dokumentasi Visual Lapangan (Komparasi
                                    Sebelum vs Sesudah)
                                </span>
                            </h3>
                            <span className="text-caption-xs text-muted-foreground">
                                Bukti otentik lapangan
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Foto Awal */}
                            <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3.5 py-2 text-caption-xs font-semibold text-foreground">
                                    <span>
                                        Foto Awal (Kondisi Rusak Pelapor)
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        Sebelum
                                    </Badge>
                                </div>
                                {detail.foto_awal ? (
                                    <div className="group relative aspect-video w-full overflow-hidden bg-black/5">
                                        <img
                                            src={detail.foto_awal}
                                            alt="Foto kondisi awal kerusakan"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-caption-sm flex aspect-video items-center justify-center text-muted-foreground">
                                        Foto awal belum diunggah oleh pelapor.
                                    </div>
                                )}
                            </div>

                            {/* Foto Sesudah */}
                            <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3.5 py-2 text-caption-xs font-semibold text-foreground">
                                    <span>
                                        Foto Sesudah (Klaim Perbaikan Instansi)
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        Sesudah
                                    </Badge>
                                </div>
                                {detail.foto_sesudah ? (
                                    <div className="group relative aspect-video w-full overflow-hidden bg-black/5">
                                        <img
                                            src={detail.foto_sesudah}
                                            alt="Foto bukti perbaikan dari instansi"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-caption-sm flex aspect-video items-center justify-center text-muted-foreground">
                                        Instansi belum melampirkan foto hasil
                                        perbaikan fisik.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Berita Acara Pekerjaan Instansi */}
                    {detail.berita_acara ? (
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <h3 className="flex items-center gap-2 text-caption-xs font-bold tracking-wider text-foreground uppercase">
                                    <FileText className="size-4 text-muted-foreground" />
                                    <span>
                                        Berita Acara Pelaksanaan Fisik (Versi{' '}
                                        {detail.berita_acara.versi})
                                    </span>
                                </h3>
                                <span className="text-caption-xs font-mono text-muted-foreground">
                                    {formatTanggal(
                                        detail.berita_acara.created_at,
                                    )}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 text-body-sm sm:grid-cols-2">
                                <div>
                                    <span className="font-semibold text-foreground">
                                        Rincian Kegiatan:
                                    </span>
                                    <p className="mt-1 text-muted-foreground">
                                        {detail.berita_acara.kegiatan}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-semibold text-foreground">
                                        Hasil Pekerjaan:
                                    </span>
                                    <p className="mt-1 text-muted-foreground">
                                        {detail.berita_acara.hasil}
                                    </p>
                                </div>
                                {detail.berita_acara.hambatan && (
                                    <div className="sm:col-span-2">
                                        <span className="font-semibold text-foreground">
                                            Hambatan Lapangan:
                                        </span>
                                        <p className="mt-1 text-muted-foreground">
                                            {detail.berita_acara.hambatan}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-caption-sm rounded-xl border border-dashed border-border bg-muted/10 p-4 text-center text-muted-foreground">
                            Belum ada dokumen Berita Acara Pekerjaan yang
                            diunggah oleh instansi pelaksana.
                        </div>
                    )}

                    {/* Catatan Sanggahan Resmi Instansi (jika ada) */}
                    {detail.sengketa &&
                        detail.sengketa.jawaban === 'sanggah' && (
                            <div className="rounded-xl border border-border bg-muted/20 p-5">
                                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                                    <h3 className="flex items-center gap-2 text-caption-xs font-bold tracking-wider text-foreground uppercase">
                                        <ShieldAlert className="size-4 text-primary" />
                                        <span>
                                            Dokumen Sanggahan Resmi Instansi
                                        </span>
                                    </h3>
                                    {detail.sengketa.petugas && (
                                        <span className="text-caption-xs text-muted-foreground">
                                            Oleh: {detail.sengketa.petugas} •{' '}
                                            {formatTanggal(
                                                detail.sengketa.waktu_jawab,
                                            )}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 text-body-sm leading-relaxed text-foreground">
                                    {detail.sengketa.alasan_sanggah}
                                </p>
                            </div>
                        )}

                    {/* Partisipasi & Suara Warga (jika ada) */}
                    {detail.suara_warga && detail.suara_warga.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                                <h3 className="flex items-center gap-2 text-caption-xs font-bold tracking-wider text-foreground uppercase">
                                    <Users className="size-4 text-muted-foreground" />
                                    <span>
                                        Partisipasi Suara Verifikasi Warga (
                                        {totalSuara} Suara)
                                    </span>
                                </h3>
                                <div className="flex items-center gap-3 text-caption-xs">
                                    <span className="text-muted-foreground">
                                        Setuju:{' '}
                                        <strong className="text-foreground">
                                            {suaraSetuju}
                                        </strong>
                                    </span>
                                    <span>•</span>
                                    <span className="text-muted-foreground">
                                        Tolak:{' '}
                                        <strong className="text-destructive">
                                            {suaraTolak}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {detail.suara_warga.map((s, idx) => (
                                    <div
                                        key={s.id || idx}
                                        className="text-caption-sm rounded-lg border border-border/60 bg-muted/10 p-3.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {s.setuju ? (
                                                    <Badge
                                                        variant="sla-safe"
                                                        className="h-5 text-[10px]"
                                                    >
                                                        Setuju
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="destructive"
                                                        className="h-5 text-[10px]"
                                                    >
                                                        Tolak
                                                    </Badge>
                                                )}
                                                <span className="text-muted-foreground">
                                                    {s.jalur === 'A'
                                                        ? 'Jarak Dekat'
                                                        : 'Jarak Jauh'}{' '}
                                                    • Bobot {s.bobot}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[11px] text-muted-foreground">
                                                {formatTanggal(s.waktu)}
                                            </span>
                                        </div>
                                        {s.alasan && (
                                            <p className="mt-2 text-body-sm text-foreground">
                                                &quot;{s.alasan}&quot;
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Riwayat Putusan Majelis Sebelumnya (jika ada) */}
                    {detail.riwayat_keputusan &&
                        detail.riwayat_keputusan.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="flex items-center gap-2 text-caption-xs font-bold tracking-wider text-foreground uppercase">
                                    <Scale className="size-4 text-muted-foreground" />
                                    <span>
                                        Riwayat Putusan Sidang Sebelumnya
                                    </span>
                                </h3>
                                <div className="mt-3 space-y-3">
                                    {detail.riwayat_keputusan.map((k) => (
                                        <div
                                            key={k.id}
                                            className="text-caption-sm rounded-lg border border-border/60 bg-muted/20 p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    variant="outline"
                                                    className="font-semibold"
                                                >
                                                    {k.jenis}
                                                </Badge>
                                                <span className="font-mono text-[11px] text-muted-foreground">
                                                    {formatTanggal(k.waktu)}
                                                </span>
                                            </div>
                                            {k.alasan && (
                                                <p className="mt-2 text-body-sm text-muted-foreground">
                                                    {k.alasan}
                                                </p>
                                            )}
                                            {k.perintah && (
                                                <p className="mt-1 text-body-sm text-foreground">
                                                    Perintah: {k.perintah}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Tombol Lanjut ke Langkah 2 */}
                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <Link
                            href="/auditor/antrean"
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                }),
                                'gap-1.5 text-xs',
                            )}
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke antrean</span>
                        </Link>

                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setCurrentStep(2);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="gap-2 text-xs font-semibold"
                        >
                            <span>Lanjut ke Sidang Putusan</span>
                            <ArrowRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 2: SIDANG PUTUSAN AUDITOR */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isSla ? (
                            /* Skenario 1: Pemicu Keterlambatan SLA */
                            <div className="space-y-5 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 size-5 shrink-0 text-destructive" />
                                    <div>
                                        <h4 className="text-body-sm font-semibold text-foreground">
                                            Penerbitan Instruksi Tindak Lanjut
                                            SLA
                                        </h4>
                                        <p className="text-caption-sm mt-1 leading-relaxed text-muted-foreground">
                                            Tiket telah melewati batas waktu SLA
                                            resmi tahap{' '}
                                            <strong>
                                                {detail.eskalasi.tahap ||
                                                    'penanganan'}
                                            </strong>
                                            . Sesuai wewenang independen,
                                            Auditor menetapkan perintah tertulis
                                            yang mengikat dan tenggat waktu
                                            kepatuhan bagi instansi pelaksana.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <FieldLabel className="text-xs font-semibold">
                                            Instruksi / Perintah Tertulis
                                            Auditor{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <span className="text-caption-xs text-muted-foreground">
                                            {perintah.length}/256
                                        </span>
                                    </div>
                                    <Textarea
                                        value={perintah}
                                        maxLength={256}
                                        onChange={(e) =>
                                            setPerintah(e.target.value)
                                        }
                                        placeholder="Contoh: Dinas wajib segera menuntaskan penerbitan surat survei lapangan (maks. 256 karakter)..."
                                        rows={4}
                                        className="text-xs"
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Minimal 10 karakter, maksimal 256
                                        karakter. Perintah ini akan tampil
                                        secara publik pada detail tiket dan
                                        dikirim sebagai notifikasi resmi ke
                                        dinas terkait.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <FieldLabel className="text-xs font-semibold">
                                        Tenggat Waktu Kepatuhan Perintah{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        type="date"
                                        value={tenggat}
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        onChange={(e) =>
                                            setTenggat(e.target.value)
                                        }
                                        className="max-w-xs text-xs"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Skenario 2: Pemicu Non-SLA (Sanggahan, Ronde 4x, Tanpa Kuorum 14 Hari) */
                            <div className="space-y-6">
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <h4 className="text-caption-xs font-bold tracking-wider text-foreground uppercase">
                                        Opsi Amar Putusan Sidang (Final &
                                        Mengikat)
                                    </h4>
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setJenis('PERBAIKAN_SAH')
                                            }
                                            className={cn(
                                                'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                                                jenis === 'PERBAIKAN_SAH'
                                                    ? 'border-primary bg-primary/5 shadow-2xs ring-1 ring-primary'
                                                    : 'border-border bg-card hover:border-foreground/20',
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2
                                                    className={cn(
                                                        'size-4',
                                                        jenis ===
                                                            'PERBAIKAN_SAH'
                                                            ? 'text-primary'
                                                            : 'text-muted-foreground',
                                                    )}
                                                />
                                                <span className="text-body-sm font-semibold text-foreground">
                                                    1. Tetapkan Perbaikan Sah
                                                </span>
                                            </div>
                                            <p className="mt-2 text-caption-xs leading-relaxed text-muted-foreground">
                                                Pekerjaan fisik perbaikan dinas
                                                dinyatakan sah dan memenuhi
                                                standar teknis. Status tiket
                                                berubah menjadi{' '}
                                                <strong className="text-foreground">
                                                    TERTUTUP_AUDITOR
                                                </strong>
                                                .
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setJenis('KERJAKAN_ULANG')
                                            }
                                            className={cn(
                                                'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                                                jenis === 'KERJAKAN_ULANG'
                                                    ? 'border-destructive bg-destructive/5 shadow-2xs ring-1 ring-destructive'
                                                    : 'border-border bg-card hover:border-foreground/20',
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RotateCcw
                                                    className={cn(
                                                        'size-4',
                                                        jenis ===
                                                            'KERJAKAN_ULANG'
                                                            ? 'text-destructive'
                                                            : 'text-muted-foreground',
                                                    )}
                                                />
                                                <span className="text-body-sm font-semibold text-foreground">
                                                    2. Perintahkan Kerjakan
                                                    Ulang
                                                </span>
                                            </div>
                                            <p className="mt-2 text-caption-xs leading-relaxed text-muted-foreground">
                                                Pekerjaan fisik dinilai belum
                                                tuntas atau tidak sesuai aduan.
                                                Status tiket dikembalikan ke{' '}
                                                <strong className="text-foreground">
                                                    DIKERJAKAN
                                                </strong>{' '}
                                                dengan tenggat baru.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Alasan Pertimbangan Yuridis / Teknis */}
                                <div className="space-y-1.5 rounded-xl border border-border bg-card p-5">
                                    <div className="flex items-center justify-between">
                                        <FieldLabel className="text-xs font-semibold">
                                            Alasan Pertimbangan Yuridis & Teknis
                                            Auditor{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <span className="text-caption-xs text-muted-foreground">
                                            {alasan.length}/256
                                        </span>
                                    </div>
                                    <Textarea
                                        value={alasan}
                                        maxLength={256}
                                        onChange={(e) =>
                                            setAlasan(e.target.value)
                                        }
                                        placeholder="Uraikan dasar pertimbangan penetapan putusan ini (maksimal 256 karakter)..."
                                        rows={4}
                                        className="text-xs"
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Minimal 10 karakter, maksimal 256
                                        karakter. Alasan pertimbangan ini akan
                                        tercatat permanen di audit log dan
                                        tampil secara transparan kepada publik.
                                    </p>
                                </div>

                                {/* Form Tambahan Jika Kerjakan Ulang */}
                                {jenis === 'KERJAKAN_ULANG' && (
                                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <FieldLabel className="text-xs font-semibold">
                                                Instruksi Khusus Perbaikan Ulang
                                            </FieldLabel>
                                            <Input
                                                type="text"
                                                value={perintah}
                                                onChange={(e) =>
                                                    setPerintah(e.target.value)
                                                }
                                                placeholder="Contoh: Lakukan pengelupasan aspal dan pemadatan ulang..."
                                                className="text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <FieldLabel className="text-xs font-semibold">
                                                Tenggat Waktu Pengerjaan Ulang{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                type="date"
                                                value={tenggat}
                                                min={
                                                    new Date()
                                                        .toISOString()
                                                        .split('T')[0]
                                                }
                                                onChange={(e) =>
                                                    setTenggat(e.target.value)
                                                }
                                                className="text-xs"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Aksi Form */}
                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setCurrentStep(1);
                                    window.scrollTo({
                                        top: 0,
                                        behavior: 'smooth',
                                    });
                                }}
                                disabled={isSubmitting}
                                className="gap-1.5 text-xs"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali ke Berkas</span>
                            </Button>

                            <Button
                                type="submit"
                                variant="default"
                                size="sm"
                                disabled={!isFormValid || isSubmitting}
                                className="gap-2 text-xs font-semibold"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Menerbitkan Putusan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Scale className="size-4" />
                                        <span>Tetapkan Putusan Resmi</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

AuditorDetailPage.layout = (page: ReactNode) => (
    <InternalLayout
        title="Telaah perkara eskalasi"
        breadcrumb="Auditor > Antrean > Telaah Perkara"
    >
        {page}
    </InternalLayout>
);
