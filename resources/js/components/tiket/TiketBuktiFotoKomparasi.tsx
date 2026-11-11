import { useState } from 'react';
import {
    Camera,
    CheckCircle,
    Navigation,
    ZoomIn,
    X,
    Image as ImageIcon,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LampiranFoto } from '@/types/tiket';

interface TiketBuktiFotoKomparasiProps {
    fotoAwal: LampiranFoto | null;
    fotoSesudah: LampiranFoto | null;
    keteranganAwal?: string;
}

export default function TiketBuktiFotoKomparasi({
    fotoAwal,
    fotoSesudah,
    keteranganAwal,
}: TiketBuktiFotoKomparasiProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>('');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-lg font-bold text-foreground">
                        Komparasi Bukti Foto Lapangan
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Perbandingan foto kondisi awal laporan warga dan hasil
                        perbaikan fisik oleh dinas teknis.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* 1. Foto Kondisi Awal */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500" />
                            <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                                Foto Awal (Laporan Warga)
                            </span>
                        </div>
                        {fotoAwal && (
                            <Badge
                                variant="outline"
                                className="px-2 py-0 text-[10px]"
                            >
                                {new Date(
                                    fotoAwal.created_at,
                                ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </Badge>
                        )}
                    </div>

                    <div className="group relative flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/60">
                        {fotoAwal ? (
                            <>
                                <img
                                    src={fotoAwal.url}
                                    alt="Foto Bukti Awal Laporan Warga"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreviewUrl(fotoAwal.url);
                                        setPreviewTitle(
                                            'Foto Bukti Awal (Laporan Warga)',
                                        );
                                    }}
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-xs">
                                        <ZoomIn className="size-4" />
                                        <span>Perbesar Foto</span>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                <Camera className="mx-auto mb-2 size-8 opacity-40" />
                                <p className="text-xs">
                                    Foto bukti awal tidak tersedia.
                                </p>
                            </div>
                        )}
                    </div>

                    {keteranganAwal && (
                        <div className="flex-1 border-t border-border/60 bg-card p-3">
                            <p className="line-clamp-3 text-xs text-muted-foreground italic">
                                &ldquo;{keteranganAwal}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* 2. Foto Kondisi Sesudah */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                                Foto Sesudah (Pengerjaan Dinas)
                            </span>
                        </div>
                        {fotoSesudah && (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/30 px-2 py-0 text-[10px] text-emerald-600 dark:text-emerald-400"
                            >
                                {new Date(
                                    fotoSesudah.created_at,
                                ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </Badge>
                        )}
                    </div>

                    <div className="group relative flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/60">
                        {fotoSesudah ? (
                            <>
                                <img
                                    src={fotoSesudah.url}
                                    alt="Foto Bukti Hasil Perbaikan Dinas"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreviewUrl(fotoSesudah.url);
                                        setPreviewTitle(
                                            'Foto Bukti Sesudah (Pengerjaan Dinas)',
                                        );
                                    }}
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-xs">
                                        <ZoomIn className="size-4" />
                                        <span>Perbesar Foto</span>
                                    </div>
                                </button>

                                {/* GPS Geofence Badge */}
                                {fotoSesudah.gps_cocok && (
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-medium text-emerald-300 backdrop-blur-xs">
                                        <CheckCircle className="size-3 text-emerald-400" />
                                        <span>
                                            Lokasi GPS Terverifikasi (&le; 50m)
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                <ImageIcon className="mx-auto mb-2 size-8 opacity-40" />
                                <p className="text-xs font-medium text-foreground">
                                    Belum Ada Foto Perbaikan
                                </p>
                                <p className="mt-1 max-w-xs text-[11px]">
                                    Dinas penanggung jawab belum mengunggah foto
                                    bukti penyelesaian pekerjaan fisik.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 border-t border-border/60 bg-card p-3">
                        {fotoSesudah ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Navigation className="size-3.5 shrink-0 text-primary" />
                                <span>
                                    Foto diunggah oleh petugas lapangan dengan
                                    verifikasi metadata koordinat GPS.
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">
                                Menunggu petugas dinas mengunggah foto
                                penyelesaian fisik dan berita acara.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            <Dialog
                open={!!previewUrl}
                onOpenChange={(open) => !open && setPreviewUrl(null)}
            >
                <DialogContent className="border-border/40 bg-black/90 p-2 text-white sm:max-w-4xl">
                    <div className="relative">
                        <div className="flex items-center justify-between border-b border-white/10 p-2 pb-3 text-sm font-medium">
                            <span>{previewTitle}</span>
                        </div>
                        {previewUrl && (
                            <div className="flex max-h-[80vh] items-center justify-center overflow-auto p-2">
                                <img
                                    src={previewUrl}
                                    alt={previewTitle}
                                    className="max-h-[75vh] w-auto max-w-full rounded-md object-contain"
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
