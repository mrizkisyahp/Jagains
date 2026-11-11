import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

export default function InstansiLocationMap({
    latitude,
    longitude,
    className,
}: {
    latitude: number;
    longitude: number;
    className?: string;
}) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [latitude, longitude],
            zoom: 17,
            scrollWheelZoom: false,
            zoomControl: true,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.9,
            weight: 2,
        }).addTo(map);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [latitude, longitude]);

    return (
        <div
            ref={mapContainerRef}
            className={cn('z-0 h-64 min-h-64 rounded-none', className)}
            aria-label="Peta titik lokasi laporan"
        />
    );
}
