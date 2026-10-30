import { Link } from '@inertiajs/react';
import { ArrowRight, Camera } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';

export default function CtaBannerSection() {
    return (
        <section className="py-16 sm:py-20 bg-muted/60 border-t border-border/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 sm:p-12 rounded-3xl bg-neutral-900 text-white shadow-xl">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            Lihat kerusakan di sekitar Anda?<br /> Laporkan sekarang.
                        </h2>
                        <p className="text-body-base text-neutral-300">
                            Cukup foto, lokasi otomatis, dan satu jenis kerusakan.
                        </p>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto">
                        <Link
                            href="/warga/lapor"
                            className={cn(
                                buttonVariants({ variant: 'default', size: 'lg' }),
                                'w-full sm:w-auto h-12 px-8 font-semibold text-body-base rounded-2xl shadow-lg gap-2 text-white bg-primary hover:bg-primary/90'
                            )}
                        >
                            <Camera className="size-5 mr-1" />
                            <span>Buat Laporan Baru</span>
                            <ArrowRight className="size-4 ml-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
