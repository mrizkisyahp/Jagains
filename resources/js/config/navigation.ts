import { NavItem } from '@/types/navigation';
import { PeranUser } from '@/types/auth';

export const NAVIGATION_CONFIG: Record<PeranUser, NavItem[]> = {
    admin: [
        { title: 'Perlu routing', href: '/admin/antrean-routing', roles: ['admin'] },
        { title: 'Moderasi', href: '/admin/moderasi', roles: ['admin'], badge: 1 },
        { title: 'Akun staf', href: '/admin/petugas', roles: ['admin'] },
        { title: 'Parameter', href: '/admin/konfigurasi', roles: ['admin'] },
        { title: 'Log audit', href: '/admin/audit-log', roles: ['admin'] },
    ],
    auditor: [
        { title: 'Antrean eskalasi', href: '/auditor/antrean', roles: ['auditor'] },
        { title: 'Pola pengawasan', href: '/auditor/pola-pengawasan', roles: ['auditor'] },
        { title: 'Log audit', href: '/auditor/audit-log', roles: ['auditor'] },
        { title: 'Profil auditor', href: '/auditor/profil', roles: ['auditor'] },
    ],
    instansi: [
        { title: 'Antrean tiket', href: '/instansi/antrean', roles: ['instansi'] },
        { title: 'Tiket sengketa', href: '/instansi/sengketa', roles: ['instansi'] },
        { title: 'Dashboard kinerja', href: '/instansi/dashboard', roles: ['instansi'] },
        { title: 'Profil dinas', href: '/instansi/profil', roles: ['instansi'] },
    ],
    warga: [
        { title: 'Eksplorasi', href: '/peta', roles: ['warga'] },
        { title: 'Tambah Laporan', href: '/warga/lapor', roles: ['warga'] },
        { title: 'Riwayat Laporan', href: '/warga/riwayat', roles: ['warga'] },
        { title: 'Verifikasi', href: '/warga/verifikasi', roles: ['warga'] },
        { title: 'Profil', href: '/warga/profil', roles: ['warga'] },
    ],
};
