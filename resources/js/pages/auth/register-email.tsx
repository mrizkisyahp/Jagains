import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from '@/components/ui/field';
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
import AuthSplitCard from '@/components/auth/AuthSplitCard';
import {
    Mail,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    Info,
} from 'lucide-react';

interface RegisterEmailProps {
    status?: string;
    tokenError?: string;
}

export default function RegisterEmail({
    status,
    tokenError,
}: RegisterEmailProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/daftar/kirim-verifikasi', {
            onSuccess: () => {
                toast.success(
                    'Tautan Terkirim!',
                    'Tautan verifikasi pendaftaran telah dikirim ke email Anda.',
                );
            },
        });
    };

    return (
        <GuestLayouts>
            <Head title="Daftar Warga - Jagains" />

            <AuthSplitCard
                heroBadge="Pendaftaran Warga"
                heroTitle="Kawal Transparansi Fasilitas Publik Kota."
                heroDescription="Satu warga, satu suara terverifikasi. Lindungi identitas Anda dengan enkripsi Zero-Knowledge Privacy."
                title="Daftar Akun Warga"
                subtitle="Masukkan alamat email aktif Anda. Kami akan mengirimkan tautan verifikasi sekali pakai untuk melanjutkan."
                footer={
                    <div className="space-y-1.5 text-caption-xs text-muted-foreground">
                        <p>
                            Sudah punya akun?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                            >
                                Masuk di sini
                            </Link>
                        </p>
                        <p>
                            Hanya ingin memantau persebaran?{' '}
                            <Link
                                href="/#sebaran-peta"
                                className="underline hover:text-foreground"
                            >
                                Buka Peta Publik
                            </Link>
                        </p>
                    </div>
                }
            >
                {/* Zero Knowledge Privacy Badge & Alert Badges */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger className="inline-flex cursor-help items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-caption-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                                <span className="font-semibold text-foreground">
                                    Zero-Knowledge Privacy
                                </span>
                                <Info className="size-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                                Alamat email Anda dinormalisasi dan dienkripsi
                                satu arah dengan HMAC SHA-256. Kami tidak pernah
                                menyimpan alamat email asli di basis data kami.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {status && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-caption-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Tautan verifikasi terkirim</span>
                        </div>
                    )}
                </div>

                {tokenError && (
                    <div
                        className="mb-3.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-caption-xs font-semibold text-destructive"
                        title={tokenError}
                    >
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span className="truncate">
                            Tautan Kedaluwarsa: Silakan masukkan email Anda
                            untuk tautan baru
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
                                Alamat Email Aktif
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
                            <p className="mt-1.5 text-caption-xs text-muted-foreground">
                                Domain instansi pemerintah (.go.id) tidak
                                diizinkan untuk akun warga.
                            </p>
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 w-full gap-2 rounded-xl font-semibold shadow-sm transition-all"
                    >
                        {processing
                            ? 'Mengirim Tautan...'
                            : 'Kirim Tautan Verifikasi'}
                        <ArrowRight className="size-4" />
                    </Button>
                </form>
            </AuthSplitCard>
        </GuestLayouts>
    );
}
