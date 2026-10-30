import { router, usePage } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import NavMain from './NavMain';
import { NAVIGATION_CONFIG } from '@/config/navigation';
import { User } from '@/types/auth';

function getRoleSubtitle(user: User): string {
    switch (user.peran) {
        case 'admin':
            return 'Admin platform';
        case 'auditor':
            return 'Auditor independen';
        case 'instansi':
            return user.instansi?.nama ?? 'Petugas instansi';
        case 'warga':
            return user.kelurahan?.nama ? `Kel. ${user.kelurahan.nama}` : 'Warga Kota Depok';
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

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            {/* Header: Logo & App Name */}
            <SidebarHeader className="p-5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-xs">
                        <MapPin className="size-5" />
                    </div>
                    <span className="font-display text-display-md font-bold tracking-tight text-sidebar-foreground">
                        Jagains
                    </span>
                </div>
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

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogout}
                        className="mt-4 w-full h-11 border-sidebar-border bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-body-medium font-semibold"
                    >
                        Keluar
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
