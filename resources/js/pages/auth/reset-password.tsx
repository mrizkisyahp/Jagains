import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import GuestLayouts from '@/layouts/GuestLayout';
import { Lock, KeyRound } from 'lucide-react';

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
            <Card className="max-w-md w-full p-8 shadow-xl border-zinc-200 rounded-2xl bg-white space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-zinc-900 text-white rounded-xl mb-2">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Atur Ulang Kata Sandi</h1>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Masukkan kata sandi baru untuk akun warga Anda. Kata sandi minimal terdiri dari 8 karakter.
                    </p>
                </div>

                {errors.token && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        {errors.token}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup className="space-y-4">
                        <Field className="w-full">
                            <FieldLabel htmlFor="password">Kata Sandi Baru</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10"
                                />
                                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                            )}
                        </Field>

                        <Field className="w-full">
                            <FieldLabel htmlFor="password_confirmation">Konfirmasi Kata Sandi Baru</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    placeholder="••••••••"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10"
                                />
                                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            </div>
                        </Field>
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-medium rounded-lg transition-all cursor-pointer"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                    </Button>
                </form>

                <div className="border-t border-zinc-100 pt-3 text-center">
                    <Link
                        href="/login"
                        className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        Batal dan kembali ke Masuk
                    </Link>
                </div>
            </Card>
        </GuestLayouts>
    );
}
