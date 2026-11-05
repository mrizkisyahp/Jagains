import type { ReactNode } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CalendarClock,
    CircleAlert,
    Clock3,
    MessageSquareWarning,
    Users,
} from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import InstansiEmptyState from '@/components/instansi/InstansiEmptyState';
import InstansiStatusBadge, {
    INSTANSI_STATUS,
} from '@/components/instansi/InstansiStatusBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { antrean, dashboard } from '@/routes/instansi';
import { detail } from '@/routes/tiket';

type PeriodeDashboard = '30_hari' | '90_hari' | 'semua';

interface TiketPrioritas {
    id: number;
    nomor_tiket: string;
    judul: string;
    status: string;
    kategori: string | null;
    kelurahan: string | null;
    urgensi: 'lewat_sla' | 'perlu_respons' | 'sengketa' | 'sla_aktif';
    sisa_hari_sla: number | null;
}

interface DashboardInstansiProps {
    periode: PeriodeDashboard;
    diperbarui_pada: string;
    tindakan: {
        lewat_sla: number;
        perlu_respons: number;
        perlu_respons_sengketa: number;
        menunggu_verifikasi: number;
        prioritas: TiketPrioritas[];
    };
    pipeline: Array<{ status: string; jumlah: number }>;
    kualitas: {
        data_cukup: boolean;
        ambang_tiket_tertutup: number;
        tiket_tertutup: number;
        median_respons_hk: number | null;
        median_selesai_hk: number | null;
        janji_ditepati_persen: number | null;
        anggaran_menggantung_total: number;
        tingkat_verifikasi_persen: number | null;
        tingkat_sengketa_persen: number | null;
    };
}

const PERIOD_LABELS: Record<PeriodeDashboard, string> = {
    '30_hari': '30 hari terakhir',
    '90_hari': '90 hari terakhir',
    semua: 'Semua periode',
};

const TERMINAL_STATUSES = new Set([
    'DITOLAK',
    'TERTUTUP_WARGA',
    'TERTUTUP_AUDITOR',
]);

function alasanUrgensi(tiket: TiketPrioritas): string {
    if (tiket.urgensi === 'lewat_sla') {
        return 'Melewati batas waktu layanan';
    }

    if (tiket.urgensi === 'sengketa') {
        return 'Menunggu respons sengketa';
    }

    if (tiket.urgensi === 'perlu_respons') {
        return 'Perlu respons awal';
    }

    if (tiket.sisa_hari_sla === null) {
        return 'Batas waktu belum ditetapkan';
    }

    if (tiket.sisa_hari_sla === 0) {
        return 'Batas waktu berakhir hari ini';
    }

    return `Sisa ${tiket.sisa_hari_sla} hari`;
}

function formatNilai(nilai: number | null, suffix: string): string {
    return nilai === null ? '—' : `${nilai.toLocaleString('id-ID')}${suffix}`;
}

export default function DashboardInstansiPage({
    periode,
    diperbarui_pada,
    tindakan,
    pipeline,
    kualitas,
}: DashboardInstansiProps) {
    const tindakanUtama = [
        {
            label: 'Lewat batas waktu',
            value: tindakan.lewat_sla,
            href: antrean({ query: { status: 'LEWAT_SLA' } }),
            icon: AlertTriangle,
        },
        {
            label: 'Perlu respons awal',
            value: tindakan.perlu_respons,
            href: antrean({ query: { status: 'PERLU_RESPONS' } }),
            icon: Clock3,
        },
        {
            label: 'Perlu respons sengketa',
            value: tindakan.perlu_respons_sengketa,
            href: antrean({ query: { status: 'SENGKETA' } }),
            icon: MessageSquareWarning,
        },
        {
            label: 'Menunggu verifikasi',
            value: tindakan.menunggu_verifikasi,
            href: antrean({ query: { status: 'MENUNGGU_VERIFIKASI' } }),
            icon: Users,
        },
    ];
    const pipelineAktif = pipeline.filter(
        ({ status }) => !TERMINAL_STATUSES.has(status),
    );
    const pipelineTerminal = pipeline.filter(({ status }) =>
        TERMINAL_STATUSES.has(status),
    );
    const totalAktif = pipelineAktif.reduce(
        (total, item) => total + item.jumlah,
        0,
    );
    const diperbarui = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(diperbarui_pada));

    const metrikKualitas = [
        [
            'Respons awal median',
            formatNilai(kualitas.median_respons_hk, ' hari kerja'),
        ],
        [
            'Sampai diajukan selesai',
            formatNilai(kualitas.median_selesai_hk, ' hari kerja'),
        ],
        [
            'Janji target dipenuhi',
            formatNilai(kualitas.janji_ditepati_persen, '%'),
        ],
        [
            'Anggaran melewati target',
            `${kualitas.anggaran_menggantung_total.toLocaleString('id-ID')} tiket`,
        ],
        [
            'Verifikasi warga',
            formatNilai(kualitas.tingkat_verifikasi_persen, '%'),
        ],
        [
            'Sengketa setelah verifikasi',
            formatNilai(kualitas.tingkat_sengketa_persen, '%'),
        ],
    ];

    return (
        <div className="flex min-w-0 flex-col gap-5">
            <Head title="Dashboard Kinerja Instansi" />

            <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-sm font-display font-semibold tracking-tight">
                        Kinerja penanganan
                    </h1>
                    <p className="mt-1 text-body-sm text-muted-foreground">
                        Prioritaskan laporan yang membutuhkan tindakan hari ini.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden text-caption-xs text-muted-foreground sm:inline">
                        Diperbarui {diperbarui}
                    </span>
                    <Select
                        value={periode}
                        onValueChange={(value) => {
                            if (!value) {
                                return;
                            }

                            router.get(
                                dashboard.url({ query: { periode: value } }),
                            );
                        }}
                    >
                        <SelectTrigger
                            aria-label="Pilih periode dashboard"
                            className="min-w-44 shadow-none"
                        >
                            <SelectValue>
                                {(value: string | null) =>
                                    PERIOD_LABELS[
                                        (value ?? 'semua') as PeriodeDashboard
                                    ]
                                }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {Object.entries(PERIOD_LABELS).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </header>


            <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
                <section
                    className="min-w-0 overflow-hidden rounded-xl border border-border"
                    aria-labelledby="prioritas-heading"
                >
                    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div>
                            <h2
                                id="prioritas-heading"
                                className="text-body-medium font-semibold"
                            >
                                Perlu ditangani
                            </h2>
                            <p className="text-body-sm text-muted-foreground">
                                Hingga delapan tiket berisiko tertinggi pada
                                periode ini.
                            </p>
                        </div>
                        <Button
                            render={<Link href={antrean()} />}
                            variant="ghost"
                            size="sm"
                        >
                            Buka antrean
                            <ArrowRight data-icon="inline-end" />
                        </Button>
                    </header>
                    {tindakan.prioritas.length === 0 ? (
                        <InstansiEmptyState
                            title="Belum ada tiket untuk ditangani."
                            description="Tiket aktif dan batas waktu layanan akan muncul di sini."
                        />
                    ) : (
                        <ul className="divide-y divide-border">
                            {tindakan.prioritas.map((tiket) => (
                                <li
                                    key={tiket.id}
                                    className="flex min-w-0 items-center gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={detail(tiket.nomor_tiket)}
                                            className="block truncate text-body-base font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            {tiket.judul}
                                        </Link>
                                        <p className="mt-0.5 truncate text-body-sm text-muted-foreground">
                                            {alasanUrgensi(tiket)}
                                            {tiket.kelurahan
                                                ? ` · ${tiket.kelurahan}`
                                                : ''}
                                        </p>
                                    </div>
                                    <InstansiStatusBadge
                                        status={tiket.status}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section
                    className="min-w-0 rounded-xl border border-border"
                    aria-labelledby="pipeline-heading"
                >
                    <header className="border-b border-border px-4 py-3">
                        <h2
                            id="pipeline-heading"
                            className="text-body-medium font-semibold"
                        >
                            Alur penanganan
                        </h2>
                        <p className="text-body-sm text-muted-foreground">
                            Sebaran tiket pada setiap tahap kerja.
                        </p>
                    </header>
                    <div className="flex flex-col gap-3 px-4 py-4">
                        {pipelineAktif.map(({ status, jumlah }) => (
                            <div key={status} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-3 text-body-sm">
                                    <span className="truncate text-muted-foreground">
                                        {INSTANSI_STATUS[status]?.label ??
                                            status}
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {jumlah.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <Progress
                                    value={
                                        totalAktif === 0
                                            ? 0
                                            : (jumlah / totalAktif) * 100
                                    }
                                    aria-label={`${INSTANSI_STATUS[status]?.label ?? status}: ${jumlah} tiket`}
                                    className="h-1 bg-muted [&_[data-slot=progress-indicator]]:bg-foreground"
                                />
                            </div>
                        ))}
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-caption-xs text-muted-foreground">
                            {pipelineTerminal.map(({ status, jumlah }) => (
                                <span key={status}>
                                    {INSTANSI_STATUS[status]?.label ?? status}:{' '}
                                    <span className="text-foreground tabular-nums">
                                        {jumlah}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <section
                className="rounded-xl border border-border"
                aria-labelledby="kualitas-heading"
            >
                <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                    <div>
                        <h2
                            id="kualitas-heading"
                            className="text-body-medium font-semibold"
                        >
                            Kualitas penanganan
                        </h2>
                        <p className="text-body-sm text-muted-foreground">
                            Indikator kinerja laporan yang masuk pada{' '}
                            {PERIOD_LABELS[periode].toLowerCase()}.
                        </p>
                    </div>
                    <CalendarClock
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                </header>
                {!kualitas.data_cukup ? (
                    <div className="flex items-start gap-3 px-4 py-5">
                        <CircleAlert
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-body-base font-medium">
                                Data belum cukup untuk evaluasi kinerja.
                            </p>
                            <p className="mt-1 text-body-sm text-muted-foreground">
                                {kualitas.tiket_tertutup.toLocaleString(
                                    'id-ID',
                                )}{' '}
                                dari{' '}
                                {kualitas.ambang_tiket_tertutup.toLocaleString(
                                    'id-ID',
                                )}{' '}
                                tiket tertutup pada periode ini diperlukan untuk
                                menampilkan indikator kualitas.
                            </p>
                        </div>
                    </div>
                ) : (
                    <dl className="grid sm:grid-cols-2 xl:grid-cols-3">
                        {metrikKualitas.map(([label, value], index) => (
                            <div
                                key={label}
                                className={`flex min-h-24 flex-col justify-center gap-1 px-4 py-3 ${index % 2 === 0 ? 'sm:border-r sm:border-border xl:border-r' : ''} ${index < 4 ? 'border-b border-border xl:border-b' : ''}`}
                            >
                                <dt className="text-body-sm text-muted-foreground">
                                    {label}
                                </dt>
                                <dd className="text-display-sm font-display font-semibold tabular-nums">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </section>
        </div>
    );
}

DashboardInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Dashboard kinerja" breadcrumb="Instansi > Kinerja">
        {page}
    </InternalLayout>
);
