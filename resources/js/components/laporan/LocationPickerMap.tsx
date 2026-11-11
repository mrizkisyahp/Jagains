import { useEffect, useRef, useState, useCallback } from 'react';
import {
    MapPin,
    Crosshair,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
    lintang: number;
    bujur: number;
    akurasiGpsM: number | null;
    lokasiSumber: 'gps' | 'manual';
    kelurahanNama: string | null;
    onChangeLocation: (
        lat: number,
        lng: number,
        akurasi: number | null,
        sumber: 'gps' | 'manual',
        kelurahan: string | null,
    ) => void;
    onPrevStep?: () => void;
    onNextStep?: () => void;
    canProceed?: boolean;
}

export default function LocationPickerMap({
    lintang,
    bujur,
    akurasiGpsM,
    lokasiSumber,
    kelurahanNama,
    onChangeLocation,
    onPrevStep,
    onNextStep,
    canProceed = true,
}: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const isAutoGpsAttempted = useRef(false);

    const [isLocating, setIsLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [isCheckingKelurahan, setIsCheckingKelurahan] = useState(false);

    // Verifikasi kelurahan titik via API
    const verifikasiTitikKelurahan = useCallback(
        async (
            lat: number,
            lng: number,
            akurasi: number | null,
            sumber: 'gps' | 'manual',
        ) => {
            setIsCheckingKelurahan(true);
            setGeoError(null);

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
                    body: JSON.stringify({ lintang: lat, bujur: lng }),
                });

                const data = await res.json();
                if (res.ok && data.terdeteksi && data.kelurahan) {
                    const wilayahLabel = `Kel. ${data.nama}${data.kecamatan ? `, Kec. ${data.kecamatan}` : ''}${data.kota ? `, ${data.kota}` : ''}`;
                    onChangeLocation(lat, lng, akurasi, sumber, wilayahLabel);
                } else {
                    onChangeLocation(lat, lng, akurasi, sumber, null);
                    setGeoError(
                        'Titik koordinat berada di luar wilayah jangkauan layanan (Jabodetabek).',
                    );
                }
            } catch {
                onChangeLocation(lat, lng, akurasi, sumber, null);
            } finally {
                setIsCheckingKelurahan(false);
            }
        },
        [onChangeLocation],
    );

    // Deteksi GPS Peramban
    const handleGetGpsLocation = useCallback(
        (isAutoTrigger = false) => {
            if (!navigator.geolocation) {
                if (!isAutoTrigger) {
                    setGeoError(
                        'Peramban Anda tidak mendukung penentuan posisi GPS.',
                    );
                }
                return;
            }

            setIsLocating(true);
            setGeoError(null);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = Number(pos.coords.latitude.toFixed(6));
                    const lng = Number(pos.coords.longitude.toFixed(6));
                    const akurasi = Number(pos.coords.accuracy.toFixed(1));

                    setIsLocating(false);

                    // Geser peta & marker ke titik GPS baru
                    if (mapInstanceRef.current && markerRef.current) {
                        mapInstanceRef.current.setView([lat, lng], 17);
                        markerRef.current.setLatLng([lat, lng]);

                        if (circleRef.current) {
                            circleRef.current.setLatLng([lat, lng]);
                            circleRef.current.setRadius(akurasi);
                        } else {
                            circleRef.current = L.circle([lat, lng], {
                                radius: akurasi,
                                color: '#3b82f6',
                                fillColor: '#60a5fa',
                                fillOpacity: 0.15,
                                weight: 1.5,
                            }).addTo(mapInstanceRef.current);
                        }
                    }

                    verifikasiTitikKelurahan(lat, lng, akurasi, 'gps');
                },
                (err) => {
                    setIsLocating(false);
                    if (!isAutoTrigger) {
                        let pesan = 'Gagal membaca posisi GPS.';
                        if (err.code === err.PERMISSION_DENIED) {
                            pesan =
                                'Izin GPS ditolak. Anda dapat menggeser pin secara manual pada peta.';
                        } else if (err.code === err.POSITION_UNAVAILABLE) {
                            pesan =
                                'Sinyal GPS tidak tersedia. Silakan tandai titik secara manual.';
                        }
                        setGeoError(pesan);
                    }
                    // Jika auto-trigger gagal atau ditolak, gunakan posisi peta awal
                    if (!kelurahanNama) {
                        verifikasiTitikKelurahan(
                            lintang || -6.402484,
                            bujur || 106.79424,
                            null,
                            'manual',
                        );
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            );
        },
        [lintang, bujur, kelurahanNama, verifikasiTitikKelurahan],
    );

    // Inisialisasi Peta Leaflet
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // Custom icon pin merah
        const customPinIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div class="flex items-center justify-center size-8 bg-rose-600 text-white rounded-full shadow-lg border-2 border-white animate-bounce-short">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });

        const initialLat = lintang || -6.402484;
        const initialLng = bujur || 106.79424;

        const map = L.map(mapContainerRef.current, {
            attributionControl: false,
        }).setView([initialLat, initialLng], 16);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Marker Draggable
        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customPinIcon,
        }).addTo(map);
        markerRef.current = marker;

        // Lingkaran Akurasi Radius
        if (akurasiGpsM && lokasiSumber === 'gps') {
            circleRef.current = L.circle([initialLat, initialLng], {
                radius: akurasiGpsM,
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.15,
                weight: 1.5,
            }).addTo(map);
        }

        // Event geser pin (dragend)
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const newLat = Number(pos.lat.toFixed(6));
            const newLng = Number(pos.lng.toFixed(6));

            if (circleRef.current) {
                circleRef.current.remove();
                circleRef.current = null;
            }

            verifikasiTitikKelurahan(newLat, newLng, null, 'manual');
        });

        // Event klik di sembarang peta
        map.on('click', (e) => {
            const newLat = Number(e.latlng.lat.toFixed(6));
            const newLng = Number(e.latlng.lng.toFixed(6));
            marker.setLatLng([newLat, newLng]);

            if (circleRef.current) {
                circleRef.current.remove();
                circleRef.current = null;
            }

            verifikasiTitikKelurahan(newLat, newLng, null, 'manual');
        });

        // OTOMATIS AMBIL POSISI GPS JIKA BELUM PERNAH DIAMBIL
        if (lokasiSumber !== 'gps' && !isAutoGpsAttempted.current) {
            isAutoGpsAttempted.current = true;
            handleGetGpsLocation(true);
        } else if (!kelurahanNama) {
            verifikasiTitikKelurahan(
                initialLat,
                initialLng,
                akurasiGpsM,
                lokasiSumber,
            );
        }

        // Pastikan ukuran Leaflet pas setelah dirender
        const timer = setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [
        lintang,
        bujur,
        akurasiGpsM,
        lokasiSumber,
        kelurahanNama,
        handleGetGpsLocation,
        verifikasiTitikKelurahan,
    ]);

    return (
        <div className="relative flex aspect-[16/10] max-h-[580px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/40 bg-zinc-950 shadow-md sm:aspect-[16/9]">
            {/* Canvas Peta Leaflet */}
            <div ref={mapContainerRef} className="z-0 size-full" />

            {/* Floating Top-Right Sesuai Wireframe: Teks Status & Tombol GPS */}
            <div className="absolute top-4 right-4 z-[500] flex max-w-[calc(100%-4.5rem)] items-center gap-2.5 sm:top-6 sm:right-6 sm:max-w-lg sm:gap-3">
                <div className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/75 px-3.5 py-2 text-caption-xs font-medium text-white shadow-xl backdrop-blur-md sm:text-body-sm">
                    {isLocating ? (
                        <span className="flex min-w-0 items-center gap-2">
                            <RefreshCw className="size-3.5 shrink-0 animate-spin text-white" />
                            <span className="truncate">Mendeteksi GPS...</span>
                        </span>
                    ) : kelurahanNama ? (
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
                            <span className="truncate">
                                Lokasi:{' '}
                                <strong className="font-semibold text-white">
                                    {kelurahanNama}
                                </strong>
                            </span>
                        </span>
                    ) : geoError ? (
                        <span className="block truncate font-medium text-amber-300">
                            {geoError}
                        </span>
                    ) : (
                        <span className="line-clamp-2 text-caption-xs text-white/90 sm:text-body-sm">
                            Lokasi tidak terdeteksi. Tekan tombol di samping
                            untuk mengambil lokasi secara otomatis
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => handleGetGpsLocation(false)}
                    disabled={isLocating}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-2xl transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95 disabled:opacity-50 sm:size-12"
                    title="Ambil Lokasi Otomatis via GPS"
                    aria-label="Ambil Lokasi Otomatis via GPS"
                >
                    <Crosshair
                        className={cn(
                            'size-6 shrink-0 text-zinc-950',
                            isLocating && 'animate-spin',
                        )}
                    />
                </button>
            </div>

            {/* Floating Bottom-Left Sesuai Wireframe: [ ← Kembali ke Bukti Foto ] */}
            {onPrevStep && (
                <div className="absolute bottom-4 left-4 z-[500] sm:bottom-6 sm:left-6">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onPrevStep}
                        className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 text-body-sm font-semibold text-zinc-950 shadow-xl transition-transform hover:scale-102 hover:bg-zinc-100 active:scale-98 sm:px-5"
                        title="Kembali ke Bukti Foto"
                    >
                        <ArrowLeft className="size-4 text-zinc-950" />
                        <span>Kembali ke Bukti Foto</span>
                    </Button>
                </div>
            )}

            {/* Floating Bottom-Right Sesuai Wireframe: [ Selanjutnya → ] */}
            {onNextStep && (
                <div className="absolute right-4 bottom-4 z-[500] sm:right-6 sm:bottom-6">
                    <Button
                        type="button"
                        onClick={onNextStep}
                        disabled={!canProceed}
                        className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 text-body-sm font-bold text-zinc-950 shadow-xl transition-transform hover:scale-102 hover:bg-zinc-100 active:scale-98 disabled:opacity-40 sm:px-6"
                        title={
                            canProceed
                                ? 'Lanjut ke Detail'
                                : 'Tentukan titik dalam wilayah layanan'
                        }
                    >
                        <span>Selanjutnya</span>
                        <ArrowRight className="size-4 text-zinc-950" />
                    </Button>
                </div>
            )}
        </div>
    );
}
