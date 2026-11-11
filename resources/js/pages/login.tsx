import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GuestLayouts from '@/layouts/GuestLayout';
import AuthSplitCard from '@/components/auth/AuthSplitCard';
import { CheckCircle2, Eye, EyeOff, Lock, User } from 'lucide-react';

interface LoginProps {
    status?: string;
    success?: string;
}

export default function Login({ status, success }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <GuestLayouts>
            <Head title="Masuk - Jagains" />

            <AuthSplitCard
                heroBadge="Sistem Pengawasan Jabodetabek"
                heroTitle="Jaga Kontribusi Anda, Jaga Fasilitas Rakyat."
                heroDescription="Platform audit sengketa fisik independen dan transparansi penanganan fasilitas publik Jabodetabek."
                title="Selamat Datang Kembali"
                subtitle="Masukkan kredensial akun Anda untuk mengakses sistem."
                footer={
                    <div className="space-y-1.5 text-caption-xs text-muted-foreground">
                        <p>
                            Data pribadi warga dikelola aman sesuai standar UU
                            PDP.
                        </p>
                        <p>
                            Hanya ingin memantau persebaran?{' '}
                            <Link
                                href="/#sebaran-peta"
                                className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                            >
                                Buka di beranda publik
                            </Link>
                        </p>
                    </div>
                }
            >
                {(success || status) && (
                    <Alert
                        variant="default"
                        className="mb-4 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    >
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertDescription className="text-body-sm">
                            {success || status}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup className="space-y-4">
                        {/* Field: Username */}
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="username"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Username
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Masukkan username Anda"
                                    value={data.username}
                                    onChange={(e) =>
                                        setData('username', e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl pl-10 text-body-sm"
                                    required
                                    autoComplete="username"
                                />
                                <User className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                            </div>
                            {errors.username && (
                                <FieldError>{errors.username}</FieldError>
                            )}
                        </Field>

                        {/* Field: Password */}
                        <Field className="w-full">
                            <div className="flex items-center justify-between">
                                <FieldLabel
                                    htmlFor="password"
                                    className="text-body-sm font-semibold text-foreground"
                                >
                                    Password
                                </FieldLabel>
                                <Link
                                    href="/lupa-sandi"
                                    className="text-caption-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    Lupa kata sandi?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl pr-10 pl-10 text-body-sm"
                                    required
                                    autoComplete="current-password"
                                />
                                <Lock className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute top-3.5 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                    aria-label={
                                        showPassword
                                            ? 'Sembunyikan password'
                                            : 'Lihat password'
                                    }
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
                    </FieldGroup>

                    {/* Tombol Submit */}
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 w-full rounded-xl font-semibold shadow-sm transition-all"
                    >
                        {processing ? 'Memproses Masuk...' : 'Masuk'}
                    </Button>

                    {/* Link Daftar */}
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-body-sm text-muted-foreground">
                        <span>Belum memiliki akun warga?</span>
                        <Link
                            href="/daftar"
                            className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                        >
                            Daftar sekarang
                        </Link>
                    </div>
                </form>
            </AuthSplitCard>
        </GuestLayouts>
    );
}
