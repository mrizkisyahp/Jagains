import L from 'leaflet';
import { KondisiSla } from '@/types/peta';

interface MarkerColorConfig {
    color: string;
    label: string;
    svgInner: string;
}

const MARKER_CONFIGS: Record<KondisiSla, MarkerColorConfig> = {
    dalam_sla: {
        color: '#10b981', // Emerald
        label: 'Dalam SLA',
        // ShieldCheck icon
        svgInner: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    },
    hampir_lewat: {
        color: '#f59e0b', // Amber
        label: 'Hampir Lewat',
        // Hourglass icon
        svgInner: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    },
    lewat_sla: {
        color: '#ef4444', // Rose/Red
        label: 'Lewat SLA',
        // AlertTriangle icon
        svgInner: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    },
    menunggu_warga: {
        color: '#3b82f6', // Blue
        label: 'Menunggu Warga / Arbitrase',
        // Users icon
        svgInner: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    },
    selesai: {
        color: '#64748b', // Slate
        label: 'Selesai',
        // CheckCheck icon
        svgInner: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
    },
};

/**
 * Membuat L.DivIcon pin kustom untuk penanda laporan di peta berdasarkan kondisi SLA.
 */
export function createStatusMarkerIcon(kondisi: KondisiSla, isSelected = false): L.DivIcon {
    const config = MARKER_CONFIGS[kondisi] || MARKER_CONFIGS.dalam_sla;
    const size = isSelected ? 42 : 36;
    const anchorX = size / 2;
    const anchorY = size;
    const ringClass = isSelected ? 'ring-4 ring-white shadow-2xl scale-110' : 'shadow-md hover:scale-105';

    const html = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${ringClass}" style="width: ${size}px; height: ${size}px;">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-md">
                <!-- Pin Body Teardrop -->
                <path d="M18 36C18 36 32 23.5 32 14C32 6.268 25.732 0 18 0C10.268 0 4 6.268 4 14C4 23.5 18 36 18 36Z" fill="${config.color}"/>
                <!-- Inner Circle Target -->
                <circle cx="18" cy="14" r="10" fill="#ffffff"/>
            </svg>
            <!-- Status Icon in Center -->
            <div class="absolute top-[8px] left-[10px] w-[16px] h-[16px] flex items-center justify-center" style="color: ${config.color};">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    ${config.svgInner}
                </svg>
            </div>
        </div>
    `;

    return L.divIcon({
        className: 'custom-status-marker-pin',
        html,
        iconSize: [size, size],
        iconAnchor: [anchorX, anchorY],
        popupAnchor: [0, -size],
    });
}

/**
 * Membuat custom icon untuk kluster marker berdekatan (Marker Clustering).
 */
export function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
    const count = cluster.getChildCount();
    let size = 40;
    let colorClass = 'bg-primary text-primary-foreground';

    if (count > 50) {
        size = 52;
        colorClass = 'bg-primary text-primary-foreground ring-4 ring-primary/30';
    } else if (count > 20) {
        size = 46;
        colorClass = 'bg-primary text-primary-foreground ring-2 ring-primary/20';
    }

    const html = `
        <div class="flex items-center justify-center rounded-full font-mono font-bold text-xs shadow-lg transition-transform hover:scale-110 cursor-pointer ${colorClass}" style="width: ${size}px; height: ${size}px;">
            <span>${count}</span>
        </div>
    `;

    return L.divIcon({
        className: 'custom-status-cluster-pin',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}
