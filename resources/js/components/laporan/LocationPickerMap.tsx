import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        kelurahan: string | null
    ) => void;
}

export default function LocationPickerMap({
    lintang,
    bujur,
    akurasiGpsM,
    lokasiSumber,
    kelurahanNama,
    onChangeLocation,
}: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [isCheckingKelurahan, setIsCheckingKelurahan] = useState(false);

    // Verifikasi kelurahan titik via API
    const verifikasiTitikKelurahan = async (lat: number, lng: number, akurasi: number | null, sumber: 'gps' | 'manual') => {
        setIsCheckingKelurahan(true);
        setGeoError(null);

        try {
            const res = await fetch('/api/wilayah/deteksi-kelurahan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ lintang: lat, bujur: lng }),
            });

            const data = await res.json();
            if (res.ok && data.terdeteksi && data.kelurahan) {
                onChangeLocation(lat, lng, akurasi, sumber, data.kelurahan.nama);
            } else {
                onChangeLocation(lat, lng, akurasi, sumber, null);
                setGeoError('Titik koordinat berada di luar wilayah percontohan Kota Depok.');
            }
        } catch {
            onChangeLocation(lat, lng, akurasi, sumber, null);
        } finally {
            setIsCheckingKelurahan(false);
        }
    };

    // Deteksi GPS Peramban
    const handleGetGpsLocation = () => {
        if (!navigator.geolocation) {
            setGeoError('Peramban Anda tidak mendukung penentuan posisi GPS.');
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
                    }
                }

                verifikasiTitikKelurahan(lat, lng, akurasi, 'gps');
            },
            (err) => {
                setIsLocating(false);
                let pesan = 'Gagal membaca posisi GPS.';
                if (err.code === err.PERMISSION_DENIED) {
                    pesan = 'Izin GPS ditolak. Anda tetap dapat menggeser pin secara manual pada peta.';
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    pesan = 'Sinyal GPS tidak tersedia. Silakan tandai titik secara manual.';
                }
                setGeoError(pesan);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

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
        const initialLng = bujur || 106.794240;

        const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
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

        // Trigger deteksi awal kelurahan jika belum ada
        if (!kelurahanNama) {
            verifikasiTitikKelurahan(initialLat, initialLng, akurasiGpsM, lokasiSumber);
        }

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Titik Lokasi Kerusakan</h3>
                    <p className="text-xs text-muted-foreground">
                        Geser pin pada peta untuk menentukan posisi kerusakan secara akurat (FR-LAP-03).
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetGpsLocation}
                    disabled={isLocating}
                    className="gap-2 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                >
                    <Navigation className={`size-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    {isLocating ? 'Mencari GPS...' : 'Gunakan GPS Saya'}
                </Button>
            </div>

            {/* Container Peta Leaflet */}
            <div className="relative overflow-hidden rounded-xl border border-border shadow-sm h-72 sm:h-80 z-0">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Floating Info Lokasi */}
                <div className="absolute top-3 left-3 right-3 sm:right-auto z-[400] flex flex-wrap gap-2 pointer-events-none">
                    <div className="bg-background/95 backdrop-blur-sm border border-border/80 px-3 py-1.5 rounded-lg shadow-md text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <MapPin className="size-3.5 text-rose-500" />
                            {lintang.toFixed(6)}, {bujur.toFixed(6)}
                            <Badge variant={lokasiSumber === 'gps' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                                {lokasiSumber.toUpperCase()}
                            </Badge>
                        </div>
                        {akurasiGpsM && lokasiSumber === 'gps' && (
                            <p className="text-[11px] text-muted-foreground pl-5">
                                Akurasi: ±{akurasiGpsM} meter
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Deteksi Kelurahan */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40 text-xs">
                <div className="flex items-center gap-2">
                    {kelurahanNama ? (
                        <>
                            <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                            <div>
                                <span className="font-semibold text-foreground">Kelurahan Terdeteksi: </span>
                                <span className="text-foreground">{kelurahanNama}, Kota Depok</span>
                            </div>
                        </>
                    ) : isCheckingKelurahan ? (
                        <span className="text-muted-foreground animate-pulse">Memeriksa batas kelurahan Kota Depok...</span>
                    ) : (
                        <>
                            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                            <span className="text-amber-700 dark:text-amber-400">
                                {geoError || 'Geser pin ke dalam batas wilayah Kota Depok'}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

