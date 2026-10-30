import { TitikLaporanPeta } from '@/types/peta';
import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ThumbsUp, X, ChevronRight, Inbox, ExternalLink } from 'lucide-react';

interface PetaDrawerListProps {
    titikList: TitikLaporanPeta[];
    selectedTiket: TitikLaporanPeta | null;
    onSelectTiket: (tiket: TitikLaporanPeta) => void;
    onClose: () => void;
    isOpen: boolean;
    onResetFilter?: () => void;
}

export default function PetaDrawerList({
    titikList,
    selectedTiket,
    onSelectTiket,
    onClose,
    isOpen,
    onResetFilter,
}: PetaDrawerListProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 z-1000 h-full w-full sm:w-[380px] bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col transition-transform duration-300">
            {/* Header Drawer */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <h3 className="font-display text-body-medium font-bold text-foreground">
                        Daftar Laporan
                    </h3>
                    <Badge variant="secondary" className="font-mono text-caption-xs font-semibold px-2 py-0.5">
                        {titikList.length}
                    </Badge>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </Button>
            </div>

            {/* List Konten */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {titikList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                        <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                            <Inbox className="size-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-display text-body-medium font-bold text-foreground">
                                Tidak Ada Laporan
                            </p>
                            <p className="text-body-sm text-muted-foreground max-w-[240px]">
                                Tidak ada laporan kerusakan yang cocok dengan kombinasi filter yang dipilih.
                            </p>
                        </div>
                        {onResetFilter && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onResetFilter}
                                className="text-caption-xs font-semibold rounded-xl border-border"
                            >
                                Reset Filter
                            </Button>
                        )}
                    </div>
                ) : (
                    titikList.map((item) => {
                        const isSelected = selectedTiket?.id === item.id;

                        return (
                            <Card
                                key={item.id}
                                onClick={() => onSelectTiket(item)}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                                        : 'border-border/80 hover:border-primary/50 hover:bg-muted/40 shadow-none'
                                }`}
                            >
                                <div className="space-y-2">
                                    {/* Baris Atas: Nomor Tiket & Status SLA */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-caption-xs font-bold text-primary">
                                            {item.nomor_tiket}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="size-2 rounded-full"
                                                style={{ backgroundColor: item.warna_sla }}
                                            />
                                            <span
                                                className="text-[11px] font-semibold"
                                                style={{ color: item.warna_sla }}
                                            >
                                                {item.label_sla}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Judul Laporan */}
                                    <p className="text-body-sm font-bold text-foreground line-clamp-2">
                                        {item.judul}
                                    </p>

                                    {/* Kategori & Lokasi */}
                                    <div className="flex flex-wrap items-center gap-2 text-caption-xs text-muted-foreground pt-1 border-t border-border/50">
                                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-medium border-border">
                                            {item.kategori_nama}
                                        </Badge>

                                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                                            Kel. {item.kelurahan_nama}
                                        </span>

                                        <div className="ml-auto flex items-center gap-2">
                                            {item.jumlah_dukungan > 0 && (
                                                <span className="flex items-center gap-1 text-muted-foreground font-mono">
                                                    <ThumbsUp className="size-3 text-primary" />
                                                    {item.jumlah_dukungan}
                                                </span>
                                            )}

                                            <Link
                                                href={`/tiket/${item.nomor_tiket}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                                title="Buka Halaman Detail Tiket"
                                            >
                                                <span>Detail</span>
                                                <ExternalLink className="size-2.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
