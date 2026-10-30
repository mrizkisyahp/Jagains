import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, MapPin, Play, Search, ShieldCheck } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from 'cn';

export default function HeroSection() {
    const [lacakKode, setLacakKode] = useState('');
    const [lacakError, setLacakError] = useState<string | null>(null);
    const [isLacakOpen, setIsLacakOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    const handleLacakSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = lacakKode.trim().toUpperCase();
        if (!code) return;

        if (!/^JAG-/.test(code)) {
            setLacakError('Format kode tiket harus sesuai (contoh: JAG-2026-0001)');
            return;
        }

        setLacakError(null);
        setIsLacakOpen(false);
        router.visit(`/tiket/${code}`);
    };

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
                        {/* Eyebrow Pill */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-caption-xs font-semibold text-primary border border-primary/20">
                            <ShieldCheck className="size-3.5" />
                            <span>Platform Akuntabilitas Fasilitas Publik Depok</span>
                        </div>

                        {/* Heading Sesuai Wireframe */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                            Lapor. Pantau.<br className="hidden sm:inline" /> Pastikan.
                        </h1>

                        {/* Deskripsi Sesuai Wireframe */}
                        <p className="text-body-base sm:text-body-large text-muted-foreground leading-relaxed max-w-xl">
                            Laporkan masalah di sekitarmu, pantau janji instansi secara terbuka, dan pastikan sendiri hasilnya bersama warga.
                        </p>

                        {/* CTA Buttons (Termasuk CTA Menuju Peta sesuai instruksi pengguna) */}
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

                            {/* CTA Menuju Peta di Bagian Bawah */}
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

                        {/* Teks Alternatif: Lacak Laporan dengan Kode (Sesuai Wireframe) */}
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => setIsLacakOpen(true)}
                                className="text-body-sm font-medium text-muted-foreground hover:text-foreground hover:underline cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <Search className="size-3.5 text-muted-foreground" />
                                <span>atau <strong>Lacak Laporan dengan Kode</strong></span>
                            </button>
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

                            {/* Floating Badge di Video Frame */}
                            <div className="absolute bottom-4 left-4 z-10 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-caption-xs text-neutral-300">
                                4 Pilar Akuntabilitas Kota Depok
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Dialog Lacak Laporan dengan Kode */}
            <Dialog open={isLacakOpen} onOpenChange={setIsLacakOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-display text-body-large font-bold text-foreground">
                            Lacak Status Laporan
                        </DialogTitle>
                        <DialogDescription className="text-body-sm text-muted-foreground">
                            Masukkan nomor tiket aduan (contoh: JAG-2026-0001) untuk melihat riwayat status, foto pengerjaan, dan kuorum verifikasi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLacakSubmit} className="space-y-4 pt-2">
                        {lacakError && (
                            <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg">
                                {lacakError}
                            </p>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="JAG-2026-XXXX"
                                value={lacakKode}
                                onChange={(e) => {
                                    setLacakKode(e.target.value);
                                    if (lacakError) setLacakError(null);
                                }}
                                className="pl-10 h-11 text-body-base font-mono uppercase tracking-wider rounded-xl border-border"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsLacakOpen(false)}
                                className="rounded-xl text-body-sm"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={!lacakKode.trim()}
                                className="rounded-xl text-body-sm font-semibold"
                            >
                                Cari Tiket
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
