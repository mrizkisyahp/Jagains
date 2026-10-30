import { Users, Clock, Scale } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PilarSection() {
    return (
        <section id="janji" className="py-20 sm:py-28 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    {/* Left Column Sesuai Wireframe */}
                    <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-28">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-caption-xs font-semibold text-primary border border-primary/20">
                            <span>Jaminan Transparansi 100%</span>
                        </div>

                        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                            Tiada Laporan<br className="hidden sm:inline" /> Sepihak
                        </h2>

                        <p className="text-body-base sm:text-body-large text-muted-foreground leading-relaxed">
                            Tiga pilar utama yang menjamin setiap laporan dikawal tuntas hingga terbukti di lapangan.
                        </p>
                    </div>

                    {/* Right Column: Bento Grid 3 Cards Sesuai Wireframe */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Large Top Card: Dicek Langsung oleh Warga Sekitar */}
                        <Card className="p-7 sm:p-8 rounded-3xl bg-card border-border shadow-xs hover:shadow-md transition-all space-y-4">
                            <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Users className="size-6" />
                            </div>

                            <h3 className="font-display text-2xl font-bold text-foreground">
                                Dicek Langsung oleh Warga Sekitar
                            </h3>

                            <p className="text-body-base text-muted-foreground leading-relaxed">
                                Validasi penutupan tiket tidak ditentukan oleh laporan sepihak instansi, melainkan oleh kuorum warga kelurahan setempat. Warga membuktikan sendiri di lapangan melalui voting berbobot dengan verifikasi foto kamera langsung (Jalur A) atau verifikasi konfirmasi (Jalur B).
                            </p>
                        </Card>

                        {/* Bottom Grid 2 Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* 2. Pantau Waktu Penanganan */}
                            <Card className="p-6 sm:p-7 rounded-3xl bg-card border-border shadow-xs hover:shadow-md transition-all space-y-3.5">
                                <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Clock className="size-5" />
                                </div>

                                <h4 className="font-display text-body-large font-bold text-foreground leading-snug">
                                    Pantau Waktu Penanganan
                                </h4>

                                <p className="text-body-sm text-muted-foreground leading-relaxed">
                                    Setiap tahap penanganan (respons, survei teknis, alokasi anggaran, dan pengerjaan) diikat SLA hari kerja resmi. Jika batas terlewati, sistem otomatis menandainya merah dan memicu eskalasi.
                                </p>
                            </Card>

                            {/* 3. Penengah Resmi Saat Ada Masalah */}
                            <Card className="p-6 sm:p-7 rounded-3xl bg-card border-border shadow-xs hover:shadow-md transition-all space-y-3.5">
                                <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                    <Scale className="size-5" />
                                </div>

                                <h4 className="font-display text-body-large font-bold text-foreground leading-snug">
                                    Penengah Resmi Saat Ada Masalah
                                </h4>

                                <p className="text-body-sm text-muted-foreground leading-relaxed">
                                    Jika terjadi perselisihan klaim perbaikan antara warga dan dinas, Auditor Independen bertindak sebagai pengadil tanpa kompromi untuk memeriksa bukti fisik dan memerintahkan pengerjaan ulang.
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
