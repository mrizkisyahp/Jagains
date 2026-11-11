import { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

interface BlankPanelProps {
    title: string;
    requirementCode?: string;
    description: string;
    children?: ReactNode;
}

export default function BlankPanel({
    title,
    requirementCode,
    description,
    children,
}: BlankPanelProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-display-md font-display font-bold tracking-tight text-foreground">
                            {title}
                        </h2>
                        {requirementCode && (
                            <Badge
                                variant="outline"
                                className="border-border text-caption-xs font-mono font-medium text-muted-foreground"
                            >
                                {requirementCode}
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 text-body-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>

            {children ? (
                children
            ) : (
                <Card className="border-dashed border-border bg-card shadow-xs">
                    <CardHeader className="pb-2 text-center">
                        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <Layers className="size-6 text-foreground/70" />
                        </div>
                        <CardTitle className="text-body-medium font-display font-semibold text-foreground">
                            Panel Operasional {title}
                        </CardTitle>
                        <CardDescription className="mx-auto max-w-md text-body-sm text-muted-foreground">
                            Fitur dan komponen antarmuka untuk modul ini telah
                            disiapkan dan siap menerima implementasi logika
                            bisnis selanjutnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 pb-8 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-caption-xs text-muted-foreground">
                            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            Status Layout Terintegrasi
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
