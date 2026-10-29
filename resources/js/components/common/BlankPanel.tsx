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
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                            {title}
                        </h2>
                        {requirementCode && (
                            <Badge variant="outline" className="text-xs font-mono font-medium text-zinc-600">
                                {requirementCode}
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                        {description}
                    </p>
                </div>
            </div>

            {children ? (
                children
            ) : (
                <Card className="border-dashed border-zinc-300 bg-white shadow-xs">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 mb-2">
                            <Layers className="size-6 text-zinc-600" />
                        </div>
                        <CardTitle className="text-base font-semibold text-zinc-800">
                            Panel Operasional {title}
                        </CardTitle>
                        <CardDescription className="max-w-md mx-auto text-xs text-zinc-500">
                            Fitur dan komponen antarmuka untuk modul ini telah disiapkan dan siap menerima implementasi logika bisnis selanjutnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8 pt-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            Status Layout Terintegrasi
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
