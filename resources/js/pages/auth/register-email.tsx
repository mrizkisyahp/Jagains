import { useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';
import GuestLayouts from '@/layouts/GuestLayout';
import { ShieldCheck, Mail, ArrowRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface RegisterEmailProps {
    status?: string;
    tokenError?: string;
}

export default function RegisterEmail({ status, tokenError }: RegisterEmailProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/daftar/kirim-verifikasi', {
            onSuccess: () => {
                toast.success('Tautan Terkirim!', 'Tautan verifikasi pendaftaran telah dikirim ke email Anda.');
            },
        });
    };

    return (
        <GuestLayouts>
            <Head title="Daftar Warga - Jagains" />
            <Card className="max-w-md w-full p-6 sm:p-8 shadow-xl border-border rounded-2xl bg-card text-card-foreground space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-primary text-primary-foreground rounded-2xl mb-2 shadow-xs">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Daftar Akun Warga
                    </h1>
                    <div className="text-body-sm text-muted-foreground max-w-sm mx-auto flex items-center justify-center gap-1.5">
                        <span>Jagains menerapkan</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="font-semibold text-foreground underline decoration-dotted cursor-help inline-flex items-center gap-1">
                                    Zero-Knowledge Privacy
                                    <Info className="size-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    Alamat email Anda dinormalisasi dan dienkripsi satu arah dengan HMAC SHA-256. Kami tidak pernah menyimpan alamat email asli di basis data kami.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {tokenError && (
                    <Alert variant="destructive" className="rounded-xl">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Tautan Kedaluwarsa atau Sudah Digunakan</AlertTitle>
                        <AlertDescription className="text-body-sm mt-1">
                            {tokenError}
                        </AlertDescription>
                    </Alert>
                )}

                {status && (
                    <Alert variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-xl">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertTitle>Tautan Terkirim!</AlertTitle>
                        <AlertDescription className="text-body-sm mt-1">
                            {status}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup>
                        <Field className="w-full">
                            <FieldLabel htmlFor="email" className="text-body-medium">Alamat Email Aktif</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@gmail.com"
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
                            <p className="text-caption-xs text-muted-foreground mt-1">
                                Domain instansi pemerintah (.go.id) tidak diizinkan untuk akun warga.
                            </p>
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 font-semibold gap-2"
                    >
                        {processing ? 'Mengirim Tautan...' : 'Kirim Tautan Verifikasi'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>

                <div className="border-t border-border pt-4 text-center text-body-sm text-muted-foreground space-y-2">
                    <p>
                        Sudah punya akun?{' '}
                        <Link href="/login" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                            Masuk di sini
                        </Link>
                    </p>
                    <p className="text-caption-xs text-muted-foreground">
                        Hanya ingin memantau laporan publik?{' '}
                        <Link href="/peta" className="underline hover:text-foreground">
                            Buka Peta Publik
                        </Link>
                    </p>
                </div>
            </Card>
        </GuestLayouts>
    );
}
