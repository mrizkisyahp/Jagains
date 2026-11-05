import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GuestLayouts from '@/layouts/GuestLayout';
import AuthSplitCard from '@/components/auth/AuthSplitCard';
import { Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
}

export default function ResetPassword({ token }: ResetPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-sandi');
    };

    return (
        <GuestLayouts>
            <Head title="Atur Ulang Kata Sandi - Jagains" />

            <AuthSplitCard
                heroBadge="Atur Ulang Sandi"
                heroTitle="Buat Kata Sandi Baru Yang Kuat."
                heroDescription="Gunakan kombinasi karakter yang aman untuk melindungi akun dan riwayat partisipasi pengawasan fasilitas Anda."
                title="Atur Ulang Kata Sandi"
                subtitle="Masukkan kata sandi baru Anda. Minimal terdiri dari 8 karakter."
                footer={
                    <div className="text-caption-xs text-muted-foreground">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Halaman Masuk</span>
                        </Link>
                    </div>
                }
            >
                {errors.token && (
                    <Alert variant="destructive" className="mb-4 rounded-xl">
                        <AlertCircle className="size-4" />
                        <AlertDescription className="text-body-sm">
                            {errors.token}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup className="space-y-4">
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="password"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Kata Sandi Baru
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
                                    className="h-11 w-full rounded-xl pr-10 pl-10 text-body-sm"
                                    autoComplete="new-password"
                                />
                                <Lock className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute top-3.5 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
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
                                Konfirmasi Kata Sandi Baru
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
                                    className="h-11 w-full rounded-xl pr-10 pl-10 text-body-sm"
                                    autoComplete="new-password"
                                />
                                <Lock className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute top-3.5 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
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
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 w-full rounded-xl font-semibold shadow-sm transition-all"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                    </Button>
                </form>
            </AuthSplitCard>
        </GuestLayouts>
    );
}
