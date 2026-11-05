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
    ShieldCheck,
    ThumbsUp,
    ZoomIn,
} from 'lucide-react';
import type { TiketDetail, LampiranFoto } from '@/types/tiket';
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
import ModalLaporKonten from '@/components/tiket/ModalLaporKonten';
import ModalKonfirmasiLogin from '@/components/tiket/ModalKonfirmasiLogin';
import ModalBukaIdentitasPelapor from '@/components/admin/ModalBukaIdentitasPelapor';
import ModalBeriSuaraVerifikasi from '@/components/verifikasi/ModalBeriSuaraVerifikasi';

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
                    label: 'Riwayat aduan',
                };
        }
    };

    const getRoleBreadcrumb = (peran: string, nomorTiket: string) => {
        switch (peran) {
            case 'admin':
                return `Admin / Moderasi & Routing / #${nomorTiket}`;
            case 'auditor':
                return `Auditor / Pengawasan Arbitrase / #${nomorTiket}`;
            case 'instansi':
                return `Instansi / Antrean tiket / #${nomorTiket}`;
            case 'warga':
            default:
                return `Warga / Detail Tiket / #${nomorTiket}`;
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
        <div className="space-y-6">
            {/* Top Toolbar: Kembali & Bagikan */}
            <div className="flex items-center justify-between gap-3">
                <Button
                    variant="ghost"
                    className="h-11 px-0 text-body-sm md:h-9"
                    render={<Link href={backNav.href} />}
                >
                    <ArrowLeft className="size-4" />
                    <span>{backNav.label}</span>
                </Button>

                <div className="flex items-center gap-2">
                    {validLocation && (
                        <Button
                            variant="ghost"
                            className="hidden h-9 gap-1.5 text-body-sm text-primary hover:text-primary sm:inline-flex"
                            render={
                                <Link
                                    href={`/peta?fokus=${encodeURIComponent(tiket.nomor_tiket)}`}
                                />
                            }
                        >
                            <MapPin className="size-4" />
                            <span>Pusatkan di peta</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="h-11 shadow-none md:h-9"
                        onClick={share}
                        title="Bagikan Tautan Tiket"
                        aria-label="Bagikan Tautan Tiket"
                    >
                        <Share2 className="size-4" />
                        <span className="hidden sm:inline">Bagikan</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 shadow-none md:h-9 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        onClick={handleOpenLaporKonten}
                        title="Laporkan Pelanggaran Konten"
                        aria-label="Laporkan Pelanggaran Konten"
                    >
                        <Flag className="size-4 text-destructive" />
                        <span className="hidden sm:inline">Laporkan</span>
                    </Button>
                </div>
            </div>

            {/* Banner Khusus RBAC Internal */}
            {renderRoleBanner()}

            {/* Banner Status Laporan Disembunyikan oleh Tim Moderasi */}
            {tiket.disembunyikan ? (
                <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
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
                    {/* Header Tiket Bersih Bergaya Instansi */}
                    <header className="space-y-4 border-b border-border pb-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-2 text-body-sm font-mono text-muted-foreground">
                                #{tiket.nomor_tiket}
                            </span>
                            <InstansiStatusBadge status={tiket.status} />
                            <Badge
                                variant="outline"
                                className="h-auto py-1 text-caption-xs"
                            >
                                Tingkat {tiket.keparahan}
                            </Badge>
                        </div>

                        <h1 className="max-w-4xl text-2xl leading-snug font-semibold tracking-tight text-foreground">
                            {tiket.judul}
                        </h1>

                        <dl className="grid gap-x-6 gap-y-4 text-body-sm sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                [
                                    'Instansi terkait',
                                    tiket.instansi_nama ?? 'Belum ditetapkan',
                                ],
                                ['Kategori', tiket.kategori_nama],
                                [
                                    'Lokasi',
                                    `Kel. ${tiket.kelurahan_nama}, Kec. ${tiket.kecamatan_nama}`,
                                ],
                                [
                                    'Tanggal laporan',
                                    formatDate(tiket.created_at),
                                ],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <dt className="mb-1 text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="font-medium text-foreground">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {tiket.keterangan && (
                            <p className="max-w-4xl text-body-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {tiket.keterangan}
                            </p>
                        )}
                    </header>

                    {/* Grid Utama 2 Kolom (Konten & Sidebar Metadata) */}
                    <div className="grid items-start gap-6 lg:grid-cols-3">
                        {/* Kolom Kiri: Bukti Foto, Berita Acara, Riwayat Penanganan, Pengalihan */}
                        <div className="min-w-0 space-y-6 lg:col-span-2">
                            {/* Bukti Foto Sebelum & Sesudah */}
                            <section
                                aria-labelledby="bukti-title"
                                className="space-y-3"
                            >
                                <h3
                                    id="bukti-title"
                                    className="text-body-base font-semibold text-foreground"
                                >
                                    Bukti foto
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <EvidencePhoto
                                        key={tiket.foto_awal?.url ?? 'awal'}
                                        photo={tiket.foto_awal}
                                        title="Sebelum perbaikan"
                                        description="Foto kondisi awal laporan akan ditampilkan di sini."
                                        onPreview={setPreview}
                                    />
                                    <EvidencePhoto
                                        key={
                                            tiket.foto_sesudah?.url ?? 'sesudah'
                                        }
                                        photo={tiket.foto_sesudah}
                                        title="Sesudah perbaikan"
                                        description="Foto hasil perbaikan tersedia setelah petugas mengajukan penyelesaian."
                                        onPreview={setPreview}
                                    />
                                </div>
                            </section>

                            {/* Berita Acara Pengerjaan */}
                            <section
                                aria-labelledby="dokumen-title"
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <h3
                                        id="dokumen-title"
                                        className="text-body-base font-semibold text-foreground"
                                    >
                                        Berita acara
                                    </h3>
                                    <span className="text-body-sm text-muted-foreground">
                                        {tiket.berita_acara.length} versi
                                    </span>
                                </div>

                                {tiket.berita_acara.length ? (
                                    <div className="divide-y divide-border rounded-lg border border-border bg-card">
                                        {tiket.berita_acara
                                            .slice(
                                                (documentPage - 1) * 3,
                                                documentPage * 3,
                                            )
                                            .map((ba) => (
                                                <details
                                                    key={ba.id}
                                                    className="group px-4 py-3"
                                                >
                                                    <summary className="cursor-pointer text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                                                        <span>
                                                            Berita acara · Versi{' '}
                                                            {ba.versi}
                                                        </span>
                                                        <span className="mt-1 block text-caption-xs font-normal text-muted-foreground">
                                                            {formatDate(
                                                                ba.created_at,
                                                            )}{' '}
                                                            · {ba.instansi_nama}
                                                        </span>
                                                    </summary>
                                                    <dl className="mt-4 space-y-3 border-t border-border/50 pt-3 text-body-sm">
                                                        {[
                                                            [
                                                                'Kegiatan',
                                                                ba.kegiatan,
                                                            ],
                                                            ['Hasil', ba.hasil],
                                                            [
                                                                'Hambatan',
                                                                ba.hambatan,
                                                            ],
                                                        ]
                                                            .filter(
                                                                ([, value]) =>
                                                                    value,
                                                            )
                                                            .map(
                                                                ([
                                                                    label,
                                                                    value,
                                                                ]) => (
                                                                    <div
                                                                        key={
                                                                            label
                                                                        }
                                                                    >
                                                                        <dt className="font-medium text-foreground">
                                                                            {
                                                                                label
                                                                            }
                                                                        </dt>
                                                                        <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                                                            {
                                                                                value
                                                                            }
                                                                        </dd>
                                                                    </div>
                                                                ),
                                                            )}
                                                    </dl>
                                                </details>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
                                        <FileText className="size-7 text-muted-foreground" />
                                        <p className="text-body-sm font-medium text-foreground">
                                            Belum ada berita acara
                                        </p>
                                        <p className="text-body-sm text-muted-foreground">
                                            Catatan kegiatan dan hasil pekerjaan
                                            akan tersedia setelah dibuat oleh
                                            petugas.
                                        </p>
                                    </div>
                                )}

                                {documentPages > 1 && (
                                    <div className="flex items-center justify-between gap-3 text-body-sm">
                                        <span className="text-muted-foreground">
                                            {documentPage} dari {documentPages}{' '}
                                            halaman
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={documentPage === 1}
                                                onClick={() =>
                                                    setDocumentPage(
                                                        (p) => p - 1,
                                                    )
                                                }
                                            >
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    documentPage ===
                                                    documentPages
                                                }
                                                onClick={() =>
                                                    setDocumentPage(
                                                        (p) => p + 1,
                                                    )
                                                }
                                            >
                                                Berikutnya
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Riwayat Penanganan Status */}
                            <section
                                aria-labelledby="riwayat-title"
                                className="space-y-4"
                            >
                                <h3
                                    id="riwayat-title"
                                    className="text-body-base font-semibold text-foreground"
                                >
                                    Riwayat penanganan
                                </h3>
                                <ol className="ml-2 border-l border-border">
                                    {tiket.riwayat_status.map((item) => (
                                        <li
                                            key={item.id}
                                            className="relative pb-5 pl-5 before:absolute before:top-2 before:-left-1 before:size-2 before:rounded-full before:bg-muted-foreground"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <InstansiStatusBadge
                                                    status={item.status_baru}
                                                />
                                                <time className="text-body-sm text-muted-foreground">
                                                    {new Date(
                                                        item.waktu,
                                                    ).toLocaleString('id-ID')}
                                                </time>
                                            </div>
                                            <p className="mt-2 text-body-sm text-muted-foreground">
                                                {item.instansi_nama ??
                                                    (item.peran_pelaku ===
                                                    'sistem'
                                                        ? 'Sistem Jagains'
                                                        : `Petugas ${item.peran_pelaku}`)}
                                            </p>
                                            {item.catatan && (
                                                <p className="mt-1 text-body-sm whitespace-pre-wrap text-foreground">
                                                    {formatInstansiMessage(
                                                        item.catatan,
                                                    )}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                                {!tiket.riwayat_status.length && (
                                    <p className="text-body-sm text-muted-foreground">
                                        Belum ada riwayat penanganan.
                                    </p>
                                )}
                            </section>

                            {/* Riwayat Pengalihan Instansi (Jika Ada) */}
                            {tiket.pengalihan.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="text-body-base font-semibold text-foreground">
                                        Riwayat pengalihan
                                    </h3>
                                    <div className="divide-y divide-border rounded-lg border border-border bg-card p-4">
                                        {tiket.pengalihan.map((item) => (
                                            <div
                                                key={item.id}
                                                className="py-3 text-body-sm first:pt-0 last:pb-0"
                                            >
                                                <p className="font-medium text-foreground">
                                                    {item.instansi_asal} &rarr;{' '}
                                                    {item.instansi_tujuan}
                                                </p>
                                                <p className="mt-1 text-caption-xs text-muted-foreground">
                                                    {formatDate(item.waktu)} ·{' '}
                                                    {item.alasan}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Kolom Kanan: Peta, Batas SLA, Dukungan, Kuorum, Auditor, Privasi */}
                        <aside className="min-w-0 space-y-5">
                            {/* Lokasi Laporan */}
                            <section className="overflow-hidden rounded-lg border border-border bg-card">
                                <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-body-sm font-semibold text-foreground">
                                    <MapPin className="size-4 text-primary" />
                                    <span>Lokasi laporan</span>
                                </div>
                                {validLocation ? (
                                    <Suspense
                                        fallback={
                                            <Skeleton className="h-56 w-full rounded-none" />
                                        }
                                    >
                                        <LocationMap
                                            latitude={latitude}
                                            longitude={longitude}
                                        />
                                    </Suspense>
                                ) : (
                                    <p className="p-5 text-body-sm text-muted-foreground">
                                        Titik lokasi belum tersedia.
                                    </p>
                                )}
                                <div className="space-y-1 p-4 text-body-sm">
                                    <p className="font-medium text-foreground">
                                        Kel. {tiket.kelurahan_nama}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Kec. {tiket.kecamatan_nama}
                                    </p>
                                    {validLocation && (
                                        <p className="text-caption-xs font-mono text-muted-foreground">
                                            {latitude.toFixed(6)},{' '}
                                            {longitude.toFixed(6)}
                                        </p>
                                    )}
                                    <div className="mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-2">
                                        {validLocation && (
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline"
                                            >
                                                <Compass className="size-3.5" />
                                                <span>
                                                    Buka di OpenStreetMap
                                                </span>
                                            </a>
                                        )}
                                        <Link
                                            href={`/peta?fokus=${encodeURIComponent(tiket.nomor_tiket)}`}
                                            className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline"
                                        >
                                            <Navigation className="size-3.5" />
                                            <span>
                                                Pusatkan di Peta Kota Depok
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </section>

                            {/* Batas Waktu Layanan (SLA) */}
                            <div className="rounded-lg border border-border bg-card p-4">
                                <p className="text-body-sm font-medium text-foreground">
                                    Batas waktu layanan
                                </p>
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
                                    className="mt-2 h-auto max-w-full py-1 text-caption-xs whitespace-normal"
                                >
                                    {tiket.sisa_sla_teks ||
                                        'Batas waktu belum tersedia.'}
                                </Badge>
                            </div>

                            {/* Dukungan Masyarakat */}
                            <div className="rounded-lg border border-border bg-card p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-body-sm text-muted-foreground">
                                        Dukungan masyarakat
                                    </p>
                                    <p className="text-xl font-semibold text-foreground tabular-nums">
                                        {tiket.total_dukungan}
                                    </p>
                                </div>

                                {(!currentUser ||
                                    currentUser.peran === 'warga') && (
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
                                        className="mt-3 w-full gap-2 text-xs font-semibold"
                                    >
                                        <ThumbsUp className="size-3.5" />
                                        <span>
                                            {tiket.sudah_didukung
                                                ? 'Telah Anda Dukung'
                                                : 'Dukung Laporan Ini'}
                                        </span>
                                    </Button>
                                )}
                            </div>

                            {/* Verifikasi Warga (Kuorum) */}
                            {tiket.kuorum_verifikasi && (
                                <section className="space-y-3 rounded-lg border border-border bg-card p-4 text-body-sm">
                                    <h3 className="font-semibold text-foreground">
                                        Verifikasi warga
                                    </h3>
                                    <p className="text-caption-xs text-muted-foreground">
                                        Ronde{' '}
                                        {tiket.kuorum_verifikasi.nomor_ronde} ·{' '}
                                        {tiket.kuorum_verifikasi.total_pemilih}{' '}
                                        pemilih
                                    </p>
                                    <dl className="space-y-2 text-caption-xs">
                                        {[
                                            [
                                                'Target bobot',
                                                tiket.kuorum_verifikasi
                                                    .target_k,
                                            ],
                                            [
                                                'Bobot setuju',
                                                tiket.kuorum_verifikasi
                                                    .suara_setuju_bobot,
                                            ],
                                            [
                                                'Bobot menolak',
                                                tiket.kuorum_verifikasi
                                                    .suara_tolak_bobot,
                                            ],
                                            [
                                                'Hasil',
                                                tiket.kuorum_verifikasi.hasil ??
                                                    'Belum diputuskan',
                                            ],
                                        ].map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="flex justify-between gap-3"
                                            >
                                                <dt className="text-muted-foreground">
                                                    {label}
                                                </dt>
                                                <dd className="font-medium text-foreground">
                                                    {value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                    {tiket.kuorum_verifikasi.batas_waktu && (
                                        <p className="text-caption-xs text-muted-foreground">
                                            Batas verifikasi:{' '}
                                            {formatDate(
                                                tiket.kuorum_verifikasi
                                                    .batas_waktu,
                                            )}
                                        </p>
                                    )}

                                    {tiket.kuorum_verifikasi.alasan_penolakan.map(
                                        (item, index) => (
                                            <p
                                                key={index}
                                                className="border-t border-border pt-2 text-caption-xs text-foreground"
                                            >
                                                {item.alasan}
                                                <span className="mt-1 block text-muted-foreground">
                                                    {formatDate(item.waktu)} ·
                                                    Jalur {item.jalur}
                                                </span>
                                            </p>
                                        ),
                                    )}

                                    {tiket.status === 'MENUNGGU_VERIFIKASI' && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                if (!currentUser) {
                                                    setLoginActionDesc(
                                                        'memberikan suara verifikasi',
                                                    );
                                                    setLoginModalOpen(true);
                                                    return;
                                                }
                                                setModalVerifikasiOpen(true);
                                            }}
                                            className="mt-2 w-full gap-1.5 rounded-xl bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700"
                                        >
                                            <ShieldCheck className="size-4" />
                                            <span>
                                                Beri Suara Verifikasi Kuorum
                                            </span>
                                        </Button>
                                    )}
                                </section>
                            )}

                            {/* Catatan Keputusan Auditor Independen */}
                            {tiket.catatan_auditor.length > 0 && (
                                <section className="space-y-3 rounded-lg border border-border bg-card p-4 text-body-sm">
                                    <h3 className="font-semibold text-foreground">
                                        Catatan Auditor
                                    </h3>
                                    {tiket.catatan_auditor.map((item) => (
                                        <div
                                            key={item.id}
                                            className="space-y-1.5 border-t border-border pt-3 text-caption-xs"
                                        >
                                            <p className="font-medium text-foreground">
                                                {(
                                                    {
                                                        PERINTAH: 'Perintah',
                                                        KERJAKAN_ULANG:
                                                            'Kerjakan ulang',
                                                        TUTUP: 'Penutupan',
                                                        SETUJU_TOLAK:
                                                            'Penolakan disetujui',
                                                        TOLAK_USULAN:
                                                            'Usulan ditolak',
                                                    } as Record<string, string>
                                                )[item.jenis] ??
                                                    item.jenis
                                                        .replaceAll('_', ' ')
                                                        .toLowerCase()}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {formatDate(item.waktu)}
                                            </p>
                                            {item.alasan && (
                                                <p className="text-foreground">
                                                    {formatInstansiMessage(
                                                        item.alasan,
                                                    )}
                                                </p>
                                            )}
                                            {item.perintah && (
                                                <p className="text-foreground">
                                                    {formatInstansiMessage(
                                                        item.perintah,
                                                    )}
                                                </p>
                                            )}
                                            {item.tenggat && (
                                                <p className="font-medium text-foreground">
                                                    Tenggat:{' '}
                                                    {formatDate(item.tenggat)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </section>
                            )}

                            {/* Kartu Jaminan Privasi Zero-Knowledge (BR-AKN-01) */}
                            <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-4 text-caption-xs leading-relaxed text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <Lock className="size-3 text-primary" />
                                    <span>Privasi Zero-Knowledge Terjamin</span>
                                </div>
                                <p>
                                    Sesuai prinsip <strong>BR-AKN-01</strong>,
                                    nama, email, serta identitas pelapor dan
                                    pendukung dienkripsi mutlak dan tidak
                                    dipublikasikan pada lembar publik ini.
                                </p>
                            </div>
                        </aside>
                    </div>
                </>
            )}

            {/* Modal Dialog Interaksi */}
            <Dialog
                open={!!preview}
                onOpenChange={(open) => !open && setPreview(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
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
                title={`Tiket #${tiket.nomor_tiket}`}
                breadcrumb={getRoleBreadcrumb(
                    currentUser.peran,
                    tiket.nomor_tiket,
                )}
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
