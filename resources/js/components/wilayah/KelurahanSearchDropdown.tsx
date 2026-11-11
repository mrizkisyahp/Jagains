import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import {
    Building2,
    Check,
    ChevronDown,
    Loader2,
    MapPin,
    Navigation,
    Search,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KelurahanItem {
    id: number;
    nama: string;
    tingkat?: string;
    kecamatan_id?: number;
    kecamatan_nama?: string;
    kota_id?: number;
    kota_nama?: string;
}

interface KelurahanSearchDropdownProps {
    value: number | string | null;
    onChange: (id: number) => void;
    error?: string;
    disabled?: boolean;
}

export default function KelurahanSearchDropdown({
    value,
    onChange,
    error,
    disabled = false,
}: KelurahanSearchDropdownProps) {
    const [kelurahans, setKelurahans] = useState<KelurahanItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [detecting, setDetecting] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Ambil daftar kelurahan saat komponen dimuat
    useEffect(() => {
        setLoading(true);
        fetch('/api/wilayah/kelurahan')
            .then((res) => res.json())
            .then((data: KelurahanItem[]) => {
                setKelurahans(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    // Tutup dropdown jika klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Kelurahan terpilih
    const selectedKelurahan = useMemo(() => {
        if (!value) return null;
        return kelurahans.find((k) => k.id === Number(value)) || null;
    }, [kelurahans, value]);

    // Filter daftar kelurahan berdasarkan kata kunci
    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return kelurahans;
        const q = searchQuery.toLowerCase().trim();
        return kelurahans.filter((k) => {
            const nama = k.nama.toLowerCase();
            const kec = (k.kecamatan_nama || '').toLowerCase();
            const kota = (k.kota_nama || '').toLowerCase();
            return (
                nama.includes(q) ||
                kec.includes(q) ||
                kota.includes(q) ||
                `kelurahan ${nama}`.includes(q)
            );
        });
    }, [kelurahans, searchQuery]);

    // Handler Deteksi GPS Otomatis
    const handleGpsDetect = () => {
        if (!navigator.geolocation) {
            toast.error('Geolokasi tidak didukung oleh browser Anda.');
            return;
        }

        setDetecting(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const res = await fetch('/api/wilayah/deteksi-kelurahan', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN':
                                (
                                    document.querySelector(
                                        'meta[name="csrf-token"]',
                                    ) as HTMLMetaElement
                                )?.content || '',
                        },
                        body: JSON.stringify({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }),
                    });

                    const data = await res.json();

                    if (data.terdeteksi && data.kelurahan_id) {
                        const targetId = Number(data.kelurahan_id);
                        onChange(targetId);
                        toast.success(
                            `Lokasi terdeteksi: Kel. ${data.nama}${data.kecamatan ? `, Kec. ${data.kecamatan}` : ''}`,
                        );
                    } else {
                        toast.error(
                            data.pesan ||
                                'Lokasi GPS Anda berada di luar area Jabodetabek.',
                        );
                    }
                } catch (err) {
                    toast.error(
                        'Gagal mendeteksi lokasi kelurahan melalui GPS.',
                    );
                } finally {
                    setDetecting(false);
                }
            },
            () => {
                setDetecting(false);
                toast.error(
                    'Izin akses lokasi ditolak. Silakan pilih kelurahan secara manual.',
                );
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    return (
        <div ref={containerRef} className="w-full space-y-1">
            <div className="flex items-center gap-2">
                {/* 1. Dropdown Pencarian Kelurahan */}
                <div className="relative min-w-0 flex-1">
                    <button
                        type="button"
                        disabled={disabled || loading}
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-left text-body-sm transition-all outline-none',
                            isOpen
                                ? 'border-primary bg-background ring-2 ring-primary/20'
                                : 'border-input bg-muted/30 hover:border-foreground/20 hover:bg-muted/50',
                            error &&
                                'border-destructive ring-1 ring-destructive',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                        aria-expanded={isOpen}
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <MapPin className="size-4 shrink-0 text-muted-foreground" />
                            {selectedKelurahan ? (
                                <span className="truncate font-medium text-foreground">
                                    Kel. {selectedKelurahan.nama}
                                    {selectedKelurahan.kecamatan_nama && (
                                        <span className="font-normal text-muted-foreground">
                                            , Kec.{' '}
                                            {selectedKelurahan.kecamatan_nama}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="truncate text-muted-foreground">
                                    {loading
                                        ? 'Memuat kelurahan...'
                                        : 'Cari & pilih kelurahan domisili...'}
                                </span>
                            )}
                        </div>

                        <ChevronDown
                            className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                isOpen && 'rotate-180',
                            )}
                        />
                    </button>

                    {/* Popover Pencarian Kelurahan */}
                    {isOpen && (
                        <div className="absolute right-0 left-0 z-50 mt-1.5 animate-in overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl fade-in-0 zoom-in-95">
                            {/* Input Cari */}
                            <div className="relative mb-2">
                                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Ketik nama kelurahan atau kecamatan..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="h-9 w-full rounded-lg pr-7 pl-8 text-xs"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Daftar Opsi Kelurahan */}
                            <div className="max-h-52 space-y-0.5 overflow-y-auto text-xs">
                                {filteredList.length === 0 ? (
                                    <div className="py-6 text-center text-muted-foreground">
                                        Kelurahan &quot;{searchQuery}&quot;
                                        tidak ditemukan.
                                    </div>
                                ) : (
                                    filteredList.map((k) => {
                                        const isSelected =
                                            selectedKelurahan?.id === k.id;
                                        return (
                                            <button
                                                key={k.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange(k.id);
                                                    setIsOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className={cn(
                                                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                                                    isSelected
                                                        ? 'bg-primary font-semibold text-primary-foreground'
                                                        : 'text-foreground hover:bg-muted',
                                                )}
                                            >
                                                <div className="min-w-0">
                                                    <span className="block truncate">
                                                        Kel. {k.nama}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'block truncate text-[11px]',
                                                            isSelected
                                                                ? 'text-primary-foreground/80'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        Kec.{' '}
                                                        {k.kecamatan_nama ||
                                                            '-'}
                                                        {k.kota_nama
                                                            ? `, ${k.kota_nama}`
                                                            : ''}
                                                    </span>
                                                </div>

                                                {isSelected && (
                                                    <Check className="size-4 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Tombol Deteksi Lokasi Otomatis (GPS) */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGpsDetect}
                    disabled={detecting || disabled}
                    className="h-11 shrink-0 gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                    title="Deteksi kelurahan otomatis berdasarkan sensor GPS perangkat"
                >
                    {detecting ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            <span className="hidden sm:inline">
                                Mendeteksi...
                            </span>
                        </>
                    ) : (
                        <>
                            <Navigation className="size-3.5 text-primary" />
                            <span>Deteksi GPS</span>
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <p className="text-caption-xs font-medium text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
