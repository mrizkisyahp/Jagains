import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { TitikLaporanPeta } from '@/types/peta';
import {
    createClusterIcon,
    createStatusMarkerIcon,
} from '@/components/peta/marker-icons';

interface WargaBerandaMapProps {
    center: [number, number];
    titik: TitikLaporanPeta[];
    selectedPointId?: number | null;
    onSelectPoint: (point: TitikLaporanPeta | null) => void;
}

export default function WargaBerandaMap({
    center,
    titik,
    selectedPointId,
    onSelectPoint,
}: WargaBerandaMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
    const markersMapRef = useRef<Map<number, L.Marker>>(new Map());

    // Inisialisasi Map Leaflet dengan MarkerClusterGroup persis seperti tab Eksplorasi
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center,
            zoom: 13,
            zoomControl: true,
            minZoom: 10,
            maxZoom: 18,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Inisialisasi Marker Cluster Group untuk grouping performa tinggi
        const clusterGroup = L.markerClusterGroup({
            iconCreateFunction: createClusterIcon,
            maxClusterRadius: 45,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
        });
        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;

        // Klik pada area kosong peta menutup kartu quick summary
        map.on('click', (e) => {
            const target = e.originalEvent.target as HTMLElement;
            if (
                !target.closest('.custom-status-marker-pin') &&
                !target.closest('.custom-status-cluster-pin')
            ) {
                onSelectPoint(null);
            }
        });

        // Invalidate size agar kanvas peta merender penuh lebar layar
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapInstanceRef.current = null;
            clusterGroupRef.current = null;
            markersMapRef.current.clear();
        };
    }, []);

    // Update center saat berpindah
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.panTo(center, {
            animate: true,
            duration: 0.5,
        });
    }, [center[0], center[1]]);

    // Render titik marker ke dalam cluster group
    useEffect(() => {
        const clusterGroup = clusterGroupRef.current;
        const map = mapInstanceRef.current;
        if (!clusterGroup || !map) return;

        clusterGroup.clearLayers();
        markersMapRef.current.clear();

        const markersToAdd: L.Marker[] = [];

        (titik ?? []).forEach((pt) => {
            const lat = Number(
                pt.lintang ?? (pt as unknown as { lat?: number }).lat,
            );
            const lng = Number(
                pt.bujur ?? (pt as unknown as { lng?: number }).lng,
            );

            if (isNaN(lat) || isNaN(lng)) {
                return;
            }

            const isSelected = selectedPointId === pt.id;
            const icon = createStatusMarkerIcon(
                pt.kondisi_sla || 'dalam_sla',
                isSelected,
            );

            const marker = L.marker([lat, lng], {
                icon,
                title: `${pt.nomor_tiket} - ${pt.judul}`,
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                onSelectPoint(pt);
                map.panTo([lat, lng], {
                    animate: true,
                    duration: 0.5,
                });
            });

            markersToAdd.push(marker);
            markersMapRef.current.set(pt.id, marker);
        });

        clusterGroup.addLayers(markersToAdd);
    }, [titik]);

    // Respon saat selectedPointId berubah tanpa re-cluster (ringan & instan)
    useEffect(() => {
        markersMapRef.current.forEach((marker, id) => {
            const pt = (titik ?? []).find((t) => t.id === id);
            if (pt) {
                marker.setIcon(
                    createStatusMarkerIcon(
                        pt.kondisi_sla || 'dalam_sla',
                        id === selectedPointId,
                    ),
                );
            }
        });
    }, [selectedPointId, titik]);

    return (
        <div
            ref={mapContainerRef}
            className="z-0 size-full min-h-[460px] sm:min-h-[520px]"
            aria-label="Peta interaktif eksplorasi laporan publik"
        />
    );
}
