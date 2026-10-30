export type KondisiSla =
    | 'dalam_sla'
    | 'hampir_lewat'
    | 'lewat_sla'
    | 'menunggu_warga'
    | 'selesai';

export interface TitikLaporanPeta {
    id: number;
    nomor_tiket: string;
    judul: string;
    kategori_id: number;
    kategori_nama: string;
    instansi_id: number | null;
    instansi_nama: string | null;
    kecamatan_id: number;
    kecamatan_nama: string;
    kelurahan_nama: string;
    status: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    kondisi_sla: KondisiSla;
    label_sla: string;
    warna_sla: string;
    ikon_sla: string;
    sisa_hari_sla: number | null;
    sisa_sla_teks: string;
    lintang: number;
    bujur: number;
    jumlah_dukungan: number;
    created_at: string;
}

export interface MasterFilterItem {
    id: number;
    nama: string;
}

export interface MasterFilterStatistik {
    total_laporan: number;
    laporan_aktif: number;
    laporan_selesai: number;
}

export interface MasterFilterPeta {
    kategori: MasterFilterItem[];
    kecamatan: MasterFilterItem[];
    instansi: MasterFilterItem[];
    statistik: MasterFilterStatistik;
}

export interface PetaFilterState {
    kategori_id: number | null;
    kecamatan_id: number | null;
    kondisi_sla: KondisiSla | null;
    instansi_id: number | null;
    rentang_waktu: number | null;
    search: string;
}
