import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, MapPin, Play } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from 'cn';

export default function HeroSection() {
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    const scrollToPeta = () => {
        const petaSection = document.getElementById('sebaran-peta');
        if (petaSection) {
            petaSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 bg-gradient-to-b from-background via-background to-muted/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column: Heading, Subtitle, & CTAs */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Heading Sesuai Wireframe */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                            Lapor. Pantau.<br className="hidden sm:inline" /> Pastikan.
                        </h1>

                        {/* Deskripsi Sesuai Wireframe */}
                        <p className="text-body-base sm:text-body-large text-muted-foreground leading-relaxed max-w-xl">
                            Laporkan masalah di sekitarmu, pantau janji instansi secara terbuka, dan pastikan sendiri hasilnya bersama warga.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                            <Link
                                href="/warga/lapor"
                                className={cn(
                                    buttonVariants({ variant: 'default', size: 'lg' }),
                                    'h-12 px-6 font-semibold rounded-xl shadow-md gap-2'
                                )}
                            >
                                <span>Lapor Masalah</span>
                                <ArrowRight className="size-4" />
                            </Link>

                            {/* CTA Menuju Peta */}
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={scrollToPeta}
                                className="h-12 px-6 font-semibold rounded-xl border-border bg-background hover:bg-muted text-foreground gap-2"
                            >
                                <MapPin className="size-4 text-primary" />
                                <span>Lihat Peta Sekitar</span>
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Video Container Sesuai Wireframe */}
                    <div className="relative">
                        <div
                            onClick={() => setIsVideoOpen(true)}
                            className="group relative w-full aspect-video rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
                        >
                            {/* Background Pattern Mesh */}
                            <div className="absolute inset-0 bg-radial from-neutral-800/80 via-neutral-900 to-black opacity-90" />
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]" />

                            {/* Label "Video" Sesuai Wireframe Mockup */}
                            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
                                <div className="size-18 rounded-full bg-primary/20 text-primary border-2 border-primary/40 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-lg">
                                    <Play className="size-8 ml-1 fill-current" />
                                </div>
                                <div className="space-y-1">
                                    <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white block">
                                        Video
                                    </span>
                                    <span className="text-caption-xs text-neutral-400 font-medium block">
                                        Tonton bagaimana laporan dikawal tanpa penutupan sepihak (2 menit)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Dialog Video Explainer */}
            <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                <DialogContent className="sm:max-w-3xl rounded-2xl p-4 sm:p-6 bg-card">
                    <DialogHeader>
                        <DialogTitle className="font-display text-body-large font-bold text-foreground">
                            Alur Akuntabilitas Platform Jagains
                        </DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Sistem transparansi dua arah yang mencegah birokrasi menutup aduan secara sepihak.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="aspect-video w-full rounded-2xl bg-neutral-900 border border-border flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                        <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                            <Play className="size-8 ml-1" />
                        </div>
                        <p className="font-display text-body-medium font-bold">Simulasi Interaktif Alur Laporan</p>
                        <p className="text-caption-xs text-neutral-400 max-w-md">
                            1. Foto Kamera GPS &rarr; 2. Triage & SLA Dinamis &rarr; 3. Berita Acara Lapangan &rarr; 4. Kuorum Voting Warga Jalur A & B.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
