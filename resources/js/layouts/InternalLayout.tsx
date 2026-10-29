import { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster, toast } from '@/components/ui/toast';
import AppSidebar from './internal/AppSidebar';
import AppHeader from './internal/AppHeader';
import { InternalLayoutProps } from '@/types/navigation';

export default function InternalLayout({
    children,
    title,
    breadcrumb,
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
            <SidebarInset className="flex min-h-screen flex-col bg-zinc-50/60">
                <AppHeader title={title} breadcrumb={breadcrumb} />
                <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
