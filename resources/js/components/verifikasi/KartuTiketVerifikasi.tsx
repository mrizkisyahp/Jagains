import { Link } from '@inertiajs/react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    MapPin,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    ImageIcon,
    Wrench,
    FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TiketVerifikasiItem } from '@/types/verifikasi';
import { cn } from '@/lib/utils';

interface KartuTiketVerifikasiProps {
    tiket: TiketVerifikasiItem;
    onSuaraBerhasil?: () => void;
}

export default function KartuTiketVerifikasi({
    tiket,
}: KartuTiketVerifikasiProps) {
    const { kuorum_info } = tiket;

    const fotoAwal = tiket.lampiran?.[0]?.path;
    const fotoSesudah = tiket.ronde_verifikasi?.[0]?.lampiran_sesudah?.path;

    return (
        <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-foreground/30 hover:shadow-md flex flex-col justify-between">
            <div>
                {/* Komparasi Foto Sebelum vs Sesudah Dinas (Top Half Split Banner 16:9 Sesuai Format Riwayat) */}
                <div className="relative aspect-[16/9] w-full bg-black overflow-hidden grid grid-cols-2 border-b border-border/60">
                    {/* Foto Sebelum */}
                    <div className="relative size-full overflow-hidden bg-black flex items-center justify-center border-r border-border/40">
                        {fotoAwal ? (
                            <img
                                src={`/storage/${fotoAwal}`}
                                alt="Foto Sebelum Perbaikan"
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className={cn(
                                'size-full flex-col items-center justify-center gap-1.5 bg-zinc-900 text-zinc-400 text-caption-xs font-semibold',
                                fotoAwal ? 'hidden' : 'flex'
                            )}
                        >
                            <ImageIcon className="size-6 text-zinc-600" />
                            <span>Foto Sebelum</span>
                        </div>
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-caption-xs font-semibold text-white backdrop-blur-xs">
                            Sebelum
                        </span>
                    </div>

                    {/* Foto Sesudah Dinas */}
                    <div className="relative size-full overflow-hidden bg-black flex items-center justify-center">
                        {fotoSesudah ? (
                            <img
                                src={`/storage/${fotoSesudah}`}
                                alt="Foto Sesudah Dinas"
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className={cn(
                                'size-full flex-col items-center justify-center gap-1.5 bg-zinc-900 text-zinc-400 text-caption-xs font-semibold',
                                fotoSesudah ? 'hidden' : 'flex'
                            )}
                        >
                            <ImageIcon className="size-6 text-zinc-600" />
                            <span>Foto Dinas</span>
                        </div>
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-primary/95 px-2 py-0.5 text-caption-xs font-semibold text-primary-foreground backdrop-blur-xs">
                            <ShieldCheck className="size-3" />
                            <span>Sesudah Dinas</span>
                        </span>
                    </div>
                </div>

                {/* Informasi Tiket Verifikasi (Bottom Half) */}
                <div className="p-5 sm:p-6 space-y-3.5">
                    {/* Header Baris 1: Sisa Waktu & Ronde */}
                    <div className="flex items-center justify-between gap-2">
                        <Badge
                            variant="stage-verify"
                            className="flex items-center gap-1.5 text-caption-xs font-semibold"
                        >
                            <Clock className="size-3" />
                            <span>Sisa {kuorum_info.sisa_hari} Hari</span>
                        </Badge>
                        <span className="text-caption-xs text-muted-foreground font-medium">
                            Ronde {kuorum_info.nomor_ronde}
                        </span>
                    </div>

                    {/* Judul Laporan */}
                    <Link
                        href={`/warga/verifikasi/${tiket.nomor_tiket}?from=verifikasi`}
                        className="block group/title"
                    >
                        <h3 className="font-display text-body-lg sm:text-title-sm font-bold text-foreground leading-snug line-clamp-2 group-hover/title:text-primary transition-colors">
                            {tiket.judul}
                        </h3>
                    </Link>

                    {/* Kategori Fasilitas */}
                    {tiket.kategori?.nama && (
                        <div className="flex items-center gap-2 text-body-sm font-medium text-foreground/80">
                            <Wrench className="size-4 text-muted-foreground shrink-0" />
                            <span>{tiket.kategori.nama}</span>
                        </div>
                    )}

                    {/* Lokasi & Instansi Penanggung Jawab */}
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                        <MapPin className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">
                            Kel. {tiket.kelurahan?.nama ?? 'Depok'}
                            {tiket.instansi?.nama ? ` · ${tiket.instansi.nama}` : ''}
                        </span>
                    </div>

                    {/* Ringkasan Berita Acara Dinas jika ada */}
                    {tiket.berita_acara && tiket.berita_acara.length > 0 && (
                        <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1 text-caption-xs leading-relaxed">
                            <div className="flex items-center justify-between text-foreground font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-primary shrink-0" />
                                    <span>Berita Acara · Versi {tiket.berita_acara[0].versi}</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground font-normal">
                                    {new Intl.DateTimeFormat('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    }).format(new Date(tiket.berita_acara[0].created_at))}
                                </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                                <span className="font-medium text-foreground">Hasil: </span>
                                {tiket.berita_acara[0].hasil || tiket.berita_acara[0].kegiatan}
                            </p>
                        </div>
                    )}

                    {/* Status Kuorum Warga */}
                    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3.5">
                        <div className="flex items-center justify-between text-caption-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                <Users className="size-3.5 text-primary" />
                                Target Kuorum: <strong>{kuorum_info.target_k} K</strong>
                            </span>
                            <span className="font-bold text-foreground">
                                {kuorum_info.persentase_setuju}%
                            </span>
                        </div>

                        <Progress
                            value={kuorum_info.persentase_setuju}
                            className="h-2"
                        />

                        <div className="flex items-center justify-between pt-0.5 text-caption-xs">
                            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" /> Setuju: +
                                {kuorum_info.suara_setuju_bobot}
                                {kuorum_info.ada_jalur_a_setuju && (
                                    <Sparkles className="size-2.5 text-primary" />
                                )}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-destructive">
                                <XCircle className="size-3.5" /> Tolak: -
                                {kuorum_info.suara_tolak_bobot}
                                {kuorum_info.ada_jalur_a_tolak && (
                                    <Sparkles className="size-2.5 text-destructive" />
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Kartu & Tombol Aksi */}
            <div className="p-5 sm:p-6 pt-0">
                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <Link
                        href={`/tiket/${tiket.nomor_tiket}`}
                        className="flex items-center gap-1.5 text-body-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>Detail Publik</span>
                        <ArrowRight className="size-3.5" />
                    </Link>

                    {kuorum_info.sudah_memberi_suara ? (
                        <Link href={`/warga/verifikasi/${tiket.nomor_tiket}?from=verifikasi`}>
                            <Badge
                                variant={
                                    kuorum_info.suara_user?.setuju
                                        ? 'closed'
                                        : 'destructive'
                                }
                                className="px-3 py-1.5 text-caption-xs font-semibold cursor-pointer hover:opacity-90"
                            >
                                {kuorum_info.suara_user?.setuju ? (
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5" /> Anda: Setuju ({kuorum_info.suara_user?.jalur === 'A' ? 'Jarak Dekat' : 'Jarak Jauh'})
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <XCircle className="size-3.5" /> Anda: Tolak ({kuorum_info.suara_user?.jalur === 'A' ? 'Jarak Dekat' : 'Jarak Jauh'})
                                    </span>
                                )}
                            </Badge>
                        </Link>
                    ) : kuorum_info.bisa_memberi_suara ? (
                        <Link
                            href={`/warga/verifikasi/${tiket.nomor_tiket}?from=verifikasi`}
                            className={buttonVariants({
                                size: 'sm',
                                className: 'h-9 px-4 rounded-xl text-body-sm font-bold gap-1.5 cursor-pointer shadow-xs',
                            })}
                        >
                            <ShieldCheck className="size-4" />
                            <span>Beri Suara</span>
                        </Link>
                    ) : (
                        <span className="text-caption-xs text-muted-foreground italic">
                            Tidak berhak bersuara
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
