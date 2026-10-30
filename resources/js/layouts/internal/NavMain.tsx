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
                    : currentUrl === item.href || (item.href !== '/' && currentUrl.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'group flex items-center justify-between px-4 py-2.5 text-body-sm rounded-xl transition-colors',
                            isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs'
                                : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                        )}
                    >
                        <span>{item.title}</span>
                        {item.badge !== undefined && (
                            <Badge
                                variant={isActive ? 'default' : 'secondary'}
                                className={cn(
                                    'px-2 py-0.5 text-caption-xs font-medium',
                                    isActive
                                        ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground border-none'
                                        : 'bg-muted text-muted-foreground border-border'
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
