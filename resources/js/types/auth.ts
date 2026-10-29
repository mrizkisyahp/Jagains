export type PeranUser = 'warga' | 'instansi' | 'admin' | 'auditor';
export type StatusAkun = 'aktif' | 'dibekukan' | 'nonaktif';

export type User = {
    id: number;
    username: string;
    peran: PeranUser;
    kelurahan_id?: number | null;
    kelurahan_diubah_pada?: string | null;
    instansi_id?: number | null;
    status_akun: StatusAkun;
    poin_peringatan: number;
    wajib_ganti_sandi: boolean;
    aktivitas_terakhir_pada?: string | null;
    created_at: string;
    updated_at: string;
    kelurahan?: {
        id: number;
        nama: string;
        tingkat: string;
    } | null;
    instansi?: {
        id: number;
        nama: string;
        singkatan?: string | null;
    } | null;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};
