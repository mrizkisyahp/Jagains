import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { router } from '@inertiajs/react';
import { NotifikasiItem } from '@/types/verifikasi';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifikasiList, setNotifikasiList] = useState<NotifikasiItem[]>([]);
    const popoverRef = useRef<HTMLDivElement>(null);

    const muatRingkasan = async () => {
        try {
            const res = await fetch('/api/notifikasi/ringkasan', {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count || 0);
                setNotifikasiList(data.notifikasi || []);
            }
        } catch {
            // Abaikan error fetch background
        }
    };

    useEffect(() => {
        muatRingkasan();
        const interval = setInterval(muatRingkasan, 30000); // Polling setiap 30 detik
        return () => clearInterval(interval);
    }, []);

    // Tutup popover jika klik di luar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifikasiList((prev) =>
                prev.map((n) =>
                    n.id === id
                        ? { ...n, dibaca_pada: new Date().toISOString() }
                        : n,
                ),
            );
            if (nomorTiket) {
                setOpen(false);
                router.visit(`/tiket/${nomorTiket}`);
            }
        } catch {
            // abaikan
        }
    };

    const tandaiSemuaDibaca = async () => {
        setLoading(true);
        try {
            await fetch('/api/notifikasi/baca-semua', {
                method: 'POST',
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
            setUnreadCount(0);
            setNotifikasiList((prev) =>
                prev.map((n) => ({
                    ...n,
                    dibaca_pada: new Date().toISOString(),
                })),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background/50 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Notifikasi"
            >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                    <span className="text-destructive-foreground absolute -top-1 -right-1 flex size-4 animate-pulse items-center justify-center rounded-full bg-destructive text-[10px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl sm:w-96">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold text-foreground">
                                Notifikasi
                            </span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={tandaiSemuaDibaca}
                                disabled={loading}
                                className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                <CheckCheck className="size-3.5" />
                                <span>Tandai Semua Dibaca</span>
                            </button>
                        )}
                    </div>

                    <div className="my-2 max-h-80 divide-y divide-border/40 overflow-y-auto">
                        {notifikasiList.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                Belum ada notifikasi baru untuk Anda.
                            </div>
                        ) : (
                            notifikasiList.map((item) => {
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
                                        className={`flex cursor-pointer flex-col gap-1 rounded-lg p-2.5 transition-colors ${
                                            isUnread
                                                ? 'bg-primary/5 hover:bg-primary/10'
                                                : 'hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p
                                                className={`text-xs ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                                            >
                                                {item.pesan}
                                            </p>
                                            {isUnread && (
                                                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {new Date(
                                                    item.created_at,
                                                ).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                            {item.laporan && (
                                                <span className="flex items-center gap-0.5 font-mono text-primary">
                                                    {item.laporan.nomor_tiket}
                                                    <ExternalLink className="size-2.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t border-border/60 pt-2 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                router.visit('/notifikasi');
                            }}
                            className="cursor-pointer text-[11px] font-semibold text-primary hover:underline"
                        >
                            Lihat Semua Notifikasi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
