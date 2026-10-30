import React, { useEffect, useMemo, useState } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react';

export interface KelurahanItem {
    id: number;
    nama: string;
    tingkat: string;
    kecamatan_id?: number;
    kecamatan_nama?: string;
    kota_id?: number;
    kota_nama?: string;
    induk?: {
        id: number;
        nama: string;
        tingkat: string;
        induk?: {
            id: number;
            nama: string;
            tingkat: string;
        };
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

    const [selectedKotaId, setSelectedKotaId] = useState<number | ''>('');
    const [selectedKecamatanId, setSelectedKecamatanId] = useState<number | ''>('');

    // Ambil daftar seluruh kelurahan dengan hierarki kecamatan dan kota
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

    // Sinkronisasi pilihan kota & kecamatan saat value (kelurahan_id) berubah / ada data awal
    useEffect(() => {
        if (value && kelurahans.length > 0) {
            const found = kelurahans.find((k) => k.id === Number(value));
            if (found) {
                const kId = found.kota_id || found.induk?.induk?.id;
                const kecId = found.kecamatan_id || found.induk?.id;
                if (kId) setSelectedKotaId(kId);
                if (kecId) setSelectedKecamatanId(kecId);
            }
        }
    }, [value, kelurahans]);

    // Daftar Unik Kota/Kabupaten
    const kotaList = useMemo(() => {
        const map = new Map<number, string>();
        kelurahans.forEach((k) => {
            const kotaId = k.kota_id || k.induk?.induk?.id;
            const kotaNama = k.kota_nama || k.induk?.induk?.nama;
            if (kotaId && kotaNama && !map.has(kotaId)) {
                map.set(kotaId, kotaNama);
            }
        });
        return Array.from(map.entries())
            .map(([id, nama]) => ({ id, nama }))
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [kelurahans]);

    // Daftar Kecamatan sesuai Kota yang dipilih
    const kecamatanList = useMemo(() => {
        if (!selectedKotaId) return [];
        const map = new Map<number, string>();
        kelurahans.forEach((k) => {
            const kotaId = k.kota_id || k.induk?.induk?.id;
            const kecId = k.kecamatan_id || k.induk?.id;
            const kecNama = k.kecamatan_nama || k.induk?.nama;
            if (kotaId === Number(selectedKotaId) && kecId && kecNama && !map.has(kecId)) {
                map.set(kecId, kecNama);
            }
        });
        return Array.from(map.entries())
            .map(([id, nama]) => ({ id, nama }))
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [kelurahans, selectedKotaId]);

    // Daftar Kelurahan sesuai Kecamatan yang dipilih
    const filteredKelurahanList = useMemo(() => {
        if (!selectedKecamatanId) return [];
        return kelurahans
            .filter((k) => (k.kecamatan_id || k.induk?.id) === Number(selectedKecamatanId))
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [kelurahans, selectedKecamatanId]);

    // Handler pergantian Kota manual
    const handleKotaChange = (kotaId: number | '') => {
        setSelectedKotaId(kotaId);
        setSelectedKecamatanId('');
        onChange(0);
    };

    // Handler pergantian Kecamatan manual
    const handleKecamatanChange = (kecamatanId: number | '') => {
        setSelectedKecamatanId(kecamatanId);
        onChange(0);
    };

    // Deteksi Otomatis via GPS
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

                    if (data.terdeteksi && data.kelurahan_id) {
                        const targetKelId = Number(data.kelurahan_id);
                        onChange(targetKelId);

                        if (data.kota_id) {
                            setSelectedKotaId(Number(data.kota_id));
                        }
                        if (data.kecamatan_id) {
                            setSelectedKecamatanId(Number(data.kecamatan_id));
                        }

                        setDetectMessage({
                            type: 'success',
                            text: `Terdeteksi: Kel. ${data.nama}, Kec. ${data.kecamatan || ''}${data.kota ? `, ${data.kota}` : ''}. Koordinat langsung dibuang demi privasi Anda.`,
                        });
                    } else {
                        setDetectMessage({
                            type: 'error',
                            text: data.pesan || 'Lokasi berada di luar wilayah layanan (Kota Depok & DKI Jakarta). Silakan pilih secara manual.',
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
                let message = 'Izin lokasi ditolak atau tidak tersedia. Silakan pilih wilayah dari daftar.';
                if (geoError.code === geoError.TIMEOUT) {
                    message = 'Pencarian sinyal GPS kedaluwarsa. Silakan pilih wilayah dari daftar.';
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
        <div className="space-y-3.5">
            <div className="flex items-center justify-between">
                <div>
                    <FieldLabel htmlFor="kota_id" className="text-sm font-semibold text-zinc-900">
                        Wilayah Domisili
                    </FieldLabel>
                    <p className="text-[11px] text-zinc-500">
                        Pilih Kota, Kecamatan, dan Kelurahan tempat Anda berdomisili.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleGpsDetect}
                    disabled={detecting || disabled}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
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

            {/* Hierarki 3-Level: Kota, Kecamatan, Kelurahan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Kota / Kabupaten */}
                <div className="space-y-1">
                    <label htmlFor="kota_id" className="text-[11px] font-medium text-zinc-600">
                        Kota / Kabupaten
                    </label>
                    <select
                        id="kota_id"
                        value={selectedKotaId}
                        onChange={(e) => handleKotaChange(e.target.value ? Number(e.target.value) : '')}
                        disabled={disabled || loadingList}
                        className="w-full h-10 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {loadingList ? 'Memuat data...' : '-- Pilih Kota / Kab --'}
                        </option>
                        {kotaList.map((kota) => (
                            <option key={kota.id} value={kota.id}>
                                {kota.nama}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Kecamatan */}
                <div className="space-y-1">
                    <label htmlFor="kecamatan_id" className="text-[11px] font-medium text-zinc-600">
                        Kecamatan
                    </label>
                    <select
                        id="kecamatan_id"
                        value={selectedKecamatanId}
                        onChange={(e) => handleKecamatanChange(e.target.value ? Number(e.target.value) : '')}
                        disabled={disabled || !selectedKotaId}
                        className="w-full h-10 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {!selectedKotaId ? '-- Pilih Kota Terlebih Dahulu --' : '-- Pilih Kecamatan --'}
                        </option>
                        {kecamatanList.map((kec) => (
                            <option key={kec.id} value={kec.id}>
                                {kec.nama}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. Kelurahan */}
                <div className="space-y-1">
                    <label htmlFor="kelurahan_id" className="text-[11px] font-medium text-zinc-600">
                        Kelurahan Domisili <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="kelurahan_id"
                        value={value || ''}
                        onChange={(e) => onChange(Number(e.target.value))}
                        disabled={disabled || !selectedKecamatanId}
                        className={`w-full h-10 px-2.5 py-1.5 bg-white border rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-zinc-100 disabled:cursor-not-allowed ${
                            error ? 'border-red-400 focus:ring-red-400' : 'border-zinc-200'
                        }`}
                    >
                        <option value="">
                            {!selectedKecamatanId ? '-- Pilih Kecamatan Terlebih Dahulu --' : '-- Pilih Kelurahan --'}
                        </option>
                        {filteredKelurahanList.map((kel) => (
                            <option key={kel.id} value={kel.id}>
                                {kel.nama}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

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
