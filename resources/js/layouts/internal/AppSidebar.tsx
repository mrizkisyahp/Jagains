import { Link, router, usePage } from '@inertiajs/react';
import { type ComponentType, useState } from 'react';
import {
    BarChart3,
    Building2,
    ChartNoAxesCombined,
    CheckSquare,
    Clock,
    FilePlus,
    FileText,
    Inbox,
    LogIn,
    LogOut,
    Map,
    Route,
    Scale,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    UserCheck,
    User as UserIcon,
    Users,
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { Button, buttonVariants } from '@/components/ui/button';
import { User } from '@/types/auth';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface NavEntry {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    badge?: number | string;
}

const NAVIGATION_ITEMS: Record<string, NavEntry[]> = {
    admin: [
        { label: 'Perlu routing', href: '/admin/antrean-routing', icon: Route },
        {
            label: 'Moderasi',
            href: '/admin/moderasi',
            icon: ShieldAlert,
        },
        { label: 'Akun staf', href: '/admin/petugas', icon: Users },
        { label: 'Parameter', href: '/admin/konfigurasi', icon: Sliders },
        { label: 'Log audit', href: '/admin/audit-log', icon: FileText },
    ],
    auditor: [
        { label: 'Antrean eskalasi', href: '/auditor/antrean', icon: Scale },
        {
            label: 'Pola pengawasan',
            href: '/auditor/pola-pengawasan',
            icon: BarChart3,
        },
        { label: 'Log audit', href: '/auditor/audit-log', icon: ShieldCheck },
        { label: 'Profil auditor', href: '/auditor/profil', icon: UserCheck },
    ],
    instansi: [
        {
            label: 'Dashboard kinerja',
            href: '/instansi/dashboard',
            icon: ChartNoAxesCombined,
        },
        { label: 'Antrean tiket', href: '/instansi/antrean', icon: Inbox },
        { label: 'Tiket sengketa', href: '/instansi/sengketa', icon: Scale },
        { label: 'Profil dinas', href: '/instansi/profil', icon: Building2 },
    ],
    warga: [
        { label: 'Peta laporan', href: '/peta', icon: Map },
        { label: 'Lapor kerusakan', href: '/warga/lapor', icon: FilePlus },
        { label: 'Riwayat laporan', href: '/warga/riwayat', icon: Clock },
        { label: 'Verifikasi', href: '/warga/verifikasi', icon: CheckSquare },
        { label: 'Profil & wilayah', href: '/warga/profil', icon: UserIcon },
    ],
};

function getRoleSubtitle(user: User): string {
    switch (user.peran) {
        case 'admin':
            return 'Admin platform';
        case 'auditor':
            return 'Auditor independen';
        case 'instansi':
            return user.instansi?.nama ?? 'Petugas instansi';
        case 'warga':
            return user.kelurahan?.nama
                ? `Kel. ${user.kelurahan.nama}`
                : 'Warga Kota Depok';
        default:
            return 'Pengguna terdaftar';
    }
}

export default function AppSidebar() {
    const { auth, counts } = usePage<{
        auth?: { user?: User | null };
        counts?: {
            moderasi?: number | null;
            antrean_routing?: number | null;
        };
    }>().props;
    const { url } = usePage();

    const user = auth?.user;
    const peran = user?.peran ?? 'warga';
    const rawItems = NAVIGATION_ITEMS[peran] ?? NAVIGATION_ITEMS.warga;
    const menuItems = rawItems.map((item) => {
        if (item.href === '/admin/moderasi') {
            const count = counts?.moderasi ?? 0;
            return {
                ...item,
                badge: count > 0 ? count : undefined,
            };
        }
        if (item.href === '/admin/antrean-routing') {
            const count = counts?.antrean_routing ?? 0;
            return {
                ...item,
                badge: count > 0 ? count : undefined,
            };
        }
        return item;
    });
    const [logoutOpen, setLogoutOpen] = useState(false);
    const { isMobile, setOpenMobile } = useSidebar();

    const handleLogout = () => {
        router.post('/logout');
    };

    const isItemActive = (href: string) => {
        const currentPath = url.split('?')[0];
        if (href === '/') {
            return currentPath === '/';
        }
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    return (
        <>
            <Sidebar
                collapsible="icon"
                className="border-r border-border bg-background [&_[data-slot=sidebar-inner]]:bg-background"
            >
                <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
                    <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
                        <Link
                            href="/"
                            className="min-w-0 group-data-[collapsible=icon]:hidden"
                            aria-label="Jagains"
                        >
                            <Logo className="text-body-medium" />
                        </Link>
                        <SidebarTrigger className="size-8 shrink-0 text-muted-foreground" />
                    </div>
                </SidebarHeader>

                <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1.5">
                    <SidebarGroup className="group-data-[collapsible=icon]:p-0">
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                            Ruang kerja
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {menuItems.map(
                                ({ label, href, icon: Icon, badge }) => (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton
                                            tooltip={
                                                badge !== undefined
                                                    ? `${label} (${badge})`
                                                    : label
                                            }
                                            isActive={isItemActive(href)}
                                            className="h-10 rounded-md data-[active=true]:border data-[active=true]:border-border data-[active=true]:bg-muted/50"
                                            render={
                                                <Link
                                                    href={href}
                                                    onClick={() =>
                                                        isMobile &&
                                                        setOpenMobile(false)
                                                    }
                                                />
                                            }
                                        >
                                            <Icon />
                                            <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                                                {label}
                                            </span>
                                            {badge !== undefined && (
                                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-caption-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">
                                                    {badge}
                                                </span>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ),
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
                    <div className="flex items-center gap-2 border-t border-border pt-3 group-data-[collapsible=icon]:justify-center">
                        {user ? (
                            <>
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-caption-xs font-semibold group-data-[collapsible=icon]:hidden">
                                    {user.username?.slice(0, 2).toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                                    <p className="truncate text-body-sm font-normal text-foreground">
                                        {user.username}
                                    </p>
                                    <p className="truncate text-caption-xs text-muted-foreground">
                                        {getRoleSubtitle(user)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setLogoutOpen(true)}
                                    aria-label="Keluar"
                                >
                                    <LogOut />
                                </Button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className={cn(
                                    buttonVariants({
                                        variant: 'outline',
                                        size: 'sm',
                                    }),
                                    'w-full gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0',
                                )}
                            >
                                <LogIn className="size-4" />
                                <span className="group-data-[collapsible=icon]:hidden">
                                    Masuk
                                </span>
                            </Link>
                        )}
                    </div>
                </SidebarFooter>
            </Sidebar>

            <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Keluar dari panel?</DialogTitle>
                        <DialogDescription>
                            Anda perlu masuk kembali untuk mengakses akun dan
                            data aplikasi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLogoutOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleLogout}>
                            Keluar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
