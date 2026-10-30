import { useState, ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import InternalLayout from '@/layouts/InternalLayout';
import { User, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface ProfileProps {
    profil: {
        username: string;
        status_akun: string;
        poin_peringatan: number;
        kelurahan_saat_ini: {
            id: number | null;
            nama: string | null;
            kecamatan: string | null;
        };
        kelurahan_diubah_pada: string | null;
        bisa_ganti_kelurahan: boolean;
        sisa_hari_kunci: number;
        tanggal_tercepat_boleh_ganti: string | null;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Profile({ profil }: ProfileProps) {
    const [isEditingKelurahan, setIsEditingKelurahan] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        kelurahan_id: profil.kelurahan_saat_ini.id || 0,
    });

    const handleSaveKelurahan = (e: React.FormEvent) => {
        e.preventDefault();
        post('/warga/kelurahan', {
            onSuccess: () => setIsEditingKelurahan(false),
        });
    };

    return (
        <div className="w-full space-y-6">
            {/* Header Profil */}
            <div>
                <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                    Profil & Wilayah Warga
                </h1>
                <p className="text-body-sm text-muted-foreground mt-1">
                    Kelola data akun dan wilayah domisili Anda untuk verifikasi fasilitas publik.
                </p>
            </div>

            {/* Ringkasan Akun Card */}
            <Card className="p-6 bg-card text-card-foreground border-border shadow-xs rounded-2xl space-y-5">
                <div className="flex items-start justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3.5">
                        <Avatar className="size-14 rounded-2xl border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-lg rounded-2xl">
                                {profil.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-display text-body-medium font-bold text-foreground">{profil.username}</h2>
                            <p className="text-body-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Warga Terverifikasi
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant={profil.status_akun === 'aktif' ? 'default' : 'destructive'}
                        className="capitalize font-semibold px-3 py-1"
                    >
                        {profil.status_akun}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">Poin Peringatan</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="cursor-help inline-flex items-center text-muted-foreground hover:text-foreground">
                                        <Info className="size-3.5" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        Akun dibekukan sementara jika akumulasi poin pelanggaran mencapai 5 poin (Parameter Moderasi).
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${profil.poin_peringatan > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                                {profil.poin_peringatan}
                            </span>
                            <span className="text-muted-foreground text-caption-xs">/ 5 batas beku</span>
                        </div>
                        <p className="text-caption-xs text-muted-foreground">Akun dibekukan jika mencapai 5 poin.</p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">Privasi Identitas</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="cursor-help inline-flex items-center text-muted-foreground hover:text-foreground">
                                        <Info className="size-3.5" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        Alamat email asli diacak permanen dengan HMAC SHA-256 dan tidak disimpan di basis data.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <span className="text-body-sm font-semibold text-foreground block">Zero-Knowledge Email</span>
                        <p className="text-caption-xs text-muted-foreground">Email asli tidak disimpan di basis data Jagains.</p>
                    </div>
                </div>
            </Card>

            {/* Domisili Kelurahan Card */}
            <Card className="p-6 bg-card text-card-foreground border-border shadow-xs rounded-2xl space-y-5">
                <div className="border-b border-border pb-4">
                    <h3 className="font-display text-body-medium font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Wilayah Domisili Warga
                    </h3>
                    <p className="text-body-sm text-muted-foreground mt-1">
                        Kelurahan ini menjadi hak voting verifikasi Anda pada penanganan kerusakan fisik di sekitar Anda.
                    </p>
                </div>

                {/* Info Kelurahan Saat Ini */}
                <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
                    <div>
                        <span className="text-caption-xs text-muted-foreground font-medium block">Kelurahan Saat Ini:</span>
                        <p className="font-display text-body-medium font-bold text-foreground mt-0.5">
                            {profil.kelurahan_saat_ini.nama
                                ? `Kel. ${profil.kelurahan_saat_ini.nama}`
                                : 'Belum Ditentukan'}
                        </p>
                        {profil.kelurahan_saat_ini.kecamatan && (
                            <span className="text-caption-xs text-muted-foreground">
                                Kec. {profil.kelurahan_saat_ini.kecamatan}, Kota Depok
                            </span>
                        )}
                    </div>

                    {!isEditingKelurahan && profil.bisa_ganti_kelurahan && (
                        <Button
                            variant="outline"
                            onClick={() => setIsEditingKelurahan(true)}
                            className="text-body-sm h-9"
                        >
                            Pindah Kelurahan
                        </Button>
                    )}
                </div>

                {/* Status Kunci 90 Hari */}
                {!profil.bisa_ganti_kelurahan && (
                    <Alert variant="default" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl">
                        <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <AlertDescription className="space-y-1 text-body-sm">
                            <p className="font-semibold text-amber-900 dark:text-amber-200">Domisili Dikunci Sementara</p>
                            <p className="text-caption-xs text-amber-800/90 dark:text-amber-300/90">
                                Anda baru dapat mengganti kelurahan domisili setelah jeda 90 hari kalender (Parameter P-14) demi menjaga integritas kuorum voting.
                            </p>
                            <div className="pt-1 flex items-center gap-4 text-caption-xs font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Tersedia:{' '}
                                    {profil.tanggal_tercepat_boleh_ganti
                                        ? new Date(profil.tanggal_tercepat_boleh_ganti).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : '-'}
                                </span>
                                <span>({profil.sisa_hari_kunci} hari tersisa)</span>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form Pindah Kelurahan */}
                {isEditingKelurahan && (
                    <div className="pt-2 border-t border-border space-y-4">
                        <div>
                            <span className="text-body-sm font-bold text-foreground block">Pilih Kelurahan Baru</span>
                            <span className="text-caption-xs text-muted-foreground">
                                Perubahan kelurahan akan mengunci domisili Anda selama 90 hari ke depan.
                            </span>
                        </div>

                        {errors.kelurahan_id && (
                            <Alert variant="destructive" className="rounded-xl">
                                <AlertTriangle className="size-4" />
                                <AlertDescription className="text-body-sm">
                                    {errors.kelurahan_id}
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSaveKelurahan} className="space-y-4">
                            <KelurahanSelector
                                value={data.kelurahan_id}
                                onChange={(id) => setData('kelurahan_id', id)}
                                disabled={processing}
                            />

                            <div className="flex items-center gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing || !data.kelurahan_id || data.kelurahan_id === profil.kelurahan_saat_ini.id}
                                    className="h-10 font-semibold"
                                >
                                    {processing ? 'Menyimpan...' : 'Konfirmasi Pemindahan'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditingKelurahan(false)}
                                    className="h-10 text-body-sm text-muted-foreground hover:text-foreground"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </Card>
        </div>
    );
}

Profile.layout = (page: ReactNode) => (
    <InternalLayout title="Profil & Wilayah Warga" breadcrumb="Warga > Profil">
        {page}
    </InternalLayout>
);