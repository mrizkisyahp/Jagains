import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
            <Card className="max-w-md w-full p-6 sm:p-8 shadow-2xl border-border rounded-2xl bg-card text-card-foreground space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-amber-500 text-white rounded-2xl mb-2 shadow-lg shadow-amber-500/20">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                        <Badge variant="secondary" className="uppercase tracking-wider mb-2">
                            Akun Petugas: {peran} ({username})
                        </Badge>
                    </div>
                    <h1 className="font-display text-display-md font-bold tracking-tight text-foreground">
                        Wajib Ganti Kata Sandi Awal
                    </h1>
                    <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
                        Demi standar keamanan operasional Jagains, akun petugas baru wajib mengganti kata sandi acak dari Administrator sebelum dapat membuka modul sistem.
                    </p>
                </div>

                <Alert variant="default" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl">
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-body-sm">
                        Kata sandi baru tidak boleh sama dengan kata sandi awal dan minimal 8 karakter.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FieldGroup className="space-y-4">
                        {/* Sandi Saat Ini */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="current_password" className="text-body-medium">Kata Sandi Awal Saat Ini</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type="password"
                                    placeholder="Kata sandi acak dari Admin"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10 text-body-base"
                                />
                                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                            </div>
                            {errors.current_password && (
                                <FieldError>{errors.current_password}</FieldError>
                            )}
                        </Field>

                        {/* Sandi Baru */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="new_password" className="text-body-medium">Kata Sandi Baru</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={data.new_password}
                                    onChange={(e) => setData('new_password', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10 text-body-base"
                                />
                                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                            </div>
                            {errors.new_password && (
                                <FieldError>{errors.new_password}</FieldError>
                            )}
                        </Field>

                        {/* Konfirmasi Sandi Baru */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="new_password_confirmation" className="text-body-medium">Konfirmasi Kata Sandi Baru</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="new_password_confirmation"
                                    type="password"
                                    placeholder="Ketik ulang kata sandi baru"
                                    value={data.new_password_confirmation}
                                    onChange={(e) => setData('new_password_confirmation', e.target.value)}
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
                        {processing ? 'Memperbarui Sandi...' : 'Simpan Sandi & Masuk ke Sistem'}
                    </Button>
                </form>

                <div className="border-t border-border pt-4 text-center">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleLogout}
                        className="text-body-sm text-muted-foreground hover:text-destructive gap-1.5"
                    >
                        <LogOut className="size-4" />
                        Keluar dari Akun
                    </Button>
                </div>
            </Card>
        </GuestLayouts>
    );
}