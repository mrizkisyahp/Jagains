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
        <div className={cn('w-full rounded-3xl sm:rounded-[32px] bg-card border border-border/70 shadow-2xl p-4 sm:p-5 md:p-5 lg:p-6 grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 lg:gap-8 items-stretch overflow-hidden', cardMaxWidth)}>
            {/* Sisi Kiri - Orange Hero Card Terinspirasi Referensi (Disembunyikan pada Tampilan Mobile) */}
            <div className="hidden md:flex md:col-span-5 rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-[#FF6B35] via-[#F1501A] to-[#D83B08] text-white p-6 sm:p-8 flex-col justify-between relative overflow-hidden shadow-lg min-h-[380px] sm:min-h-[480px]">
                {/* Efek Lingkaran Cahaya Lembut di Background */}
                <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                {/* Konten Teks Hero Atas */}
                <div className="relative z-10 space-y-3">
                    {heroBadge && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white tracking-wide uppercase">
                            {heroBadge}
                        </div>
                    )}
                    <h1 className="font-display text-display-xs sm:text-display-sm lg:text-display-md font-extrabold text-white leading-tight tracking-tight">
                        {heroTitle}
                    </h1>
                    <p className="text-caption-sm sm:text-body-sm text-white/90 leading-relaxed font-normal">
                        {heroDescription}
                    </p>
                </div>

                {/* Ilustrasi di Bagian Bawah Kartu */}
                <div className="relative z-10 mt-6 -mb-6 sm:-mb-8 flex justify-center items-end overflow-hidden">
                    <img
                        src={illustrationSrc}
                        alt="Ilustrasi Jagains"
                        className="w-full max-w-[240px] sm:max-w-[290px] max-h-48 sm:max-h-60 object-contain object-bottom drop-shadow-xl select-none pointer-events-none transition-transform hover:scale-105 duration-300"
                    />
                </div>
            </div>

            {/* Sisi Kanan - Area Form Utama */}
            <div className="col-span-1 md:col-span-7 flex flex-col justify-center px-1 sm:px-6 md:px-8 py-2 sm:py-5">
                <div className="w-full space-y-6">
                    {/* Brand Logo Teks Jagains Sederhana */}
                    <div>
                        <Link
                            href="/"
                            className="inline-block text-2xl font-black font-display tracking-tight text-foreground hover:opacity-90 transition-opacity"
                        >
                            Jagains<span className="text-primary">.</span>
                        </Link>
                    </div>

                    {/* Judul & Keterangan Form */}
                    <div>
                        <h2 className="font-display text-display-xs sm:text-display-sm font-bold text-foreground tracking-tight">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-1 text-body-sm text-muted-foreground leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Konten Form */}
                    <div>
                        {children}
                    </div>

                    {/* Footer Sekunder Bawah Form */}
                    {footer && (
                        <div className="pt-2 border-t border-border/70 text-center">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
