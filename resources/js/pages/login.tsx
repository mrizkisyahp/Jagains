import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import GuestLayouts from '@/layouts/GuestLayout';
import { MapPin } from 'lucide-react';

export default function Login() {
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
            <Card className="max-w-5xl w-full p-0 grid grid-cols-2 border-none shadow-2xl rounded-2xl">
                {/* Sisi Kiri - Dark Branding Section */}
                <div className=" bg-black text-white p-10 flex flex-col justify-between">
                    <div>
                        {/* Logo & Brand Name */}
                        <div className="flex items-center gap-2 mb-12">
                            <div className="border border-white/20 p-1.5 rounded-lg bg-white/5">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-wide">Jagains</span>
                        </div>

                        {/* Title Hero */}
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-8">
                            Jaga Kontribusi Anda,<br />
                            Jaga Fasilitas Rakyat.
                        </h1>

                        {/* Description List */}
                        <div className="space-y-5 text-sm text-zinc-400">
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
                    <div className="pt-6">
                        <a 
                            href="#" 
                            className="text-xs font-medium text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
                        >
                            Hanya ingin melihat peta? Buka tanpa akun
                        </a>
                    </div>
                </div>

                {/* Sisi Kanan - Login Form Section */}
                <div className=" bg-white p-10 flex flex-col justify-between">
                    <div className="max-w-md w-full mx-auto my-auto space-y-6">
                        {/* Form Header */}
                        <div>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Masuk ke Akun
                            </span>
                            <h2 className="text-2xl font-bold text-zinc-900 mt-1">
                                Selamat datang kembali
                            </h2>
                            <p className="text-sm text-zinc-500 mt-1">
                                Masukkan kredensial Anda untuk mengakses sistem.
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <FieldGroup className="w-full">
                                {/* Field 1: Username */}
                                <Field className="w-full">
                                    <FieldLabel htmlFor="username">Username</FieldLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Masukkan username"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="w-full h-11"
                                    />
                                    {errors.username && (
                                        <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                                    )}
                                </Field>

                                {/* Field 2: Password */}
                                <Field className="w-full">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full h-11"
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                                    )}
                                </Field>
                            </FieldGroup>

                            {/* Field 3: Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={processing} 
                                className="w-full h-11 bg-black hover:bg-zinc-800 text-white font-medium rounded-lg transition-all"
                            >
                                {processing ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>
                    </div>

                    {/* Footer Info */}
                    <p className="text-xs text-center text-zinc-400 mt-6">
                        Data pribadi dikelola sesuai UU PDP. Layanan gratis bagi warga.
                    </p>
                </div>
            </Card>
        </GuestLayouts>
    );
}