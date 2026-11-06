import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    MapPin,
    ArrowRight,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TiketVerifikasiItem } from '@/types/verifikasi';
import ModalBeriSuaraVerifikasi from './ModalBeriSuaraVerifikasi';

interface KartuTiketVerifikasiProps {
    tiket: TiketVerifikasiItem;
    onSuaraBerhasil?: () => void;
}

export default function KartuTiketVerifikasi({
    tiket,
    onSuaraBerhasil,
}: KartuTiketVerifikasiProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const { kuorum_info } = tiket;

    const fotoAwal = tiket.lampiran?.[0]?.path;
    const fotoSesudah = tiket.ronde_verifikasi?.[0]?.lampiran_sesudah?.path;

    return (
        <div className="flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-border hover:shadow-md">
            <div className="space-y-3">
                {/* Header Kartu: Nomor Tiket & Sisa Waktu */}
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-body-sm font-bold text-foreground">
                                {tiket.nomor_tiket}
                            </span>
                            <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                            >
                                {tiket.kategori?.nama}
                            </Badge>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="size-3 text-primary" />
                            Kel. {tiket.kelurahan?.nama}
                        </p>
                    </div>

                    <div className="flex flex-col items-end">
                        <Badge
                            variant="stage-verify"
                            className="flex items-center gap-1 text-[10px] font-semibold"
                        >
                            <Clock className="size-3" />
                            <span>Sisa {kuorum_info.sisa_hari} Hari</span>
                        </Badge>
                        <span className="mt-0.5 text-[10px] text-muted-foreground">
                            Ronde {kuorum_info.nomor_ronde}
                        </span>
                    </div>
                </div>

                {/* Judul & Deskripsi */}
                <div>
                    <h3 className="font-display text-body-medium font-bold text-foreground line-clamp-1">
                        {tiket.judul}
                    </h3>
                    <p className="mt-0.5 text-body-sm text-muted-foreground line-clamp-2">
                        {tiket.deskripsi}
                    </p>
                </div>

                {/* Komparasi Foto Sebelum vs Sesudah */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                        {fotoAwal ? (
                            <img
                                src={`/storage/${fotoAwal}`}
                                alt="Awal"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                Foto awal
                            </div>
                        )}
                        <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                            Sebelum
                        </span>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-lg border border-primary/40 bg-muted/30">
                        {fotoSesudah ? (
                            <img
                                src={`/storage/${fotoSesudah}`}
                                alt="Sesudah Dinas"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                Foto dinas
                            </div>
                        )}
                        <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground backdrop-blur-xs">
                            <ShieldCheck className="size-2.5" /> Sesudah Dinas
                        </span>
                    </div>
                </div>

                {/* Progres Kuorum Terhadap Target K */}
                <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-caption-xs">
                        <span className="flex items-center gap-1 font-medium text-foreground text-[11px]">
                            <Users className="size-3.5 text-primary" />
                            Target Kuorum: <strong>{kuorum_info.target_k} K</strong>
                        </span>
                        <span className="font-bold text-foreground text-[11px]">
                            {kuorum_info.persentase_setuju}%
                        </span>
                    </div>
                    <Progress
                        value={kuorum_info.persentase_setuju}
                        className="h-2"
                    />

                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" /> Setuju: +
                            {kuorum_info.suara_setuju_bobot}
                            {kuorum_info.ada_jalur_a_setuju && (
                                <Sparkles className="size-2.5 text-primary" />
                            )}
                        </span>
                        <span className="flex items-center gap-0.5 font-semibold text-destructive">
                            <XCircle className="size-3" /> Tolak: -
                            {kuorum_info.suara_tolak_bobot}
                            {kuorum_info.ada_jalur_a_tolak && (
                                <Sparkles className="size-2.5 text-destructive" />
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Kartu & Tombol Aksi */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.visit(`/tiket/${tiket.nomor_tiket}`)}
                    className="h-8 gap-1 px-2 text-caption-xs text-muted-foreground hover:text-foreground"
                >
                    <span>Detail Publik</span>
                    <ArrowRight className="size-3" />
                </Button>

                {kuorum_info.sudah_memberi_suara ? (
                    <Badge
                        variant={
                            kuorum_info.suara_user?.setuju
                                ? 'closed'
                                : 'destructive'
                        }
                        className="px-2.5 py-1 text-caption-xs font-semibold"
                    >
                        {kuorum_info.suara_user?.setuju ? (
                            <span className="flex items-center gap-1">
                                <CheckCircle2 className="size-3.5" /> Anda: Setuju
                                (Jalur {kuorum_info.suara_user?.jalur})
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <XCircle className="size-3.5" /> Anda: Tolak
                                (Jalur {kuorum_info.suara_user?.jalur})
                            </span>
                        )}
                    </Badge>
                ) : kuorum_info.bisa_memberi_suara ? (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setModalOpen(true)}
                        className="h-8 gap-1 rounded-lg text-caption-xs font-semibold"
                    >
                        <ShieldCheck className="size-3.5" />
                        <span>Beri Suara</span>
                    </Button>
                ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                        Tidak berhak bersuara
                    </span>
                )}
            </div>

            {/* Modal Beri Suara */}
            <ModalBeriSuaraVerifikasi
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                tiket={tiket}
                onSuccess={onSuaraBerhasil}
            />
        </div>
    );
}
