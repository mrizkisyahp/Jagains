export interface MatriksKinerjaRow {
    id: number;
    nama: string;
    total_tiket: number;
    tiket_selesai: number;
    median_respons_hk: number | null;
    median_selesai_hk: number | null;
    janji_ditepati_persen: number;
    anggaran_menggantung_total: number;
    tingkat_verifikasi_persen: number;
    tingkat_sengketa_persen: number;
    data_cukup: boolean;
}

export type PeriodeDashboard = '30_hari' | '90_hari' | 'semua';
export type SegmenDashboard = 'kecamatan' | 'instansi';
