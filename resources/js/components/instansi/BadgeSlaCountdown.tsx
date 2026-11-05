const TAHAP_LAYANAN: Record<string, { label: string; instruction: string }> = {
    RESPONS: {
        label: 'Respons awal',
        instruction: 'Terima, alihkan, atau kembalikan tiket.',
    },
    SURVEI: {
        label: 'Survei lapangan',
        instruction: 'Selesaikan pemeriksaan kondisi di lokasi laporan.',
    },
    ANGGARAN: {
        label: 'Penjadwalan anggaran',
        instruction: 'Tetapkan sumber dana dan tanggal target selesai.',
    },
    PELAKSANAAN: {
        label: 'Pelaksanaan perbaikan',
        instruction:
            'Selesaikan perbaikan dan ajukan hasilnya untuk diperiksa warga.',
    },
    JAWAB_SENGKETA: {
        label: 'Respons sengketa',
        instruction:
            'Pilih kerjakan ulang atau kirim sanggahan kepada Auditor.',
    },
};

interface BadgeSlaCountdownProps {
    tahap: string | null;
    jatuhTempo: string | null;
    sisaHari: number | null;
    persenSla: number | null;
    status?: string;
    compact?: boolean;
}

export default function BadgeSlaCountdown({
    tahap,
    jatuhTempo,
    sisaHari,
    status,
    compact = false,
}: BadgeSlaCountdownProps) {
    const waitingLabel =
        status === 'MENUNGGU_VERIFIKASI'
            ? compact
                ? 'Menunggu warga'
                : 'Menunggu warga memeriksa hasil perbaikan'
            : ['USULAN_TOLAK', 'MENUNGGU_KEPUTUSAN_AUDITOR'].includes(
                    status ?? '',
                )
              ? compact
                  ? 'Menunggu Auditor'
                  : 'Menunggu peninjauan Auditor'
              : null;
    if (waitingLabel || !tahap || !jatuhTempo || sisaHari === null) {
        return (
            <span className="text-body-sm text-muted-foreground">
                {waitingLabel ??
                    (['TERTUTUP_WARGA', 'TERTUTUP_AUDITOR'].includes(
                        status ?? '',
                    )
                        ? compact
                            ? 'Selesai'
                            : 'Penanganan tiket sudah selesai'
                        : status === 'DITOLAK'
                          ? compact
                              ? 'Laporan ditolak'
                              : 'Laporan sudah ditolak oleh Auditor'
                          : compact
                            ? 'Belum tersedia'
                            : 'Batas waktu tahap ini belum tersedia')}
            </span>
        );
    }
    const stage = TAHAP_LAYANAN[tahap.toUpperCase()];
    const label =
        sisaHari < 0
            ? `Lewat ${Math.abs(sisaHari)} hari kalender`
            : sisaHari === 0
              ? 'Jatuh tempo hari ini'
              : `Sisa ${sisaHari} hari kalender`;
    return (
        <div className="flex flex-col items-start gap-1.5">
            <span className="text-body-sm text-muted-foreground tabular-nums">
                {label}
            </span>
            {!compact &&
                (stage ? (
                    <>
                        {tahap.toUpperCase() !== 'RESPONS' && (
                            <span className="text-body-sm font-medium text-foreground">
                                Tahap: {stage.label}
                            </span>
                        )}
                        <span className="max-w-56 text-body-sm text-muted-foreground">
                            {stage.instruction}
                        </span>
                    </>
                ) : (
                    <span className="text-body-sm text-muted-foreground">
                        Rincian tahap layanan belum tersedia.
                    </span>
                ))}
        </div>
    );
}
