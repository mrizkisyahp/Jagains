import { Link } from '@inertiajs/react';
import { NavItem } from '@/types/navigation';
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
                            'group flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-colors',
                            isActive
                                ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                                : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium'
                        )}
                    >
                        <span>{item.title}</span>
                        {item.badge !== undefined && (
                            <span
                                className={cn(
                                    'px-2 py-0.5 text-xs rounded-full font-normal transition-colors',
                                    isActive
                                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                        : 'bg-white text-zinc-600 border border-zinc-200'
                                )}
                            >
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
