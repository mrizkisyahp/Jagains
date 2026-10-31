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

export default function KartuTiketVerifikasi({ tiket, onSuaraBerhasil }: KartuTiketVerifikasiProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const { kuorum_info } = tiket;

    const fotoAwal = tiket.lampiran?.[0]?.path;
    const fotoSesudah = tiket.ronde_verifikasi?.[0]?.lampiran_sesudah?.path;

    return (
        <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
                {/* Header Kartu: Nomor Tiket & Sisa Waktu */}
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-foreground">
                                {tiket.nomor_tiket}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {tiket.kategori?.nama}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3 text-primary" />
                            Kel. {tiket.kelurahan?.nama}
                        </p>
                    </div>

                    <div className="flex flex-col items-end">
                        <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-semibold flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>Sisa {kuorum_info.sisa_hari} Hari</span>
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            Ronde {kuorum_info.nomor_ronde}
                        </span>
                    </div>
                </div>

                {/* Judul & Deskripsi */}
                <div>
                    <h3 className="font-display text-sm font-bold text-foreground line-clamp-1">
                        {tiket.judul}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {tiket.deskripsi}
                    </p>
                </div>

                {/* Komparasi Foto Sebelum vs Sesudah */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-border/60 bg-muted/30">
                        {fotoAwal ? (
                            <img
                                src={`/storage/${fotoAwal}`}
                                alt="Awal"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                                Foto awal
                            </div>
                        )}
                        <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                            Sebelum
                        </span>
                    </div>

                    <div className="relative rounded-xl overflow-hidden aspect-video border border-primary/40 bg-muted/30">
                        {fotoSesudah ? (
                            <img
                                src={`/storage/${fotoSesudah}`}
                                alt="Sesudah Dinas"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                                Foto dinas
                            </div>
                        )}
                        <span className="absolute bottom-1 left-1 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground backdrop-blur-xs flex items-center gap-0.5">
                            <ShieldCheck className="size-2.5" /> Sesudah Dinas
                        </span>
                    </div>
                </div>

                {/* Progres Kuorum Terhadap Target K */}
                <div className="space-y-1.5 rounded-2xl bg-muted/30 p-3 border border-border/50">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            <Users className="size-3.5 text-primary" />
                            Target Kuorum: <strong>{kuorum_info.target_k} K</strong>
                        </span>
                        <span className="text-[11px] font-bold text-foreground">
                            {kuorum_info.persentase_setuju}%
                        </span>
                    </div>
                    <Progress value={kuorum_info.persentase_setuju} className="h-2" />

                    <div className="flex items-center justify-between text-[10px] pt-1 text-muted-foreground">
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="size-3" /> Setuju: +{kuorum_info.suara_setuju_bobot}
                            {kuorum_info.ada_jalur_a_setuju && <Sparkles className="size-2.5 text-primary" />}
                        </span>
                        <span className="text-destructive font-semibold flex items-center gap-0.5">
                            <XCircle className="size-3" /> Tolak: -{kuorum_info.suara_tolak_bobot}
                            {kuorum_info.ada_jalur_a_tolak && <Sparkles className="size-2.5 text-destructive" />}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Kartu & Tombol Aksi */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.visit(`/tiket/${tiket.nomor_tiket}`)}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                >
                    <span>Detail Publik</span>
                    <ArrowRight className="size-3" />
                </Button>

                {kuorum_info.sudah_memberi_suara ? (
                    <Badge
                        className={`text-xs font-semibold py-1 px-2.5 ${
                            kuorum_info.suara_user?.setuju
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-destructive/15 text-destructive border-destructive/30'
                        }`}
                    >
                        {kuorum_info.suara_user?.setuju ? (
                            <span className="flex items-center gap-1">
                                <CheckCircle2 className="size-3.5" /> Anda: Setuju (Jalur {kuorum_info.suara_user?.jalur})
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <XCircle className="size-3.5" /> Anda: Tolak (Jalur {kuorum_info.suara_user?.jalur})
                            </span>
                        )}
                    </Badge>
                ) : kuorum_info.bisa_memberi_suara ? (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setModalOpen(true)}
                        className="text-xs font-bold gap-1 rounded-xl"
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
