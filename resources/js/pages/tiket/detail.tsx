import { lazy, Suspense, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Compass,
    EyeOff,
    FileText,
    Flag,
    GitBranch,
    ImageIcon,
    Inbox,
    Lock,
    MapPin,
    Navigation,
    Scale,
    Share2,
    Shield,
    ShieldAlert,
    ThumbsUp,
    ZoomIn,
    Copy,
    Check,
} from 'lucide-react';
import type { TiketDetail, LampiranFoto, RiwayatStatusItem } from '@/types/tiket';
import type { User } from '@/types/auth';
import InternalLayout from '@/layouts/InternalLayout';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import InstansiStatusBadge, {
    formatInstansiMessage,
} from '@/components/instansi/InstansiStatusBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Toaster, toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import ModalLaporKonten from '@/components/tiket/ModalLaporKonten';
import ModalKonfirmasiLogin from '@/components/tiket/ModalKonfirmasiLogin';
import ModalBukaIdentitasPelapor from '@/components/admin/ModalBukaIdentitasPelapor';
import ModalBeriSuaraVerifikasi from '@/components/verifikasi/ModalBeriSuaraVerifikasi';
import TiketRiwayatStatusTimeline from '@/components/tiket/TiketRiwayatStatusTimeline';

const LocationMap = lazy(
    () => import('@/components/instansi/InstansiLocationMap'),
);

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

function EvidencePhoto({
    photo,
    title,
    description,
    onPreview,
}: {
    photo: LampiranFoto | null;
    title: string;
    description: string;
    onPreview: (photo: LampiranFoto) => void;
}) {
    const [failed, setFailed] = useState(false);

    return (
        <figure className="overflow-hidden rounded-lg border border-border bg-card">
            <figcaption className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 text-body-sm font-medium">
                <span>{title}</span>
                {photo && (
                    <span className="font-normal text-muted-foreground">
                        {formatDate(photo.created_at)}
                    </span>
                )}
            </figcaption>

            {photo && !failed ? (
                <button
                    type="button"
                    onClick={() => onPreview(photo)}
                    className="group relative block aspect-video w-full bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Perbesar ${title.toLowerCase()}`}
                >
                    <img
                        src={photo.url}
                        alt={title}
                        onError={() => setFailed(true)}
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-caption-xs shadow-xs">
                        <ZoomIn className="size-3" />
                        Perbesar
                    </span>
                </button>
            ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-muted/25 p-5 text-center">
                    <ImageIcon className="size-7 text-muted-foreground" />
                    <p className="text-body-sm font-medium text-foreground">
                        {failed ? 'Foto gagal dimuat' : 'Foto belum tersedia'}
                    </p>
                    <p className="max-w-xs text-body-sm text-muted-foreground">
                        {failed
                            ? 'Buka ulang halaman untuk mencoba memuat foto kembali.'
                            : description}
                    </p>
                </div>
            )}
        </figure>
    );
}

interface DetailTiketProps {
    tiket: TiketDetail;
}

export default function DetailTiketPage({
    tiket: initialTiket,
}: DetailTiketProps) {
    const { auth } = usePage<{ auth?: { user?: User | null } }>().props;
    const currentUser = auth?.user;

    const [tiket, setTiket] = useState<TiketDetail>(initialTiket);
    const [preview, setPreview] = useState<LampiranFoto | null>(null);
    const [documentPage, setDocumentPage] = useState(1);
    const [loadingDukungan, setLoadingDukungan] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [loginActionDesc, setLoginActionDesc] = useState(
        'memberikan dukungan',
    );
    const [laporModalOpen, setLaporModalOpen] = useState(false);
    const [modalIdentitasOpen, setModalIdentitasOpen] = useState(false);
    const [modalVerifikasiOpen, setModalVerifikasiOpen] = useState(false);
    const [copiedTicket, setCopiedTicket] = useState(false);
    const [activePhotoTab, setActivePhotoTab] = useState<'awal' | 'sesudah'>('awal');

    const handleCopyTicket = async () => {
        try {
            await navigator.clipboard.writeText(tiket.nomor_tiket);
            setCopiedTicket(true);
            setTimeout(() => setCopiedTicket(false), 2000);
            toast.success('Nomor Tiket Disalin', `Nomor #${tiket.nomor_tiket} telah disalin ke papan klip.`);
        } catch {
            toast.error('Gagal Menyalin', 'Tidak dapat menyalin nomor tiket.');
        }
    };

    const documentPages = Math.max(1, Math.ceil(tiket.berita_acara.length / 3));

    const latitude = Number(tiket.lintang);
    const longitude = Number(tiket.bujur);
    const validLocation =
        tiket.lintang != null &&
        tiket.bujur != null &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180;

    const share = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Tautan tiket disalin');
        } catch {
            toast.error(
                'Tautan gagal disalin',
                'Salin alamat halaman melalui peramban.',
            );
        }
    };

    // Handler Toggle Dukungan (FR-INT-01 / BR-DUK)
    const handleToggleDukungan = async () => {
        if (!currentUser) {
            setLoginActionDesc('memberikan dukungan');
            setLoginModalOpen(true);
            return;
        }

        if (currentUser.peran !== 'warga') {
            toast.warning(
                'Aksi Dibatasi',
                'Hanya akun warga Kota Depok yang dapat memberikan dukungan laporan.',
            );
            return;
        }

        setLoadingDukungan(true);

        try {
            const csrfToken = (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content;
            const res = await fetch(`/tiket/${tiket.nomor_tiket}/dukung`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(
                    'Gagal Memberi Dukungan',
                    data.pesan || 'Terjadi kesalahan sistem.',
                );
                return;
            }

            setTiket((prev) => ({
                ...prev,
                sudah_didukung: data.sudah_didukung,
                total_dukungan: data.total_dukungan,
            }));

            toast.success(
                data.sudah_didukung
                    ? 'Dukungan Dicatat'
                    : 'Dukungan Dibatalkan',
                data.pesan,
            );
        } catch {
            toast.error(
                'Kendala Jaringan',
                'Gagal menghubungi server. Silakan coba kembali.',
            );
        } finally {
            setLoadingDukungan(false);
        }
    };

    // Handler Modal Lapor Pelanggaran Konten (FR-INT-03)
    const handleOpenLaporKonten = () => {
        if (!currentUser) {
            setLoginActionDesc('melaporkan pelanggaran konten');
            setLoginModalOpen(true);
            return;
        }

        if (currentUser.peran !== 'warga') {
            toast.warning(
                'Aksi Dibatasi',
                'Hanya akun warga yang dapat melaporkan konten ke antrean moderasi.',
            );
            return;
        }

        setLaporModalOpen(true);
    };

    // Handler Navigasi Beri Suara Verifikasi Warga (FR-VER-01 s/d FR-VER-04)
    const handleBeriSuara = () => {
        if (!currentUser) {
            setLoginActionDesc('memberikan suara verifikasi');
            setLoginModalOpen(true);
            return;
        }

        if (currentUser.peran !== 'warga') {
            toast.warning(
                'Aksi Dibatasi',
                'Hanya akun warga yang dapat memberikan suara verifikasi.',
            );
            return;
        }

        router.visit(`/warga/verifikasi/${tiket.nomor_tiket}?from=tiket`);
    };

    const getBackNavigation = (user: User | null | undefined) => {
        if (!user) {
            return {
                href: '/peta',
                label: 'Kembali ke peta laporan',
            };
        }
        switch (user.peran) {
            case 'admin':
                return {
                    href: '/admin/antrean-routing',
                    label: 'Antrean routing',
                };
            case 'auditor':
                return {
                    href: '/auditor/antrean',
                    label: 'Antrean arbitrase',
                };
            case 'instansi':
                return {
                    href: '/instansi/antrean',
                    label: 'Antrean tiket',
                };
            case 'warga':
            default:
                return {
                    href: '/warga/riwayat',
                    label: 'Kembali ke Riwayat Laporan',
                };
        }
    };

    const getRoleBreadcrumb = (peran: string, nomorTiket: string) => {
        switch (peran) {
            case 'admin':
                return `Admin > Moderasi & Routing > #${nomorTiket}`;
            case 'auditor':
                return `Auditor > Pengawasan Arbitrase > #${nomorTiket}`;
            case 'instansi':
                return `Instansi > Antrean Tiket > #${nomorTiket}`;
            case 'warga':
            default:
                return `Warga > Riwayat Laporan > #${nomorTiket}`;
        }
    };

    // Banner kontekstual RBAC untuk peran internal
    const renderRoleBanner = () => {
        if (!currentUser) {
            return null;
        }

        switch (currentUser.peran) {
            case 'admin':
                return (
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                            <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <span className="font-semibold text-foreground">
                                    Akses Administrator Sistem:{' '}
                                </span>
                                <span className="text-muted-foreground">
                                    Tinjau moderasi konten, laporan pelanggaran,
                                    atau routing instansi untuk tiket ini.
                                </span>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setModalIdentitasOpen(true)}
                                className="h-8 gap-1.5 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                                title="Buka Identitas Pelapor"
                                aria-label="Buka Identitas Pelapor"
                            >
                                <Lock className="size-3" />
                                <span className="hidden sm:inline">
                                    Buka Identitas
                                </span>
                            </Button>
                            <Link
                                href="/admin/moderasi"
                                title="Antrean Moderasi"
                                aria-label="Antrean Moderasi"
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className: 'h-8 text-xs gap-1.5',
                                })}
                            >
                                <ShieldAlert className="size-3.5 sm:hidden" />
                                <span className="hidden sm:inline">
                                    Antrean Moderasi
                                </span>
                            </Link>
                            <Link
                                href="/admin/antrean-routing"
                                title="Antrean Routing"
                                aria-label="Antrean Routing"
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className: 'h-8 text-xs gap-1.5',
                                })}
                            >
                                <GitBranch className="size-3.5 sm:hidden" />
                                <span className="hidden sm:inline">
                                    Antrean Routing
                                </span>
                            </Link>
                        </div>
                    </div>
                );
            case 'auditor':
                return (
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                            <Scale className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
                            <div>
                                <span className="font-semibold text-foreground">
                                    Akses Auditor Independen:{' '}
                                </span>
                                <span className="text-muted-foreground">
                                    Tiket ini berada di bawah yurisdiksi
                                    pengawasan independen dan arbitrase SLA.
                                </span>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setModalIdentitasOpen(true)}
                                className="h-8 gap-1.5 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                                title="Buka Identitas Pelapor"
                                aria-label="Buka Identitas Pelapor"
                            >
                                <Lock className="size-3" />
                                <span className="hidden sm:inline">
                                    Buka Identitas
                                </span>
                            </Button>
                            <Link
                                href="/auditor/antrean"
                                title="Buka Antrean Arbitrase"
                                aria-label="Buka Antrean Arbitrase"
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className: 'h-8 text-xs gap-1.5',
                                })}
                            >
                                <Scale className="size-3.5 sm:hidden" />
                                <span className="hidden sm:inline">
                                    Buka Antrean Arbitrase
                                </span>
                            </Link>
                        </div>
                    </div>
                );
            case 'instansi':
                return (
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                            <Building2 className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <div>
                                <span className="font-semibold text-foreground">
                                    Akses Petugas Instansi:{' '}
                                </span>
                                <span className="text-muted-foreground">
                                    Anda membuka lembar tiket ini sebagai
                                    petugas dinas penanggung jawab.
                                </span>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <Link
                                href="/instansi/antrean"
                                title="Antrean Tugas"
                                aria-label="Antrean Tugas"
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className: 'h-8 text-xs gap-1.5',
                                })}
                            >
                                <Inbox className="size-3.5 sm:hidden" />
                                <span className="hidden sm:inline">
                                    Antrean Tugas
                                </span>
                            </Link>
                            <Link
                                href="/instansi/sengketa"
                                title="Panel Sengketa"
                                aria-label="Panel Sengketa"
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                    className: 'h-8 text-xs gap-1.5',
                                })}
                            >
                                <Scale className="size-3.5 sm:hidden" />
                                <span className="hidden sm:inline">
                                    Panel Sengketa
                                </span>
                            </Link>
                        </div>
                    </div>
                );
            case 'warga':
            default:
                return null;
        }
    };

    const backNav = getBackNavigation(currentUser);

    const mainTicketContent = (
        <div className="space-y-8 pb-16">
            {/* Navigasi Kembali Sesuai Wireframe */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="h-9 px-0 text-body-sm hover:bg-transparent hover:text-foreground text-muted-foreground gap-1.5 cursor-pointer font-medium"
                    render={<Link href={backNav.href} />}
                >
                    <ArrowLeft className="size-4" />
                    <span>Kembali</span>
                </Button>
            </div>

            {/* Banner Khusus RBAC Internal */}
            {renderRoleBanner()}

            {/* Banner Status Laporan Disembunyikan oleh Tim Moderasi */}
            {tiket.disembunyikan ? (
                <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                    <EyeOff className="mx-auto size-8 text-destructive" />
                    <h2 className="text-body-base font-semibold text-destructive">
                        Konten Laporan Disembunyikan oleh Tim Moderasi
                    </h2>
                    <p className="mx-auto max-w-xl text-body-sm text-muted-foreground">
                        Laporan dengan nomor tiket{' '}
                        <strong className="font-mono text-foreground">
                            {tiket.nomor_tiket}
                        </strong>{' '}
                        sedang atau telah dimoderasi oleh Administrator sistem
                        karena terindikasi memuat pelanggaran panduan komunitas.
                    </p>
                    <p className="text-caption-xs text-muted-foreground">
                        Sesuai prinsip transparansi Jagains, nomor tiket, status
                        penanganan dinas, dan log mutasi waktu tetap tercatat
                        secara permanen untuk keperluan audit.
                    </p>
                </div>
            ) : (
                <>
                    {/* Header Tiket Sesuai Wireframe */}
                    <div className="space-y-4 border-b border-border/80 pb-6">
                        {/* Baris 1: Judul Laporan (Kiri) & ID Tiket + Salin (Kanan) */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display max-w-3xl leading-snug">
                                {tiket.judul}
                            </h1>

                            <button
                                type="button"
                                onClick={handleCopyTicket}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-caption-xs sm:text-body-sm font-mono font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                                title="Klik untuk salin nomor tiket"
                            >
                                <span>#{tiket.nomor_tiket}</span>
                                {copiedTicket ? (
                                    <Check className="size-3.5 text-emerald-500" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                            </button>
                        </div>

                        {/* Baris 2: Badge Status (Kiri) & Tombol Aksi (Kanan) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                            {/* Badges Status */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                <Badge
                                    variant="outline"
                                    className="h-8 px-3.5 rounded-full text-caption-xs font-semibold capitalize bg-muted/40 border-border/70"
                                >
                                    Tingkat {tiket.keparahan}
                                </Badge>

                                <InstansiStatusBadge status={tiket.status} />

                                {tiket.sisa_sla_teks ? (
                                    <Badge
                                        variant={
                                            tiket.kondisi_sla === 'lewat_sla'
                                                ? 'sla-late'
                                                : tiket.kondisi_sla === 'hampir_lewat'
                                                  ? 'sla-warn'
                                                  : tiket.kondisi_sla === 'dalam_sla'
                                                    ? 'sla-safe'
                                                    : 'outline'
                                        }
                                        className="h-8 px-3.5 rounded-full text-caption-xs font-medium"
                                    >
                                        {tiket.sisa_sla_teks}
                                    </Badge>
                                ) : (
                                    tiket.instansi_nama && (
                                        <Badge variant="outline" className="h-8 px-3.5 rounded-full text-caption-xs font-medium text-muted-foreground border-border/70">
                                            {tiket.instansi_nama}
                                        </Badge>
                                    )
                                )}
                            </div>

                            {/* Tombol Aksi Kanan: Dukung, Bagikan, Lapor */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Button
                                    type="button"
                                    variant={tiket.sudah_didukung ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={loadingDukungan}
                                    onClick={handleToggleDukungan}
                                    className="h-9 px-3.5 rounded-xl gap-2 text-caption-xs sm:text-body-sm font-semibold cursor-pointer shadow-xs"
                                    title={tiket.sudah_didukung ? 'Batalkan dukungan' : 'Dukung laporan ini'}
                                >
                                    <ThumbsUp className={cn('size-4', tiket.sudah_didukung && 'fill-current')} />
                                    <span className="font-semibold">{tiket.total_dukungan.toLocaleString('id-ID')}</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={share}
                                    className="size-9 p-0 rounded-xl cursor-pointer"
                                    title="Bagikan Tautan Tiket"
                                    aria-label="Bagikan Tautan Tiket"
                                >
                                    <Share2 className="size-4" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenLaporKonten}
                                    className="size-9 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
                                    title="Laporkan Pelanggaran Konten"
                                    aria-label="Laporkan Pelanggaran Konten"
                                >
                                    <Flag className="size-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Section Media & Metadata (3 Kolom Sesuai Wireframe: Peta | Foto | Detail) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {/* Kolom 1: Peta Lokasi */}
                        <div className="relative overflow-hidden rounded-2xl bg-zinc-950 aspect-[4/3] w-full border border-border/50 shadow-sm flex items-center justify-center">
                            {validLocation ? (
                                <Suspense fallback={<Skeleton className="size-full rounded-2xl" />}>
                                    <LocationMap
                                        latitude={latitude}
                                        longitude={longitude}
                                        className="size-full rounded-2xl h-full min-h-full"
                                    />
                                </Suspense>
                            ) : (
                                <span className="text-zinc-500 font-display font-semibold text-body-sm">Peta</span>
                            )}
                        </div>

                        {/* Kolom 2: Bukti Foto Kerusakan */}
                        <div className="relative overflow-hidden rounded-2xl bg-zinc-950 aspect-[4/3] w-full border border-border/50 shadow-sm flex items-center justify-center group">
                            {tiket.foto_awal ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreview(
                                            activePhotoTab === 'sesudah' && tiket.foto_sesudah
                                                ? tiket.foto_sesudah
                                                : tiket.foto_awal,
                                        )
                                    }
                                    className="size-full relative block focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                                    aria-label="Perbesar foto bukti"
                                >
                                    <img
                                        src={
                                            activePhotoTab === 'sesudah' && tiket.foto_sesudah
                                                ? tiket.foto_sesudah.url
                                                : tiket.foto_awal.url
                                        }
                                        alt="Bukti Foto Kerusakan"
                                        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur-md px-2.5 py-1 text-caption-xs text-white shadow-md">
                                        <ZoomIn className="size-3.5" />
                                        <span>Perbesar</span>
                                    </span>
                                </button>
                            ) : (
                                <span className="text-zinc-500 font-display font-semibold text-body-sm">Foto</span>
                            )}

                            {/* Toggle Foto Awal vs Sesudah jika laporan sudah selesai diperbaiki */}
                            {tiket.foto_awal && tiket.foto_sesudah && (
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-xl bg-black/70 backdrop-blur-md p-1 border border-white/10 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => setActivePhotoTab('awal')}
                                        className={cn(
                                            'px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer',
                                            activePhotoTab === 'awal'
                                                ? 'bg-white text-zinc-950 shadow-xs'
                                                : 'text-white/70 hover:text-white',
                                        )}
                                    >
                                        Sebelum
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActivePhotoTab('sesudah')}
                                        className={cn(
                                            'px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer',
                                            activePhotoTab === 'sesudah'
                                                ? 'bg-white text-zinc-950 shadow-xs'
                                                : 'text-white/70 hover:text-white',
                                        )}
                                    >
                                        Sesudah
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Kolom 3: Rincian Metadata */}
                        <div className="flex flex-col justify-between py-1 space-y-4 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-2xs">
                            <div className="space-y-1">
                                <h3 className="text-body-sm font-bold text-foreground">
                                    Tanggal Pelaporan
                                </h3>
                                <p className="text-body-sm text-muted-foreground">
                                    {formatDate(tiket.created_at)}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-body-sm font-bold text-foreground">
                                    Lokasi
                                </h3>
                                <p className="text-body-sm text-muted-foreground leading-relaxed">
                                    Kel. {tiket.kelurahan_nama}, Kec. {tiket.kecamatan_nama}, Kota Depok
                                </p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-body-sm font-bold text-foreground">
                                    Kategori Kerusakan
                                </h3>
                                <p className="text-body-sm text-muted-foreground">
                                    {tiket.kategori_nama}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-body-sm font-bold text-foreground">
                                    Instansi Terkait
                                </h3>
                                <p className="text-body-sm text-muted-foreground">
                                    {tiket.instansi_nama || 'Belum ditetapkan'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section Keterangan Detail Kerusakan */}
                    <section className="space-y-3">
                        <h2 className="font-display text-title-md sm:text-title-lg font-bold text-foreground">
                            Keterangan Detail Kerusakan
                        </h2>
                        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs">
                            <p className="text-body-sm sm:text-body-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                                {tiket.keterangan || 'Tidak ada keterangan tambahan.'}
                            </p>
                        </div>
                    </section>

                    {/* Section Lini Masa Laporan (Timeline Vertikal Sesuai Referensi & Urutan Kronologis Descending) */}
                    <section className="space-y-4 pt-2">
                        <h2 className="font-display text-title-md sm:text-title-lg font-bold text-foreground">
                            Lini Masa Laporan
                        </h2>

                        <TiketRiwayatStatusTimeline
                            riwayatStatus={tiket.riwayat_status}
                            pengalihan={tiket.pengalihan}
                            tiketStatus={tiket.status}
                            nomorTiket={tiket.nomor_tiket}
                            onBeriSuara={handleBeriSuara}
                            onPreviewPhoto={(photo) => setPreview(photo)}
                        />
                    </section>



                </>
            )}

            {/* Modal Dialog Interaksi */}
            <Dialog
                open={!!preview}
                onOpenChange={(open) => !open && setPreview(null)}
            >
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle>
                            {preview?.tahap === 'awal'
                                ? 'Foto sebelum perbaikan'
                                : 'Foto sesudah perbaikan'}
                        </DialogTitle>
                        <DialogDescription>
                            Dokumentasi lapangan tiket #{tiket.nomor_tiket}.
                        </DialogDescription>
                    </DialogHeader>
                    {preview && (
                        <img
                            src={preview.url}
                            alt="Dokumentasi laporan diperbesar"
                            className="max-h-[70vh] w-full object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>

            <ModalKonfirmasiLogin
                open={loginModalOpen}
                onOpenChange={setLoginModalOpen}
                judulAksi={loginActionDesc}
            />

            <ModalLaporKonten
                open={laporModalOpen}
                onOpenChange={setLaporModalOpen}
                nomorTiket={tiket.nomor_tiket}
            />

            <ModalBukaIdentitasPelapor
                nomorTiket={tiket.nomor_tiket}
                isOpen={modalIdentitasOpen}
                onClose={() => setModalIdentitasOpen(false)}
            />

            <ModalBeriSuaraVerifikasi
                open={modalVerifikasiOpen}
                onClose={() => setModalVerifikasiOpen(false)}
                tiket={tiket as any}
                onSuccess={() => router.reload()}
            />
        </div>
    );

    // KONDISI 1: Pengguna Terautentikasi (Admin, Auditor, Instansi, Warga)
    if (currentUser) {
        return (
            <InternalLayout
                title={`Detail Laporan: #${tiket.nomor_tiket}`}
                breadcrumb={
                    currentUser.peran === 'warga'
                        ? `Warga > Riwayat Laporan > #${tiket.nomor_tiket}`
                        : getRoleBreadcrumb(currentUser.peran, tiket.nomor_tiket)
                }
                fullWidth
            >
                <Head>
                    <title>{`Tiket ${tiket.nomor_tiket}: ${tiket.judul} — Jagains`}</title>
                    <meta
                        name="description"
                        content={`Pantau akuntabilitas penanganan laporan fasilitas publik nomor tiket ${tiket.nomor_tiket} di Kota Depok secara transparan.`}
                    />
                </Head>
                {mainTicketContent}
            </InternalLayout>
        );
    }

    // KONDISI 2: Pengguna Publik / Tamu (Tanpa Login)
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>{`Tiket ${tiket.nomor_tiket}: ${tiket.judul} — Jagains`}</title>
                <meta
                    name="description"
                    content={`Pantau akuntabilitas penanganan laporan fasilitas publik nomor tiket ${tiket.nomor_tiket} di Kota Depok secara transparan.`}
                />
            </Head>

            <LandingNavbar />

            <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/peta"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali ke Peta Laporan</span>
                    </Link>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Shield className="size-3.5 text-primary" />
                        <span>Platform Pengawasan Publik Kota Depok</span>
                    </div>
                </div>

                {mainTicketContent}
            </main>

            <Toaster />
            <LandingFooter />
        </div>
    );
}
