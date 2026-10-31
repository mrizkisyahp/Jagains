export interface AuditLogPelaku {
    id: number;
    username: string;
    peran: string;
}

export interface AuditLogLaporan {
    id: number;
    nomor_tiket: string;
    judul: string;
}

export interface AuditLogItem {
    id: number;
    pelaku_id: number | null;
    aksi: string;
    objek_tipe: string | null;
    objek_id: number | null;
    laporan_id: number | null;
    nilai_lama: Record<string, unknown> | null;
    nilai_baru: Record<string, unknown> | null;
    alasan: string | null;
    konteks: {
        ip?: string;
        user_agent?: string;
    } | null;
    waktu: string;
    pelaku?: AuditLogPelaku | null;
    laporan?: AuditLogLaporan | null;
}

export interface AuditLogFilterState {
    waktu_mulai?: string | null;
    waktu_selesai?: string | null;
    aksi?: string | null;
    objek_tipe?: string | null;
    search?: string | null;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}
