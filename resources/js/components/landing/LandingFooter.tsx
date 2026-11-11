import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import Logo from '@/components/common/Logo';

export default function LandingFooter() {
    return (
        <footer className="border-t border-border bg-background py-12 text-body-sm text-muted-foreground sm:py-16">
            <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    {/* Brand & Slogan */}
                    <div className="space-y-2">
                        <Link href="/" className="flex items-center">
                            <Logo />
                        </Link>
                        <p className="max-w-sm text-caption-xs text-muted-foreground">
                            Platform Pengawasan & Transparansi Penanganan
                            Fasilitas Publik Berbasis Kuorum Warga Jabodetabek.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap items-center gap-6 text-caption-xs font-semibold">
                        <Link
                            href="/#sebaran-peta"
                            className="transition-colors hover:text-foreground"
                        >
                            Peta Laporan
                        </Link>
                        <Link
                            href="/warga/lapor"
                            className="transition-colors hover:text-foreground"
                        >
                            Lapor Fasilitas
                        </Link>
                        <Link
                            href="/login"
                            className="transition-colors hover:text-foreground"
                        >
                            Masuk Petugas & Warga
                        </Link>
                        <Link
                            href="/bantuan"
                            className="inline-flex items-center gap-1 text-primary transition-colors hover:text-foreground"
                        >
                            <ShieldCheck className="size-3.5" />
                            <span>Kebijakan Privasi</span>
                        </Link>
                    </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-caption-xs text-muted-foreground sm:flex-row">
                    <p>
                        &copy; 2026 Tim Jagains. Seluruh hak cipta dilindungi.
                    </p>
                    <p className="text-center sm:text-right">
                        Dirancang sesuai UU Perlindungan Data Pribadi (UU PDP).
                        Identitas pelapor dilindungi penuh.
                    </p>
                </div>
            </div>
        </footer>
    );
}
