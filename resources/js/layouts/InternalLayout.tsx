import { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster, toast } from '@/components/ui/toast';
import AppSidebar from './internal/AppSidebar';
import AppHeader from './internal/AppHeader';
import { InternalLayoutProps } from '@/types/navigation';
import { cn } from '@/lib/utils';

export default function InternalLayout({
    children,
    title,
    breadcrumb,
    fullWidth = false,
    noPadding = false,
    mainClassName,
}: InternalLayoutProps) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            error?: string;
            status?: string;
        };
    }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <SidebarProvider defaultOpen={true}>
            {title && <Head title={title} />}
            <AppSidebar />
            <SidebarInset className="flex min-h-screen max-w-full min-w-0 flex-col overflow-x-hidden bg-background text-foreground">
                <AppHeader title={title} breadcrumb={breadcrumb} />
                <main
                    className={cn(
                        'min-w-0 flex-1',
                        noPadding ? 'p-0' : 'p-4 sm:p-6 lg:p-8',
                        fullWidth ? 'w-full' : 'mx-auto w-full max-w-7xl',
                        mainClassName,
                    )}
                >
                    {children}
                </main>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
