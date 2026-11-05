import {
    Map,
    MapCircleMarker,
    MapTileLayer,
    MapZoomControl,
} from '@/components/ui/map';

export default function InstansiLocationMap({
    latitude,
    longitude,
}: {
    latitude: number;
    longitude: number;
}) {
    return (
        <Map
            key={`${latitude},${longitude}`}
            center={[latitude, longitude]}
            zoom={17}
            scrollWheelZoom={false}
            className="z-0 h-64 min-h-64 rounded-none"
            aria-label="Peta titik lokasi laporan"
        >
            <MapTileLayer />
            <MapCircleMarker center={[latitude, longitude]} radius={8} />
            <MapZoomControl />
        </Map>
    );
}
