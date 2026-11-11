import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface InstansiMapPoint {
    id: number;
    nomor_tiket: string;
    judul: string;
    status: string;
    lat: number;
    lng: number;
}

interface InstansiOverviewMapProps {
    points: InstansiMapPoint[];
    className?: string;
}

export default function InstansiOverviewMap({
    points,
    className,
}: InstansiOverviewMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    const defaultCenter: [number, number] = [-6.2088, 106.8456];

    const center = useMemo<[number, number]>(() => {
        if (!points || points.length === 0) return defaultCenter;
        const validPoints = points.filter(
            (p) =>
                typeof p.lat === 'number' &&
                typeof p.lng === 'number' &&
                !isNaN(p.lat) &&
                !isNaN(p.lng),
        );
        if (validPoints.length === 0) return defaultCenter;
        const sumLat = validPoints.reduce((acc, p) => acc + p.lat, 0);
        const sumLng = validPoints.reduce((acc, p) => acc + p.lng, 0);
        return [sumLat / validPoints.length, sumLng / validPoints.length];
    }, [points]);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center,
            zoom: 12,
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            boxZoom: false,
            keyboard: false,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            layerGroupRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.setView(center);
    }, [center[0], center[1]]);

    useEffect(() => {
        const layerGroup = layerGroupRef.current;
        if (!layerGroup) return;

        layerGroup.clearLayers();

        (points ?? []).forEach((pt) => {
            if (
                typeof pt.lat !== 'number' ||
                typeof pt.lng !== 'number' ||
                isNaN(pt.lat) ||
                isNaN(pt.lng)
            ) {
                return;
            }
            L.circleMarker([pt.lat, pt.lng], {
                radius: 6,
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.85,
                weight: 2,
            }).addTo(layerGroup);
        });
    }, [points]);

    return (
        <div
            className={cn(
                'relative flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-muted/20',
                className,
            )}
        >
            <div className="pointer-events-none absolute top-3.5 left-3.5 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/90 px-3 py-1.5 text-caption-xs font-bold text-foreground shadow-xs backdrop-blur-md">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Sebaran Tiket Aktif Dinas ({points.length})</span>
                </span>
            </div>

            <div className="size-full min-h-[300px] flex-1">
                <div
                    ref={mapContainerRef}
                    className="pointer-events-none z-0 size-full min-h-[300px]"
                    aria-label="Peta sebaran lokasi laporan instansi"
                />
            </div>
        </div>
    );
}
