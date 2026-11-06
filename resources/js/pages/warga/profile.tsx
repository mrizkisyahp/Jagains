import { useState, ReactNode } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import InternalLayout from '@/layouts/InternalLayout';
import { MapPin, Calendar, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-20">
            <Head title="Profil & Wilayah - Jagains" />

            {/* Header Halaman (Sesuai Konvensi Admin / Auditor / Instansi) */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-1">
                <div>
                    <h1 className="font-display text-display-xs font-semibold tracking-tight text-foreground sm:text-display-sm">
                        Profil & Wilayah
                    </h1>
                    <p className="text-body-sm text-muted-foreground">
                        Informasi akun warga dan kelurahan domisili untuk hak voting verifikasi perbaikan.
                    </p>
                </div>
            </div>

            {/* Bagian 1: Informasi Akun & Keamanan (Flat List, Tanpa Nested Cards) */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Header Profil */}
                <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <Avatar className="size-11 rounded-lg border border-border">
                            <AvatarFallback className="bg-primary/10 font-display text-body-sm font-bold text-primary">
                                {profil.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-display text-body-medium font-bold text-foreground">
                                    {profil.username}
                                </h2>
                                <Badge
                                    variant={profil.status_akun === 'aktif' ? 'closed' : 'destructive'}
                                    className="capitalize font-semibold px-2 py-0 text-caption-xs"
                                >
                                    {profil.status_akun}
                                </Badge>
                            </div>
                            <p className="mt-0.5 flex items-center gap-1.5 text-caption-xs text-muted-foreground">
                                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                Warga Terverifikasi
                            </p>
                        </div>
                    </div>
                </div>

                {/* Definition List Datar */}
                <dl className="divide-y divide-border px-5">
                    <div className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-4 sm:items-center">
                        <dt className="text-body-sm text-muted-foreground">
                            Poin Peringatan
                        </dt>
                        <dd className="text-body-sm">
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'font-bold text-base',
                                        profil.poin_peringatan > 0
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-foreground',
                                    )}
                                >
                                    {profil.poin_peringatan}
                                </span>
                                <span className="text-caption-xs text-muted-foreground">
                                    / 5 batas beku akun
                                </span>
                            </div>
                            <p className="mt-0.5 text-caption-xs text-muted-foreground">
                                Akun dibekukan sementara jika akumulasi pelanggaran mencapai 5 poin.
                            </p>
                        </dd>
                    </div>

                    <div className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-4 sm:items-center">
                        <dt className="text-body-sm text-muted-foreground">
                            Privasi Identitas
                        </dt>
                        <dd className="text-body-sm">
                            <span className="font-semibold text-foreground">
                                Zero-Knowledge Email (HMAC SHA-256)
                            </span>
                            <p className="mt-0.5 text-caption-xs text-muted-foreground">
                                Alamat email asli diacak permanen dan tidak disimpan di basis data Jagains demi menjaga kerahasiaan pelapor.
                            </p>
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Bagian 2: Wilayah Domisili Warga (Flat Section, Tanpa Nested Cards) */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="font-display text-body-medium font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        Wilayah Domisili Voting
                    </h2>
                    <p className="mt-0.5 text-caption-xs text-muted-foreground">
                        Kelurahan domisili menentukan hak suara Anda saat melakukan verifikasi kuorum penanganan fasilitas publik.
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    {/* Ringkasan Kelurahan Saat Ini */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-caption-xs font-medium text-muted-foreground block">
                                Kelurahan Domisili Saat Ini
                            </span>
                            <p className="font-display text-display-xs font-bold text-foreground mt-0.5">
                                {profil.kelurahan_saat_ini.nama
                                    ? `Kel. ${profil.kelurahan_saat_ini.nama}`
                                    : 'Belum Ditentukan'}
                            </p>
                            {profil.kelurahan_saat_ini.kecamatan && (
                                <p className="text-body-sm text-muted-foreground mt-0.5">
                                    Kec. {profil.kelurahan_saat_ini.kecamatan}, Kota Depok
                                </p>
                            )}
                        </div>

                        {!isEditingKelurahan && profil.bisa_ganti_kelurahan && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditingKelurahan(true)}
                                className="h-9 shrink-0 text-caption-xs font-semibold shadow-none"
                            >
                                Pindah Kelurahan
                            </Button>
                        )}
                    </div>

                    {/* Status Terkunci 90 Hari (Inline Callout Bersih) */}
                    {!profil.bisa_ganti_kelurahan && (
                        <div className="border-t border-border pt-4">
                            <div className="flex items-start gap-3">
                                <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div className="space-y-1 text-body-sm">
                                    <p className="font-semibold text-foreground">
                                        Domisili Terkunci Sementara
                                    </p>
                                    <p className="text-caption-xs text-muted-foreground">
                                        Anda baru dapat mengganti kelurahan domisili setelah jeda 90 hari kalender (Parameter P-14) demi menjaga integritas kuorum voting warga.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-caption-xs">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="size-3.5" />
                                            Tersedia kembali:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {profil.tanggal_tercepat_boleh_ganti
                                                ? new Date(
                                                      profil.tanggal_tercepat_boleh_ganti,
                                                  ).toLocaleDateString('id-ID', {
                                                      day: 'numeric',
                                                      month: 'long',
                                                      year: 'numeric',
                                                  })
                                                : '-'}
                                        </span>
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                            ({profil.sisa_hari_kunci} hari tersisa)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Pindah Kelurahan */}
                    {isEditingKelurahan && (
                        <div className="border-t border-border pt-4 space-y-4">
                            <div>
                                <h3 className="text-body-sm font-semibold text-foreground">
                                    Pilih Kelurahan Baru
                                </h3>
                                <p className="text-caption-xs text-muted-foreground mt-0.5">
                                    Konfirmasi pemindahan akan langsung mengunci kelurahan baru Anda selama 90 hari ke depan.
                                </p>
                            </div>

                            {errors.kelurahan_id && (
                                <Alert variant="destructive" className="rounded-lg">
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

                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !data.kelurahan_id ||
                                            data.kelurahan_id ===
                                                profil.kelurahan_saat_ini.id
                                        }
                                        className="h-9 font-semibold text-caption-xs shadow-none"
                                    >
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Konfirmasi Pemindahan'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsEditingKelurahan(false)}
                                        className="h-9 text-caption-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

Profile.layout = (page: ReactNode) => (
    <InternalLayout title="Profil & Wilayah" breadcrumb="Warga > Profil">
        {page}
    </InternalLayout>
);
