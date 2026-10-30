import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GuestLayouts from '@/layouts/GuestLayout';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
}

export default function ResetPassword({ token }: ResetPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-sandi');
    };

    return (
        <GuestLayouts>
            <Head title="Atur Ulang Kata Sandi - Jagains" />
            <Card className="max-w-md w-full p-6 sm:p-8 shadow-xl border-border rounded-2xl bg-card text-card-foreground space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-primary text-primary-foreground rounded-2xl mb-2 shadow-xs">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Atur Ulang Kata Sandi
                    </h1>
                    <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
                        Masukkan kata sandi baru untuk akun warga Anda. Kata sandi minimal terdiri dari 8 karakter.
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

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup className="space-y-4">
                        <Field className="w-full">
                            <FieldLabel htmlFor="password" className="text-body-medium">Kata Sandi Baru</FieldLabel>
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
                            <FieldLabel htmlFor="password_confirmation" className="text-body-medium">Konfirmasi Kata Sandi Baru</FieldLabel>
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
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 font-semibold"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                    </Button>
                </form>

                <div className="border-t border-border pt-4 text-center">
                    <Link
                        href="/login"
                        className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Batal dan kembali ke Masuk
                    </Link>
                </div>
            </Card>
        </GuestLayouts>
    );
}