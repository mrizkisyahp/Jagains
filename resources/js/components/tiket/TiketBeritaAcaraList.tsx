import {
    FileText,
    Building2,
    Calendar,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BeritaAcaraItem } from '@/types/tiket';

interface TiketBeritaAcaraListProps {
    beritaAcara: BeritaAcaraItem[];
}

export default function TiketBeritaAcaraList({
    beritaAcara,
}: TiketBeritaAcaraListProps) {
    if (!beritaAcara || beritaAcara.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                <h3 className="font-display text-sm font-bold text-foreground">
                    Belum Ada Dokumen Berita Acara
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Berita acara pengerjaan fisik akan diarsipkan di sini secara
                    terbuka oleh dinas penanggung jawab setelah proses survei
                    atau perbaikan dimulai.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                        <FileText className="size-5 text-primary" />
                        <span>Arsip Berita Acara Pekerjaan</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Dokumen kekal bersifat append-only yang merinci tahapan
                        perbaikan fisik oleh dinas teknis.
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
                        className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-2xs transition-all hover:border-primary/40"
                    >
                        {/* Header Berita Acara */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2">
                                <Badge className="border-primary/20 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20">
                                    Dokumen Berita Acara — Versi {ba.versi}
                                </Badge>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <Building2 className="size-3.5" />
                                    <span>{ba.instansi_nama}</span>
                                </span>
                            </div>

                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="size-3.5" />
                                <span>
                                    {new Date(ba.created_at).toLocaleDateString(
                                        'id-ID',
                                        {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        },
                                    )}
                                </span>
                            </span>
                        </div>

                        {/* Konten Kegiatan & Hasil */}
                        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                            <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5">
                                <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground">
                                    <CheckCircle2 className="size-3.5 text-primary" />
                                    <span>
                                        Uraian Tindakan / Kegiatan Lapangan:
                                    </span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                    {ba.kegiatan}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5">
                                <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground">
                                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Hasil Fisik Capaian:</span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                    {ba.hasil}
                                </p>
                            </div>
                        </div>

                        {/* Hambatan Lapangan jika ada */}
                        {ba.hambatan && (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                                <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                                    <AlertCircle className="size-3.5" />
                                    <span>Kendala / Hambatan Lapangan:</span>
                                </div>
                                <p className="leading-relaxed text-muted-foreground">
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
