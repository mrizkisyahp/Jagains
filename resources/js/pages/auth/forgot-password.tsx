import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import GuestLayouts from '@/layouts/GuestLayout';
import AuthSplitCard from '@/components/auth/AuthSplitCard';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
    tokenError?: string;
}

export default function ForgotPassword({
    status,
    tokenError,
}: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/lupa-sandi', {
            onSuccess: () => {
                toast.success(
                    'Permintaan Diterima',
                    'Jika email terdaftar, tautan pemulihan telah dikirim ke email Anda.',
                );
            },
        });
    };

    return (
        <GuestLayouts>
            <Head title="Lupa Kata Sandi - Jagains" />

            <AuthSplitCard
                heroBadge="Keamanan Akun"
                heroTitle="Aman, Terpercaya, & Terenkripsi Penuh."
                heroDescription="Kehilangan akses ke akun Anda? Masukkan alamat email terdaftar dan kami akan mengirimkan tautan pemulihan sekali pakai."
                title="Pemulihan Kata Sandi"
                subtitle="Masukkan alamat email terdaftar untuk mengatur ulang kata sandi Anda."
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
                {status && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-caption-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{status}</span>
                    </div>
                )}

                {tokenError && (
                    <div
                        className="mb-3.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-caption-xs font-semibold text-destructive"
                        title={tokenError}
                    >
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span className="truncate">
                            Tautan Kedaluwarsa: Silakan ajukan permintaan baru
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup>
                        <Field className="w-full">
                            <FieldLabel
                                htmlFor="email"
                                className="text-body-sm font-semibold text-foreground"
                            >
                                Alamat Email Terdaftar
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                    className="h-11 w-full rounded-xl pl-10 text-body-sm"
                                    autoComplete="email"
                                />
                                <Mail className="absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
                            </div>
                            {errors.email && (
                                <FieldError>{errors.email}</FieldError>
                            )}
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 w-full rounded-xl font-semibold shadow-sm transition-all"
                    >
                        {processing ? 'Memproses...' : 'Kirim Tautan Pemulihan'}
                    </Button>
                </form>
            </AuthSplitCard>
        </GuestLayouts>
    );
}
