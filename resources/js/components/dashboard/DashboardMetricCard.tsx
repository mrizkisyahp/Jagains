import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DashboardMetricCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    colorClass: string;
}

export default function DashboardMetricCard({
    title,
    value,
    description,
    icon: Icon,
    colorClass,
}: DashboardMetricCardProps) {
    return (
        <Card className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
                <span className="text-caption-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {title}
                </span>
                <div className={`rounded-xl p-2 ${colorClass}`}>
                    <Icon className="size-4" />
                </div>
            </div>
            <div className="space-y-1">
                <div className="font-display text-3xl font-extrabold text-foreground">
                    {value}
                </div>
                <p className="text-caption-xs leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>
        </Card>
    );
}
