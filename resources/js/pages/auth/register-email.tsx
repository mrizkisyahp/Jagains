import { useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import GuestLayouts from '@/layouts/GuestLayout';
import { ShieldCheck, Mail, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RegisterEmailProps {
    status?: string;
    tokenError?: string;
}

export default function RegisterEmail({ status, tokenError }: RegisterEmailProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    useEffect(() => {
        if (status) {
            toast.success('Tautan Terkirim!', status);
        }
    }, [status]);

    useEffect(() => {
        if (tokenError) {
            toast.error('Gagal Verifikasi', tokenError);
        }
    }, [tokenError]);

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
            <Card className="max-w-md w-full p-8 shadow-xl border-zinc-200 rounded-2xl bg-white space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-zinc-900 text-white rounded-xl mb-2">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Daftar Akun Warga</h1>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Jagains menerapkan <strong>Zero-Knowledge Privacy</strong>. Email Anda hanya dipakai untuk mengirimkan tautan verifikasi dan <strong>tidak akan disimpan di basis data</strong>.
                    </p>
                </div>

                {tokenError && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-0.5">Tautan Kedaluwarsa atau Sudah Digunakan</p>
                            <p>{tokenError}</p>
                        </div>
                    </div>
                )}

                {status && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-0.5">Tautan Terkirim!</p>
                            <p>{status}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup>
                        <Field className="w-full">
                            <FieldLabel htmlFor="email">Alamat Email Aktif</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@gmail.com"
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
                            <p className="text-[11px] text-zinc-400 mt-1">
                                Domain instansi pemerintah (.go.id) tidak diizinkan untuk akun warga.
                            </p>
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 bg-black hover:bg-zinc-800 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {processing ? 'Mengirim Tautan...' : 'Kirim Tautan Verifikasi'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>

                <div className="border-t border-zinc-100 pt-4 text-center text-xs text-zinc-500 space-y-2">
                    <p>
                        Sudah punya akun?{' '}
                        <Link href="/login" className="font-semibold text-zinc-900 underline underline-offset-4 hover:text-blue-600">
                            Masuk di sini
                        </Link>
                    </p>
                    <p className="text-[11px] text-zinc-400">
                        Hanya ingin memantau laporan publik?{' '}
                        <Link href="/" className="underline hover:text-zinc-600">
                            Buka Peta Publik
                        </Link>
                    </p>
                </div>
            </Card>
        </GuestLayouts>
    );
}
