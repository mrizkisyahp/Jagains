import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function InstansiEmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <p className="text-body-medium font-semibold text-foreground">
                {title}
            </p>
            <p className="max-w-sm text-body-sm text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
