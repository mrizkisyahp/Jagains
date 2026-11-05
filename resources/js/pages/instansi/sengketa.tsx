import type { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import InternalLayout from '@/layouts/InternalLayout';
import { Button } from '@/components/ui/button';
import InstansiEmptyState from '@/components/instansi/InstansiEmptyState';
import { antrean } from '@/routes/instansi';

export default function SengketaInstansiPage() {
    return (
        <div className="flex min-w-0 flex-col gap-5">
            <Head title="Tiket Sengketa" />
            <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-display-sm font-display font-semibold tracking-tight">
                            Tiket sengketa
                        </h1>
                        <p className="mt-1 text-body-sm text-muted-foreground">
                            Tiket sengketa yang memerlukan respons akan muncul di sini.
                        </p>
                    </div>                                     
            </header>            
            <section
                className="overflow-hidden rounded-xl border border-border bg-card"
                aria-label="Antrean sengketa"
            >
                <header className="border-b border-border px-4 py-3">
                    <h2 className="text-body-medium font-semibold">
                        Tiket sengketa
                    </h2>
                </header>
                <InstansiEmptyState
                    title="Belum ada tiket sengketa."
                    description="Tiket yang memerlukan respons akan muncul di sini."
                    action={
                        <Button
                            render={
                                <Link
                                    href={antrean({
                                        query: { status: 'sengketa' },
                                    })}
                                />
                            }
                            variant="outline"
                            className="h-11 shadow-none md:h-9"
                        >
                            Lihat antrean sengketa
                            <ArrowUpRight data-icon="inline-end" />
                        </Button>
                    }
                />
            </section>
        </div>
    );
}

SengketaInstansiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Tiket sengketa" breadcrumb="Instansi > Sengketa">
        {page}
    </InternalLayout>
);
