import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
                        <h2 className="font-display text-display-md font-bold tracking-tight text-foreground">
                            {title}
                        </h2>
                        {requirementCode && (
                            <Badge variant="outline" className="text-caption-xs font-mono font-medium text-muted-foreground border-border">
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
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
                            <Layers className="size-6 text-foreground/70" />
                        </div>
                        <CardTitle className="font-display text-body-medium font-semibold text-foreground">
                            Panel Operasional {title}
                        </CardTitle>
                        <CardDescription className="max-w-md mx-auto text-body-sm text-muted-foreground">
                            Fitur dan komponen antarmuka untuk modul ini telah disiapkan dan siap menerima implementasi logika bisnis selanjutnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8 pt-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-caption-xs text-muted-foreground">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            Status Layout Terintegrasi
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
