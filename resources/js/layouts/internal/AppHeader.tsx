import { SidebarTrigger } from '@/components/ui/sidebar';

interface AppHeaderProps {
    title?: string;
    breadcrumb?: string;
}

export default function AppHeader({ title, breadcrumb }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 size-8 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900" />
                <div className="flex flex-col">
                    {breadcrumb && (
                        <span className="text-[11px] font-medium text-zinc-400">
                            {breadcrumb}
                        </span>
                    )}
                    {title && (
                        <h1 className="text-sm font-semibold text-zinc-900">
                            {title}
                        </h1>
                    )}
                </div>
            </div>
        </header>
    );
}
