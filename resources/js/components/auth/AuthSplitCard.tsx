import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface AuthSplitCardProps {
    heroTitle: string;
    heroDescription: string;
    heroBadge?: string;
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    illustrationSrc?: string;
    cardMaxWidth?: string;
}

export default function AuthSplitCard({
    heroTitle,
    heroDescription,
    heroBadge,
    title,
    subtitle,
    children,
    footer,
    illustrationSrc = '/person_with_lock.png',
    cardMaxWidth = 'max-w-5xl',
}: AuthSplitCardProps) {
    return (
        <div
            className={cn(
                'grid w-full grid-cols-1 items-stretch gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-2xl sm:rounded-[32px] sm:p-5 md:grid-cols-12 md:gap-6 md:p-5 lg:gap-8 lg:p-6',
                cardMaxWidth,
            )}
        >
            {/* Sisi Kiri - Orange Hero Card Terinspirasi Referensi (Disembunyikan pada Tampilan Mobile) */}
            <div className="relative hidden min-h-[380px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF6B35] via-[#F1501A] to-[#D83B08] p-6 text-white shadow-lg sm:min-h-[480px] sm:rounded-[26px] sm:p-8 md:col-span-5 md:flex">
                {/* Efek Lingkaran Cahaya Lembut di Background */}
                <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-black/10 blur-2xl" />

                {/* Konten Teks Hero Atas */}
                <div className="relative z-10 space-y-3">
                    {heroBadge && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-xs">
                            {heroBadge}
                        </div>
                    )}
                    <h1 className="text-display-xs font-display leading-tight font-extrabold tracking-tight text-white sm:text-display-sm lg:text-display-md">
                        {heroTitle}
                    </h1>
                    <p className="text-caption-sm leading-relaxed font-normal text-white/90 sm:text-body-sm">
                        {heroDescription}
                    </p>
                </div>

                {/* Ilustrasi di Bagian Bawah Kartu */}
                <div className="relative z-10 mt-6 -mb-6 flex items-end justify-center overflow-hidden sm:-mb-8">
                    <img
                        src={illustrationSrc}
                        alt="Ilustrasi Jagains"
                        className="pointer-events-none max-h-48 w-full max-w-[240px] object-contain object-bottom drop-shadow-xl transition-transform duration-300 select-none hover:scale-105 sm:max-h-60 sm:max-w-[290px]"
                    />
                </div>
            </div>

            {/* Sisi Kanan - Area Form Utama */}
            <div className="col-span-1 flex flex-col justify-center px-1 py-2 sm:px-6 sm:py-5 md:col-span-7 md:px-8">
                <div className="w-full space-y-6">
                    {/* Brand Logo Teks Jagains Sederhana */}
                    <div>
                        <Link
                            href="/"
                            className="inline-block font-display text-2xl font-black tracking-tight text-foreground transition-opacity hover:opacity-90"
                        >
                            Jagains<span className="text-primary">.</span>
                        </Link>
                    </div>

                    {/* Judul & Keterangan Form */}
                    <div>
                        <h2 className="text-display-xs font-display font-bold tracking-tight text-foreground sm:text-display-sm">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Konten Form */}
                    <div>{children}</div>

                    {/* Footer Sekunder Bawah Form */}
                    {footer && (
                        <div className="border-t border-border/70 pt-2 text-center">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
