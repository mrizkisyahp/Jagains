import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Building2,
    ChartNoAxesCombined,
    Inbox,
    LogIn,
    LogOut,
    Scale,
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
import NavMain from './NavMain';
import { NAVIGATION_CONFIG } from '@/config/navigation';
import { User } from '@/types/auth';
import { cn } from 'cn';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { antrean, dashboard, profil, sengketa } from '@/routes/instansi';

const instansiNavigation = [
    { label: 'Dashboard kinerja', route: dashboard, icon: ChartNoAxesCombined },
    { label: 'Antrean tiket', route: antrean, icon: Inbox },
    { label: 'Tiket sengketa', route: sengketa, icon: Scale },
    { label: 'Profil dinas', route: profil, icon: Building2 },
];

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
    const { auth } = usePage<{ auth?: { user?: User | null } }>().props;
    const { url } = usePage();

    const user = auth?.user;
    const peran = user?.peran ?? 'warga';
    const menuItems = NAVIGATION_CONFIG[peran] ?? [];
    const [logoutOpen, setLogoutOpen] = useState(false);
    const { isMobile, setOpenMobile } = useSidebar();

    const handleLogout = () => {
        router.post('/logout');
    };

    if (peran === 'instansi') {
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
                                {instansiNavigation.map(
                                    ({ label, route, icon: Icon }) => (
                                        <SidebarMenuItem key={label}>
                                            <SidebarMenuButton
                                                tooltip={label}
                                                isActive={
                                                    url.split('?')[0] ===
                                                    route.url()
                                                }
                                                className="h-10 rounded-md data-[active=true]:border data-[active=true]:border-border data-[active=true]:bg-muted/50"
                                                render={
                                                    <Link
                                                        href={route()}
                                                        onClick={() =>
                                                            isMobile &&
                                                            setOpenMobile(false)
                                                        }
                                                    />
                                                }
                                            >
                                                <Icon />
                                                <span className="group-data-[collapsible=icon]:hidden">
                                                    {label}
                                                </span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ),
                                )}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
                        <div className="flex items-center gap-2 border-t border-border pt-3 group-data-[collapsible=icon]:justify-center">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-caption-xs font-semibold group-data-[collapsible=icon]:hidden">
                                {user?.username?.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                                <p className="truncate text-body-sm font-medium">
                                    {user?.username}
                                </p>
                                <p className="text-caption-xs text-muted-foreground">
                                    Petugas instansi
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
                        </div>
                    </SidebarFooter>
                </Sidebar>
                <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                    <DialogContent showCloseButton={false}>
                        <DialogHeader>
                            <DialogTitle>Keluar dari panel?</DialogTitle>
                            <DialogDescription>
                                Anda perlu masuk kembali untuk mengakses antrean
                                dan data instansi.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setLogoutOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                            >
                                Keluar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            {/* Header: Logo & App Name */}
            <SidebarHeader className="p-5 pb-3">
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>
            </SidebarHeader>

            {/* Content: Role Navigation Items */}
            <SidebarContent className="px-2 py-2">
                <NavMain items={menuItems} currentUrl={url} />
            </SidebarContent>

            {/* Footer: User Info & Keluar Button */}
            <SidebarFooter className="p-5 pt-2">
                <div className="border-t border-sidebar-border pt-4">
                    <div className="space-y-0.5">
                        <p className="truncate text-body-medium font-semibold text-sidebar-foreground">
                            {user?.username ?? 'Pengguna'}
                        </p>
                        <p className="truncate text-caption-xs text-muted-foreground">
                            {user ? getRoleSubtitle(user) : 'Tamu'}
                        </p>
                    </div>

                    {user ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            className="mt-4 h-11 w-full border-sidebar-border bg-sidebar text-body-medium font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            Keluar
                        </Button>
                    ) : (
                        <Link
                            href="/login"
                            className={cn(
                                buttonVariants({ variant: 'default' }),
                                'mt-4 h-11 w-full gap-2 font-semibold shadow-xs',
                            )}
                        >
                            <LogIn className="size-4" />
                            <span>Masuk / Daftar</span>
                        </Link>
                    )}
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
