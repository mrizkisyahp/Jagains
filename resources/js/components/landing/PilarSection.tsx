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
        setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : PILAR_ITEMS.length - 1,
        );
    };

    const handleNext = () => {
        setActiveIndex((prev) =>
            prev < PILAR_ITEMS.length - 1 ? prev + 1 : 0,
        );
    };

    return (
        <section id="janji" className="bg-background py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Tata letak horizontal sesuai Referensi image 8.png: Intro di kiri, 3 Card di kanan */}
                <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* 1. Intro Column (Card Kiri Sesuai image 8.png) */}
                    <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-muted/30 p-6 sm:p-7">
                        <div className="space-y-4">
                            <h2 className="font-display text-2xl leading-[1.2] font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-3xl">
                                Tiada Laporan Sepihak
                            </h2>
                            <p className="text-body-sm leading-relaxed text-muted-foreground">
                                Tiga pilar utama yang menjamin setiap pengaduan
                                dikawal tuntas hingga terbukti nyata di
                                lapangan.
                            </p>
                        </div>

                        {/* Interactive Navigation Buttons Sesuai image 8.png */}
                        <div className="flex items-center gap-2 pt-8">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handlePrev}
                                className={cn(
                                    'size-10 rounded-xl transition-colors',
                                    activeIndex > 0
                                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'border-border bg-card text-foreground hover:bg-muted',
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
                                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'border-border bg-card text-foreground hover:bg-muted',
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
                                    'group flex cursor-pointer flex-col justify-between space-y-6 rounded-3xl border bg-card p-6 transition-all duration-200 sm:p-7',
                                    isFocused
                                        ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
                                        : 'border-border/80 shadow-xs hover:border-border hover:shadow-sm',
                                )}
                            >
                                {/* Gambar Ilustrasi Pilar */}
                                <div className="flex h-36 items-center justify-center pt-2 sm:h-40">
                                    <img
                                        src={item.image}
                                        alt={item.alt}
                                        className={cn(
                                            'mx-auto w-full object-contain transition-transform duration-300 group-hover:scale-105',
                                            item.imageClassName ??
                                                'h-36 max-w-[180px] sm:h-40',
                                        )}
                                        loading="lazy"
                                    />
                                </div>

                                {/* Judul & Deskripsi yang Dipersingkat */}
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-body-base font-display leading-snug font-bold text-foreground">
                                        {item.judul}
                                    </h3>
                                    <p className="text-body-sm leading-relaxed text-muted-foreground">
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
