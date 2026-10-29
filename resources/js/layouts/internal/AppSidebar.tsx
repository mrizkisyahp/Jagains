import { router, usePage } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
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
        <Sidebar className="border-r border-zinc-200 bg-white">
            {/* Header: Logo & App Name */}
            <SidebarHeader className="p-5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-xs">
                        <MapPin className="size-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900">
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
                <div className="border-t border-zinc-200/90 pt-4">
                    <div className="space-y-0.5">
                        <p className="truncate text-sm font-bold text-zinc-900">
                            {user?.username ?? 'Pengguna'}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                            {user ? getRoleSubtitle(user) : 'Tamu'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 w-full rounded-xl border border-zinc-200 bg-white py-2 text-center text-sm font-semibold text-zinc-900 shadow-2xs transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                    >
                        Keluar
                    </button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
