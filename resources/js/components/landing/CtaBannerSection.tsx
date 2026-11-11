import { Link } from '@inertiajs/react';
import { ArrowRight, Camera } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';

export default function CtaBannerSection() {
    return (
        <section className="border-t border-border/80 bg-muted/60 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-neutral-900 p-8 text-white shadow-xl sm:p-12 md:flex-row">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Lihat kerusakan di sekitar Anda?
                            <br /> Laporkan sekarang.
                        </h2>
                        <p className="text-body-base text-neutral-300">
                            Cukup foto, lokasi otomatis, dan satu jenis
                            kerusakan.
                        </p>
                    </div>

                    <div className="w-full shrink-0 sm:w-auto">
                        <Link
                            href="/warga/lapor"
                            className={cn(
                                buttonVariants({
                                    variant: 'default',
                                    size: 'lg',
                                }),
                                'h-12 w-full gap-2 rounded-2xl bg-primary px-8 text-body-base font-semibold text-white shadow-lg hover:bg-primary/90 sm:w-auto',
                            )}
                        >
                            <Camera className="mr-1 size-5" />
                            <span>Buat Laporan Baru</span>
                            <ArrowRight className="ml-1 size-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
