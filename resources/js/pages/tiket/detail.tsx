import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    MapPin,
    Shield,
    AlertTriangle,
    EyeOff,
    Navigation,
    Compass,
    Lock,
    ArrowLeft,
    Building2,
    Scale,
    ShieldAlert,
} from 'lucide-react';
import { TiketDetail } from '@/types/tiket';
import { User } from '@/types/auth';
import InternalLayout from '@/layouts/InternalLayout';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import TiketHeader from '@/components/tiket/TiketHeader';
import TiketSlaCountdownCard from '@/components/tiket/TiketSlaCountdownCard';
import TiketBuktiFotoKomparasi from '@/components/tiket/TiketBuktiFotoKomparasi';
import TiketBeritaAcaraList from '@/components/tiket/TiketBeritaAcaraList';
import TiketRiwayatStatusTimeline from '@/components/tiket/TiketRiwayatStatusTimeline';
import TiketKuorumVerifikasiCard from '@/components/tiket/TiketKuorumVerifikasiCard';
import TiketAuditorNotesCard from '@/components/tiket/TiketAuditorNotesCard';
import ModalLaporKonten from '@/components/tiket/ModalLaporKonten';
import ModalKonfirmasiLogin from '@/components/tiket/ModalKonfirmasiLogin';
import { Toaster, toast } from '@/components/ui/toast';
import { buttonVariants } from '@/components/ui/button';

interface DetailTiketProps {
    tiket: TiketDetail;
}

export default function DetailTiketPage({ tiket: initialTiket }: DetailTiketProps) {
    const { auth } = usePage<{ auth?: { user?: User | null } }>().props;
    const currentUser = auth?.user;

    const [tiket, setTiket] = useState<TiketDetail>(initialTiket);
    const [loadingDukungan, setLoadingDukungan] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [loginActionDesc, setLoginActionDesc] = useState('memberikan dukungan');
    const [laporModalOpen, setLaporModalOpen] = useState(false);

    // Handler Toggle Dukungan (FR-INT-01)
    const handleToggleDukungan = async () => {
        if (!currentUser) {
            setLoginActionDesc('memberikan dukungan');
            setLoginModalOpen(true);
            return;
        }

        if (currentUser.peran !== 'warga') {
            toast.warning('Aksi Dibatasi', 'Hanya akun warga Kota Depok yang dapat memberikan dukungan laporan.');
            return;
        }

        setLoadingDukungan(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(`/tiket/${tiket.nomor_tiket}/dukung`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error('Gagal Memberi Dukungan', data.pesan || 'Terjadi kesalahan sistem.');
                return;
            }

            setTiket((prev) => ({
                ...prev,
                sudah_didukung: data.sudah_didukung,
                total_dukungan: data.total_dukungan,
            }));

            toast.success(
                data.sudah_didukung ? 'Dukungan Dicatat' : 'Dukungan Dibatalkan',
                data.pesan
            );
        } catch {
            toast.error('Kendala Jaringan', 'Gagal menghubungi server. Silakan coba kembali.');
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
            toast.warning('Aksi Dibatasi', 'Hanya akun warga yang dapat melaporkan konten ke antrean moderasi.');
            return;
        }

        setLaporModalOpen(true);
    };

    // Breadcrumb sesuai peran aktor
    const getRoleBreadcrumb = (peran: string) => {
        switch (peran) {
            case 'admin':
                return 'Admin > Moderasi & Routing > Detail Tiket';
            case 'auditor':
                return 'Auditor > Pengawasan Arbitrase > Detail Tiket';
            case 'instansi':
                return 'Instansi > Penanganan Dinas > Detail Tiket';
            case 'warga':
            default:
                return 'Warga > Detail Tiket Publik';
        }
    };

    // Banner kontekstual peran internal (Instansi, Auditor, Admin, Warga)
    const renderRoleBanner = () => {
        if (!currentUser) return null;

        switch (currentUser.peran) {
            case 'instansi':
                return (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <Building2 className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <div>
                                <span className="font-semibold text-foreground">Akses Petugas Instansi: </span>
                                <span className="text-muted-foreground">
                                    Anda membuka lembar publik tiket ini sebagai petugas dinas penanggung jawab.
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href="/instansi/antrean"
                                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8' })}
                            >
                                Antrean Tugas
                            </Link>
                            <Link
                                href="/instansi/sengketa"
                                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8' })}
                            >
                                Panel Sengketa
                            </Link>
                        </div>
                    </div>
                );
            case 'auditor':
                return (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <Scale className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <div>
                                <span className="font-semibold text-foreground">Akses Auditor Independen: </span>
                                <span className="text-muted-foreground">
                                    Tiket ini berada di bawah yurisdiksi pengawasan independen dan arbitrase SLA.
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/auditor/antrean"
                            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8 shrink-0' })}
                        >
                            Buka Antrean Arbitrase
                        </Link>
                    </div>
                );
            case 'admin':
                return (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div>
                                <span className="font-semibold text-foreground">Akses Administrator Sistem: </span>
                                <span className="text-muted-foreground">
                                    Tinjau moderasi konten, laporan pelanggaran, atau routing instansi untuk tiket ini.
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href="/admin/moderasi"
                                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8' })}
                            >
                                Antrean Moderasi
                            </Link>
                            <Link
                                href="/admin/antrean-routing"
                                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8' })}
                            >
                                Antrean Routing
                            </Link>
                        </div>
                    </div>
                );
            case 'warga':
            default:
                return (
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/50 text-xs">
                        <Link
                            href="/warga/riwayat"
                            className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Riwayat Aduan Saya</span>
                        </Link>
                        <Link
                            href={`/peta?fokus=${encodeURIComponent(tiket.nomor_tiket)}`}
                            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                        >
                            <MapPin className="size-3.5" />
                            <span>Pusatkan di Peta Laporan</span>
                        </Link>
                    </div>
                );
        }
    };

    // Konten Detail Tiket
    const pageContent = (
        <div className="space-y-6">
            {renderRoleBanner()}

            {/* Banner Tiket Disembunyikan oleh Moderasi (FR-ADM-06 & FR-TKT-01d) */}
            {tiket.disembunyikan ? (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 md:p-8 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-destructive/20 p-3 text-destructive shrink-0">
                                <EyeOff className="size-8" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="font-display text-xl md:text-2xl font-bold text-destructive">
                                    Konten Laporan Disembunyikan oleh Tim Moderasi
                                </h1>
                                <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
                                    Laporan dengan nomor tiket <strong className="font-mono">{tiket.nomor_tiket}</strong> sedang atau telah dimoderasi oleh Administrator sistem karena terindikasi memuat pelanggaran pedoman komunitas atau konten tidak pantas.
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Sesuai prinsip transparansi Jagains, nomor tiket, status penanganan dinas, serta log mutasi waktu tetap tercatat secara kekal untuk keperluan audit publik dan tidak dapat dihapus.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Status Administratif Saja */}
                    <TiketHeader
                        tiket={tiket}
                        onToggleDukungan={handleToggleDukungan}
                        onOpenLaporKonten={handleOpenLaporKonten}
                        loadingDukungan={loadingDukungan}
                        userRole={currentUser?.peran}
                    />

                    <TiketSlaCountdownCard tiket={tiket} />
                </div>
            ) : (
                /* Halaman Detail Tiket Publik Normal */
                <div className="space-y-6">
                    {/* Header Tiket Utama */}
                    <TiketHeader
                        tiket={tiket}
                        onToggleDukungan={handleToggleDukungan}
                        onOpenLaporKonten={handleOpenLaporKonten}
                        loadingDukungan={loadingDukungan}
                        userRole={currentUser?.peran}
                    />

                    {/* Kartu SLA Countdown */}
                    <TiketSlaCountdownCard tiket={tiket} />

                    {/* Grid Konten Detail 2 Kolom */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Kolom Kiri: Bukti Foto, Deskripsi, Berita Acara, Linimasa (8 Kolom) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Galeri Foto Komparasi Awal & Sesudah */}
                            <TiketBuktiFotoKomparasi
                                fotoAwal={tiket.foto_awal}
                                fotoSesudah={tiket.foto_sesudah}
                                keteranganAwal={tiket.keterangan}
                            />

                            {/* Berita Acara Pengerjaan (Append-Only) */}
                            <TiketBeritaAcaraList beritaAcara={tiket.berita_acara} />

                            {/* Linimasa Riwayat Mutasi Status (T-01..T-20) */}
                            <TiketRiwayatStatusTimeline
                                riwayatStatus={tiket.riwayat_status}
                                pengalihan={tiket.pengalihan}
                            />
                        </div>

                        {/* Kolom Kanan: Kuorum, Auditor, Lokasi Spasial, Privasi ZK (4 Kolom) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Kartu Kuorum Verifikasi Warga jika ada ronde verifikasi */}
                            {tiket.kuorum_verifikasi && (
                                <TiketKuorumVerifikasiCard kuorum={tiket.kuorum_verifikasi} />
                            )}

                            {/* Catatan Keputusan Auditor Independen jika ada */}
                            {tiket.catatan_auditor && tiket.catatan_auditor.length > 0 && (
                                <TiketAuditorNotesCard catatanAuditor={tiket.catatan_auditor} />
                            )}

                            {/* Kartu Titik Lokasi & Navigasi Spasial */}
                            <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                        <Compass className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-sm font-bold text-foreground">
                                            Koordinat Lokasi Kejadian
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground">
                                            Lokasi geografis penanda kerusakan fasilitas.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="rounded-lg bg-muted/30 p-2.5 border border-border/50 flex items-center justify-between">
                                        <span className="text-muted-foreground">Wilayah:</span>
                                        <span className="font-semibold text-foreground">
                                            Kel. {tiket.kelurahan_nama}, Kec. {tiket.kecamatan_nama}
                                        </span>
                                    </div>

                                    <div className="rounded-lg bg-muted/30 p-2.5 border border-border/50 flex items-center justify-between">
                                        <span className="text-muted-foreground">Koordinat:</span>
                                        <span className="font-mono text-[11px] text-foreground font-semibold">
                                            {tiket.lintang.toFixed(6)}, {tiket.bujur.toFixed(6)}
                                        </span>
                                    </div>

                                    {tiket.akurasi_gps_m && (
                                        <div className="rounded-lg bg-muted/30 p-2.5 border border-border/50 flex items-center justify-between">
                                            <span className="text-muted-foreground">Akurasi GPS Perangkat:</span>
                                            <span className="font-medium text-foreground">
                                                &plusmn;{tiket.akurasi_gps_m} meter
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol Deep Linking ke Peta */}
                                <Link
                                    href={`/peta?fokus=${encodeURIComponent(tiket.nomor_tiket)}`}
                                    className={buttonVariants({
                                        variant: 'outline',
                                        className: 'w-full gap-2 text-xs font-semibold cursor-pointer border-primary/30 hover:bg-primary/5 hover:text-primary',
                                    })}
                                >
                                    <Navigation className="size-3.5" />
                                    <span>Buka dan Pusatkan di Peta</span>
                                </Link>
                            </div>

                            {/* Kartu Jaminan Privasi Zero-Knowledge (BR-AKN-01) */}
                            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                    <Lock className="size-4 text-primary" />
                                    <span>Privasi Zero-Knowledge Terjamin</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Sesuai prinsip <strong>BR-AKN-01</strong>, nama, email, nomor ponsel, serta data identitas pribadi warga pelapor maupun pemberi dukungan dienkripsi mutlak dan tidak pernah dimuat pada kode halaman publik ini.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Dialog Interaksi */}
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
        </div>
    );

    // KONDISI 1: Pengguna Terautentikasi (Warga, Instansi, Auditor, Admin)
    // Menyesuaikan dengan InternalLayout (Sidebar Navigasi & Header Breadcrumb sesuai Peran)
    if (currentUser) {
        return (
            <InternalLayout
                title={`Tiket #${tiket.nomor_tiket}`}
                breadcrumb={getRoleBreadcrumb(currentUser.peran)}
            >
                <Head>
                    <title>{`Tiket ${tiket.nomor_tiket}: ${tiket.judul} — JAGAIns`}</title>
                    <meta
                        name="description"
                        content={`Pantau akuntabilitas penanganan laporan fasilitas publik nomor tiket ${tiket.nomor_tiket} di Kota Depok secara transparan.`}
                    />
                </Head>
                {pageContent}
            </InternalLayout>
        );
    }

    // KONDISI 2: Pengguna Publik / Tamu (Tanpa Login)
    // Menggunakan Layout Publik (LandingNavbar, Kontainer Landing Page, LandingFooter)
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>{`Tiket ${tiket.nomor_tiket}: ${tiket.judul} — JAGAIns`}</title>
                <meta
                    name="description"
                    content={`Pantau akuntabilitas penanganan laporan fasilitas publik nomor tiket ${tiket.nomor_tiket} di Kota Depok secara transparan.`}
                />
            </Head>

            {/* Navigasi Publik */}
            <LandingNavbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Breadcrumb & Tombol Balik Publik */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/peta"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali ke Peta Laporan</span>
                    </Link>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Shield className="size-3.5 text-primary" />
                        <span>Platform Pengawasan Publik Kota Depok</span>
                    </div>
                </div>

                {pageContent}
            </main>

            {/* Toast Notifikasi Global Publik */}
            <Toaster />

            {/* Footer Publik */}
            <LandingFooter />
        </div>
    );
}
