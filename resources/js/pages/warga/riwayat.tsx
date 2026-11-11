import { ReactNode, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InstansiStatusBadge, {
    INSTANSI_STATUS,
} from '@/components/instansi/InstansiStatusBadge';
import SearchableFilterDropdown, {
    DropdownFilterOption,
} from '@/components/peta/SearchableFilterDropdown';
import { MasterFilterPeta, KondisiSla } from '@/types/peta';
import { cn } from '@/lib/utils';
import {
    FileText,
    ThumbsUp,
    Plus,
    Search,
    RotateCcw,
    MapPin,
    Wrench,
    ImageIcon,
    ChevronLeft,
    ChevronRight,
    Filter,
    ChevronDown,
    Activity,
    Tag,
    X,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface LaporanItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    keparahan: 'ringan' | 'sedang' | 'berat';
    status: string;
    kategori_id: number | null;
    kategori_nama: string | null;
    instansi_id: number | null;
    instansi_nama: string | null;
    kelurahan_id: number | null;
    kecamatan_id: number | null;
    kota_id: number | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    foto_url: string | null;
    jumlah_dukungan: number;
    kondisi_sla: string | null;
    sla_tahap: string | null;
    sla_jatuh_tempo: string | null;
    dibuat_pada: string;
    tanggal_format: string;
}

interface DukunganItem {
    id: number;
    nomor_tiket: string;
    judul: string;
    keterangan: string;
    status: string;
    kategori_id: number | null;
    kategori_nama: string | null;
    instansi_id: number | null;
    instansi_nama: string | null;
    kelurahan_id: number | null;
    kecamatan_id: number | null;
    kota_id: number | null;
    wilayah_nama: string | null;
    kota_nama: string | null;
    foto_url: string | null;
    jumlah_dukungan: number;
    kondisi_sla: string | null;
    didukung_pada: string;
}

interface RiwayatProps {
    laporanList: LaporanItem[];
    dukunganList: DukunganItem[];
    masterFilter?: MasterFilterPeta;
}

function formatLokasiLengkap(
    wilayah: string | null,
    kota: string | null,
): string {
    const kotaStr = kota || 'Jabodetabek';
    if (!wilayah) return kotaStr;
    if (
        wilayah.toLowerCase().includes('kec.') ||
        wilayah.toLowerCase().includes('kecamatan')
    ) {
        return `${wilayah}, ${kotaStr}`;
    }
    const cleanKel = wilayah.replace(/^(kelurahan|kel\.)\s*/i, '');
    return `Kel. ${cleanKel}, ${kotaStr}`;
}

function formatRelativeSla(
    tahap: string | null,
    jatuhTempo: string | null,
): string | null {
    if (!jatuhTempo) return null;

    try {
        const cleanDateStr = jatuhTempo.replace(/, \d{2}:\d{2}/, '');
        const targetDate = new Date(cleanDateStr);
        if (isNaN(targetDate.getTime())) {
            return `Sisa ${jatuhTempo}`;
        }
        const now = new Date();
        const diffDays = Math.ceil(
            (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 0) {
            return `Lewat SLA (${Math.abs(diffDays)} hari)`;
        } else if (diffDays === 0) {
            return `Batas hari ini`;
        } else {
            return `Sisa ${String(diffDays).padStart(2, '0')} hari kerja`;
        }
    } catch {
        return `Sisa ${jatuhTempo}`;
    }
}

const ITEMS_PER_PAGE = 6;

function getPageNumbers(
    current: number,
    total: number,
): (number | 'ellipsis')[] {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
        return [1, 2, 3, 4, 'ellipsis', total];
    }
    if (current >= total - 2) {
        return [1, 'ellipsis', total - 3, total - 2, total - 1, total];
    }
    return [
        1,
        'ellipsis',
        current - 1,
        current,
        current + 1,
        'ellipsis',
        total,
    ];
}

interface PaginationBarProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    from: number;
    to: number;
    onPageChange: (newPage: number) => void;
    itemName?: string;
}

function PaginationBar({
    currentPage,
    totalPages,
    totalItems,
    from,
    to,
    onPageChange,
    itemName = 'laporan',
}: PaginationBarProps) {
    if (totalItems === 0 || totalPages <= 1) return null;

    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
            <p className="order-2 text-body-sm text-muted-foreground sm:order-1">
                Menampilkan{' '}
                <span className="font-semibold text-foreground">{from}</span>–
                <span className="font-semibold text-foreground">{to}</span> dari{' '}
                <span className="font-semibold text-foreground">
                    {totalItems}
                </span>{' '}
                {itemName}
            </p>

            <div className="order-1 flex items-center gap-1.5 sm:order-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-9 cursor-pointer gap-1 rounded-xl border-border bg-card px-3 text-body-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="size-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                <div className="flex items-center gap-1">
                    {pageNumbers.map((p, idx) => {
                        if (p === 'ellipsis') {
                            return (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="px-2 text-body-sm text-muted-foreground select-none"
                                >
                                    …
                                </span>
                            );
                        }

                        const isActive = p === currentPage;
                        return (
                            <button
                                key={`page-${p}`}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={cn(
                                    'flex size-9 cursor-pointer items-center justify-center rounded-xl text-body-sm font-semibold transition-all',
                                    isActive
                                        ? 'bg-foreground text-background shadow-xs'
                                        : 'border border-border bg-card text-foreground hover:bg-muted',
                                )}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-9 cursor-pointer gap-1 rounded-xl border-border bg-card px-3 text-body-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}

const STATUS_OPTIONS: Array<{ value: string; label: string; grup: string }> = [
    // Tahap Penanganan
    {
        value: 'PERLU_ROUTING',
        label: 'Perlu Routing',
        grup: 'Tahap Penanganan',
    },
    {
        value: 'DITERUSKAN',
        label: 'Diteruskan ke Dinas',
        grup: 'Tahap Penanganan',
    },
    { value: 'DITERIMA', label: 'Diterima Dinas', grup: 'Tahap Penanganan' },
    { value: 'DISURVEI', label: 'Selesai Survei', grup: 'Tahap Penanganan' },
    {
        value: 'TERJADWAL_ANGGARAN',
        label: 'Terjadwal Anggaran',
        grup: 'Tahap Penanganan',
    },
    {
        value: 'DIKERJAKAN',
        label: 'Sedang Dikerjakan',
        grup: 'Tahap Penanganan',
    },
    // Verifikasi & Arbitrase
    {
        value: 'MENUNGGU_VERIFIKASI',
        label: 'Menunggu Verifikasi Warga',
        grup: 'Verifikasi & Sengketa',
    },
    {
        value: 'DISENGKETAKAN',
        label: 'Disengketakan',
        grup: 'Verifikasi & Sengketa',
    },
    {
        value: 'MENUNGGU_KEPUTUSAN_AUDITOR',
        label: 'Menunggu Keputusan Auditor',
        grup: 'Verifikasi & Sengketa',
    },
    {
        value: 'USULAN_TOLAK',
        label: 'Usulan Penolakan',
        grup: 'Verifikasi & Sengketa',
    },
    // Selesai & Tutup
    {
        value: 'TERTUTUP_WARGA',
        label: 'Ditutup Warga',
        grup: 'Selesai & Tutup',
    },
    {
        value: 'TERTUTUP_AUDITOR',
        label: 'Ditutup Auditor',
        grup: 'Selesai & Tutup',
    },
    { value: 'DITOLAK', label: 'Ditolak', grup: 'Selesai & Tutup' },
];

const KONDISI_SLA_OPTIONS: Array<{ value: KondisiSla; label: string }> = [
    { value: 'dalam_sla', label: 'Dalam SLA (Aman)' },
    { value: 'hampir_lewat', label: 'Hampir Lewat (Kritis)' },
    { value: 'lewat_sla', label: 'Lewat Batas SLA (Terlambat)' },
];

const DEFAULT_MASTER_FILTER: MasterFilterPeta = {
    kategori: [],
    kecamatan: [],
    kota: [],
    status: [],
    instansi: [],
    statistik: {
        total_laporan: 0,
        laporan_aktif: 0,
        laporan_selesai: 0,
    },
};

export default function RiwayatLaporanPage({
    laporanList = [],
    dukunganList = [],
    masterFilter = DEFAULT_MASTER_FILTER,
}: RiwayatProps) {
    const [activeTab, setActiveTab] = useState<'laporan' | 'dukungan'>(
        'laporan',
    );
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('semua');
    const [lokasiFilter, setLokasiFilter] = useState<string>('semua');
    const [kategoriFilter, setKategoriFilter] = useState<string>('semua');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Pagination State (6 per page)
    const [currentPageLaporan, setCurrentPageLaporan] = useState(1);
    const [currentPageDukungan, setCurrentPageDukungan] = useState(1);

    // Dukungan Action States
    const [submittingDukunganId, setSubmittingDukunganId] = useState<
        number | null
    >(null);
    const [localDukunganCounts, setLocalDukunganCounts] = useState<
        Record<number, number>
    >({});
    const [localSupportedIds, setLocalSupportedIds] = useState<Set<number>>(
        new Set(),
    );

    // Track which reports are supported by current user
    const initialSupportedIds = useMemo(() => {
        return new Set(dukunganList.map((d) => d.id));
    }, [dukunganList]);

    const isReportSupported = (id: number) => {
        return localSupportedIds.has(id) || initialSupportedIds.has(id);
    };

    const getDukunganCount = (id: number, fallback: number) => {
        return localDukunganCounts[id] ?? fallback;
    };

    const handleDukung = async (
        e: React.MouseEvent,
        laporanId: number,
        nomorTiket: string,
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (isReportSupported(laporanId)) {
            toast.info(
                'Sudah Didukung',
                `Anda sudah memberikan dukungan untuk laporan ${nomorTiket}.`,
            );
            return;
        }

        setSubmittingDukunganId(laporanId);
        try {
            const res = await fetch('/warga/lapor/dukung', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify({ laporan_id: laporanId }),
            });

            const data = await res.json();
            if (res.ok && data.sukses) {
                setLocalSupportedIds((prev) => new Set([...prev, laporanId]));
                setLocalDukunganCounts((prev) => ({
                    ...prev,
                    [laporanId]:
                        data.total_dukungan ?? (prev[laporanId] ?? 0) + 1,
                }));
                toast.success('Dukungan Dicatat', data.pesan);
                router.reload({ only: ['laporanList', 'dukunganList'] });
            } else {
                toast.error(
                    'Gagal Memberikan Dukungan',
                    data.pesan || 'Laporan tidak dapat menerima dukungan lagi.',
                );
            }
        } catch {
            toast.error(
                'Gagal Menghubungi Server',
                'Periksa koneksi Anda dan coba lagi.',
            );
        } finally {
            setSubmittingDukunganId(null);
        }
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSearchQuery(searchInput);
        setCurrentPageLaporan(1);
        setCurrentPageDukungan(1);
    };

    const handleResetFilter = () => {
        setSearchInput('');
        setSearchQuery('');
        setStatusFilter('semua');
        setLokasiFilter('semua');
        setKategoriFilter('semua');
        setCurrentPageLaporan(1);
        setCurrentPageDukungan(1);
    };

    const activeDropdownFilterCount =
        (statusFilter !== 'semua' ? 1 : 0) +
        (lokasiFilter !== 'semua' ? 1 : 0) +
        (kategoriFilter !== 'semua' ? 1 : 0);

    const isFilterActive =
        searchQuery.trim() !== '' || activeDropdownFilterCount > 0;

    // 1. Opsi Status untuk Searchable Dropdown (Fase Siklus Hidup & Batas Waktu SLA)
    const statusDropdownOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Status' },
        ];

        for (const s of STATUS_OPTIONS) {
            opts.push({
                value: s.value,
                label: s.label,
                group: s.grup,
            });
        }

        for (const sla of KONDISI_SLA_OPTIONS) {
            opts.push({
                value: `sla:${sla.value}`,
                label: sla.label,
                group: 'Batas Waktu SLA',
            });
        }

        return opts;
    }, []);

    // 2. Opsi Wilayah / Lokasi untuk Searchable Dropdown (Kota & Kecamatan)
    const locationDropdownOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Lokasi' },
        ];

        const kotaList = masterFilter?.kota ?? [];
        const kecList = masterFilter?.kecamatan ?? [];

        for (const kota of kotaList) {
            opts.push({
                value: `kota:${kota.id}`,
                label: kota.nama,
                group: kota.nama,
                sublabel: `Seluruh ${kota.nama}`,
            });

            const kAnak = kecList.filter((k) => k.induk_id === kota.id);
            for (const kec of kAnak) {
                opts.push({
                    value: `kec:${kec.id}`,
                    label: `Kec. ${kec.nama}`,
                    group: kota.nama,
                    sublabel: kota.nama,
                });
            }
        }

        const orphanKec = kecList.filter(
            (k) =>
                !k.induk_id || !kotaList.some((kota) => kota.id === k.induk_id),
        );
        for (const kec of orphanKec) {
            opts.push({
                value: `kec:${kec.id}`,
                label: `Kec. ${kec.nama}`,
                group: kec.kota_nama || 'Wilayah Lainnya',
            });
        }

        // Fallback untuk kelurahan / wilayah unik yang ada di riwayat pelapor
        const existingLabels = new Set(opts.map((o) => o.label.toLowerCase()));
        [...laporanList, ...dukunganList].forEach((item) => {
            if (
                item.wilayah_nama &&
                !existingLabels.has(item.wilayah_nama.toLowerCase())
            ) {
                opts.push({
                    value: item.wilayah_nama,
                    label: item.wilayah_nama,
                    group: item.kota_nama || 'Wilayah Lainnya',
                });
                existingLabels.add(item.wilayah_nama.toLowerCase());
            }
        });

        return opts;
    }, [
        masterFilter?.kota,
        masterFilter?.kecamatan,
        laporanList,
        dukunganList,
    ]);

    // 3. Opsi Kategori untuk Searchable Dropdown
    const kategoriDropdownOptions = useMemo<DropdownFilterOption[]>(() => {
        const opts: DropdownFilterOption[] = [
            { value: 'semua', label: 'Semua Kategori' },
        ];

        for (const kat of masterFilter?.kategori ?? []) {
            opts.push({
                value: String(kat.id),
                label: kat.nama,
            });
        }

        const existingValues = new Set(opts.map((o) => o.value));
        [...laporanList, ...dukunganList].forEach((item) => {
            if (item.kategori_nama && !existingValues.has(item.kategori_nama)) {
                opts.push({
                    value: item.kategori_nama,
                    label: item.kategori_nama,
                });
                existingValues.add(item.kategori_nama);
            }
        });

        return opts;
    }, [masterFilter?.kategori, laporanList, dukunganList]);

    // Active Filter Label Resolvers
    const activeStatusLabel = useMemo(() => {
        if (!statusFilter || statusFilter === 'semua') return null;
        if (statusFilter.startsWith('sla:')) {
            const slaVal = statusFilter.replace('sla:', '');
            return (
                KONDISI_SLA_OPTIONS.find((s) => s.value === slaVal)?.label ??
                statusFilter
            );
        }
        return (
            STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ??
            INSTANSI_STATUS[statusFilter]?.label ??
            statusFilter
        );
    }, [statusFilter]);

    const activeLocationLabel = useMemo(() => {
        if (!lokasiFilter || lokasiFilter === 'semua') return null;
        if (lokasiFilter.startsWith('kota:')) {
            const id = Number(lokasiFilter.replace('kota:', ''));
            return masterFilter?.kota?.find((k) => k.id === id)?.nama ?? 'Kota';
        }
        if (lokasiFilter.startsWith('kec:')) {
            const id = Number(lokasiFilter.replace('kec:', ''));
            const kec = masterFilter?.kecamatan?.find((k) => k.id === id);
            return kec ? `Kec. ${kec.nama}` : 'Kecamatan';
        }
        return lokasiFilter;
    }, [lokasiFilter, masterFilter?.kota, masterFilter?.kecamatan]);

    const activeKategoriLabel = useMemo(() => {
        if (!kategoriFilter || kategoriFilter === 'semua') return null;
        const kat = masterFilter?.kategori?.find(
            (k) => String(k.id) === kategoriFilter,
        );
        return kat ? kat.nama : kategoriFilter;
    }, [kategoriFilter, masterFilter?.kategori]);

    const filteredLaporan = useMemo(() => {
        return laporanList.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTicket = item.nomor_tiket.toLowerCase().includes(q);
                const matchJudul = item.judul.toLowerCase().includes(q);
                const matchKategori = item.kategori_nama
                    ?.toLowerCase()
                    .includes(q);
                const matchWilayah = item.wilayah_nama
                    ?.toLowerCase()
                    .includes(q);
                if (
                    !matchTicket &&
                    !matchJudul &&
                    !matchKategori &&
                    !matchWilayah
                ) {
                    return false;
                }
            }
            if (statusFilter !== 'semua') {
                if (statusFilter.startsWith('sla:')) {
                    const slaVal = statusFilter.replace('sla:', '');
                    if (item.kondisi_sla !== slaVal) return false;
                } else if (item.status !== statusFilter) {
                    return false;
                }
            }
            if (lokasiFilter !== 'semua') {
                if (lokasiFilter.startsWith('kota:')) {
                    const kotaId = Number(lokasiFilter.replace('kota:', ''));
                    if (item.kota_id !== kotaId) return false;
                } else if (lokasiFilter.startsWith('kec:')) {
                    const kecId = Number(lokasiFilter.replace('kec:', ''));
                    if (item.kecamatan_id !== kecId) return false;
                } else if (item.wilayah_nama !== lokasiFilter) {
                    return false;
                }
            }
            if (kategoriFilter !== 'semua') {
                if (
                    String(item.kategori_id) !== kategoriFilter &&
                    item.kategori_nama !== kategoriFilter
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [laporanList, searchQuery, statusFilter, lokasiFilter, kategoriFilter]);

    const filteredDukungan = useMemo(() => {
        return dukunganList.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTicket = item.nomor_tiket.toLowerCase().includes(q);
                const matchJudul = item.judul.toLowerCase().includes(q);
                const matchKategori = item.kategori_nama
                    ?.toLowerCase()
                    .includes(q);
                const matchWilayah = item.wilayah_nama
                    ?.toLowerCase()
                    .includes(q);
                if (
                    !matchTicket &&
                    !matchJudul &&
                    !matchKategori &&
                    !matchWilayah
                ) {
                    return false;
                }
            }
            if (statusFilter !== 'semua') {
                if (statusFilter.startsWith('sla:')) {
                    const slaVal = statusFilter.replace('sla:', '');
                    if (item.kondisi_sla !== slaVal) return false;
                } else if (item.status !== statusFilter) {
                    return false;
                }
            }
            if (lokasiFilter !== 'semua') {
                if (lokasiFilter.startsWith('kota:')) {
                    const kotaId = Number(lokasiFilter.replace('kota:', ''));
                    if (item.kota_id !== kotaId) return false;
                } else if (lokasiFilter.startsWith('kec:')) {
                    const kecId = Number(lokasiFilter.replace('kec:', ''));
                    if (item.kecamatan_id !== kecId) return false;
                } else if (item.wilayah_nama !== lokasiFilter) {
                    return false;
                }
            }
            if (kategoriFilter !== 'semua') {
                if (
                    String(item.kategori_id) !== kategoriFilter &&
                    item.kategori_nama !== kategoriFilter
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [dukunganList, searchQuery, statusFilter, lokasiFilter, kategoriFilter]);

    // Pagination Slices & Values (6 per page)
    const totalPagesLaporan = Math.max(
        1,
        Math.ceil(filteredLaporan.length / ITEMS_PER_PAGE),
    );
    const paginatedLaporan = useMemo(() => {
        const start = (currentPageLaporan - 1) * ITEMS_PER_PAGE;
        return filteredLaporan.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLaporan, currentPageLaporan]);

    const fromLaporan =
        filteredLaporan.length === 0
            ? 0
            : (currentPageLaporan - 1) * ITEMS_PER_PAGE + 1;
    const toLaporan = Math.min(
        filteredLaporan.length,
        currentPageLaporan * ITEMS_PER_PAGE,
    );

    const totalPagesDukungan = Math.max(
        1,
        Math.ceil(filteredDukungan.length / ITEMS_PER_PAGE),
    );
    const paginatedDukungan = useMemo(() => {
        const start = (currentPageDukungan - 1) * ITEMS_PER_PAGE;
        return filteredDukungan.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredDukungan, currentPageDukungan]);

    const fromDukungan =
        filteredDukungan.length === 0
            ? 0
            : (currentPageDukungan - 1) * ITEMS_PER_PAGE + 1;
    const toDukungan = Math.min(
        filteredDukungan.length,
        currentPageDukungan * ITEMS_PER_PAGE,
    );

    const handlePageChange = (
        type: 'laporan' | 'dukungan',
        newPage: number,
    ) => {
        if (type === 'laporan') {
            setCurrentPageLaporan(newPage);
        } else {
            setCurrentPageDukungan(newPage);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <InternalLayout
            title="Riwayat Laporan"
            breadcrumb="Warga > Riwayat Laporan"
        >
            <div className="relative mx-auto w-full max-w-7xl space-y-6 pb-28">
                <Head title="Riwayat Laporan - Jagains" />

                {/* Bar Pencarian Sesuai Wireframe & Explorasi (Input Lebar + Tombol Hitam Cari Laporan) */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex w-full items-center gap-3"
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Jalan berlubang..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-12 w-full rounded-2xl border-border/80 bg-card pr-4 pl-11 text-body-base shadow-xs focus-visible:ring-1 focus-visible:ring-foreground"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="h-12 shrink-0 cursor-pointer rounded-2xl bg-foreground px-6 text-body-sm font-semibold text-background shadow-xs hover:bg-foreground/90"
                    >
                        Cari Laporan
                    </Button>
                </form>

                {/* 3. Baris Filter Sesuai Explorasi Peta Warga */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant={
                                isFilterOpen || activeDropdownFilterCount > 0
                                    ? 'secondary'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => setIsFilterOpen((prev) => !prev)}
                            className={cn(
                                'h-9 cursor-pointer gap-1.5 rounded-full px-4 text-caption-xs font-semibold shadow-none transition-colors sm:text-body-sm',
                                (isFilterOpen ||
                                    activeDropdownFilterCount > 0) &&
                                    'border-border bg-muted text-foreground',
                            )}
                            aria-expanded={isFilterOpen}
                        >
                            <Filter className="size-3.5 text-muted-foreground" />
                            <span>Filter</span>
                            {activeDropdownFilterCount > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {activeDropdownFilterCount}
                                </span>
                            )}
                            <ChevronDown
                                className={cn(
                                    'size-3.5 text-muted-foreground transition-transform duration-200',
                                    isFilterOpen &&
                                        'rotate-180 text-foreground',
                                )}
                            />
                        </Button>

                        {/* Reset Semua Filter */}
                        {isFilterActive && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilter}
                                className="h-9 cursor-pointer gap-1.5 rounded-full text-caption-xs text-muted-foreground hover:text-foreground"
                                title="Reset Semua Filter"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>Reset Semua</span>
                            </Button>
                        )}
                    </div>

                    {/* Active Filter Chips / Pills */}
                    {isFilterActive && (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {searchQuery.trim() !== '' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-caption-xs text-foreground">
                                    <Search className="size-3 text-muted-foreground" />
                                    <span className="max-w-[150px] truncate">
                                        "{searchQuery}"
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchInput('');
                                            setSearchQuery('');
                                            setCurrentPageLaporan(1);
                                            setCurrentPageDukungan(1);
                                        }}
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {activeStatusLabel && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-caption-xs font-medium text-primary">
                                    <Activity className="size-3" />
                                    <span className="max-w-[180px] truncate">
                                        {activeStatusLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter('semua');
                                            setCurrentPageLaporan(1);
                                            setCurrentPageDukungan(1);
                                        }}
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter status"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {activeLocationLabel && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-caption-xs text-foreground">
                                    <MapPin className="size-3 text-muted-foreground" />
                                    <span className="max-w-[180px] truncate">
                                        {activeLocationLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLokasiFilter('semua');
                                            setCurrentPageLaporan(1);
                                            setCurrentPageDukungan(1);
                                        }}
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter lokasi"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {activeKategoriLabel && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-caption-xs text-foreground">
                                    <Tag className="size-3 text-muted-foreground" />
                                    <span className="max-w-[180px] truncate">
                                        {activeKategoriLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setKategoriFilter('semua');
                                            setCurrentPageLaporan(1);
                                            setCurrentPageDukungan(1);
                                        }}
                                        className="ml-0.5 cursor-pointer hover:text-destructive"
                                        aria-label="Hapus filter kategori"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* 3 Select Dropdowns (Searchable Combobox Sesuai Explorasi Peta) */}
                    {isFilterOpen && (
                        <div className="grid animate-in grid-cols-1 gap-2.5 duration-150 fade-in-50 sm:grid-cols-3">
                            {/* 1. Status Dropdown */}
                            <SearchableFilterDropdown
                                value={statusFilter}
                                placeholder="Semua Status"
                                searchPlaceholder="Ketik status..."
                                options={statusDropdownOptions}
                                onSelect={(val) => {
                                    setStatusFilter(val ?? 'semua');
                                    setCurrentPageLaporan(1);
                                    setCurrentPageDukungan(1);
                                }}
                                align="start"
                            />

                            {/* 2. Lokasi Dropdown */}
                            <SearchableFilterDropdown
                                value={lokasiFilter}
                                placeholder="Semua Lokasi"
                                searchPlaceholder="Ketik kota / kecamatan..."
                                options={locationDropdownOptions}
                                onSelect={(val) => {
                                    setLokasiFilter(val ?? 'semua');
                                    setCurrentPageLaporan(1);
                                    setCurrentPageDukungan(1);
                                }}
                                align="center"
                            />

                            {/* 3. Kategori Dropdown */}
                            <SearchableFilterDropdown
                                value={kategoriFilter}
                                placeholder="Semua Kategori"
                                searchPlaceholder="Ketik kategori..."
                                options={kategoriDropdownOptions}
                                onSelect={(val) => {
                                    setKategoriFilter(val ?? 'semua');
                                    setCurrentPageLaporan(1);
                                    setCurrentPageDukungan(1);
                                }}
                                align="end"
                            />
                        </div>
                    )}
                </div>

                {/* 4. Segmented Control Tabs Sesuai Wireframe */}
                <div className="w-full rounded-2xl border border-border/40 bg-muted/60 p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('laporan')}
                            className={cn(
                                'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-body-sm font-semibold transition-all',
                                activeTab === 'laporan'
                                    ? 'bg-card text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
                            )}
                        >
                            <span>Laporan Saya</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-caption-xs font-semibold">
                                {laporanList.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('dukungan')}
                            className={cn(
                                'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-body-sm font-semibold transition-all',
                                activeTab === 'dukungan'
                                    ? 'bg-card text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
                            )}
                        >
                            <span>Laporan yang Didukung</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-caption-xs font-semibold">
                                {dukunganList.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 5. Konten Tab 1: Laporan Saya */}
                {activeTab === 'laporan' && (
                    <div>
                        {filteredLaporan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <FileText className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-body-medium font-display font-semibold text-foreground">
                                        {isFilterActive
                                            ? 'Tidak ada laporan yang sesuai kriteria filter'
                                            : 'Belum Ada Laporan yang Diajukan'}
                                    </h3>
                                    <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                        {isFilterActive
                                            ? 'Coba sesuaikan kata kunci pencarian atau reset filter aktif.'
                                            : 'Anda belum mengirimkan laporan fasilitas publik. Buat laporan kerusakan jalan, lampu penerangan, atau saluran air di sekitar Anda.'}
                                    </p>
                                </div>
                                {isFilterActive ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetFilter}
                                        className="rounded-xl border-border text-caption-xs font-semibold"
                                    >
                                        Reset Semua Filter
                                    </Button>
                                ) : (
                                    <Link
                                        href="/warga/lapor"
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-body-sm font-semibold text-background shadow-xs hover:bg-foreground/90"
                                    >
                                        <Plus className="size-4" />
                                        Buat Laporan Sekarang
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Card Grid 2 Kolom Sesuai Wireframe (6 Per Halaman) */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {paginatedLaporan.map((laporan) => {
                                        const isSupported = isReportSupported(
                                            laporan.id,
                                        );
                                        const currentCount = getDukunganCount(
                                            laporan.id,
                                            laporan.jumlah_dukungan,
                                        );
                                        const slaText = formatRelativeSla(
                                            laporan.sla_tahap,
                                            laporan.sla_jatuh_tempo,
                                        );

                                        return (
                                            <div
                                                key={laporan.id}
                                                onClick={() =>
                                                    router.visit(
                                                        `/tiket/${encodeURIComponent(laporan.nomor_tiket)}`,
                                                    )
                                                }
                                                className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-foreground/30 hover:shadow-md"
                                            >
                                                <div>
                                                    {/* Foto Laporan (Top Half) */}
                                                    <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-black">
                                                        {laporan.foto_url ? (
                                                            <img
                                                                src={
                                                                    laporan.foto_url
                                                                }
                                                                alt={
                                                                    laporan.judul
                                                                }
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    (
                                                                        e.target as HTMLElement
                                                                    ).style.display =
                                                                        'none';
                                                                    const fallback =
                                                                        (
                                                                            e.target as HTMLElement
                                                                        )
                                                                            .nextElementSibling as HTMLElement;
                                                                    if (
                                                                        fallback
                                                                    )
                                                                        fallback.style.display =
                                                                            'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div
                                                            className={cn(
                                                                'size-full flex-col items-center justify-center gap-2 bg-zinc-900 text-body-base font-semibold text-zinc-300',
                                                                laporan.foto_url
                                                                    ? 'hidden'
                                                                    : 'flex',
                                                            )}
                                                        >
                                                            <ImageIcon className="size-8 text-zinc-500" />
                                                            <span>
                                                                Foto Laporan
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Informasi Laporan (Bottom Half) */}
                                                    <div className="space-y-3 p-5 sm:p-6">
                                                        {/* Status Badge */}
                                                        <div>
                                                            <InstansiStatusBadge
                                                                status={
                                                                    laporan.status
                                                                }
                                                            />
                                                        </div>

                                                        {/* Judul Laporan */}
                                                        <h3 className="line-clamp-2 text-body-lg font-display leading-snug font-bold text-foreground transition-colors group-hover:text-primary sm:text-title-sm">
                                                            {laporan.judul}
                                                        </h3>

                                                        {/* Kategori Fasilitas */}
                                                        <div className="flex items-center gap-2 text-body-sm font-medium text-foreground/80">
                                                            <Wrench className="size-4 shrink-0 text-muted-foreground" />
                                                            <span>
                                                                {laporan.kategori_nama ||
                                                                    'Fasilitas Umum'}
                                                            </span>
                                                        </div>

                                                        {/* Lokasi */}
                                                        <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                                                            <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                                            <span className="truncate">
                                                                {formatLokasiLengkap(
                                                                    laporan.wilayah_nama,
                                                                    laporan.kota_nama,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Kartu Sesuai Wireframe */}
                                                <div className="p-5 pt-0 sm:p-6">
                                                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-body-sm font-medium">
                                                        <span className="text-caption-xs text-muted-foreground sm:text-body-sm">
                                                            {slaText ||
                                                                'Selesai'}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDukung(
                                                                    e,
                                                                    laporan.id,
                                                                    laporan.nomor_tiket,
                                                                );
                                                            }}
                                                            className={cn(
                                                                'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors',
                                                                isSupported
                                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                            )}
                                                            title="Dukung Laporan Ini"
                                                        >
                                                            <ThumbsUp className="size-4" />
                                                            <span>
                                                                {String(
                                                                    currentCount,
                                                                ).padStart(
                                                                    2,
                                                                    '0',
                                                                )}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination 6 Per Halaman */}
                                <PaginationBar
                                    currentPage={currentPageLaporan}
                                    totalPages={totalPagesLaporan}
                                    totalItems={filteredLaporan.length}
                                    from={fromLaporan}
                                    to={toLaporan}
                                    onPageChange={(p) =>
                                        handlePageChange('laporan', p)
                                    }
                                    itemName="laporan"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 6. Konten Tab 2: Laporan yang Didukung */}
                {activeTab === 'dukungan' && (
                    <div>
                        {filteredDukungan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <ThumbsUp className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-body-medium font-display font-semibold text-foreground">
                                        {isFilterActive
                                            ? 'Tidak ada dukungan yang sesuai kriteria filter'
                                            : 'Belum Ada Laporan yang Didukung'}
                                    </h3>
                                    <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                                        {isFilterActive
                                            ? 'Coba sesuaikan kata kunci pencarian atau reset filter aktif.'
                                            : 'Saat Anda melihat kerusakan di fasilitas sekitar yang dilaporkan warga lain, Anda dapat memberikan dukungan untuk mempercepat prioritas penanganan dinas.'}
                                    </p>
                                </div>
                                {isFilterActive && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetFilter}
                                        className="rounded-xl border-border text-caption-xs font-semibold"
                                    >
                                        Reset Semua Filter
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Card Grid 2 Kolom untuk Laporan yang Didukung (6 Per Halaman) */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {paginatedDukungan.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() =>
                                                router.visit(
                                                    `/tiket/${encodeURIComponent(item.nomor_tiket)}`,
                                                )
                                            }
                                            className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-foreground/30 hover:shadow-md"
                                        >
                                            <div>
                                                {/* Foto Laporan (Top Half) */}
                                                <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-black">
                                                    {item.foto_url ? (
                                                        <img
                                                            src={item.foto_url}
                                                            alt={item.judul}
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            onError={(e) => {
                                                                (
                                                                    e.target as HTMLElement
                                                                ).style.display =
                                                                    'none';
                                                                const fallback =
                                                                    (
                                                                        e.target as HTMLElement
                                                                    )
                                                                        .nextElementSibling as HTMLElement;
                                                                if (fallback)
                                                                    fallback.style.display =
                                                                        'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={cn(
                                                            'size-full flex-col items-center justify-center gap-2 bg-zinc-900 text-body-base font-semibold text-zinc-300',
                                                            item.foto_url
                                                                ? 'hidden'
                                                                : 'flex',
                                                        )}
                                                    >
                                                        <ImageIcon className="size-8 text-zinc-500" />
                                                        <span>
                                                            Foto Laporan
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Informasi Laporan (Bottom Half) */}
                                                <div className="space-y-3 p-5 sm:p-6">
                                                    {/* Status Badge */}
                                                    <div>
                                                        <InstansiStatusBadge
                                                            status={item.status}
                                                        />
                                                    </div>

                                                    {/* Judul Laporan */}
                                                    <h3 className="line-clamp-2 text-body-lg font-display leading-snug font-bold text-foreground transition-colors group-hover:text-primary sm:text-title-sm">
                                                        {item.judul}
                                                    </h3>

                                                    {/* Kategori Fasilitas */}
                                                    <div className="flex items-center gap-2 text-body-sm font-medium text-foreground/80">
                                                        <Wrench className="size-4 shrink-0 text-muted-foreground" />
                                                        <span>
                                                            {item.kategori_nama ||
                                                                'Fasilitas Umum'}
                                                        </span>
                                                    </div>

                                                    {/* Lokasi */}
                                                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                                                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {formatLokasiLengkap(
                                                                item.wilayah_nama,
                                                                item.kota_nama,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Kartu */}
                                            <div className="p-5 pt-0 sm:p-6">
                                                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-body-sm font-medium">
                                                    <span className="text-caption-xs text-muted-foreground sm:text-body-sm">
                                                        Didukung{' '}
                                                        {item.didukung_pada}
                                                    </span>

                                                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                                                        <ThumbsUp className="size-4 text-primary" />
                                                        <span>
                                                            {String(
                                                                item.jumlah_dukungan,
                                                            ).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination 6 Per Halaman */}
                                <PaginationBar
                                    currentPage={currentPageDukungan}
                                    totalPages={totalPagesDukungan}
                                    totalItems={filteredDukungan.length}
                                    from={fromDukungan}
                                    to={toDukungan}
                                    onPageChange={(p) =>
                                        handlePageChange('dukungan', p)
                                    }
                                    itemName="dukungan"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 7. Floating Action Button (FAB) Kanan Bawah Sesuai Wireframe */}
                <Link
                    href="/warga/lapor"
                    className="fixed right-6 bottom-6 z-40 flex cursor-pointer items-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-body-sm font-semibold text-background shadow-xl transition-all hover:scale-105 hover:bg-foreground/90 active:scale-95"
                    aria-label="Tambah Laporan Baru"
                >
                    <Plus className="size-4" />
                    <span>Tambah Laporan</span>
                </Link>
            </div>
        </InternalLayout>
    );
}
