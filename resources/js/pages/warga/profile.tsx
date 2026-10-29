import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import { User, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';

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

export default function Profile({ profil, flash }: ProfileProps) {
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

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
            <Head title="Profil Akun Warga - Jagains" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header Profil */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Profil & Wilayah Warga</h1>
                        <p className="text-xs text-zinc-500">
                            Kelola data akun dan wilayah domisili Anda di Kota Depok.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="text-xs flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar
                    </Button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-0.5">Berhasil!</p>
                            <p>{flash.success}</p>
                        </div>
                    </div>
                )}

                {/* Ringkasan Akun Card */}
                <Card className="p-6 bg-white border-zinc-200 shadow-sm rounded-2xl space-y-5">
                    <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-zinc-900 text-white rounded-xl">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-zinc-900">{profil.username}</h2>
                                <p className="text-xs text-zinc-500">Peran: Warga Kota Depok</p>
                            </div>
                        </div>
                        <Badge
                            variant={profil.status_akun === 'aktif' ? 'default' : 'destructive'}
                            className="uppercase text-[10px] tracking-wider"
                        >
                            {profil.status_akun}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                            <span className="text-zinc-400 block font-medium">Zero-Knowledge Email</span>
                            <span className="font-semibold text-zinc-700 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Terverifikasi & Terenkripsi
                            </span>
                        </div>
                        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                            <span className="text-zinc-400 block font-medium">Poin Peringatan Moderasi</span>
                            <span className="font-semibold text-zinc-700">
                                {profil.poin_peringatan} / 5 Poin
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Bagian Domisili Kelurahan Card (FR-AKN-04) */}
                <Card className="p-6 bg-white border-zinc-200 shadow-sm rounded-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900">Kelurahan Domisili</h3>
                                <p className="text-xs text-zinc-500">
                                    Menentukan hak pemberian suara pada verifikasi hasil perbaikan fasilitas sekitar Anda.
                                </p>
                            </div>
                        </div>

                        {profil.bisa_ganti_kelurahan ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                Dapat Diubah
                            </Badge>
                        ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                                Terkunci ({profil.sisa_hari_kunci} Hari Lagi)
                            </Badge>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs text-zinc-400 block font-medium">Kelurahan Saat Ini:</span>
                                <span className="text-base font-bold text-zinc-900">
                                    {profil.kelurahan_saat_ini.nama || 'Belum Ditentukan'}
                                    {profil.kelurahan_saat_ini.kecamatan && (
                                        <span className="text-xs font-normal text-zinc-500 ml-1.5">
                                            (Kec. {profil.kelurahan_saat_ini.kecamatan})
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-zinc-400 block">Terakhir Diperbarui:</span>
                                <span className="text-xs font-medium text-zinc-700">
                                    {profil.kelurahan_diubah_pada || '-'}
                                </span>
                            </div>
                        </div>

                        {!profil.bisa_ganti_kelurahan && (
                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Aturan Jeda 90 Hari (P-14)</p>
                                    <p className="text-[11px] mt-0.5 text-amber-800">
                                        Demi mencegah manipulasi kuorum voting warga, pemindahan kelurahan hanya diizinkan paling cepat 90 hari setelah perubahan terakhir. Anda baru dapat mengganti kembali pada tanggal <strong>{profil.tanggal_tercepat_boleh_ganti}</strong>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Ganti Kelurahan Jika Boleh */}
                    {profil.bisa_ganti_kelurahan && (
                        <div>
                            {!isEditingKelurahan ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditingKelurahan(true)}
                                    className="text-xs cursor-pointer"
                                >
                                    Pindahkan Kelurahan Domisili
                                </Button>
                            ) : (
                                <form onSubmit={handleSaveKelurahan} className="space-y-4 pt-2">
                                    <KelurahanSelector
                                        value={data.kelurahan_id}
                                        onChange={(id) => setData('kelurahan_id', id)}
                                        error={errors.kelurahan_id}
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
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
