import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import GuestLayouts from '@/layouts/GuestLayout';
import KelurahanSelector from '@/components/wilayah/kelurahan-selector';
import { CheckCircle, Lock, User as UserIcon } from 'lucide-react';

interface RegisterCompleteProps {
    token: string;
    payload: string;
    emailMasked: string;
}

export default function RegisterComplete({
    token,
    payload,
    emailMasked,
}: RegisterCompleteProps) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        payload: payload,
        username: '',
        password: '',
        password_confirmation: '',
        kelurahan_id: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/daftar/selesai');
    };

    return (
        <GuestLayouts>
            <Head title="Lengkapi Pendaftaran Warga - Jagains" />
            <Card className="max-w-xl w-full p-8 shadow-xl border-zinc-200 rounded-2xl bg-white space-y-6">
                <div>
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Email Terverifikasi ({emailMasked})</span>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">Lengkapi Profil Akun Warga</h1>
                    <p className="text-xs text-zinc-500 mt-1">
                        Tentukan kredensial masuk dan kelurahan domisili Anda untuk keperluan verifikasi hasil perbaikan fasilitas.
                    </p>
                </div>

                {errors.token && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        {errors.token}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FieldGroup className="space-y-4">
                        {/* Field 1: Username */}
                        <Field className="w-full">
                            <FieldLabel htmlFor="username">Username Akun</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="contoh: budi_depok"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    required
                                    className="w-full h-11 pl-10"
                                />
                                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            </div>
                            {errors.username && (
                                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                            )}
                            <p className="text-[11px] text-zinc-400 mt-1">
                                Huruf kecil, angka, tanda hubung (-) atau garis bawah (_). Minimal 3 karakter.
                            </p>
                        </Field>

                        {/* Field 2 & 3: Password & Confirmation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field className="w-full">
                                <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
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
                                <FieldLabel htmlFor="password_confirmation">Konfirmasi Kata Sandi</FieldLabel>
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
                        </div>

                        {/* Field 4: Kelurahan Selector */}
                        <KelurahanSelector
                            value={data.kelurahan_id}
                            onChange={(id) => setData('kelurahan_id', id)}
                            error={errors.kelurahan_id}
                        />
                    </FieldGroup>

                    <Button
                        type="submit"
                        disabled={processing || !data.kelurahan_id}
                        className="w-full h-11 bg-black hover:bg-zinc-800 text-white font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan Akun...' : 'Selesaikan Pendaftaran'}
                    </Button>
                </form>

                <p className="text-[11px] text-center text-zinc-400">
                    Sesuai aturan Jagains (P-14), kelurahan domisili yang dipilih hanya dapat diubah kembali paling cepat setelah <strong>90 hari</strong>.
                </p>
            </Card>
        </GuestLayouts>
    );
}
