import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'cn';

const PILAR_ITEMS = [
    {
        id: 1,
        judul: 'Verifikasi Kuorum Warga',
        deskripsi:
            'Penutupan tiket wajib melalui validasi langsung kuorum warga setempat lewat verifikasi kamera atau konfirmasi voting.',
        image: '/images/landing/jagains_sla_phone.png',
        alt: 'Ilustrasi Verifikasi Kuorum Warga',
        imageClassName: 'max-w-[180px] h-36 sm:h-40',
    },
    {
        id: 2,
        judul: 'Batas Waktu SLA Terikat',
        deskripsi:
            'Setiap tahap pengerjaan dinas diikat batas durasi hari kerja resmi. Jika terlambat, sistem otomatis memicu eskalasi.',
        image: '/images/landing/jagains_clock.png',
        alt: 'Ilustrasi Batas Waktu SLA Terikat',
        imageClassName: 'max-w-[120px] h-28 sm:h-30',
    },
    {
        id: 3,
        judul: 'Auditor Independen',
        deskripsi:
            'Bila terjadi sengketa hasil perbaikan antara warga dan dinas, auditor independen menguji fisik dan memberi putusan final.',
        image: '/images/landing/jagains_scale.png',
        alt: 'Ilustrasi Auditor Independen',
        imageClassName: 'max-w-[180px] h-36 sm:h-40',
    },
];

export default function PilarSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    const handlePrev = () => {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : PILAR_ITEMS.length - 1));
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev < PILAR_ITEMS.length - 1 ? prev + 1 : 0));
    };

    return (
        <section id="janji" className="py-20 sm:py-28 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Tata letak horizontal sesuai Referensi image 8.png: Intro di kiri, 3 Card di kanan */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {/* 1. Intro Column (Card Kiri Sesuai image 8.png) */}
                    <div className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-muted/30 border border-border/80">
                        <div className="space-y-4">
                            <h2 className="font-display text-2xl sm:text-3xl lg:text-3xl font-extrabold tracking-tight text-foreground leading-[1.2]">
                                Tiada Laporan Sepihak
                            </h2>
                            <p className="text-body-sm text-muted-foreground leading-relaxed">
                                Tiga pilar utama yang menjamin setiap pengaduan dikawal tuntas hingga terbukti nyata di lapangan.
                            </p>
                        </div>

                        {/* Interactive Navigation Buttons Sesuai image 8.png */}
                        <div className="pt-8 flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handlePrev}
                                className={cn(
                                    'size-10 rounded-xl transition-colors',
                                    activeIndex > 0
                                        ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                        : 'bg-card text-foreground border-border hover:bg-muted'
                                )}
                                title="Sebelumnya"
                            >
                                <ChevronLeft className="size-5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleNext}
                                className={cn(
                                    'size-10 rounded-xl transition-colors',
                                    activeIndex < PILAR_ITEMS.length - 1
                                        ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                        : 'bg-card text-foreground border-border hover:bg-muted'
                                )}
                                title="Berikutnya"
                            >
                                <ChevronRight className="size-5" />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Tiga Card Pilar (Sesuai Referensi image 8.png) */}
                    {PILAR_ITEMS.map((item, index) => {
                        const isFocused = activeIndex === index;

                        return (
                            <Card
                                key={item.id}
                                onClick={() => setActiveIndex(index)}
                                className={cn(
                                    'cursor-pointer p-6 sm:p-7 rounded-3xl bg-card border transition-all duration-200 flex flex-col justify-between space-y-6 group',
                                    isFocused
                                        ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
                                        : 'border-border/80 shadow-xs hover:border-border hover:shadow-sm'
                                )}
                            >
                                {/* Gambar Ilustrasi Pilar */}
                                <div className="pt-2 h-36 sm:h-40 flex items-center justify-center">
                                    <img
                                        src={item.image}
                                        alt={item.alt}
                                        className={cn(
                                            'w-full object-contain mx-auto transition-transform duration-300 group-hover:scale-105',
                                            item.imageClassName ?? 'max-w-[180px] h-36 sm:h-40'
                                        )}
                                        loading="lazy"
                                    />
                                </div>

                                {/* Judul & Deskripsi yang Dipersingkat */}
                                <div className="space-y-2 pt-2">
                                    <h3 className="font-display text-body-base font-bold text-foreground leading-snug">
                                        {item.judul}
                                    </h3>
                                    <p className="text-body-sm text-muted-foreground leading-relaxed">
                                        {item.deskripsi}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
