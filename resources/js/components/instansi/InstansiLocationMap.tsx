import {
    Map,
    MapCircleMarker,
    MapTileLayer,
    MapZoomControl,
} from '@/components/ui/map';
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
    return (
        <Map
            key={`${latitude},${longitude}`}
            center={[latitude, longitude]}
            zoom={17}
            scrollWheelZoom={false}
            className={cn('z-0 h-64 min-h-64 rounded-none', className)}
            aria-label="Peta titik lokasi laporan"
        >
            <MapTileLayer />
            <MapCircleMarker center={[latitude, longitude]} radius={8} />
            <MapZoomControl />
        </Map>
    );
}
