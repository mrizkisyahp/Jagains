import { TrendingUp, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const KINERJA_DATA = [
    {
        judul: 'Respons Cepat Terukur',
        metrik: '< 3 Hari',
        deskripsi: 'Median respons pertama dinas teknis terhadap aduan baru di Kota Depok sesuai batas SLA.',
        ikon: Clock,
        warna: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
    {
        judul: 'Transparansi Janji',
        metrik: '100%',
        deskripsi: 'Seluruh tahap penanganan dan tanggal target penyelesaian tercatat abadi dan dapat diawasi publik.',
        ikon: TrendingUp,
        warna: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
        judul: 'Bukti Nyata Lapangan',
        metrik: '2 Titik Foto',
        deskripsi: 'Perbandingan foto sebelum dan sesudah perbaikan di titik koordinat yang sama dengan geofence valid.',
        ikon: CheckCircle,
        warna: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
        judul: 'Kendali Penuh Warga',
        metrik: 'Kuorum K',
        deskripsi: 'Tiket hanya dinyatakan tertutup setelah diverifikasi secara langsung oleh kuorum warga kelurahan.',
        ikon: ShieldCheck,
        warna: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    },
];

export default function KinerjaSection() {
    return (
        <section id="kinerja" className="py-20 sm:py-28 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
                {/* Header Sesuai Wireframe */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                        Ukur Kinerja Layanan Publik Berbasis Data Nyata
                    </h2>
                    <p className="text-body-base sm:text-body-large text-muted-foreground">
                        Ubah keluhan jadi aksi nyata dengan sistem pengaduan yang transparan dan memihak warga.
                    </p>
                </div>

                {/* 4 Cards Grid Sesuai Wireframe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {KINERJA_DATA.map((item, idx) => {
                        const Icon = item.ikon;

                        return (
                            <Card
                                key={idx}
                                className="p-6 sm:p-7 rounded-3xl bg-card border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center ${item.warna}`}>
                                        <Icon className="size-6" />
                                    </div>

                                    <div className="space-y-1">
                                        <span className="font-mono text-3xl font-extrabold text-foreground block">
                                            {item.metrik}
                                        </span>
                                        <h3 className="font-display text-body-large font-bold text-foreground">
                                            {item.judul}
                                        </h3>
                                    </div>

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
