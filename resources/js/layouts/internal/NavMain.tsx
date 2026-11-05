import { Link } from '@inertiajs/react';
import { NavItem } from '@/types/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';

interface NavMainProps {
    items: NavItem[];
    currentUrl: string;
}

export default function NavMain({ items, currentUrl }: NavMainProps) {
    return (
        <nav className="flex flex-col space-y-1.5 px-3 py-2">
            {items.map((item) => {
                const isActive = item.exact
                    ? currentUrl === item.href
                    : currentUrl === item.href ||
                      (item.href !== '/' && currentUrl.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'group flex items-center justify-between rounded-xl px-4 py-2.5 text-body-sm transition-colors',
                            isActive
                                ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-xs'
                                : 'font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:text-sidebar-foreground',
                        )}
                    >
                        <span>{item.title}</span>
                        {item.badge !== undefined && (
                            <Badge
                                variant={isActive ? 'default' : 'secondary'}
                                className={cn(
                                    'px-2 py-0.5 text-caption-xs font-medium',
                                    isActive
                                        ? 'border-none bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                                        : 'border-border bg-muted text-muted-foreground',
                                )}
                            >
                                {item.badge}
                            </Badge>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
