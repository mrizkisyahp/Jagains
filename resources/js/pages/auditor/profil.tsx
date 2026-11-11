import type { ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    CircleCheck,
    CirclePause,
    CircleX,
    KeyRound,
    Scale,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Badge } from '@/components/ui/badge';
import type { Auth } from '@/types/auth';

export default function ProfilAuditorPage() {
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
            'Peran sistem',
            user?.peran === 'auditor'
                ? 'Auditor Independen'
                : (user?.peran ?? 'Belum tersedia'),
        ],
        ['Wajib ganti sandi', user?.wajib_ganti_sandi ? 'Ya' : 'Tidak'],
        [
            'Terdaftar sejak',
            user?.created_at
                ? new Date(user.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                  })
                : 'Belum tersedia',
        ],
    ];

    return (
        <div className="flex w-full min-w-0 flex-col gap-6 pb-6">
            <Head title="Profil auditor" />

            {/* Header Konteks */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-display-sm font-display font-semibold tracking-tight text-foreground">
                        Profil Auditor Independen
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Informasi akun pengawas independen dan kredensial akses
                        operasional sistem Jagains.
                    </p>
                </div>
            </div>

            {/* Profil Card */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.6fr)]">
                    {/* Kolom Kiri: Lembaga / Satuan Pengawas */}
                    <div className="border-b border-border p-5 lg:border-r lg:border-b-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Scale className="size-4" />
                            <p className="text-caption-sm font-medium">
                                Lembaga Pengawas
                            </p>
                        </div>
                        <h3 className="mt-3 text-display-xs font-display font-semibold text-foreground">
                            Majelis Auditor Independen
                        </h3>
                        <p className="text-caption-sm mt-1 text-muted-foreground">
                            Arbitrase Pengawasan Kebijakan Publik & Kepatuhan
                            SLA Fasilitas Publik Jabodetabek
                        </p>
                    </div>

                    {/* Kolom Kanan: Informasi Akun */}
                    <div className="min-w-0">
                        <div className="border-b border-border px-5 py-3">
                            <h3 className="text-body-medium font-semibold text-foreground">
                                Informasi Akun
                            </h3>
                        </div>
                        <dl className="divide-y divide-border px-5">
                            {details.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"
                                >
                                    <dt className="text-body-sm text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="text-body-sm font-medium break-words text-foreground">
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
                                        variant={
                                            accountStatus === 'aktif'
                                                ? 'sla-safe'
                                                : 'destructive'
                                        }
                                        className="gap-1.5 py-0.5 text-caption-xs capitalize"
                                    >
                                        <StatusIcon className="size-3.5" />
                                        {accountStatus ?? 'Belum tersedia'}
                                    </Badge>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Footer Keterangan Keamanan Akun */}
                <div className="flex items-start gap-3 border-t border-border bg-muted/20 px-5 py-3">
                    <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-body-sm text-muted-foreground">
                        Hubungi Administrator sistem untuk pemulihan akses,
                        pembekuan akun, atau pengaturan ulang kata sandi akun
                        auditor.
                    </p>
                </div>
            </section>
        </div>
    );
}

ProfilAuditorPage.layout = (page: ReactNode) => (
    <InternalLayout title="Profil auditor" breadcrumb="Auditor > Profil">
        {page}
    </InternalLayout>
);
