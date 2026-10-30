import { useState } from 'react';
import { Camera, CheckCircle, Navigation, ZoomIn, X, Image as ImageIcon } from 'lucide-react';
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
                        Perbandingan foto kondisi awal laporan warga dan hasil perbaikan fisik oleh dinas teknis.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Foto Kondisi Awal */}
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs flex flex-col">
                    <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500" />
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Foto Awal (Laporan Warga)
                            </span>
                        </div>
                        {fotoAwal && (
                            <Badge variant="outline" className="text-[10px] py-0 px-2">
                                {new Date(fotoAwal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Badge>
                        )}
                    </div>

                    <div className="relative aspect-4/3 bg-muted/60 flex items-center justify-center overflow-hidden group">
                        {fotoAwal ? (
                            <>
                                <img
                                    src={fotoAwal.url}
                                    alt="Foto Bukti Awal Laporan Warga"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreviewUrl(fotoAwal.url);
                                        setPreviewTitle('Foto Bukti Awal (Laporan Warga)');
                                    }}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                >
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-xs">
                                        <ZoomIn className="size-4" />
                                        <span>Perbesar Foto</span>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6 text-muted-foreground">
                                <Camera className="size-8 mx-auto mb-2 opacity-40" />
                                <p className="text-xs">Foto bukti awal tidak tersedia.</p>
                            </div>
                        )}
                    </div>

                    {keteranganAwal && (
                        <div className="p-3 bg-card border-t border-border/60 flex-1">
                            <p className="text-xs text-muted-foreground line-clamp-3 italic">
                                &ldquo;{keteranganAwal}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* 2. Foto Kondisi Sesudah */}
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs flex flex-col">
                    <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Foto Sesudah (Pengerjaan Dinas)
                            </span>
                        </div>
                        {fotoSesudah && (
                            <Badge variant="outline" className="text-[10px] py-0 px-2 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                {new Date(fotoSesudah.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Badge>
                        )}
                    </div>

                    <div className="relative aspect-4/3 bg-muted/60 flex items-center justify-center overflow-hidden group">
                        {fotoSesudah ? (
                            <>
                                <img
                                    src={fotoSesudah.url}
                                    alt="Foto Bukti Hasil Perbaikan Dinas"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreviewUrl(fotoSesudah.url);
                                        setPreviewTitle('Foto Bukti Sesudah (Pengerjaan Dinas)');
                                    }}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                >
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-xs">
                                        <ZoomIn className="size-4" />
                                        <span>Perbesar Foto</span>
                                    </div>
                                </button>

                                {/* GPS Geofence Badge */}
                                {fotoSesudah.gps_cocok && (
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs">
                                        <CheckCircle className="size-3 text-emerald-400" />
                                        <span>Lokasi GPS Terverifikasi (&le; 50m)</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center p-6 text-muted-foreground">
                                <ImageIcon className="size-8 mx-auto mb-2 opacity-40" />
                                <p className="text-xs font-medium text-foreground">Belum Ada Foto Perbaikan</p>
                                <p className="text-[11px] mt-1 max-w-xs">
                                    Dinas penanggung jawab belum mengunggah foto bukti penyelesaian pekerjaan fisik.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-card border-t border-border/60 flex-1">
                        {fotoSesudah ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Navigation className="size-3.5 text-primary shrink-0" />
                                <span>
                                    Foto diunggah oleh petugas lapangan dengan verifikasi metadata koordinat GPS.
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">
                                Menunggu petugas dinas mengunggah foto penyelesaian fisik dan berita acara.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
                <DialogContent className="sm:max-w-4xl p-2 bg-black/90 border-border/40 text-white">
                    <div className="relative">
                        <div className="p-2 pb-3 flex items-center justify-between text-sm font-medium border-b border-white/10">
                            <span>{previewTitle}</span>
                        </div>
                        {previewUrl && (
                            <div className="max-h-[80vh] flex items-center justify-center p-2 overflow-auto">
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
