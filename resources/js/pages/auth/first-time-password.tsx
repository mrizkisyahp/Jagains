import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
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
import { Lock, Eye, EyeOff, AlertCircle, LogOut } from 'lucide-react';

interface FirstTimePasswordProps {
    username: string;
    peran: string;
}

export default function FirstTimePassword({
    username,
    peran,
}: FirstTimePasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/ganti-sandi-pertama');
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <GuestLayouts>
            <Head title="Wajib Ganti Sandi Awal - Jagains" />

            <AuthSplitCard
                heroBadge="Aktivasi Akun Petugas"
                heroTitle="Tingkatkan Keamanan Akses Sistem."
                heroDescription="Demi standar kepatuhan operasional Jagains, akun petugas baru wajib mengganti kata sandi acak dari Administrator sebelum mengakses modul sistem."
                title="Wajib Ganti Kata Sandi Awal"
                subtitle={`Akun: ${username} • Role: ${peran.toUpperCase()}`}
                footer={
                    <div className="flex items-center justify-between text-caption-xs text-muted-foreground">
                        <span>Ingin menggunakan akun lain?</span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1 font-semibold text-destructive hover:underline"
                        >
                            <LogOut className="size-3" />
                            <span>Keluar Sesi</span>
                        </button>
                    </div>
                }
            >
                <Alert
                    variant="default"
                    className="mb-4 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                >
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-body-sm">
                        Kata sandi baru tidak boleh sama dengan kata sandi awal
                        dan minimal 8 karakter.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FieldGroup className="space-y-3.5">
                        {/* Sandi Saat Ini */}
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="current_password"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Kata Sandi Awal Saat Ini
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type={showCurrent ? 'text' : 'password'}
                                    placeholder="Kata sandi acak dari Administrator"
                                    value={data.current_password}
                                    onChange={(e) =>
                                        setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="h-11 w-full rounded-xl pr-10 pl-10 text-body-sm"
                                    autoComplete="current-password"
                                />
                                <Lock className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute top-3.5 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                    aria-label="Toggle password"
                                >
                                    {showCurrent ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            {errors.current_password && (
                                <FieldError>
                                    {errors.current_password}
                                </FieldError>
                            )}
                        </Field>

                        {/* Sandi Baru */}
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="new_password"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Kata Sandi Baru
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Minimal 8 karakter"
                                    value={data.new_password}
                                    onChange={(e) =>
                                        setData('new_password', e.target.value)
                                    }
                                    required
                                    className="h-11 w-full rounded-xl pr-10 pl-10 text-body-sm"
                                    autoComplete="new-password"
                                />
                                <Lock className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute top-3.5 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                    aria-label="Toggle new password"
                                >
                                    {showNew ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            {errors.new_password && (
                                <FieldError>{errors.new_password}</FieldError>
                            )}
                        </Field>

                        {/* Konfirmasi Sandi Baru */}
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="new_password_confirmation"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Konfirmasi Kata Sandi Baru
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="new_password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Ulangi kata sandi baru"
                                    value={data.new_password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'new_password_confirmation',
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
                        className="mt-2 h-11 w-full rounded-xl font-semibold shadow-sm transition-all"
                    >
                        {processing
                            ? 'Menyimpan...'
                            : 'Simpan & Masuk ke Sistem'}
                    </Button>
                </form>
            </AuthSplitCard>
        </GuestLayouts>
    );
}
