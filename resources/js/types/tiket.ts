import { KondisiSla } from './peta';

export interface LampiranFoto {
    uuid: string;
    url: string;
    tahap: 'awal' | 'sesudah' | 'verifikasi';
    lebar: number;
    tinggi: number;
    gps_cocok: boolean | null;
    jarak_m: number | null;
    akurasi_m: number | null;
    created_at: string;
}

export interface BeritaAcaraItem {
    id: number;
    versi: number;
    kegiatan: string;
    hasil: string;
    hambatan: string | null;
    instansi_nama: string;
    created_at: string;
}

export interface RiwayatStatusItem {
    id: number;
    kode_transisi: string;
    status_lama: string | null;
    status_baru: string;
    catatan: string | null;
    waktu: string;
    instansi_nama: string | null;
    peran_pelaku: string;
}

export interface PengalihanItem {
    id: number;
    instansi_asal: string;
    instansi_tujuan: string;
    alasan: string;
    waktu: string;
}

export interface AlasanPenolakanKuorum {
    alasan: string;
    jalur: string;
    waktu: string;
}

export interface KuorumVerifikasiData {
    nomor_ronde: number;
    target_k: number;
    suara_setuju_bobot: number;
    suara_tolak_bobot: number;
    total_pemilih: number;
    persentase_setuju: number;
    mulai: string | null;
    batas_waktu: string | null;
    hasil: 'setuju' | 'tolak' | 'kedaluwarsa' | null;
    selesai_pada: string | null;
    alasan_penolakan: AlasanPenolakanKuorum[];
}

export interface CatatanAuditorItem {
    id: number;
    jenis: string;
    alasan: string | null;
    perintah: string | null;
    tenggat: string | null;
    waktu: string;
}

export interface TiketDetail {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    status: string;
    disembunyikan: boolean;
    kategori_nama: string;
    instansi_nama: string | null;
    kelurahan_nama: string;
    kecamatan_nama: string;
    lintang: number;
    bujur: number;
    akurasi_gps_m: number | null;
    lokasi_sumber: string | null;
    kondisi_sla: KondisiSla;
    label_sla: string;
    warna_sla: string;
    ikon_sla: string;
    sisa_hari_sla: number | null;
    sisa_sla_teks: string;
    foto_awal: LampiranFoto | null;
    foto_sesudah: LampiranFoto | null;
    foto_verifikasi: LampiranFoto[];
    berita_acara: BeritaAcaraItem[];
    riwayat_status: RiwayatStatusItem[];
    pengalihan: PengalihanItem[];
    kuorum_verifikasi: KuorumVerifikasiData | null;
    catatan_auditor: CatatanAuditorItem[];
    total_dukungan: number;
    sudah_didukung: boolean;
    created_at: string;
}
