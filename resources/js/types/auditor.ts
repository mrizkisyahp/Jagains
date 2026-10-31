export type PemicuEskalasi = 'SLA' | 'SANGGAHAN' | 'RONDE' | 'TANPA_KUORUM';

export type JenisKeputusanAuditor = 'PERINTAH' | 'PERBAIKAN_SAH' | 'KERJAKAN_ULANG';

export interface KeputusanAuditorItem {
    id: number;
    jenis: JenisKeputusanAuditor;
    alasan: string | null;
    perintah: string | null;
    tenggat: string | null;
    waktu: string;
    auditor?: string;
}

export interface EskalasiItem {
    id: number;
    pemicu: PemicuEskalasi;
    tahap: string | null;
    created_at: string;
    selesai_pada: string | null;
    selesai_alasan: string | null;
    hari_terlambat: number;
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        keterangan: string;
        status: string;
        keparahan: 'ringan' | 'sedang' | 'berat';
        sla_tahap: string | null;
        sla_jatuh_tempo: string | null;
        kategori: { id: number; nama: string } | null;
        instansi: { id: number; nama: string; singkatan: string } | null;
        kelurahan: { id: number; nama: string; tingkat?: string } | null;
    };
    keputusan_auditor?: KeputusanAuditorItem[];
}

export interface SuaraWargaPublik {
    id: number;
    setuju: boolean;
    jalur: 'A' | 'B';
    bobot: number;
    alasan: string | null;
    lampiran_foto: string | null;
    waktu: string;
}

export interface DetailPerkaraAudit {
    eskalasi: {
        id: number;
        pemicu: PemicuEskalasi;
        tahap: string | null;
        created_at: string;
        selesai_pada: string | null;
        selesai_alasan: string | null;
        hari_terlambat: number;
    };
    laporan: {
        id: number;
        nomor_tiket: string;
        judul: string;
        keterangan: string;
        status: string;
        keparahan: string;
        kategori: { id: number; nama: string } | null;
        instansi: { id: number; nama: string; singkatan: string } | null;
        kelurahan: { id: number; nama: string } | null;
        lintang: number;
        bujur: number;
        sla_tahap: string | null;
        sla_jatuh_tempo: string | null;
        tanggal_target: string | null;
        ronde_sengketa: number;
        jumlah_pengalihan: number;
        created_at: string;
    };
    foto_awal: string | null;
    foto_sesudah: string | null;
    berita_acara: {
        versi: number;
        kegiatan: string;
        hasil: string;
        hambatan: string | null;
        created_at: string;
    } | null;
    sengketa: {
        id: number;
        tenggat: string;
        jawaban: string | null;
        alasan_sanggah: string | null;
        waktu_jawab: string | null;
        petugas?: string | null;
    } | null;
    ronde_info: {
        nomor: number;
        k: number;
        batas_waktu: string;
        hasil: string | null;
    } | null;
    suara_warga: SuaraWargaPublik[];
    riwayat_keputusan: KeputusanAuditorItem[];
}

export interface RingkasanPolaPengawasan {
    eskalasi_aktif: number;
    perintah_diterbitkan: number;
    perbaikan_sah: number;
    perintah_kerja_ulang: number;
}

export interface MatriksPengalihanItem {
    asal: string;
    tujuan: string;
    total: number;
}

export interface PerformaInstansiItem {
    id: number;
    nama: string;
    singkatan: string;
    total_tiket: number;
    tiket_selesai: number;
    tiket_sengketa: number;
    rasio_sengketa: number;
    eskalasi_sla: number;
    anggaran_tertahan: number;
}

export interface PolaPengawasanData {
    ringkasan: RingkasanPolaPengawasan;
    pengalihan: MatriksPengalihanItem[];
    performa_instansi: PerformaInstansiItem[];
}
