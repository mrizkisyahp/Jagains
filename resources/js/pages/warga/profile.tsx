import { useState, ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import InternalLayout from '@/layouts/InternalLayout';
import { User, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

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
        <div className="max-w-3xl space-y-6">
            {/* Header Profil */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                    Profil & Wilayah Warga
                </h1>
                <p className="text-xs text-zinc-500">
                    Kelola data akun dan wilayah domisili Anda.
                </p>
            </div>

            {/* Ringkasan Akun Card */}
            <Card className="p-6 bg-white border-zinc-200 shadow-xs rounded-2xl space-y-5">
                <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-zinc-100 text-zinc-800 rounded-2xl flex items-center justify-center font-bold text-lg border border-zinc-200">
                            {profil.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-zinc-900">{profil.username}</h2>
                            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Warga Terverifikasi
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant={profil.status_akun === 'aktif' ? 'default' : 'destructive'}
                        className="capitalize text-xs font-semibold px-3 py-1"
                    >
                        {profil.status_akun}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                        <span className="text-zinc-500 block font-medium">Poin Peringatan Moderasi</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${profil.poin_peringatan > 0 ? 'text-amber-600' : 'text-zinc-800'}`}>
                                {profil.poin_peringatan}
                            </span>
                            <span className="text-zinc-400">/ 5 batas beku</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Akun dibekukan jika mencapai 5 poin.</p>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                        <span className="text-zinc-500 block font-medium">Privasi Identitas</span>
                        <span className="text-xs font-semibold text-zinc-800 block">Zero-Knowledge Email</span>
                        <p className="text-[11px] text-zinc-400">Alamat email Anda tidak disimpan di basis data Jagains.</p>
                    </div>
                </div>
            </Card>

            {/* Domisili Kelurahan Card */}
            <Card className="p-6 bg-white border-zinc-200 shadow-xs rounded-2xl space-y-5">
                <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-700" />
                        Wilayah Domisili Warga
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        Kelurahan ini menjadi hak voting verifikasi Anda pada penanganan kerusakan fisik di sekitar Anda.
                    </p>
                </div>

                {/* Info Kelurahan Saat Ini */}
                <div className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-zinc-500 font-medium block">Kelurahan Saat Ini:</span>
                        <p className="text-base font-bold text-zinc-900 mt-0.5">
                            {profil.kelurahan_saat_ini.nama
                                ? `Kel. ${profil.kelurahan_saat_ini.nama}`
                                : 'Belum Ditentukan'}
                        </p>
                        {profil.kelurahan_saat_ini.kecamatan && (
                            <span className="text-xs text-zinc-500">
                                Kec. {profil.kelurahan_saat_ini.kecamatan}, Kota Depok
                            </span>
                        )}
                    </div>

                    {!isEditingKelurahan && profil.bisa_ganti_kelurahan && (
                        <Button
                            variant="outline"
                            onClick={() => setIsEditingKelurahan(true)}
                            className="text-xs h-9 bg-white cursor-pointer"
                        >
                            Pindah Kelurahan
                        </Button>
                    )}
                </div>

                {/* Status Kunci 90 Hari */}
                {!profil.bisa_ganti_kelurahan && (
                    <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold">Domisili Dikunci Sementara</p>
                            <p className="text-amber-800 text-[11px]">
                                Anda baru dapat mengganti kelurahan domisili setelah jeda 90 hari kalender demi mencegah manipulasi kuorum voting.
                            </p>
                            <div className="pt-1 flex items-center gap-4 text-[11px] font-medium text-amber-900">
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
                        </div>
                    </div>
                )}

                {/* Form Pindah Kelurahan */}
                {isEditingKelurahan && (
                    <div className="pt-2 border-t border-zinc-100">
                        <div className="mb-4">
                            <span className="text-xs font-bold text-zinc-900 block">Pilih Kelurahan Baru</span>
                            <span className="text-[11px] text-zinc-500">
                                Perubahan kelurahan akan mengunci domisili Anda selama 90 hari ke depan.
                            </span>
                        </div>

                        {errors.kelurahan_id && (
                            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {errors.kelurahan_id}
                            </div>
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
                                    className="h-10 text-xs bg-zinc-900 hover:bg-black text-white cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : 'Konfirmasi Pemindahan'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditingKelurahan(false)}
                                    className="h-10 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
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
