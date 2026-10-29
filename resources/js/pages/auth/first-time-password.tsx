import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import GuestLayouts from '@/layouts/GuestLayout';
import { KeyRound, Lock, AlertCircle, LogOut } from 'lucide-react';

interface FirstTimePasswordProps {
    username: string;
    peran: string;
}

export default function FirstTimePassword({ username, peran }: FirstTimePasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

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
            <Card className="max-w-md w-full p-8 shadow-2xl border-amber-200 rounded-2xl bg-white space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-amber-500 text-white rounded-xl mb-2 shadow-lg shadow-amber-500/20">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-1">
                        Akun Petugas: {peran} ({username})
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Wajib Ganti Kata Sandi Awal</h1>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Demi standar keamanan operasional Jagains, akun petugas baru wajib mengganti kata sandi acak dari Administrator sebelum dapat membuka modul sistem.
                    </p>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Kata sandi baru tidak boleh sama dengan kata sandi awal dan minimal 8 karakter.</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup className="space-y-4">
                        {/* Sandi Saat Ini */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="current_password">Kata Sandi Awal Saat Ini</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type="password"
                                    placeholder="Kata sandi acak dari Admin"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10"
                                />
                                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            </div>
                            {errors.current_password && (
                                <p className="text-xs text-red-500 mt-1">{errors.current_password}</p>
                            )}
                        </Field>

                        {/* Sandi Baru */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="new_password">Kata Sandi Baru</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={data.new_password}
                                    onChange={(e) => setData('new_password', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10"
                                />
                                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            </div>
                            {errors.new_password && (
                                <p className="text-xs text-red-500 mt-1">{errors.new_password}</p>
                            )}
                        </Field>

                        {/* Konfirmasi Sandi Baru */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="new_password_confirmation">Konfirmasi Kata Sandi Baru</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="new_password_confirmation"
                                    type="password"
                                    placeholder="Ketik ulang kata sandi baru"
                                    value={data.new_password_confirmation}
                                    onChange={(e) => setData('new_password_confirmation', e.target.value)}
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
                        {processing ? 'Memperbarui Sandi...' : 'Simpan Sandi & Masuk ke Sistem'}
                    </Button>
                </form>

                <div className="border-t border-zinc-100 pt-3 text-center">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="text-xs text-zinc-500 hover:text-red-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar dari Akun
                    </button>
                </div>
            </Card>
        </GuestLayouts>
    );
}
