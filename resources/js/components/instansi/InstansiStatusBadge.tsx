import type { ComponentProps } from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import {
    CalendarDays,
    CircleCheck,
    CircleHelp,
    CircleX,
    ClipboardCheck,
    FileQuestion,
    Forward,
    Hammer,
    MapPinCheck,
    Route,
    Scale,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusPresentation = {
    label: string;
    description: string;
    variant: ComponentProps<typeof Badge>['variant'];
    icon: typeof CircleCheck;
    tone?: string;
};
export const INSTANSI_STATUS: Record<string, StatusPresentation> = {
    PERLU_ROUTING: {
        description:
            'Laporan belum memiliki dinas penanganan yang tepat dan perlu dialihkan.',
        tone: 'border-sla-warn/30 bg-sla-warn/10 text-sla-warn',
        label: 'Perlu pengalihan',
        variant: 'outline',
        icon: Route,
    },
    DITERUSKAN: {
        description:
            'Laporan sudah dikirim ke dinas Anda dan menunggu petugas menerimanya.',
        tone: 'border-stage-verify/30 bg-stage-verify/10 text-stage-verify',
        label: 'Diteruskan',
        variant: 'outline',
        icon: Forward,
    },
    DITERIMA: {
        description:
            'Dinas sudah menerima laporan dan akan menyiapkan survei atau rencana penanganan.',
        tone: 'border-stage-verify/30 bg-stage-verify/5 text-stage-verify',
        label: 'Diterima',
        variant: 'outline',
        icon: ClipboardCheck,
    },
    DISURVEI: {
        description:
            'Survei lapangan sudah selesai. Dinas sedang menyiapkan langkah penanganan berikutnya.',
        tone: 'border-sla-safe/30 bg-sla-safe/10 text-sla-safe',
        label: 'Selesai survei',
        variant: 'outline',
        icon: MapPinCheck,
    },
    TERJADWAL_ANGGARAN: {
        description:
            'Penanganan sudah dijadwalkan dan menunggu pelaksanaan sesuai anggaran yang tersedia.',
        tone: 'border-sla-warn/30 bg-sla-warn/10 text-sla-warn',
        label: 'Terjadwal anggaran',
        variant: 'outline',
        icon: CalendarDays,
    },
    DIKERJAKAN: {
        description: 'Pekerjaan perbaikan sedang dilakukan oleh dinas.',
        tone: 'border-primary/40 bg-primary/15 text-foreground',
        label: 'Dikerjakan',
        variant: 'secondary',
        icon: Hammer,
    },
    MENUNGGU_VERIFIKASI: {
        description:
            'Perbaikan sudah diajukan selesai dan menunggu warga memeriksa hasilnya.',
        label: 'Verifikasi warga',
        variant: 'stage-verify',
        icon: Users,
    },
    DISENGKETAKAN: {
        description:
            'Warga tidak setuju dengan hasil penanganan. Dinas perlu memberikan respons sengketa.',
        tone: 'border-destructive/30 bg-destructive/10 text-destructive',
        label: 'Disengketakan',
        variant: 'stage-audit',
        icon: Scale,
    },
    MENUNGGU_KEPUTUSAN_AUDITOR: {
        description:
            'Sengketa sedang diperiksa Auditor. Dinas menunggu keputusan lanjutan.',
        label: 'Menunggu Auditor',
        variant: 'stage-audit',
        icon: ShieldCheck,
    },
    USULAN_TOLAK: {
        description:
            'Dinas mengusulkan laporan ditolak dan menunggu keputusan Auditor.',
        tone: 'border-sla-warn/30 bg-sla-warn/10 text-sla-warn',
        label: 'Usulan penolakan',
        variant: 'stage-audit',
        icon: FileQuestion,
    },
    DITOLAK: {
        description: 'Laporan dinyatakan tidak dapat ditindaklanjuti.',
        label: 'Ditolak',
        variant: 'destructive',
        icon: CircleX,
    },
    TERTUTUP_WARGA: {
        description:
            'Warga sudah menyetujui hasil penanganan. Tiket ini telah selesai.',
        tone: 'border-sla-safe/30 bg-sla-safe/10 text-sla-safe',
        label: 'Ditutup warga',
        variant: 'closed',
        icon: CircleCheck,
    },
    TERTUTUP_AUDITOR: {
        description: 'Auditor sudah menutup tiket. Tiket ini telah selesai.',
        tone: 'border-sla-safe/30 bg-sla-safe/10 text-sla-safe',
        label: 'Ditutup Auditor',
        variant: 'closed',
        icon: ShieldCheck,
    },
};

export default function InstansiStatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const presentation = INSTANSI_STATUS[status] ?? {
        label: status,
        description: 'Status laporan sedang diperbarui.',
        variant: 'outline' as const,
        icon: CircleHelp,
    };
    const Icon = presentation.icon;
    return (
        <PopoverPrimitive.Root>
            <Badge
                render={
                    <PopoverPrimitive.Trigger
                        aria-label={`${presentation.label}. ${presentation.description}`}
                        delay={150}
                        closeDelay={100}
                        openOnHover
                    />
                }
                variant={presentation.variant}
                className={cn(
                    'h-auto min-h-6 max-w-full gap-1.5 py-1 text-caption-xs',
                    presentation.tone,
                    className,
                )}
            >
                <Icon aria-hidden="true" />
                <span className="whitespace-nowrap">{presentation.label}</span>
            </Badge>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Positioner side="top" sideOffset={6}>
                    <PopoverPrimitive.Popup
                        initialFocus={false}
                        role="tooltip"
                        className="z-50 max-w-72 rounded-lg border border-neutral-700/60 bg-neutral-900 px-3 py-2 text-caption-xs leading-relaxed text-white shadow-xl outline-none dark:bg-neutral-800"
                    >
                        {presentation.description}
                    </PopoverPrimitive.Popup>
                </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}

const statusCodePattern = new RegExp(
    `\\b(${Object.keys(INSTANSI_STATUS).join('|')})\\b`,
    'g',
);

export function formatInstansiMessage(message: string | undefined): string {
    return (message ?? '').replace(
        statusCodePattern,
        (code) => INSTANSI_STATUS[code]?.label ?? code,
    );
}
