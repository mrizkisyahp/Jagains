import { useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';
import GuestLayouts from '@/layouts/GuestLayout';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
    tokenError?: string;
}

export default function ForgotPassword({ status, tokenError }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/lupa-sandi', {
            onSuccess: () => {
                toast.success('Permintaan Diterima', 'Jika email terdaftar, tautan pemulihan telah dikirim ke email Anda.');
            },
        });
    };

    return (
        <GuestLayouts>
            <Head title="Lupa Kata Sandi - Jagains" />
            <Card className="max-w-md w-full p-6 sm:p-8 shadow-xl border-border rounded-2xl bg-card text-card-foreground space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-primary text-primary-foreground rounded-2xl mb-2 shadow-xs">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Pemulihan Kata Sandi
                    </h1>
                    <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
                        Masukkan alamat email Anda. Jika terdaftar, kami akan mengirimkan tautan sekali pakai untuk mengatur ulang kata sandi Anda.
                    </p>
                </div>

                {tokenError && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertTriangle className="size-4" />
                        <AlertDescription className="text-body-sm">
                            {tokenError}
                        </AlertDescription>
                    </Alert>
                )}

                {status && (
                    <Alert variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-xl">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertDescription className="text-body-sm">
                            {status}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup>
                        <Field className="w-full">
                            <FieldLabel htmlFor="email" className="text-body-medium">Alamat Email Terdaftar</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10 text-body-base"
                                />
                                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                            </div>
                            {errors.email && (
                                <FieldError>{errors.email}</FieldError>
                            )}
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 font-semibold"
                    >
                        {processing ? 'Memproses...' : 'Kirim Tautan Pemulihan'}
                    </Button>
                </form>

                <div className="border-t border-border pt-4 text-center">
                    <Link
                        href="/login"
                        className="text-body-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Halaman Masuk
                    </Link>
                </div>
            </Card>
        </GuestLayouts>
    );
}