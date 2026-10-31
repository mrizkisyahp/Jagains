import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from '@/components/notifikasi/NotificationBell';

interface AppHeaderProps {
    title?: string;
    breadcrumb?: string;
}

export default function AppHeader({ title, breadcrumb }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 text-foreground backdrop-blur-xs sm:px-6">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground" />
                <div className="flex flex-col">
                    {breadcrumb && (
                        <span className="text-caption-xs font-medium text-muted-foreground">
                            {breadcrumb}
                        </span>
                    )}
                    {title && (
                        <h1 className="font-display text-body-medium font-semibold text-foreground">
                            {title}
                        </h1>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell />
            </div>
        </header>
    );
}
