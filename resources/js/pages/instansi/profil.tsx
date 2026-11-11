import type { ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { CircleCheck, CirclePause, CircleX, KeyRound } from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Badge } from '@/components/ui/badge';
import type { Auth } from '@/types/auth';

export default function ProfilInstansiPage() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const accountStatus = user?.status_akun;
    const StatusIcon =
        accountStatus === 'aktif'
            ? CircleCheck
            : accountStatus === 'dibekukan'
              ? CirclePause
              : CircleX;
    const details = [
        ['Nama pengguna', user?.username ?? 'Belum tersedia'],
        [
            'Peran',
            user?.peran === 'instansi' ? 'Petugas instansi' : 'Belum tersedia',
        ],
        ['Dinas naungan', user?.instansi?.nama ?? 'Belum tersedia'],
    ];

    return (
        <div className="flex min-w-0 flex-col gap-5">
            <Head title="Profil Dinas" />
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.6fr)]">
                    <div className="border-b border-border px-5 py-5 lg:border-r lg:border-b-0">
                        <p className="text-body-sm text-muted-foreground">
                            Instansi
                        </p>
                        <h2 className="mt-2 text-display-sm font-display font-semibold">
                            {user?.instansi?.nama ?? 'Instansi belum tersedia'}
                        </h2>
                        <p className="mt-1 text-body-sm text-muted-foreground">
                            {user?.instansi?.singkatan ??
                                'Singkatan belum tersedia'}
                        </p>
                    </div>

                    <div className="min-w-0">
                        <header className="border-b border-border px-5 py-3">
                            <h2 className="text-body-medium font-semibold">
                                Informasi akun
                            </h2>
                        </header>
                        <dl className="divide-y divide-border px-5">
                            {details.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"
                                >
                                    <dt className="text-body-sm text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="text-body-sm font-medium break-words">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                                <dt className="text-body-sm text-muted-foreground">
                                    Status akun
                                </dt>
                                <dd>
                                    <Badge
                                        variant="outline"
                                        className="h-auto gap-1.5 py-1 text-caption-xs capitalize"
                                    >
                                        <StatusIcon />
                                        {accountStatus ?? 'Belum tersedia'}
                                    </Badge>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
                <div className="flex items-start gap-3 border-t border-border px-5 py-3">
                    <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-body-sm text-muted-foreground">
                        Hubungi Admin untuk pemulihan akses atau pengaturan
                        ulang kata sandi akun instansi.
                    </p>
                </div>
            </section>
        </div>
    );
}

ProfilInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Profil dinas" breadcrumb="Instansi > Akun">
        {page}
    </InternalLayout>
);
