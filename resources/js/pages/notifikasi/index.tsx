import { Head, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, Clock, ExternalLink, Inbox } from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { NotifikasiItem } from '@/types/verifikasi';

interface NotifikasiPageProps {
    notifikasi: {
        data: NotifikasiItem[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}

export default function NotifikasiIndexPage({
    notifikasi,
}: NotifikasiPageProps) {
    const { auth } = usePage<{ auth?: { user?: { peran?: string } | null } }>()
        .props;
    const peran = auth?.user?.peran;
    const rolePrefix =
        peran === 'admin'
            ? 'Admin'
            : peran === 'auditor'
              ? 'Auditor'
              : peran === 'instansi'
                ? 'Instansi'
                : 'Warga';

    const unreadCount = notifikasi.data.filter((n) => !n.dibaca_pada).length;

    const tandaiDibaca = async (id: number, nomorTiket?: string) => {
        try {
            await fetch(`/api/notifikasi/${id}/baca`, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
            });
            if (nomorTiket) {
                router.visit(`/tiket/${nomorTiket}`);
            } else {
                router.reload();
            }
        } catch {
            // abaikan
        }
    };

    const tandaiSemuaDibaca = () => {
        router.post(
            '/api/notifikasi/baca-semua',
            {},
            {
                onSuccess: () =>
                    toast.success('Seluruh notifikasi telah ditandai dibaca.'),
            },
        );
    };

    return (
        <InternalLayout
            title="Pusat Notifikasi"
            breadcrumb={`${rolePrefix} > Notifikasi`}
        >
            <div className="mx-auto max-w-4xl space-y-6 pb-12">
                <Head title="Pusat Notifikasi" />

                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="font-display text-2xl font-bold text-foreground">
                                Pusat Notifikasi & Pembaruan
                            </h1>
                            {unreadCount > 0 && (
                                <Badge className="border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                                    {unreadCount} Belum Dibaca
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pemberitahuan resmi mengenai perubahan status tiket
                            Anda, undangan verifikasi kuorum warga, dan proses
                            mediasi sengketa.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={tandaiSemuaDibaca}
                            className="cursor-pointer gap-1.5 self-start text-xs sm:self-auto"
                        >
                            <CheckCheck className="size-4" />
                            <span>Tandai Semua Dibaca</span>
                        </Button>
                    )}
                </div>

                {/* List Notifikasi */}
                {notifikasi.data.length === 0 ? (
                    <div className="space-y-3 rounded-3xl border border-dashed border-border/80 p-12 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <Inbox className="size-6" />
                        </div>
                        <h3 className="font-display text-base font-bold text-foreground">
                            Belum Ada Notifikasi
                        </h3>
                        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                            Ketika ada pembaruan laporan atau permohonan
                            verifikasi hasil perbaikan di lingkungan Anda,
                            pemberitahuan akan tampil di sini.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/60 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xs">
                        {notifikasi.data.map((item) => {
                            const isUnread = !item.dibaca_pada;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() =>
                                        tandaiDibaca(
                                            item.id,
                                            item.laporan?.nomor_tiket,
                                        )
                                    }
                                    className={`flex cursor-pointer items-start gap-4 p-4 transition-colors sm:p-5 ${
                                        isUnread
                                            ? 'bg-primary/5 hover:bg-primary/10'
                                            : 'hover:bg-muted/30'
                                    }`}
                                >
                                    <div
                                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                                            isUnread
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <Bell className="size-4" />
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <p
                                                className={`text-sm leading-relaxed ${
                                                    isUnread
                                                        ? 'font-bold text-foreground'
                                                        : 'text-foreground/80'
                                                }`}
                                            >
                                                {item.pesan}
                                            </p>
                                            {isUnread && (
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 text-[11px]">
                                                <Clock className="size-3" />
                                                {new Date(
                                                    item.created_at,
                                                ).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>

                                            {item.laporan && (
                                                <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                                                    {item.laporan.nomor_tiket}
                                                    <ExternalLink className="size-3" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Paginasi */}
                {notifikasi.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                        <span>
                            Menampilkan {notifikasi.from} - {notifikasi.to} dari
                            total {notifikasi.total}
                        </span>
                        <div className="flex items-center gap-1">
                            {notifikasi.links.map((link, idx) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={idx}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                            className="px-2.5 py-1 text-xs text-muted-foreground/50"
                                        />
                                    );
                                }
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => router.visit(link.url!)}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-primary font-bold text-primary-foreground'
                                                : 'text-foreground hover:bg-muted'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </InternalLayout>
    );
}
