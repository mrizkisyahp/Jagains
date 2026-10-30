import { Camera, Clock, FileCheck2, Vote } from 'lucide-react';
import { Card } from '@/components/ui/card';

const LANGKAH_DATA = [
    {
        nomor: '01',
        judul: 'Lapor Instan Tanpa Ribet',
        deskripsi:
            'Ambil foto kerusakan langsung dari kamera ponsel di lokasi kejadian. Titik koordinat GPS dan kelurahan terdeteksi otomatis tanpa input formulir yang berbelit.',
        ikon: Camera,
    },
    {
        nomor: '02',
        judul: 'Kawal Secara Terbuka',
        deskripsi:
            'Pantau waktu penanganan dinas yang terikat standar durasi SLA hari kerja. Hitung mundur sisa waktu dan eskalasi pengawasan terlihat transparan oleh publik.',
        ikon: Clock,
    },
    {
        nomor: '03',
        judul: 'Lihat Bukti Nyata di Lapangan',
        deskripsi:
            'Petugas wajib mengunggah bukti foto pengerjaan di titik GPS yang sama beserta berita acara resmi sebelum mengajukan klaim penyelesaian perbaikan.',
        ikon: FileCheck2,
    },
    {
        nomor: '04',
        judul: 'Anda Pegang Kendali Penutupan',
        deskripsi:
            'Dinas tidak bisa menutup tiket sepihak. Warga kelurahan setempat melakukan verifikasi lapangan (Jalur A foto atau Jalur B voting) hingga memenuhi kuorum K.',
        ikon: Vote,
    },
];

export default function AlurSection() {
    return (
        <section id="alur" className="py-20 sm:py-28 bg-muted/30 border-y border-border/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
                {/* Header Seksi Sesuai Wireframe */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                        4 Langkah Mudah, Suara Anda yang Menentukan
                    </h2>
                    <p className="text-body-base sm:text-body-large text-muted-foreground">
                        Ubah keluhan jadi aksi nyata dengan sistem pengaduan yang transparan dan memihak warga.
                    </p>
                </div>

                {/* 4 Cards Grid Sesuai Wireframe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {LANGKAH_DATA.map((langkah) => {
                        const Icon = langkah.ikon;

                        return (
                            <Card
                                key={langkah.nomor}
                                className="relative p-6 sm:p-7 rounded-3xl bg-card border-border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6"
                            >
                                <div className="space-y-4">
                                    {/* Icon & Nomor Step */}
                                    <div className="flex items-center justify-between">
                                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Icon className="size-6" />
                                        </div>
                                        <span className="font-mono text-body-sm font-bold text-muted-foreground/60">
                                            {langkah.nomor}
                                        </span>
                                    </div>

                                    {/* Judul Kartu Sesuai Wireframe */}
                                    <h3 className="font-display text-body-large font-bold text-foreground leading-snug">
                                        {langkah.judul}
                                    </h3>

                                    {/* Penjelasan Ringkas */}
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
