import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from 'cn';

const LANGKAH_DATA = [
    {
        id: 1,
        judul: 'Lapor Instan Tanpa Ribet',
        deskripsi:
            'Ambil foto kerusakan langsung dari kamera ponsel di lokasi kejadian',
        gambar: '/images/landing/pothole_photo.png',
    },
    {
        id: 2,
        judul: 'Kawal Secara Terbuka',
        deskripsi:
            'Pantau waktu penanganan dinas yang terikat standar durasi SLA hari kerja.',
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
        <section
            id="alur"
            className="relative overflow-hidden border-y border-border/80 bg-muted/20 py-20 sm:py-28"
        >
            <div className="mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
                {/* Header Seksi */}
                <div className="mx-auto max-w-3xl space-y-4 text-center">
                    <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-4xl">
                        4 Langkah Mudah, Suara Anda yang Menentukan
                    </h2>
                    <p className="sm:text-body-large text-body-base text-muted-foreground">
                        Ubah keluhan jadi aksi nyata dengan sistem pengaduan
                        yang transparan dan memihak warga.
                    </p>
                </div>

                {/* 2. Timeline Step di Luar Atas Card (Sesuai Referensi Gambar) */}
                <div className="mx-auto max-w-4xl px-4 sm:px-8">
                    <div className="relative flex items-center justify-between">
                        {/* Garis Horizontal Latar (Abu-abu Netral) */}
                        <div className="absolute inset-x-6 top-2.5 z-0 h-0.5 -translate-y-1/2 bg-border sm:inset-x-10" />

                        {/* Garis Horizontal Progress Aktif (Warna Primary) */}
                        <div
                            className="absolute top-2.5 left-6 z-0 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 sm:left-10"
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
                                    className="group relative z-10 flex cursor-pointer flex-col items-center focus:outline-hidden"
                                >
                                    {/* Titik / Node Indikator Lingkaran Sesuai Referensi */}
                                    <div
                                        className={cn(
                                            'flex size-5 items-center justify-center rounded-full transition-all duration-300',
                                            isCompleted
                                                ? 'bg-primary ring-4 ring-background'
                                                : isActive
                                                  ? 'border-2 border-primary bg-background ring-4 ring-primary/20'
                                                  : 'border-2 border-border bg-background ring-4 ring-background group-hover:border-primary/50',
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
                                            'mt-2.5 font-mono text-[11px] tracking-wider uppercase transition-colors sm:text-xs',
                                            isActive
                                                ? 'font-bold text-foreground'
                                                : isCompleted
                                                  ? 'font-semibold text-primary'
                                                  : 'font-medium text-muted-foreground/60 group-hover:text-muted-foreground',
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
                <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-4">
                    {LANGKAH_DATA.map((langkah) => {
                        const isSelected = activeStep === langkah.id;

                        return (
                            <Card
                                key={langkah.id}
                                onClick={() => setActiveStep(langkah.id)}
                                className={cn(
                                    'group flex cursor-pointer flex-col justify-between space-y-6 rounded-3xl border bg-card p-6 transition-all duration-300 sm:p-7',
                                    isSelected
                                        ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
                                        : 'border-border/80 shadow-xs hover:border-primary/30 hover:shadow-md',
                                )}
                            >
                                <div className="space-y-5">
                                    {/* Gambar Ilustrasi Baru */}
                                    <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl bg-muted/20 p-2 sm:h-48">
                                        <img
                                            src={langkah.gambar}
                                            alt={langkah.judul}
                                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Judul Kartu */}
                                    <h3 className="sm:text-body-large text-body-base font-display leading-snug font-bold text-foreground">
                                        {langkah.judul}
                                    </h3>

                                    {/* Deskripsi Langkah Baru */}
                                    <p className="text-body-sm leading-relaxed text-muted-foreground">
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
