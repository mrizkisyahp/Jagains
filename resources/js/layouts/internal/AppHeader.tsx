import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from '@/components/notifikasi/NotificationBell';

interface AppHeaderProps {
    title?: string;
    breadcrumb?: string;
}

export default function AppHeader({ title, breadcrumb }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 text-foreground backdrop-blur-xs sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="-ml-1 size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden" />
                <div className="flex min-w-0 flex-col">
                    {breadcrumb && (
                        <span className="truncate text-caption-xs font-medium text-muted-foreground">
                            {breadcrumb}
                        </span>
                    )}
                    {title && (
                        <h1 className="truncate text-body-medium font-display font-semibold text-foreground">
                            {title}
                        </h1>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <NotificationBell />
            </div>
        </header>
    );
}
