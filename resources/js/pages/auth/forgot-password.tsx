import { useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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

    useEffect(() => {
        if (status) {
            toast.success('Permintaan Diterima', status);
        }
    }, [status]);

    useEffect(() => {
        if (tokenError) {
            toast.error('Gagal Pemulihan', tokenError);
        }
    }, [tokenError]);

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
            <Card className="max-w-md w-full p-8 shadow-xl border-zinc-200 rounded-2xl bg-white space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-zinc-900 text-white rounded-xl mb-2">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Pemulihan Kata Sandi</h1>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Masukkan alamat email Anda. Jika terdaftar, kami akan mengirimkan tautan sekali pakai untuk mengatur ulang kata sandi Anda.
                    </p>
                </div>

                {tokenError && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{tokenError}</span>
                    </div>
                )}

                {status && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup>
                        <Field className="w-full">
                            <FieldLabel htmlFor="email">Alamat Email Terdaftar</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10"
                                />
                                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                            )}
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-medium rounded-lg transition-all cursor-pointer"
                    >
                        {processing ? 'Memproses...' : 'Kirim Tautan Pemulihan'}
                    </Button>
                </form>

                <div className="border-t border-zinc-100 pt-3 text-center">
                    <Link
                        href="/login"
                        className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1.5 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Halaman Masuk
                    </Link>
                </div>
            </Card>
        </GuestLayouts>
    );
}
