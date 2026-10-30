import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GuestLayouts from '@/layouts/GuestLayout';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import { CheckCircle, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface RegisterCompleteProps {
    token: string;
    payload: string;
    emailMasked: string;
}

export default function RegisterComplete({
    token,
    payload,
    emailMasked,
}: RegisterCompleteProps) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        payload: payload,
        username: '',
        password: '',
        password_confirmation: '',
        kelurahan_id: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/daftar/selesai');
    };

    return (
        <GuestLayouts>
            <Head title="Lengkapi Pendaftaran Warga - Jagains" />
            <Card className="max-w-xl w-full p-6 sm:p-8 shadow-xl border-border rounded-2xl bg-card text-card-foreground space-y-6">
                <div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-caption-xs font-semibold uppercase tracking-wider mb-1">
                        <CheckCircle className="size-4" />
                        <span>Email Terverifikasi ({emailMasked})</span>
                    </div>
                    <h1 className="font-display text-display-md font-bold text-foreground">
                        Lengkapi Profil Akun Warga
                    </h1>
                    <p className="text-body-sm text-muted-foreground mt-1">
                        Tentukan kredensial masuk dan kelurahan domisili Anda untuk keperluan verifikasi hasil perbaikan fasilitas.
                    </p>
                </div>

                {errors.token && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="size-4" />
                        <AlertDescription className="text-body-sm">
                            {errors.token}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FieldGroup className="space-y-4">
                        {/* Field 1: Username */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="username" className="text-body-medium">Username Akun</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="contoh: budi_depok"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10 text-body-base"
                                />
                                <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                            </div>
                            {errors.username && (
                                <FieldError>{errors.username}</FieldError>
                            )}
                            <p className="text-caption-xs text-muted-foreground mt-1">
                                Huruf kecil, angka, tanda hubung (-) atau garis bawah (_). Minimal 3 karakter.
                            </p>
                        </Field>

                        {/* Field 2 & 3: Password & Confirmation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field className="w-full">
                                <FieldLabel htmlFor="password" className="text-body-medium">Kata Sandi</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        className="w-full h-11 pl-10 text-body-base"
                                    />
                                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                                </div>
                                {errors.password && (
                                    <FieldError>{errors.password}</FieldError>
                                )}
                            </Field>

                            <Field className="w-full">
                                <FieldLabel htmlFor="password_confirmation" className="text-body-medium">Konfirmasi Sandi</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                        className="w-full h-11 pl-10 text-body-base"
                                    />
                                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                                </div>
                            </Field>
                        </div>

                        {/* Field 4: Kelurahan Selector */}
                        <KelurahanSelector
                            value={data.kelurahan_id}
                            onChange={(id) => setData('kelurahan_id', id)}
                            error={errors.kelurahan_id}
                        />
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing || !data.kelurahan_id}
                        className="w-full h-11 font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan Akun...' : 'Selesaikan Pendaftaran'}
                    </Button>
                </form>

                <p className="text-caption-xs text-center text-muted-foreground">
                    Sesuai aturan Jagains (P-14), kelurahan domisili yang dipilih hanya dapat diubah kembali paling cepat setelah <strong>90 hari</strong>.
                </p>
            </Card>
        </GuestLayouts>
    );
}
