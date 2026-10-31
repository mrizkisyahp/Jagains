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
        <Card className="p-5 sm:p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-caption-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {title}
                </span>
                <div className={`p-2 rounded-xl ${colorClass}`}>
                    <Icon className="size-4" />
                </div>
            </div>
            <div className="space-y-1">
                <div className="font-display text-3xl font-extrabold text-foreground">
                    {value}
                </div>
                <p className="text-caption-xs text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </Card>
    );
}
