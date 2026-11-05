import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GuestLayouts from '@/layouts/GuestLayout';
import AuthSplitCard from '@/components/auth/AuthSplitCard';
import KelurahanSearchDropdown from '@/components/wilayah/KelurahanSearchDropdown';
import { CheckCircle2, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';

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

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/daftar/selesai');
    };

    return (
        <GuestLayouts>
            <Head title="Lengkapi Profil Akun Anda - Jagains" />

            <AuthSplitCard
                cardMaxWidth="max-w-5xl"
                heroBadge="Tahap Terakhir"
                heroTitle="Langkah Terakhir, Jadilah Pengawas Berdaya."
                heroDescription="Tentukan username dan domisili kelurahan Anda untuk memverifikasi keabsahan pekerjaan fisik di lingkungan sekitar."
                title="Lengkapi Profil Akun Anda"
                subtitle="Isi username, password dan kelurahan anda untuk verifikasi hasil perbaikan fasilitas."
                footer={
                    <p className="text-caption-xs text-muted-foreground">
                        Sesuai aturan Jagains (P-14), kelurahan domisili dapat diubah kembali paling cepat setelah <strong>90 hari</strong>.
                    </p>
                }
            >
                {/* Chip Status Email Terverifikasi Ringkas */}
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-caption-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Email Terverifikasi ({emailMasked})</span>
                </div>

                {errors.token && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="size-4" />
                        <AlertDescription className="text-body-sm">
                            {errors.token}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FieldGroup className="space-y-3">
                        {/* Field 1: Username Akun */}
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="username"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Username Akun
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="contoh: budi_depok"
                                    value={data.username}
                                    onChange={(e) =>
                                        setData('username', e.target.value)
                                    }
                                    required
                                    className="h-10 w-full rounded-xl pl-10 text-body-sm"
                                    autoComplete="username"
                                />
                                <UserIcon className="absolute top-3 left-3.5 size-4 text-muted-foreground" />
                            </div>
                            {errors.username && (
                                <FieldError>{errors.username}</FieldError>
                            )}
                        </Field>

                        {/* Field 2 & 3: Kata Sandi & Konfirmasi Sandi Berdampingan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field className="w-full">
                                <FieldLabel
                                    htmlFor="password"
                                    className="text-body-sm font-semibold text-foreground"
                                >
                                    Kata Sandi
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        required
                                        className="h-10 w-full rounded-xl pr-9 pl-10 text-body-sm"
                                        autoComplete="new-password"
                                    />
                                    <Lock className="absolute top-3 left-3.5 size-4 text-muted-foreground" />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                        aria-label="Toggle password"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <FieldError>{errors.password}</FieldError>
                                )}
                            </Field>

                            <Field className="w-full">
                                <FieldLabel
                                    htmlFor="password_confirmation"
                                    className="text-body-sm font-semibold text-foreground"
                                >
                                    Konfirmasi Sandi
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="h-10 w-full rounded-xl pr-9 pl-10 text-body-sm"
                                        autoComplete="new-password"
                                    />
                                    <Lock className="absolute top-3 left-3.5 size-4 text-muted-foreground" />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirm(!showConfirm)
                                        }
                                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                        aria-label="Toggle confirm password"
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </Field>
                        </div>

                        {/* Field 4: Kelurahan Domisili (1 Searchable Dropdown + 1 Tombol GPS) */}
                        <Field className="w-full">
                            <FieldLabel className="text-body-sm font-semibold text-foreground">
                                Kelurahan Domisili
                            </FieldLabel>
                            <KelurahanSearchDropdown
                                value={data.kelurahan_id}
                                onChange={(id) => setData('kelurahan_id', id)}
                                error={errors.kelurahan_id}
                            />
                        </Field>
                    </FieldGroup>

                    {/* Tombol Submit */}
                    <Button
                        type="submit"
                        disabled={processing || !data.kelurahan_id}
                        className="h-10 w-full rounded-xl font-semibold shadow-sm transition-all"
                    >
                        {processing
                            ? 'Menyimpan Akun...'
                            : 'Selesaikan Pendaftaran'}
                    </Button>
                </form>
            </AuthSplitCard>
        </GuestLayouts>
    );
}
