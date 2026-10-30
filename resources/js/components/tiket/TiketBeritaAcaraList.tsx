import { FileText, Building2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BeritaAcaraItem } from '@/types/tiket';

interface TiketBeritaAcaraListProps {
    beritaAcara: BeritaAcaraItem[];
}

export default function TiketBeritaAcaraList({ beritaAcara }: TiketBeritaAcaraListProps) {
    if (!beritaAcara || beritaAcara.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                <FileText className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-display text-sm font-bold text-foreground">
                    Belum Ada Dokumen Berita Acara
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Berita acara pengerjaan fisik akan diarsipkan di sini secara terbuka oleh dinas penanggung jawab setelah proses survei atau perbaikan dimulai.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        <span>Arsip Berita Acara Pekerjaan</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Dokumen kekal bersifat append-only yang merinci tahapan perbaikan fisik oleh dinas teknis.
                    </p>
                </div>
                <Badge variant="outline" className="text-xs">
                    {beritaAcara.length} Versi Dokumen
                </Badge>
            </div>

            <div className="space-y-3">
                {beritaAcara.map((ba) => (
                    <div
                        key={ba.id}
                        className="rounded-xl border border-border/70 bg-card p-5 shadow-2xs space-y-4 transition-all hover:border-primary/40"
                    >
                        {/* Header Berita Acara */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-xs font-semibold">
                                    Dokumen Berita Acara — Versi {ba.versi}
                                </Badge>
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="size-3.5" />
                                    <span>{ba.instansi_nama}</span>
                                </span>
                            </div>

                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="size-3.5" />
                                <span>
                                    {new Date(ba.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </span>
                        </div>

                        {/* Konten Kegiatan & Hasil */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="rounded-lg bg-muted/30 p-3.5 border border-border/50">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1.5">
                                    <CheckCircle2 className="size-3.5 text-primary" />
                                    <span>Uraian Tindakan / Kegiatan Lapangan:</span>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {ba.kegiatan}
                                </p>
                            </div>

                            <div className="rounded-lg bg-muted/30 p-3.5 border border-border/50">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Hasil Fisik Capaian:</span>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {ba.hasil}
                                </p>
                            </div>
                        </div>

                        {/* Hambatan Lapangan jika ada */}
                        {ba.hambatan && (
                            <div className="rounded-lg bg-amber-500/5 p-3 border border-amber-500/20 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                    <AlertCircle className="size-3.5" />
                                    <span>Kendala / Hambatan Lapangan:</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {ba.hambatan}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
