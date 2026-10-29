import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export interface KelurahanItem {
    id: number;
    nama: string;
    tingkat: string;
    induk?: {
        id: number;
        nama: string;
        tingkat: string;
    };
}

interface KelurahanSelectorProps {
    value: number | string | null;
    onChange: (id: number) => void;
    error?: string;
    disabled?: boolean;
}

export default function KelurahanSelector({
    value,
    onChange,
    error,
    disabled = false,
}: KelurahanSelectorProps) {
    const [kelurahans, setKelurahans] = useState<KelurahanItem[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [detectMessage, setDetectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        setLoadingList(true);
        fetch('/api/wilayah/kelurahan')
            .then((res) => res.json())
            .then((data: KelurahanItem[]) => {
                setKelurahans(data);
                setLoadingList(false);
            })
            .catch(() => {
                setLoadingList(false);
            });
    }, []);

    const handleGpsDetect = () => {
        if (!navigator.geolocation) {
            setDetectMessage({
                type: 'error',
                text: 'Peramban Anda tidak mendukung sensor geolokasi GPS.',
            });
            return;
        }

        setDetecting(true);
        setDetectMessage(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const res = await fetch('/api/wilayah/deteksi-kelurahan', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        },
                        body: JSON.stringify({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }),
                    });

                    const data = await res.json();

                    if (data.kelurahan_id) {
                        onChange(Number(data.kelurahan_id));
                        setDetectMessage({
                            type: 'success',
                            text: `Terdeteksi: ${data.nama}${data.kecamatan ? ` (Kec. ${data.kecamatan})` : ''}. Koordinat langsung dibuang demi privasi Anda.`,
                        });
                    } else {
                        setDetectMessage({
                            type: 'error',
                            text: data.pesan || 'Lokasi berada di luar wilayah Kota Depok. Silakan pilih kelurahan secara manual.',
                        });
                    }
                } catch {
                    setDetectMessage({
                        type: 'error',
                        text: 'Gagal mendeteksi lokasi dari server. Silakan pilih secara manual.',
                    });
                } finally {
                    setDetecting(false);
                }
            },
            (geoError) => {
                setDetecting(false);
                let message = 'Izin lokasi ditolak atau tidak tersedia. Silakan pilih kelurahan dari daftar.';
                if (geoError.code === geoError.TIMEOUT) {
                    message = 'Pencarian sinyal GPS kedaluwarsa. Silakan pilih kelurahan dari daftar.';
                }
                setDetectMessage({
                    type: 'error',
                    text: message,
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="space-y-3">
            <Field className="w-full">
                <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="kelurahan_id">Kelurahan Domisili (Depok)</FieldLabel>
                    <button
                        type="button"
                        onClick={handleGpsDetect}
                        disabled={detecting || disabled}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {detecting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Mendeteksi GPS...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-3.5 h-3.5" />
                                Deteksi Otomatis (GPS)
                            </>
                        )}
                    </button>
                </div>

                <div className="relative">
                    <select
                        id="kelurahan_id"
                        value={value || ''}
                        onChange={(e) => onChange(Number(e.target.value))}
                        disabled={disabled || loadingList}
                        className="w-full h-11 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {loadingList ? 'Memuat daftar kelurahan...' : '-- Pilih Kelurahan Domisili --'}
                        </option>
                        {kelurahans.map((kel) => (
                            <option key={kel.id} value={kel.id}>
                                {kel.nama} {kel.induk ? `(Kec. ${kel.induk.nama})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </Field>

            {detectMessage && (
                <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                        detectMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                >
                    {detectMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{detectMessage.text}</span>
                </div>
            )}
        </div>
    );
}
