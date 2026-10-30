import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GuestLayouts from '@/layouts/GuestLayout';
import { MapPin, CheckCircle2 } from 'lucide-react';

interface LoginProps {
    status?: string;
    success?: string;
}

export default function Login({ status, success }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <GuestLayouts>
            <Head title="Masuk - Jagains" />
            <Card className="max-w-5xl w-full p-0 grid grid-cols-1 md:grid-cols-2 border border-border bg-card shadow-2xl rounded-2xl overflow-hidden">
                {/* Sisi Kiri - Dark Branding Section */}
                <div className="bg-zinc-950 dark:bg-zinc-900 text-zinc-100 p-6 sm:p-10 flex flex-col justify-between">
                    <div>
                        {/* Logo & Brand Name */}
                        <div className="flex items-center gap-2.5 mb-10">
                            <div className="border border-white/20 p-2 rounded-xl bg-white/10 shadow-xs">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-display text-display-md font-bold tracking-tight text-white">Jagains</span>
                        </div>

                        {/* Title Hero */}
                        <h1 className="font-display text-display-lg font-bold leading-tight tracking-tight mb-8">
                            Jaga Kontribusi Anda,<br />
                            Jaga Fasilitas Rakyat.
                        </h1>

                        {/* Description List */}
                        <div className="space-y-4 text-body-sm text-zinc-400">
                            <div>
                                <p className="font-semibold text-white">Warga</p>
                                <p>Lapor, pantau tenggat, dan verifikasi hasil perbaikan.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Instansi</p>
                                <p>Terima, survei, kerjakan, dan ajukan selesai dengan berita acara.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Admin dan Auditor</p>
                                <p>Pengelolaan platform dan penengah sengketa. Akun dibuat oleh admin.</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Link */}
                    <div className="pt-8">
                        <Link 
                            href="/peta" 
                            className="text-caption-xs font-medium text-zinc-300 underline underline-offset-4 hover:text-white transition-colors"
                        >
                            Hanya ingin melihat peta? Buka tanpa akun
                        </Link>
                    </div>
                </div>

                {/* Sisi Kanan - Login Form Section */}
                <div className="bg-card text-card-foreground p-6 sm:p-10 flex flex-col justify-between">
                    <div className="max-w-md w-full mx-auto my-auto space-y-6">
                        {/* Form Header */}
                        <div>
                            <span className="text-caption-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Masuk ke Akun
                            </span>
                            <h2 className="font-display text-display-md font-bold text-foreground mt-1">
                                Selamat datang kembali
                            </h2>
                            <p className="text-body-sm text-muted-foreground mt-1">
                                Masukkan kredensial Anda untuk mengakses sistem.
                            </p>
                        </div>

                        {(success || status) && (
                            <Alert variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <AlertDescription className="text-body-sm">
                                    {success || status}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <FieldGroup className="w-full space-y-4">
                                {/* Field 1: Username */}
                                <Field className="w-full">
                                    <FieldLabel htmlFor="username" className="text-body-medium">Username</FieldLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Masukkan username"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="w-full h-11 text-body-base"
                                        required
                                    />
                                    {errors.username && (
                                        <FieldError>{errors.username}</FieldError>
                                    )}
                                </Field>

                                {/* Field 2: Password */}
                                <Field className="w-full">
                                    <FieldLabel htmlFor="password" className="text-body-medium">Password</FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full h-11 text-body-base"
                                        required
                                    />
                                    {errors.password && (
                                        <FieldError>{errors.password}</FieldError>
                                    )}
                                </Field>
                            </FieldGroup>

                            {/* Field 3: Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={processing} 
                                className="w-full h-11 font-semibold"
                            >
                                {processing ? 'Memproses...' : 'Masuk'}
                            </Button>

                            <div className="flex items-center justify-between text-body-sm pt-1">
                                <Link
                                    href="/lupa-sandi"
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Lupa kata sandi?
                                </Link>
                                <Link
                                    href="/daftar"
                                    className="font-semibold text-primary hover:underline underline-offset-4"
                                >
                                    Daftar akun warga
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer Info */}
                    <p className="text-caption-xs text-center text-muted-foreground mt-6">
                        Data pribadi dikelola sesuai UU PDP. Layanan gratis bagi warga.
                    </p>
                </div>
            </Card>
        </GuestLayouts>
    );
}