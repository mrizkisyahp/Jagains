import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { TitikLaporanPeta } from '@/types/peta';
import { createClusterIcon, createStatusMarkerIcon } from './marker-icons';
import { Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

interface PetaCanvasProps {
    titikList: TitikLaporanPeta[];
    selectedTiket: TitikLaporanPeta | null;
    onSelectTiket: (tiket: TitikLaporanPeta | null) => void;
    isLoading?: boolean;
    className?: string;
}

const DEPOK_CENTER: [number, number] = [-6.402484, 106.79424];
const DEFAULT_ZOOM = 13;

export default function PetaCanvas({
    titikList,
    selectedTiket,
    onSelectTiket,
    isLoading = false,
    className,
}: PetaCanvasProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
    const markersMapRef = useRef<Map<number, L.Marker>>(new Map());

    // Inisialisasi Peta Leaflet
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: DEPOK_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false, // Diganti dengan tombol kontrol kustom
            minZoom: 10,
            maxZoom: 19,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Inisialisasi Marker Cluster Group
        const clusterGroup = L.markerClusterGroup({
            iconCreateFunction: createClusterIcon,
            maxClusterRadius: 45,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
        });
        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;

        // Klik di kanvas kosong menutup sheet detail
        map.on('click', (e) => {
            // Jika klik bukan pada marker
            const target = e.originalEvent.target as HTMLElement;
            if (!target.closest('.custom-status-marker-pin') && !target.closest('.custom-status-cluster-pin')) {
                onSelectTiket(null);
            }
        });

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            clusterGroupRef.current = null;
        };
    }, []);

    // Sinkronisasi Marker & Cluster dengan Daftar Titik
    useEffect(() => {
        const clusterGroup = clusterGroupRef.current;
        const map = mapInstanceRef.current;
        if (!clusterGroup || !map) return;

        // Bersihkan marker lama
        clusterGroup.clearLayers();
        markersMapRef.current.clear();

        const markersToAdd: L.Marker[] = [];

        titikList.forEach((titik) => {
            const isSelected = selectedTiket?.id === titik.id;
            const icon = createStatusMarkerIcon(titik.kondisi_sla, isSelected);

            const marker = L.marker([titik.lintang, titik.bujur], {
                icon,
                title: `${titik.nomor_tiket} - ${titik.judul}`,
            });

            marker.on('click', () => {
                onSelectTiket(titik);
                map.panTo([titik.lintang, titik.bujur], { animate: true, duration: 0.5 });
            });

            markersToAdd.push(marker);
            markersMapRef.current.set(titik.id, marker);
        });

        clusterGroup.addLayers(markersToAdd);
    }, [titikList]);

    // Respon saat selectedTiket berubah dari luar (misal diklik dari drawer list)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !selectedTiket) return;

        map.setView([selectedTiket.lintang, selectedTiket.bujur], 16, { animate: true });

        // Update icon marker yang dipilih
        markersMapRef.current.forEach((marker, id) => {
            const titik = titikList.find((t) => t.id === id);
            if (titik) {
                marker.setIcon(createStatusMarkerIcon(titik.kondisi_sla, id === selectedTiket.id));
            }
        });
    }, [selectedTiket]);

    const handleResetCenter = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(DEPOK_CENTER, DEFAULT_ZOOM, { animate: true });
            onSelectTiket(null);
        }
    };

    const handleZoomIn = () => {
        mapInstanceRef.current?.zoomIn();
    };

    const handleZoomOut = () => {
        mapInstanceRef.current?.zoomOut();
    };

    return (
        <div
            className={cn(
                'relative w-full h-full overflow-hidden',
                className ?? 'min-h-[500px] rounded-2xl border border-border shadow-xs'
            )}
        >
            {/* Kanvas Leaflet */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Indikator Loading Data */}
            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 bg-card/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border shadow-md flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-ping" />
                    <span className="text-caption-xs font-semibold text-foreground">Memperbarui sebaran peta...</span>
                </div>
            )}

            {/* Tombol Kontrol Peta Melayang di Kanan Bawah */}
            <div className="absolute bottom-6 right-4 z-1000 flex flex-col gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleResetCenter}
                    className="size-10 rounded-xl bg-card/90 backdrop-blur-md shadow-md border-border text-foreground hover:bg-muted"
                    title="Pusatkan Peta ke Depok"
                >
                    <Compass className="size-5 text-primary" />
                </Button>

                <div className="flex flex-col bg-card/90 backdrop-blur-md rounded-xl border border-border shadow-md overflow-hidden">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        className="size-10 rounded-none border-b border-border hover:bg-muted text-foreground"
                        title="Perbesar"
                    >
                        <ZoomIn className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        className="size-10 rounded-none hover:bg-muted text-foreground"
                        title="Perkecil"
                    >
                        <ZoomOut className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
