export interface SuaraUser {
    setuju: boolean;
    jalur: 'A' | 'B';
    bobot: number;
    alasan: string | null;
    waktu: string | null;
}

export interface KuorumInfo {
    ronde_id: number | null;
    nomor_ronde: number;
    target_k: number;
    suara_setuju_bobot: number;
    suara_tolak_bobot: number;
    persentase_setuju: number;
    ada_jalur_a_setuju: boolean;
    ada_jalur_a_tolak: boolean;
    sisa_hari: number;
    sudah_memberi_suara: boolean;
    suara_user: SuaraUser | null;
    bisa_memberi_suara: boolean;
}

export interface TiketVerifikasiItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    deskripsi: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    status: string;
    lintang: number;
    bujur: number;
    akurasi_gps_m: number | null;
    created_at: string;
    kategori: {
        id: number;
        nama: string;
    } | null;
    kelurahan: {
        id: number;
        nama: string;
        tingkat: string;
    } | null;
    instansi: {
        id: number;
        nama: string;
        singkatan: string;
    } | null;
    kuorum_info: KuorumInfo;
    ronde_verifikasi?: Array<{
        id: number;
        nomor: number;
        k: number;
        batas_waktu: string;
        lampiran_sesudah?: {
            id: number;
            path: string;
        } | null;
    }>;
    berita_acara?: Array<{
        id: number;
        versi: number;
        kegiatan: string;
        hasil: string;
        hambatan: string | null;
        created_at: string;
    }>;
    lampiran?: Array<{
        id: number;
        tahap: string;
        path: string;
    }>;
}

export interface NotifikasiItem {
    id: number;
    pengguna_id: number;
    laporan_id: number | null;
    tipe: string;
    pesan: string;
    kunci_dedup: string | null;
    dibaca_pada: string | null;
    created_at: string;
    laporan?: {
        id: number;
        nomor_tiket: string;
        judul: string;
        status: string;
    } | null;
}
