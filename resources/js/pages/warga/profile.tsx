import { useState, ReactNode } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import InternalLayout from '@/layouts/InternalLayout';
import {
    MapPin,
    Calendar,
    Clock,
    AlertTriangle,
    ShieldCheck,
    KeyRound,
    Eye,
    EyeOff,
} from 'lucide-react';
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
            kota?: string | null;
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
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        kelurahan_id: profil.kelurahan_saat_ini.id || 0,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSaveKelurahan = (e: React.FormEvent) => {
        e.preventDefault();
        post('/warga/kelurahan', {
            onSuccess: () => setIsEditingKelurahan(false),
        });
    };

    const openPasswordModal = () => {
        passwordForm.reset();
        passwordForm.clearErrors();
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setIsPasswordModalOpen(true);
    };

    const closePasswordModal = () => {
        setIsPasswordModalOpen(false);
        passwordForm.reset();
        passwordForm.clearErrors();
    };

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/warga/password', {
            preserveScroll: true,
            onSuccess: () => {
                closePasswordModal();
                toast.success('Kata sandi berhasil diperbarui.');
            },
        });
    };

    return (
        <InternalLayout title="Profil & Wilayah" breadcrumb="Warga > Profil">
            <div className="mx-auto w-full max-w-7xl space-y-6 pb-20">
                <Head title="Profil & Wilayah - Jagains" />

                {/* Bagian 1: Informasi Akun & Keamanan (Flat List, Tanpa Nested Cards) */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    {/* Header Profil */}
                    <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3.5">
                            <Avatar className="size-11 rounded-lg border border-border">
                                <AvatarFallback className="bg-primary/10 text-body-sm font-display font-bold text-primary">
                                    {profil.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-body-medium font-display font-bold text-foreground">
                                        {profil.username}
                                    </h2>
                                    <Badge
                                        variant={
                                            profil.status_akun === 'aktif'
                                                ? 'closed'
                                                : 'destructive'
                                        }
                                        className="px-2 py-0 text-caption-xs font-semibold capitalize"
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
                        <div className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-4">
                            <dt className="text-body-sm text-muted-foreground">
                                Poin Peringatan
                            </dt>
                            <dd className="text-body-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'text-base font-bold',
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
                                    Akun dibekukan sementara jika akumulasi
                                    pelanggaran mencapai 5 poin.
                                </p>
                            </dd>
                        </div>

                        <div className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-4">
                            <dt className="text-body-sm text-muted-foreground">
                                Privasi Identitas
                            </dt>
                            <dd className="text-body-sm">
                                <span className="font-semibold text-foreground">
                                    Zero-Knowledge Email (HMAC SHA-256)
                                </span>
                                <p className="mt-0.5 text-caption-xs text-muted-foreground">
                                    Alamat email asli diacak permanen dan tidak
                                    disimpan di basis data Jagains demi menjaga
                                    kerahasiaan pelapor.
                                </p>
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Bagian 2: Wilayah Domisili Warga (Flat Section, Tanpa Nested Cards) */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="flex items-center gap-2 text-body-medium font-display font-semibold text-foreground">
                            <MapPin className="size-4 text-primary" />
                            Wilayah Domisili Voting
                        </h2>
                        <p className="mt-0.5 text-caption-xs text-muted-foreground">
                            Kelurahan domisili menentukan hak suara Anda saat
                            melakukan verifikasi kuorum penanganan fasilitas
                            publik.
                        </p>
                    </div>

                    <div className="space-y-4 p-5">
                        {/* Ringkasan Kelurahan Saat Ini */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="block text-caption-xs font-medium text-muted-foreground">
                                    Kelurahan Domisili Saat Ini
                                </span>
                                <p className="mt-0.5 text-display-xs font-display font-bold text-foreground">
                                    {profil.kelurahan_saat_ini.nama
                                        ? `Kel. ${profil.kelurahan_saat_ini.nama}`
                                        : 'Belum Ditentukan'}
                                </p>
                                {profil.kelurahan_saat_ini.kecamatan && (
                                    <p className="mt-0.5 text-body-sm text-muted-foreground">
                                        Kec.{' '}
                                        {profil.kelurahan_saat_ini.kecamatan},{' '}
                                        {profil.kelurahan_saat_ini.kota ||
                                            'Jabodetabek'}
                                    </p>
                                )}
                            </div>

                            {!isEditingKelurahan &&
                                profil.bisa_ganti_kelurahan && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setIsEditingKelurahan(true)
                                        }
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
                                    <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div className="space-y-1 text-body-sm">
                                        <p className="font-semibold text-foreground">
                                            Domisili Terkunci Sementara
                                        </p>
                                        <p className="text-caption-xs text-muted-foreground">
                                            Anda baru dapat mengganti kelurahan
                                            domisili setelah jeda 90 hari
                                            kalender (Parameter P-14) demi
                                            menjaga integritas kuorum voting
                                            warga.
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
                                                      ).toLocaleDateString(
                                                          'id-ID',
                                                          {
                                                              day: 'numeric',
                                                              month: 'long',
                                                              year: 'numeric',
                                                          },
                                                      )
                                                    : '-'}
                                            </span>
                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                ({profil.sisa_hari_kunci} hari
                                                tersisa)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Pindah Kelurahan */}
                        {isEditingKelurahan && (
                            <div className="space-y-4 border-t border-border pt-4">
                                <div>
                                    <h3 className="text-body-sm font-semibold text-foreground">
                                        Pilih Kelurahan Baru
                                    </h3>
                                    <p className="mt-0.5 text-caption-xs text-muted-foreground">
                                        Konfirmasi pemindahan akan langsung
                                        mengunci kelurahan baru Anda selama 90
                                        hari ke depan.
                                    </p>
                                </div>

                                {errors.kelurahan_id && (
                                    <Alert
                                        variant="destructive"
                                        className="rounded-lg"
                                    >
                                        <AlertTriangle className="size-4" />
                                        <AlertDescription className="text-body-sm">
                                            {errors.kelurahan_id}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form
                                    onSubmit={handleSaveKelurahan}
                                    className="space-y-4"
                                >
                                    <KelurahanSelector
                                        value={data.kelurahan_id}
                                        onChange={(id) =>
                                            setData('kelurahan_id', id)
                                        }
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
                                            className="h-9 text-caption-xs font-semibold shadow-none"
                                        >
                                            {processing
                                                ? 'Menyimpan...'
                                                : 'Konfirmasi Pemindahan'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setIsEditingKelurahan(false)
                                            }
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

                {/* Bagian 3: Keamanan & Kata Sandi */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="flex items-center gap-2 text-body-medium font-display font-semibold text-foreground">
                            <KeyRound className="size-4 text-primary" />
                            Keamanan & Kata Sandi
                        </h2>
                        <p className="mt-0.5 text-caption-xs text-muted-foreground">
                            Kelola kredensial login dan perlindungan akses akun
                            warga Anda.
                        </p>
                    </div>

                    <div className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <span className="block text-caption-xs font-medium text-muted-foreground">
                                    Kata Sandi Akun
                                </span>
                                <p className="font-mono text-base font-bold tracking-widest text-foreground">
                                    ••••••••••••
                                </p>
                                <p className="flex items-center gap-1.5 pt-0.5 text-caption-xs text-muted-foreground">
                                    <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Terlindungi enkripsi satu arah yang aman
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={openPasswordModal}
                                className="h-9 shrink-0 gap-2 text-caption-xs font-semibold shadow-none"
                            >
                                <KeyRound className="size-3.5" />
                                Ubah Kata Sandi
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Modal Dialog Ubah Kata Sandi */}
                <Dialog
                    open={isPasswordModalOpen}
                    onOpenChange={(open) => !open && closePasswordModal()}
                >
                    <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-display-xs font-display font-semibold text-foreground">
                                <KeyRound
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                <span>Ubah Kata Sandi Akun</span>
                            </DialogTitle>
                            <DialogDescription className="text-body-sm text-muted-foreground">
                                Masukkan kata sandi lama Anda untuk verifikasi,
                                lalu tentukan kata sandi baru minimal 8
                                karakter.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleSavePassword}
                            className="space-y-4 pt-1"
                        >
                            {/* Kata Sandi Saat Ini */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="modal_current_password"
                                    className="block text-body-sm font-medium text-foreground"
                                >
                                    Kata Sandi Saat Ini{' '}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        id="modal_current_password"
                                        type={
                                            showCurrentPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={
                                            passwordForm.data.current_password
                                        }
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'current_password',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Masukkan kata sandi saat ini"
                                        className="pr-10"
                                        required
                                        disabled={passwordForm.processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrentPassword(
                                                !showCurrentPassword,
                                            )
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-hidden"
                                        tabIndex={-1}
                                        aria-label={
                                            showCurrentPassword
                                                ? 'Sembunyikan kata sandi saat ini'
                                                : 'Tampilkan kata sandi saat ini'
                                        }
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordForm.errors.current_password && (
                                    <p className="text-caption-xs text-destructive">
                                        {passwordForm.errors.current_password}
                                    </p>
                                )}
                            </div>

                            {/* Kata Sandi Baru */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="modal_password"
                                    className="block text-body-sm font-medium text-foreground"
                                >
                                    Kata Sandi Baru{' '}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        id="modal_password"
                                        type={
                                            showNewPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={passwordForm.data.password}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Minimal 8 karakter"
                                        className="pr-10"
                                        required
                                        disabled={passwordForm.processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-hidden"
                                        tabIndex={-1}
                                        aria-label={
                                            showNewPassword
                                                ? 'Sembunyikan kata sandi baru'
                                                : 'Tampilkan kata sandi baru'
                                        }
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="text-caption-xs text-destructive">
                                        {passwordForm.errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Konfirmasi Kata Sandi Baru */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="modal_password_confirmation"
                                    className="block text-body-sm font-medium text-foreground"
                                >
                                    Konfirmasi Kata Sandi Baru{' '}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        id="modal_password_confirmation"
                                        type={
                                            showConfirmPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={
                                            passwordForm.data
                                                .password_confirmation
                                        }
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ulangi kata sandi baru Anda"
                                        className="pr-10"
                                        required
                                        disabled={passwordForm.processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-hidden"
                                        tabIndex={-1}
                                        aria-label={
                                            showConfirmPassword
                                                ? 'Sembunyikan konfirmasi kata sandi'
                                                : 'Tampilkan konfirmasi kata sandi'
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-caption-xs text-destructive">
                                        {
                                            passwordForm.errors
                                                .password_confirmation
                                        }
                                    </p>
                                )}
                            </div>

                            <p className="text-caption-xs text-muted-foreground">
                                Kata sandi harus terdiri dari minimal 8 karakter
                                dan berbeda dari kata sandi saat ini.
                            </p>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closePasswordModal}
                                    disabled={passwordForm.processing}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    disabled={
                                        passwordForm.processing ||
                                        !passwordForm.data.current_password ||
                                        !passwordForm.data.password ||
                                        !passwordForm.data.password_confirmation
                                    }
                                >
                                    {passwordForm.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Kata Sandi'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </InternalLayout>
    );
}
