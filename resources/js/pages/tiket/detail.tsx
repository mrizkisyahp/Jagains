import { lazy, Suspense, useEffect, useState } from 'react';
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
    X,
    ClipboardCheck,
    Calendar,
    Hammer,
    CheckSquare,
} from 'lucide-react';
import type {
    TiketDetail,
    LampiranFoto,
    RiwayatStatusItem,
} from '@/types/tiket';
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
import ModalTerimaTiket from '@/components/instansi/ModalTerimaTiket';
import ModalUsulanTolak from '@/components/instansi/ModalUsulanTolak';
import ModalSurveiSelesai from '@/components/instansi/ModalSurveiSelesai';
import ModalJadwalAnggaran from '@/components/instansi/ModalJadwalAnggaran';
import ModalAjukanSelesai from '@/components/instansi/ModalAjukanSelesai';
import ModalBeritaAcara from '@/components/instansi/ModalBeritaAcara';
import FotoKondisiLapanganView from '@/components/instansi/FotoKondisiLapanganView';
import KelolaBeritaAcaraView from '@/components/instansi/KelolaBeritaAcaraView';
import AjukanPenyelesaianView from '@/components/instansi/AjukanPenyelesaianView';

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
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setTiket(initialTiket);
    }, [initialTiket]);
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
    const [modalTerimaOpen, setModalTerimaOpen] = useState(false);
    const [modalUsulTolakOpen, setModalUsulTolakOpen] = useState(false);
    const [modalSurveiOpen, setModalSurveiOpen] = useState(false);
    const [modalAnggaranOpen, setModalAnggaranOpen] = useState(false);
    const [modalAjukanSelesaiOpen, setModalAjukanSelesaiOpen] = useState(false);
    const [modalBeritaAcaraOpen, setModalBeritaAcaraOpen] = useState(false);
    const [isCapturingMulai, setIsCapturingMulai] = useState(false);
    const [isKelolaBeritaAcara, setIsKelolaBeritaAcara] = useState(false);
    const [isAjukanPenyelesaian, setIsAjukanPenyelesaian] = useState(false);
    const [copiedTicket, setCopiedTicket] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('aksi') === 'mulai-pengerjaan') {
                setIsCapturingMulai(true);
            }
            if (params.get('aksi') === 'berita-acara') {
                setIsKelolaBeritaAcara(true);
            }
            if (params.get('aksi') === 'ajukan-selesai') {
                setIsAjukanPenyelesaian(true);
            }
        }
    }, []);
    const [activePhotoTab, setActivePhotoTab] = useState<'awal' | 'sesudah'>(
        'awal',
    );

    const handleCopyTicket = async () => {
        try {
            await navigator.clipboard.writeText(tiket.nomor_tiket);
            setCopiedTicket(true);
            setTimeout(() => setCopiedTicket(false), 2000);
            toast.success(
                'Nomor Tiket Disalin',
                `Nomor #${tiket.nomor_tiket} telah disalin ke papan klip.`,
            );
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
                'Hanya akun warga terdaftar yang dapat memberikan dukungan laporan.',
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
                    label: 'Kembali',
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
                return 'Instansi > Daftar Laporan > Detail Laporan';
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
                    className="h-9 cursor-pointer gap-1.5 px-0 text-body-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
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
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <h1 className="max-w-3xl font-display text-2xl leading-snug font-bold tracking-tight text-foreground sm:text-3xl">
                                {tiket.judul}
                            </h1>

                            <button
                                type="button"
                                onClick={handleCopyTicket}
                                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-xl border border-border/60 bg-muted/40 px-3 py-1.5 text-caption-xs font-mono font-medium text-muted-foreground shadow-2xs transition-colors hover:bg-muted hover:text-foreground sm:self-auto sm:text-body-sm"
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
                        <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
                            {/* Badges Status */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                <Badge
                                    variant="outline"
                                    className="h-8 rounded-full border-border/70 bg-muted/40 px-3.5 text-caption-xs font-semibold capitalize"
                                >
                                    Tingkat {tiket.keparahan}
                                </Badge>

                                <InstansiStatusBadge status={tiket.status} />

                                {tiket.sisa_sla_teks ? (
                                    <Badge
                                        variant={
                                            tiket.kondisi_sla === 'lewat_sla'
                                                ? 'sla-late'
                                                : tiket.kondisi_sla ===
                                                    'hampir_lewat'
                                                  ? 'sla-warn'
                                                  : tiket.kondisi_sla ===
                                                      'dalam_sla'
                                                    ? 'sla-safe'
                                                    : 'outline'
                                        }
                                        className="h-8 rounded-full px-3.5 text-caption-xs font-medium"
                                    >
                                        {tiket.sisa_sla_teks}
                                    </Badge>
                                ) : (
                                    tiket.instansi_nama && (
                                        <Badge
                                            variant="outline"
                                            className="h-8 rounded-full border-border/70 px-3.5 text-caption-xs font-medium text-muted-foreground"
                                        >
                                            {tiket.instansi_nama}
                                        </Badge>
                                    )
                                )}
                            </div>

                            {/* Tombol Aksi Kanan: Dukung, Bagikan, Lapor */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Button
                                    type="button"
                                    variant={
                                        tiket.sudah_didukung
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    disabled={loadingDukungan}
                                    onClick={handleToggleDukungan}
                                    className="h-9 cursor-pointer gap-2 rounded-xl px-3.5 text-caption-xs font-semibold shadow-xs sm:text-body-sm"
                                    title={
                                        tiket.sudah_didukung
                                            ? 'Batalkan dukungan'
                                            : 'Dukung laporan ini'
                                    }
                                >
                                    <ThumbsUp
                                        className={cn(
                                            'size-4',
                                            tiket.sudah_didukung &&
                                                'fill-current',
                                        )}
                                    />
                                    <span className="font-semibold">
                                        {tiket.total_dukungan.toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={share}
                                    className="size-9 cursor-pointer rounded-xl p-0"
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
                                    className="size-9 cursor-pointer rounded-xl p-0 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                                    title="Laporkan Pelanggaran Konten"
                                    aria-label="Laporkan Pelanggaran Konten"
                                >
                                    <Flag className="size-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Section Media & Metadata (3 Kolom Sesuai Wireframe: Peta | Foto | Detail) */}
                    <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
                        {/* Kolom 1: Peta Lokasi */}
                        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-zinc-950 shadow-sm">
                            {validLocation && isMounted ? (
                                <Suspense
                                    fallback={
                                        <Skeleton className="size-full rounded-2xl" />
                                    }
                                >
                                    <LocationMap
                                        latitude={latitude}
                                        longitude={longitude}
                                        className="size-full h-full min-h-full rounded-2xl"
                                    />
                                </Suspense>
                            ) : (
                                <span className="text-body-sm font-display font-semibold text-zinc-500">
                                    Peta
                                </span>
                            )}
                        </div>

                        {/* Kolom 2: Bukti Foto Kerusakan */}
                        <div className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-zinc-950 shadow-sm">
                            {tiket.foto_awal ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreview(
                                            activePhotoTab === 'sesudah' &&
                                                tiket.foto_sesudah
                                                ? tiket.foto_sesudah
                                                : tiket.foto_awal,
                                        )
                                    }
                                    className="relative block size-full cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
                                    aria-label="Perbesar foto bukti"
                                >
                                    <img
                                        src={
                                            activePhotoTab === 'sesudah' &&
                                            tiket.foto_sesudah
                                                ? tiket.foto_sesudah.url
                                                : tiket.foto_awal.url
                                        }
                                        alt="Bukti Foto Kerusakan"
                                        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-xl bg-black/70 px-2.5 py-1 text-caption-xs text-white shadow-md backdrop-blur-md">
                                        <ZoomIn className="size-3.5" />
                                        <span>Perbesar</span>
                                    </span>
                                </button>
                            ) : (
                                <span className="text-body-sm font-display font-semibold text-zinc-500">
                                    Foto
                                </span>
                            )}

                            {/* Toggle Foto Awal vs Sesudah jika laporan sudah selesai diperbaiki */}
                            {tiket.foto_awal && tiket.foto_sesudah && (
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-black/70 p-1 text-[11px] backdrop-blur-md">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActivePhotoTab('awal')
                                        }
                                        className={cn(
                                            'cursor-pointer rounded-lg px-2 py-0.5 font-semibold transition-all',
                                            activePhotoTab === 'awal'
                                                ? 'bg-white text-zinc-950 shadow-xs'
                                                : 'text-white/70 hover:text-white',
                                        )}
                                    >
                                        Sebelum
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActivePhotoTab('sesudah')
                                        }
                                        className={cn(
                                            'cursor-pointer rounded-lg px-2 py-0.5 font-semibold transition-all',
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
                        <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-5 py-1 shadow-2xs sm:p-6">
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
                                <p className="text-body-sm leading-relaxed text-muted-foreground">
                                    Kel. {tiket.kelurahan_nama}, Kec.{' '}
                                    {tiket.kecamatan_nama},{' '}
                                    {tiket.kota_nama || 'Jabodetabek'}
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
                        <h2 className="text-title-md font-display font-bold text-foreground sm:text-title-lg">
                            Keterangan Detail Kerusakan
                        </h2>
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6">
                            <p className="text-body-sm leading-relaxed whitespace-pre-wrap text-foreground/90 sm:text-body-base">
                                {tiket.keterangan ||
                                    'Tidak ada keterangan tambahan.'}
                            </p>
                        </div>
                    </section>

                    {/* Section Lini Masa Laporan (Timeline Vertikal Sesuai Referensi & Urutan Kronologis Descending) */}
                    <section className="space-y-4 pt-2">
                        <h2 className="text-title-md font-display font-bold text-foreground sm:text-title-lg">
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

                    {/* Floating / Sticky Action Bar Khusus Petugas Instansi saat status DITERUSKAN (Sesuai Wireframe) */}
                    {currentUser?.peran === 'instansi' &&
                        tiket.status === 'DITERUSKAN' && (
                            <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6 sm:gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalUsulTolakOpen(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-xl px-5 font-semibold text-foreground shadow-xs transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <span>Usul Penolakan</span>
                                    <X className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setModalTerimaOpen(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-xl bg-foreground px-6 font-semibold text-background shadow-xs transition-colors hover:bg-foreground/90"
                                >
                                    <span>Terima Tiket</span>
                                    <Check className="size-4" />
                                </Button>
                            </div>
                        )}

                    {/* Floating / Sticky Action Bar Khusus Petugas Instansi saat status DITERIMA (Selesaikan Survei Sesuai Wireframe) */}
                    {currentUser?.peran === 'instansi' &&
                        tiket.status === 'DITERIMA' && (
                            <div className="fixed right-4 bottom-4 z-40 flex items-center rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalSurveiOpen(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 px-5 font-semibold text-foreground shadow-xs hover:bg-muted"
                                >
                                    <span>Selesaikan Survei</span>
                                    <ClipboardCheck className="size-4" />
                                </Button>
                            </div>
                        )}

                    {/* Floating / Sticky Action Bar Khusus Petugas Instansi saat status DISURVEI (Jadwalkan Anggaran Sesuai Wireframe) */}
                    {currentUser?.peran === 'instansi' &&
                        tiket.status === 'DISURVEI' && (
                            <div className="fixed right-4 bottom-4 z-40 flex items-center rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalAnggaranOpen(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 px-5 font-semibold text-foreground shadow-xs hover:bg-muted"
                                >
                                    <span>Jadwalkan Anggaran</span>
                                    <Calendar className="size-4" />
                                </Button>
                            </div>
                        )}

                    {/* Floating / Sticky Action Bar Khusus Petugas Instansi saat status TERJADWAL_ANGGARAN (Mulai Pengerjaan Sesuai Wireframe) */}
                    {currentUser?.peran === 'instansi' &&
                        (tiket.status === 'TERJADWAL_ANGGARAN' ||
                            tiket.status === 'SIAP_DIKERJAKAN') && (
                            <div className="fixed right-4 bottom-4 z-40 flex items-center rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCapturingMulai(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 px-5 font-semibold text-foreground shadow-xs hover:bg-muted"
                                >
                                    <span>Mulai Pengerjaan</span>
                                    <Hammer className="size-4" />
                                </Button>
                            </div>
                        )}

                    {/* Floating / Sticky Action Bar Khusus Petugas Instansi saat status DIKERJAKAN (Kelola Berita Acara & Ajukan Selesai Sesuai Wireframe) */}
                    {currentUser?.peran === 'instansi' &&
                        (tiket.status === 'DIKERJAKAN' ||
                            tiket.status === 'DALAM_PENGERJAAN') && (
                            <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6 sm:gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsKelolaBeritaAcara(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 px-5 font-semibold text-foreground shadow-xs hover:bg-muted"
                                >
                                    <span>Kelola Berita Acara</span>
                                    <FileText className="size-4" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setIsAjukanPenyelesaian(true)
                                    }
                                    className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 px-5 font-semibold text-foreground shadow-xs hover:bg-muted"
                                >
                                    <span>Ajukan Selesai</span>
                                    <CheckSquare className="size-4" />
                                </Button>
                            </div>
                        )}
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

            {/* Modal Aksi Petugas Instansi */}
            {currentUser?.peran === 'instansi' && (
                <>
                    <ModalTerimaTiket
                        open={modalTerimaOpen}
                        onClose={() => setModalTerimaOpen(false)}
                        laporan={{
                            id: tiket.id,
                            nomor_tiket: tiket.nomor_tiket,
                            judul: tiket.judul,
                        }}
                        onSuccess={() => router.reload()}
                    />

                    <ModalUsulanTolak
                        open={modalUsulTolakOpen}
                        onClose={() => setModalUsulTolakOpen(false)}
                        laporan={{
                            id: tiket.id,
                            nomor_tiket: tiket.nomor_tiket,
                            judul: tiket.judul,
                        }}
                        onSuccess={() => router.reload()}
                    />

                    <ModalSurveiSelesai
                        open={modalSurveiOpen}
                        onClose={() => setModalSurveiOpen(false)}
                        laporan={{
                            id: tiket.id,
                            nomor_tiket: tiket.nomor_tiket,
                            judul: tiket.judul,
                        }}
                        onSuccess={() => router.reload()}
                    />

                    <ModalJadwalAnggaran
                        open={modalAnggaranOpen}
                        onClose={() => setModalAnggaranOpen(false)}
                        laporan={{
                            id: tiket.id,
                            nomor_tiket: tiket.nomor_tiket,
                            judul: tiket.judul,
                        }}
                        onSuccess={() => router.reload()}
                    />

                    <ModalBeritaAcara
                        open={modalBeritaAcaraOpen}
                        onClose={() => setModalBeritaAcaraOpen(false)}
                        laporan={{
                            id: tiket.id,
                            nomor_tiket: tiket.nomor_tiket,
                            judul: tiket.judul,
                            total_berita_acara: tiket.berita_acara?.length ?? 0,
                            semua_berita_acara:
                                tiket.berita_acara?.map((b) => ({
                                    versi: b.versi,
                                    kegiatan: b.kegiatan,
                                    hasil: b.hasil,
                                    hambatan: b.hambatan,
                                    waktu: b.created_at,
                                })) ?? [],
                        }}
                        onSuccess={() => router.reload()}
                    />

                    <ModalAjukanSelesai
                        open={modalAjukanSelesaiOpen}
                        onClose={() => setModalAjukanSelesaiOpen(false)}
                        onOpenBeritaAcara={() => {
                            setModalAjukanSelesaiOpen(false);
                            setModalBeritaAcaraOpen(true);
                        }}
                        laporan={{
                            id: tiket.id,
                            nomor_tiket: tiket.nomor_tiket,
                            judul: tiket.judul,
                            lintang: Number(tiket.lintang),
                            bujur: Number(tiket.bujur),
                            total_berita_acara: tiket.berita_acara?.length ?? 0,
                        }}
                        onSuccess={() => router.reload()}
                    />
                </>
            )}
        </div>
    );

    // KONDISI 1A: Petugas Instansi Membuka Kamera Kondisi Lapangan (Sesuai Wireframe)
    if (currentUser?.peran === 'instansi' && isCapturingMulai) {
        return (
            <InternalLayout
                title="Foto Kondisi Lapangan Pengerjaan"
                breadcrumb="Instansi > Daftar Laporan > Detail Laporan > Foto Kondisi Lapangan Pengerjaan"
                fullWidth
            >
                <Head>
                    <title>{`Foto Kondisi Lapangan — #${tiket.nomor_tiket} — Jagains`}</title>
                    <meta
                        name="description"
                        content={`Dokumentasi foto kondisi fisik awal sebelum dimulainya perbaikan tiket #${tiket.nomor_tiket}.`}
                    />
                </Head>
                <FotoKondisiLapanganView
                    laporan={{
                        id: tiket.id,
                        nomor_tiket: tiket.nomor_tiket,
                        judul: tiket.judul,
                        lintang: Number(tiket.lintang),
                        bujur: Number(tiket.bujur),
                    }}
                    onKembali={() => setIsCapturingMulai(false)}
                    onSuccess={() => {
                        setIsCapturingMulai(false);
                        router.reload();
                    }}
                />
            </InternalLayout>
        );
    }

    // KONDISI 1B: Petugas Instansi Membuka Layar Kelola Berita Acara (Sesuai Wireframe - 41)
    if (currentUser?.peran === 'instansi' && isKelolaBeritaAcara) {
        return (
            <InternalLayout
                title="Kelola Berita Acara"
                breadcrumb="Instansi > Daftar Laporan > Detail Laporan > Kelola Berita Acara"
                fullWidth
            >
                <Head>
                    <title>{`Kelola Berita Acara — #${tiket.nomor_tiket} — Jagains`}</title>
                    <meta
                        name="description"
                        content={`Kelola progres dan riwayat berita acara pelaksanaan fisik perbaikan tiket #${tiket.nomor_tiket}.`}
                    />
                </Head>
                <KelolaBeritaAcaraView
                    beritaAcara={tiket.berita_acara || []}
                    instansiNama={tiket.instansi_nama || ''}
                    laporanId={tiket.id}
                    nomorTiket={tiket.nomor_tiket}
                    onKembali={() => setIsKelolaBeritaAcara(false)}
                    onSuccess={() => router.reload()}
                />

                <ModalBeritaAcara
                    open={modalBeritaAcaraOpen}
                    onClose={() => setModalBeritaAcaraOpen(false)}
                    laporan={{
                        id: tiket.id,
                        nomor_tiket: tiket.nomor_tiket,
                        judul: tiket.judul,
                        total_berita_acara: tiket.berita_acara?.length ?? 0,
                        semua_berita_acara:
                            tiket.berita_acara?.map((b) => ({
                                versi: b.versi,
                                kegiatan: b.kegiatan,
                                hasil: b.hasil,
                                hambatan: b.hambatan,
                                waktu: b.created_at,
                            })) ?? [],
                    }}
                    onSuccess={() => router.reload()}
                />
            </InternalLayout>
        );
    }

    // KONDISI 1C: Petugas Instansi Membuka Layar Ajukan Penyelesaian (Sesuai Wireframe - 45, 50, 51)
    if (currentUser?.peran === 'instansi' && isAjukanPenyelesaian) {
        return (
            <InternalLayout
                title="Ajukan Penyelesaian"
                breadcrumb="Instansi > Daftar Laporan > Detail Laporan > Ajukan Penyelesaian"
                fullWidth
            >
                <Head>
                    <title>{`Ajukan Penyelesaian — #${tiket.nomor_tiket} — Jagains`}</title>
                    <meta
                        name="description"
                        content={`Ajukan penyelesaian pekerjaan perbaikan fisik fasilitas publik untuk tiket #${tiket.nomor_tiket}.`}
                    />
                </Head>
                <AjukanPenyelesaianView
                    tiket={tiket}
                    onKembali={() => setIsAjukanPenyelesaian(false)}
                    onSuccess={() => {
                        setIsAjukanPenyelesaian(false);
                        router.reload();
                    }}
                    onBukaBeritaAcara={() => {
                        setIsAjukanPenyelesaian(false);
                        setIsKelolaBeritaAcara(true);
                    }}
                />
            </InternalLayout>
        );
    }

    // KONDISI 1: Pengguna Terautentikasi (Admin, Auditor, Instansi, Warga)
    if (currentUser) {
        return (
            <InternalLayout
                title={
                    currentUser.peran === 'instansi'
                        ? 'Detail Laporan'
                        : `Detail Laporan: #${tiket.nomor_tiket}`
                }
                breadcrumb={
                    currentUser.peran === 'warga'
                        ? `Warga > Riwayat Laporan > #${tiket.nomor_tiket}`
                        : getRoleBreadcrumb(
                              currentUser.peran,
                              tiket.nomor_tiket,
                          )
                }
                fullWidth
            >
                <Head>
                    <title>{`Tiket ${tiket.nomor_tiket}: ${tiket.judul} — Jagains`}</title>
                    <meta
                        name="description"
                        content={`Pantau akuntabilitas penanganan laporan fasilitas publik nomor tiket ${tiket.nomor_tiket} di ${tiket.kota_nama || 'Jabodetabek'} secara transparan.`}
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
                    content={`Pantau akuntabilitas penanganan laporan fasilitas publik nomor tiket ${tiket.nomor_tiket} di ${tiket.kota_nama || 'Jabodetabek'} secara transparan.`}
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
                        <span>Platform Pengawasan Publik Jabodetabek</span>
                    </div>
                </div>

                {mainTicketContent}
            </main>

            <Toaster />
            <LandingFooter />
        </div>
    );
}
