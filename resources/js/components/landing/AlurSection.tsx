import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from 'cn';

const LANGKAH_DATA = [
    {
        id: 1,
        judul: 'Lapor Instan Tanpa Ribet',
        deskripsi: 'Ambil foto kerusakan langsung dari kamera ponsel di lokasi kejadian',
        gambar: '/images/landing/pothole_photo.png',
    },
    {
        id: 2,
        judul: 'Kawal Secara Terbuka',
        deskripsi: 'Pantau waktu penanganan dinas yang terikat standar durasi SLA hari kerja.',
        gambar: '/images/landing/report_observe.png',
    },
    {
        id: 3,
        judul: 'Lihat Bukti Nyata di Lapangan',
        deskripsi: 'verifikasi apakah perbaikan sudah dilakukan dengan benar.',
        gambar: '/images/landing/pothole_survey.png',
    },
    {
        id: 4,
        judul: 'Anda Pegang Kendali Penutupan',
        deskripsi:
            'memberikan konfirmasi perbaikan dengan melakukan pelaporan ditempat (melalui foto) atau cukup vote dari mana saja.',
        gambar: '/images/landing/report_vote.png',
    },
];

export default function AlurSection() {
    const [activeStep, setActiveStep] = useState(4);

    return (
        <section id="alur" className="relative py-20 sm:py-28 bg-muted/20 border-y border-border/80 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
                {/* Header Seksi */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                        4 Langkah Mudah, Suara Anda yang Menentukan
                    </h2>
                    <p className="text-body-base sm:text-body-large text-muted-foreground">
                        Ubah keluhan jadi aksi nyata dengan sistem pengaduan yang transparan dan memihak warga.
                    </p>
                </div>

                {/* 2. Timeline Step di Luar Atas Card (Sesuai Referensi Gambar) */}
                <div className="max-w-4xl mx-auto px-4 sm:px-8">
                    <div className="relative flex items-center justify-between">
                        {/* Garis Horizontal Latar (Abu-abu Netral) */}
                        <div className="absolute top-2.5 inset-x-6 sm:inset-x-10 h-0.5 bg-border -translate-y-1/2 z-0" />

                        {/* Garis Horizontal Progress Aktif (Warna Primary) */}
                        <div
                            className="absolute top-2.5 left-6 sm:left-10 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500 z-0"
                            style={{
                                width: `calc(${((activeStep - 1) / (LANGKAH_DATA.length - 1)) * 100}% - ${
                                    activeStep === 1 ? '0px' : '1.5rem'
                                })`,
                            }}
                        />

                        {LANGKAH_DATA.map((item, idx) => {
                            const stepNum = idx + 1;
                            const isCompleted = stepNum < activeStep;
                            const isActive = stepNum === activeStep;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveStep(stepNum)}
                                    className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-hidden"
                                >
                                    {/* Titik / Node Indikator Lingkaran Sesuai Referensi */}
                                    <div
                                        className={cn(
                                            'size-5 rounded-full transition-all duration-300 flex items-center justify-center',
                                            isCompleted
                                                ? 'bg-primary ring-4 ring-background'
                                                : isActive
                                                ? 'bg-background border-2 border-primary ring-4 ring-primary/20'
                                                : 'bg-background border-2 border-border ring-4 ring-background group-hover:border-primary/50'
                                        )}
                                    >
                                        {isCompleted && (
                                            <span className="size-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                        {isActive && (
                                            <span className="size-2 rounded-full bg-primary" />
                                        )}
                                    </div>

                                    {/* Label STEP 1 - STEP 4 Sesuai Referensi */}
                                    <span
                                        className={cn(
                                            'mt-2.5 font-mono text-[11px] sm:text-xs tracking-wider uppercase transition-colors',
                                            isActive
                                                ? 'font-bold text-foreground'
                                                : isCompleted
                                                ? 'font-semibold text-primary'
                                                : 'font-medium text-muted-foreground/60 group-hover:text-muted-foreground'
                                        )}
                                    >
                                        STEP {stepNum}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4 Cards Grid (Tanpa Tulisan Langkah 01 - 04, Gambar Baru & Deskripsi Baru) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 items-stretch">
                    {LANGKAH_DATA.map((langkah) => {
                        const isSelected = activeStep === langkah.id;

                        return (
                            <Card
                                key={langkah.id}
                                onClick={() => setActiveStep(langkah.id)}
                                className={cn(
                                    'group p-6 sm:p-7 rounded-3xl bg-card border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer',
                                    isSelected
                                        ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
                                        : 'border-border/80 shadow-xs hover:shadow-md hover:border-primary/30'
                                )}
                            >
                                <div className="space-y-5">
                                    {/* Gambar Ilustrasi Baru */}
                                    <div className="w-full h-44 sm:h-48 overflow-hidden rounded-2xl bg-muted/20 flex items-center justify-center p-2">
                                        <img
                                            src={langkah.gambar}
                                            alt={langkah.judul}
                                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Judul Kartu */}
                                    <h3 className="font-display text-body-base sm:text-body-large font-bold text-foreground leading-snug">
                                        {langkah.judul}
                                    </h3>

                                    {/* Deskripsi Langkah Baru */}
                                    <p className="text-body-sm text-muted-foreground leading-relaxed">
                                        {langkah.deskripsi}
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
