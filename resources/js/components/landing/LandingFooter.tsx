import { Link } from '@inertiajs/react';
import { MapPin, ShieldCheck } from 'lucide-react';

export default function LandingFooter() {
    return (
        <footer className="border-t border-border bg-background py-12 sm:py-16 text-muted-foreground text-body-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Brand & Slogan */}
                    <div className="space-y-2">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                <MapPin className="size-4" />
                            </div>
                            <span className="font-display text-lg font-bold tracking-tight text-foreground">
                                JAGAIns
                            </span>
                        </Link>
                        <p className="text-caption-xs text-muted-foreground max-w-sm">
                            Platform Pengawasan & Transparansi Penanganan Fasilitas Publik Berbasis Kuorum Warga Kota Depok.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap items-center gap-6 text-caption-xs font-semibold">
                        <Link href="/#sebaran-peta" className="hover:text-foreground transition-colors">
                            Peta Laporan
                        </Link>
                        <Link href="/warga/lapor" className="hover:text-foreground transition-colors">
                            Lapor Fasilitas
                        </Link>
                        <Link href="/login" className="hover:text-foreground transition-colors">
                            Masuk Petugas & Warga
                        </Link>
                        <Link
                            href="/bantuan"
                            className="hover:text-foreground transition-colors inline-flex items-center gap-1 text-primary"
                        >
                            <ShieldCheck className="size-3.5" />
                            <span>Zero-Knowledge Privacy (FR-LAN-01)</span>
                        </Link>
                    </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption-xs text-muted-foreground">
                    <p>
                        &copy; 2026 Pemerintah Kota Depok & Tim Jagains. Seluruh hak cipta dilindungi.
                    </p>
                    <p className="text-center sm:text-right">
                        Dirancang sesuai UU Perlindungan Data Pribadi (UU PDP). Identitas pelapor dilindungi penuh.
                    </p>
                </div>
            </div>
        </footer>
    );
}
