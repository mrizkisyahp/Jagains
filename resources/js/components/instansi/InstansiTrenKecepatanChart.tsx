import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface TrenKecepatanData {
    labels: string[];
    median_diterima: number[];
    median_selesai: number[];
}

interface InstansiTrenKecepatanChartProps {
    data: TrenKecepatanData;
    className?: string;
    labelDiterima?: string;
    labelSelesai?: string;
}

export default function InstansiTrenKecepatanChart({
    data,
    className,
    labelDiterima = 'Median Diterima Laporan',
    labelSelesai = 'Median Diselesaikan Laporan',
}: InstansiTrenKecepatanChartProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const { labels, median_diterima, median_selesai } = data;

    const width = 800;
    const height = 240;
    const paddingLeft = 55;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 40;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Menentukan skala maksimal Y
    const maxVal = useMemo(() => {
        const all = [...median_diterima, ...median_selesai];
        const highest = Math.max(...all, 5);
        return Math.ceil(highest / 2) * 2; // kelipatan 2
    }, [median_diterima, median_selesai]);

    const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

    // Fungsi konversi koordinat
    const getX = (index: number) => {
        if (labels.length <= 1) return paddingLeft + graphWidth / 2;
        return paddingLeft + (index / (labels.length - 1)) * graphWidth;
    };

    const getY = (val: number) => {
        const ratio = maxVal > 0 ? val / maxVal : 0;
        return paddingTop + graphHeight - ratio * graphHeight;
    };

    // Fungsi membuat path cubic Bezier mulus (spline)
    const createSplinePath = (points: Array<{ x: number; y: number }>) => {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;

            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return path;
    };

    const pointsDiterima = median_diterima.map((val, idx) => ({
        x: getX(idx),
        y: getY(val),
    }));
    const pointsSelesai = median_selesai.map((val, idx) => ({
        x: getX(idx),
        y: getY(val),
    }));

    const pathDiterima = createSplinePath(pointsDiterima);
    const pathSelesai = createSplinePath(pointsSelesai);

    return (
        <div
            className={cn(
                'space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs sm:p-6',
                className,
            )}
        >
            {/* Header Chart & Legend */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-body-base font-display font-bold text-foreground sm:text-body-lg">
                    Tren Kecepatan Penanganan
                </h3>

                {/* Legend Sesuai Wireframe */}
                <div className="flex flex-wrap items-center gap-4 text-caption-xs font-medium sm:text-body-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="size-3 shrink-0 rounded-sm bg-rose-600 dark:bg-rose-500" />
                        <span className="text-muted-foreground">
                            {labelDiterima}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="size-3 shrink-0 rounded-sm bg-indigo-600 dark:bg-indigo-400" />
                        <span className="text-muted-foreground">
                            {labelSelesai}
                        </span>
                    </div>
                </div>
            </div>

            {/* SVG Canvas Area */}
            <div className="relative w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-auto w-full min-w-[500px] overflow-visible select-none"
                >
                    {/* Y-Axis Label Teks */}
                    <text
                        x={10}
                        y={height / 2}
                        transform={`rotate(-90, 15, ${height / 2})`}
                        className="fill-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
                        textAnchor="middle"
                    >
                        Median Hari
                    </text>

                    {/* Horizontal Grid Lines & Y Ticks */}
                    {yTicks.map((tickVal, idx) => {
                        const y = getY(tickVal);
                        return (
                            <g key={idx}>
                                <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={width - paddingRight}
                                    y2={y}
                                    className="stroke-border/70"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                />
                                <text
                                    x={paddingLeft - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="fill-muted-foreground font-mono text-[10px]"
                                >
                                    {Math.round(tickVal)}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis Horizontal Base Line */}
                    <line
                        x1={paddingLeft}
                        y1={paddingTop + graphHeight}
                        x2={width - paddingRight}
                        y2={paddingTop + graphHeight}
                        className="stroke-border"
                        strokeWidth="1.5"
                    />

                    {/* Spline Line: Median Diselesaikan (Blue/Indigo) */}
                    <path
                        d={pathSelesai}
                        fill="none"
                        className="stroke-indigo-600 dark:stroke-indigo-400"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Spline Line: Median Diterima (Red/Rose) */}
                    <path
                        d={pathDiterima}
                        fill="none"
                        className="stroke-rose-600 dark:stroke-rose-500"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Titik Point Interaktif */}
                    {pointsDiterima.map((pt, idx) => (
                        <circle
                            key={`diterima-${idx}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredIdx === idx ? 5 : 3}
                            className="fill-rose-600 stroke-background transition-all"
                            strokeWidth="2"
                        />
                    ))}

                    {pointsSelesai.map((pt, idx) => (
                        <circle
                            key={`selesai-${idx}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredIdx === idx ? 5 : 3}
                            className="fill-indigo-600 stroke-background transition-all"
                            strokeWidth="2"
                        />
                    ))}

                    {/* X-Axis Ticks & Labels */}
                    {labels.map((lbl, idx) => {
                        const x = getX(idx);
                        return (
                            <g
                                key={idx}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className="cursor-pointer"
                            >
                                <line
                                    x1={x}
                                    y1={paddingTop + graphHeight}
                                    x2={x}
                                    y2={paddingTop + graphHeight + 5}
                                    className="stroke-border"
                                    strokeWidth="1.5"
                                />
                                <text
                                    x={x}
                                    y={paddingTop + graphHeight + 18}
                                    textAnchor="middle"
                                    className={cn(
                                        'font-mono text-[10px] transition-colors',
                                        hoveredIdx === idx
                                            ? 'fill-foreground font-bold'
                                            : 'fill-muted-foreground',
                                    )}
                                >
                                    {lbl}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis Center Title */}
                    <text
                        x={paddingLeft + graphWidth / 2}
                        y={height - 2}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
                    >
                        Tanggal
                    </text>
                </svg>

                {/* Floating Tooltip jika hover */}
                {hoveredIdx !== null && (
                    <div
                        className="pointer-events-none absolute bottom-12 z-10 -translate-x-1/2 space-y-0.5 rounded-xl border border-border bg-popover/95 p-2 text-[11px] shadow-lg backdrop-blur-xs"
                        style={{ left: `${(getX(hoveredIdx) / width) * 100}%` }}
                    >
                        <p className="font-bold text-foreground">
                            {labels[hoveredIdx]}
                        </p>
                        <p className="font-medium text-rose-600 dark:text-rose-400">
                            Diterima: {median_diterima[hoveredIdx]} hari
                        </p>
                        <p className="font-medium text-indigo-600 dark:text-indigo-400">
                            Selesai: {median_selesai[hoveredIdx]} hari
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
