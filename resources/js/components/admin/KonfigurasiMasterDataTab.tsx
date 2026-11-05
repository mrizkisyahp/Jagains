import { type FormEvent, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Building2,
    Edit2,
    Layers,
    MapPin,
    Plus,
    Search,
    X,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export interface InstansiRow {
    id: number;
    nama: string;
    singkatan: string;
    wilayah_id: number;
    aktif: boolean;
    wilayah?: {
        id: number;
        nama: string;
    } | null;
}

export interface KategoriRow {
    id: number;
    nama: string;
    radius_gabung_m?: number;
    deskripsi?: string | null;
    aktif: boolean;
}

export interface WilayahRow {
    id: number;
    induk_id?: number | null;
    nama: string;
    kode_bps?: string | null;
    kode?: string;
    tingkat: string;
    induk?: {
        id: number;
        nama: string;
    } | null;
    jumlah_pemilih?: number | null;
}

interface KonfigurasiMasterDataTabProps {
    masterInstansi: InstansiRow[];
    masterKategori: KategoriRow[];
    masterWilayah: WilayahRow[];
}

export default function KonfigurasiMasterDataTab({
    masterInstansi,
    masterKategori,
    masterWilayah,
}: KonfigurasiMasterDataTabProps) {
    const [subTab, setSubTab] = useState<'instansi' | 'kategori' | 'wilayah'>(
        'instansi',
    );

    // State Instansi
    const [modalInstansiBuka, setModalInstansiBuka] = useState(false);
    const [editInstansiId, setEditInstansiId] = useState<number | null>(null);
    const [searchInstansi, setSearchInstansi] = useState('');
    const [filterStatusInstansi, setFilterStatusInstansi] = useState('semua');
    const [pageInstansi, setPageInstansi] = useState(1);

    // State Kategori
    const [modalKategoriBuka, setModalKategoriBuka] = useState(false);
    const [editKategoriId, setEditKategoriId] = useState<number | null>(null);
    const [searchKategori, setSearchKategori] = useState('');
    const [filterStatusKategori, setFilterStatusKategori] = useState('semua');
    const [pageKategori, setPageKategori] = useState(1);

    // State Wilayah
    const [modalWilayahBuka, setModalWilayahBuka] = useState(false);
    const [editWilayahId, setEditWilayahId] = useState<number | null>(null);
    const [searchWilayah, setSearchWilayah] = useState('');
    const [filterTingkatWilayah, setFilterTingkatWilayah] = useState('semua');
    const [pageWilayah, setPageWilayah] = useState(1);
    const PAGE_SIZE = 10;

    // Form Instansi
    const formInstansi = useForm({
        nama: '',
        singkatan: '',
        wilayah_id: masterWilayah[0]?.id || 1,
        aktif: true,
    });

    // Form Kategori
    const formKategori = useForm({
        nama: '',
        radius_gabung_m: 25,
        aktif: true,
    });

    // Form Wilayah
    const formWilayah = useForm({
        tingkat: 'kelurahan',
        nama: '',
        kode_bps: '',
        induk_id: '',
    });

    // Instansi Handlers
    const bukaTambahInstansi = () => {
        setEditInstansiId(null);
        formInstansi.setData({
            nama: '',
            singkatan: '',
            wilayah_id: masterWilayah[0]?.id || 1,
            aktif: true,
        });
        formInstansi.clearErrors();
        setModalInstansiBuka(true);
    };

    const bukaEditInstansi = (ins: InstansiRow) => {
        setEditInstansiId(ins.id);
        formInstansi.setData({
            nama: ins.nama,
            singkatan: ins.singkatan,
            wilayah_id: ins.wilayah_id,
            aktif: ins.aktif,
        });
        formInstansi.clearErrors();
        setModalInstansiBuka(true);
    };

    const simpanInstansi = (e: FormEvent) => {
        e.preventDefault();
        if (editInstansiId) {
            formInstansi.put(`/admin/konfigurasi/instansi/${editInstansiId}`, {
                onSuccess: () => setModalInstansiBuka(false),
            });
        } else {
            formInstansi.post('/admin/konfigurasi/instansi', {
                onSuccess: () => setModalInstansiBuka(false),
            });
        }
    };

    // Kategori Handlers
    const bukaTambahKategori = () => {
        setEditKategoriId(null);
        formKategori.setData({
            nama: '',
            radius_gabung_m: 25,
            aktif: true,
        });
        formKategori.clearErrors();
        setModalKategoriBuka(true);
    };

    const bukaEditKategori = (kat: KategoriRow) => {
        setEditKategoriId(kat.id);
        formKategori.setData({
            nama: kat.nama,
            radius_gabung_m: kat.radius_gabung_m ?? 25,
            aktif: kat.aktif,
        });
        formKategori.clearErrors();
        setModalKategoriBuka(true);
    };

    const simpanKategori = (e: FormEvent) => {
        e.preventDefault();
        if (editKategoriId) {
            formKategori.put(`/admin/konfigurasi/kategori/${editKategoriId}`, {
                onSuccess: () => setModalKategoriBuka(false),
            });
        } else {
            formKategori.post('/admin/konfigurasi/kategori', {
                onSuccess: () => setModalKategoriBuka(false),
            });
        }
    };

    // Wilayah Handlers
    const bukaTambahWilayah = () => {
        setEditWilayahId(null);
        const kotaDefault =
            masterWilayah.find((w) => w.tingkat === 'kecamatan') ||
            masterWilayah[0];
        formWilayah.setData({
            tingkat: 'kelurahan',
            nama: '',
            kode_bps: '',
            induk_id: kotaDefault ? String(kotaDefault.id) : '',
        });
        formWilayah.clearErrors();
        setModalWilayahBuka(true);
    };

    const bukaEditWilayah = (wil: WilayahRow) => {
        setEditWilayahId(wil.id);
        formWilayah.setData({
            tingkat: wil.tingkat,
            nama: wil.nama,
            kode_bps: wil.kode_bps ?? '',
            induk_id: wil.induk_id ? String(wil.induk_id) : '',
        });
        formWilayah.clearErrors();
        setModalWilayahBuka(true);
    };

    const simpanWilayah = (e: FormEvent) => {
        e.preventDefault();
        if (editWilayahId) {
            formWilayah.put(`/admin/konfigurasi/wilayah/${editWilayahId}`, {
                onSuccess: () => setModalWilayahBuka(false),
            });
        } else {
            formWilayah.post('/admin/konfigurasi/wilayah', {
                onSuccess: () => setModalWilayahBuka(false),
            });
        }
    };

    // Filter & Paginasi Instansi
    const instansiTersaring = useMemo(() => {
        return masterInstansi.filter((ins) => {
            const matchSearch =
                !searchInstansi.trim() ||
                ins.nama
                    .toLowerCase()
                    .includes(searchInstansi.trim().toLowerCase()) ||
                ins.singkatan
                    .toLowerCase()
                    .includes(searchInstansi.trim().toLowerCase());
            const matchStatus =
                filterStatusInstansi === 'semua' ||
                (filterStatusInstansi === 'aktif' && ins.aktif) ||
                (filterStatusInstansi === 'nonaktif' && !ins.aktif);
            return matchSearch && matchStatus;
        });
    }, [masterInstansi, searchInstansi, filterStatusInstansi]);

    const paginatedInstansi = useMemo(() => {
        const start = (pageInstansi - 1) * PAGE_SIZE;
        return instansiTersaring.slice(start, start + PAGE_SIZE);
    }, [instansiTersaring, pageInstansi]);

    // Filter & Paginasi Kategori
    const kategoriTersaring = useMemo(() => {
        return masterKategori.filter((kat) => {
            const matchSearch =
                !searchKategori.trim() ||
                kat.nama
                    .toLowerCase()
                    .includes(searchKategori.trim().toLowerCase());
            const matchStatus =
                filterStatusKategori === 'semua' ||
                (filterStatusKategori === 'aktif' && kat.aktif) ||
                (filterStatusKategori === 'nonaktif' && !kat.aktif);
            return matchSearch && matchStatus;
        });
    }, [masterKategori, searchKategori, filterStatusKategori]);

    const paginatedKategori = useMemo(() => {
        const start = (pageKategori - 1) * PAGE_SIZE;
        return kategoriTersaring.slice(start, start + PAGE_SIZE);
    }, [kategoriTersaring, pageKategori]);

    // Filter & Paginasi Wilayah
    const wilayahTersaring = useMemo(() => {
        return masterWilayah.filter((wil) => {
            const cocokNama =
                !searchWilayah.trim() ||
                wil.nama
                    .toLowerCase()
                    .includes(searchWilayah.trim().toLowerCase()) ||
                (wil.kode_bps &&
                    wil.kode_bps
                        .toLowerCase()
                        .includes(searchWilayah.trim().toLowerCase()));
            const cocokTingkat =
                filterTingkatWilayah === 'semua' ||
                wil.tingkat === filterTingkatWilayah;
            return cocokNama && cocokTingkat;
        });
    }, [masterWilayah, searchWilayah, filterTingkatWilayah]);

    const paginatedWilayah = useMemo(() => {
        const start = (pageWilayah - 1) * PAGE_SIZE;
        return wilayahTersaring.slice(start, start + PAGE_SIZE);
    }, [wilayahTersaring, pageWilayah]);

    return (
        <div className="space-y-4">
            {/* Sub-tab Switcher */}
            <Tabs
                value={subTab}
                onValueChange={(val) => val && setSubTab(val as typeof subTab)}
                className="w-full"
            >
                <div className="w-full scrollbar-none overflow-x-auto pb-1">
                    <TabsList className="inline-flex w-max min-w-full justify-start bg-muted/50 p-1">
                        <TabsTrigger
                            value="instansi"
                            className="shrink-0 gap-1.5"
                        >
                            <Building2
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            <span>
                                Instansi Teknis ({masterInstansi.length})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="kategori"
                            className="shrink-0 gap-1.5"
                        >
                            <Layers className="size-3.5" aria-hidden="true" />
                            <span>
                                Kategori Kerusakan ({masterKategori.length})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="wilayah"
                            className="shrink-0 gap-1.5"
                        >
                            <MapPin className="size-3.5" aria-hidden="true" />
                            <span>
                                Wilayah Administratif ({masterWilayah.length})
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>

            {/* Sub-Tab 1: Instansi */}
            {subTab === 'instansi' && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-body-medium font-semibold text-foreground">
                                Daftar Instansi Teknis
                            </h4>
                            <p className="text-caption-xs text-muted-foreground">
                                Organisasi Perangkat Daerah (OPD) penanggung
                                jawab pekerjaan fisik di lapangan.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[200px] flex-1 sm:w-56">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari instansi atau singkatan..."
                                    value={searchInstansi}
                                    onChange={(e) => {
                                        setSearchInstansi(e.target.value);
                                        setPageInstansi(1);
                                    }}
                                    className="h-9 pr-8 pl-9 text-xs"
                                />
                                {searchInstansi && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchInstansi('');
                                            setPageInstansi(1);
                                        }}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <Select
                                value={filterStatusInstansi}
                                onValueChange={(val) => {
                                    setFilterStatusInstansi(val ?? 'semua');
                                    setPageInstansi(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[120px] text-xs">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="semua">
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem value="aktif">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="nonaktif">
                                            Nonaktif
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Button
                                size="sm"
                                variant="default"
                                onClick={bukaTambahInstansi}
                                title="Tambah Instansi"
                                aria-label="Tambah Instansi"
                            >
                                <Plus className="size-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">
                                    Tambah Instansi
                                </span>
                            </Button>
                        </div>
                    </div>

                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead className="font-semibold text-foreground">
                                    Singkatan
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    Nama Lengkap Instansi
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    Wilayah Induk
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    Status
                                </TableHead>
                                <TableHead className="text-right font-semibold text-foreground">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedInstansi.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center"
                                    >
                                        <AdminEmptyState
                                            icon={Building2}
                                            title="Instansi Tidak Ditemukan"
                                            description="Tidak ada data instansi yang cocok dengan filter pencarian."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedInstansi.map((ins) => (
                                    <TableRow
                                        key={ins.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <TableCell className="text-body-sm font-mono font-semibold text-foreground">
                                            {ins.singkatan}
                                        </TableCell>
                                        <TableCell className="text-body-sm font-medium text-foreground">
                                            {ins.nama}
                                        </TableCell>
                                        <TableCell className="text-caption-xs text-muted-foreground">
                                            {ins.wilayah?.nama || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    ins.aktif
                                                        ? 'sla-safe'
                                                        : 'closed'
                                                }
                                                className="text-caption-xs"
                                            >
                                                {ins.aktif
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    bukaEditInstansi(ins)
                                                }
                                                title={`Ubah data ${ins.nama}`}
                                                aria-label={`Ubah data ${ins.nama}`}
                                            >
                                                <Edit2
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span className="hidden sm:inline">
                                                    Ubah
                                                </span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <AdminTablePagination
                        currentPage={pageInstansi}
                        totalItems={instansiTersaring.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPageInstansi}
                        itemName="instansi"
                    />
                </div>
            )}

            {/* Sub-Tab 2: Kategori */}
            {subTab === 'kategori' && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-body-medium font-semibold text-foreground">
                                Daftar Kategori Kerusakan
                            </h4>
                            <p className="text-caption-xs text-muted-foreground">
                                Klasifikasi fasilitas publik dan batas radius
                                deteksi kemiripan/duplikasi aduan (meter).
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[200px] flex-1 sm:w-56">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari kategori kerusakan..."
                                    value={searchKategori}
                                    onChange={(e) => {
                                        setSearchKategori(e.target.value);
                                        setPageKategori(1);
                                    }}
                                    className="h-9 pr-8 pl-9 text-xs"
                                />
                                {searchKategori && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchKategori('');
                                            setPageKategori(1);
                                        }}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <Select
                                value={filterStatusKategori}
                                onValueChange={(val) => {
                                    setFilterStatusKategori(val ?? 'semua');
                                    setPageKategori(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[120px] text-xs">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="semua">
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem value="aktif">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="nonaktif">
                                            Nonaktif
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Button
                                size="sm"
                                variant="default"
                                onClick={bukaTambahKategori}
                                title="Tambah Kategori"
                                aria-label="Tambah Kategori"
                            >
                                <Plus className="size-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">
                                    Tambah Kategori
                                </span>
                            </Button>
                        </div>
                    </div>

                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead className="font-semibold text-foreground">
                                    ID
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    Nama Kategori Kerusakan
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    Radius Deteksi Duplikat
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    Status
                                </TableHead>
                                <TableHead className="text-right font-semibold text-foreground">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedKategori.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center"
                                    >
                                        <AdminEmptyState
                                            icon={Layers}
                                            title="Kategori Tidak Ditemukan"
                                            description="Tidak ada kategori kerusakan yang cocok dengan filter pencarian."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedKategori.map((kat) => (
                                    <TableRow
                                        key={kat.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <TableCell className="text-body-sm font-mono font-semibold text-foreground">
                                            #{kat.id}
                                        </TableCell>
                                        <TableCell className="text-body-sm font-medium text-foreground">
                                            {kat.nama}
                                        </TableCell>
                                        <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                            {kat.radius_gabung_m ?? 25} meter
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    kat.aktif
                                                        ? 'sla-safe'
                                                        : 'closed'
                                                }
                                                className="text-caption-xs"
                                            >
                                                {kat.aktif
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    bukaEditKategori(kat)
                                                }
                                                title={`Ubah data ${kat.nama}`}
                                                aria-label={`Ubah data ${kat.nama}`}
                                            >
                                                <Edit2
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span className="hidden sm:inline">
                                                    Ubah
                                                </span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <AdminTablePagination
                        currentPage={pageKategori}
                        totalItems={kategoriTersaring.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPageKategori}
                        itemName="kategori"
                    />
                </div>
            )}

            {/* Sub-Tab 3: Wilayah */}
            {subTab === 'wilayah' && (
                <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                       <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-body-medium font-semibold text-foreground">
                                Wilayah Administratif
                            </h4>
                            <p className="text-caption-xs text-muted-foreground">
                                Data wilayah administratif yang digunakan untuk
                                mengelompokkan aduan dan instansi teknis.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                            <div className="relative max-w-sm min-w-[200px] flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari kelurahan, kecamatan, BPS..."
                                    value={searchWilayah}
                                    onChange={(e) => {
                                        setSearchWilayah(e.target.value);
                                        setPageWilayah(1);
                                    }}
                                    className="h-9 pr-8 pl-9 text-xs"
                                />
                                {searchWilayah && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchWilayah('');
                                            setPageWilayah(1);
                                        }}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            <Select
                                value={filterTingkatWilayah}
                                onValueChange={(val) => {
                                    setFilterTingkatWilayah(val ?? 'semua');
                                    setPageWilayah(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <SelectValue placeholder="Tingkat Wilayah" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="semua">
                                            Semua Tingkat
                                        </SelectItem>
                                        <SelectItem value="kelurahan">
                                            Kelurahan
                                        </SelectItem>
                                        <SelectItem value="kecamatan">
                                            Kecamatan
                                        </SelectItem>
                                        <SelectItem value="kota">
                                            Kota
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={bukaTambahWilayah}
                            title="Tambah Wilayah"
                            aria-label="Tambah Wilayah"
                        >
                            <Plus className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">
                                Tambah Wilayah
                            </span>
                        </Button>
                    </div>
                    </div>
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="font-semibold text-foreground">
                                        Nama Wilayah
                                    </TableHead>
                                    <TableHead className="font-semibold text-foreground">
                                        Tingkat
                                    </TableHead>
                                    <TableHead className="font-semibold text-foreground">
                                        Kode BPS
                                    </TableHead>
                                    <TableHead className="font-semibold text-foreground">
                                        Wilayah Induk
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedWilayah.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-32 text-center"
                                        >
                                            <AdminEmptyState
                                                icon={MapPin}
                                                title="Wilayah Tidak Ditemukan"
                                                description="Tidak ada data wilayah yang cocok dengan filter pencarian."
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedWilayah.map((wil) => (
                                        <TableRow
                                            key={wil.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <TableCell className="text-body-sm font-semibold text-foreground">
                                                {wil.nama}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        wil.tingkat ===
                                                        'kelurahan'
                                                            ? 'outline'
                                                            : wil.tingkat ===
                                                                'kecamatan'
                                                              ? 'secondary'
                                                              : 'default'
                                                    }
                                                    className="text-caption-xs capitalize"
                                                >
                                                    {wil.tingkat}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                                {wil.kode_bps || '—'}
                                            </TableCell>
                                            <TableCell className="text-caption-xs text-muted-foreground">
                                                {wil.induk?.nama || '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        bukaEditWilayah(wil)
                                                    }
                                                    title={`Ubah data ${wil.nama}`}
                                                    aria-label={`Ubah data ${wil.nama}`}
                                                >
                                                    <Edit2
                                                        className="size-3 text-muted-foreground"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="hidden sm:inline">
                                                        Ubah
                                                    </span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <AdminTablePagination
                            currentPage={pageWilayah}
                            totalItems={wilayahTersaring.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPageWilayah}
                            itemName="wilayah"
                        />
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Instansi */}
            <Dialog
                open={modalInstansiBuka}
                onOpenChange={setModalInstansiBuka}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editInstansiId
                                ? 'Ubah Data Instansi'
                                : 'Tambah Instansi Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Organisasi Perangkat Daerah teknis penanggung jawab
                            tindak lanjut laporan fisik.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanInstansi} className="space-y-4 pt-1">
                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="ins-singkatan">
                                Singkatan OPD{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="ins-singkatan"
                                type="text"
                                value={formInstansi.data.singkatan}
                                onChange={(e) =>
                                    formInstansi.setData(
                                        'singkatan',
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: DISHUB, PUPR"
                                required
                            />
                            {formInstansi.errors.singkatan && (
                                <FieldError>
                                    {formInstansi.errors.singkatan}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="ins-nama">
                                Nama Lengkap Instansi{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="ins-nama"
                                type="text"
                                value={formInstansi.data.nama}
                                onChange={(e) =>
                                    formInstansi.setData('nama', e.target.value)
                                }
                                placeholder="Contoh: Dinas Perhubungan Kota Depok"
                                required
                            />
                            {formInstansi.errors.nama && (
                                <FieldError>
                                    {formInstansi.errors.nama}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="ins-wilayah">
                                Wilayah Induk{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={String(formInstansi.data.wilayah_id)}
                                onValueChange={(val) =>
                                    formInstansi.setData(
                                        'wilayah_id',
                                        Number(val),
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="ins-wilayah"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih Wilayah Induk" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {masterWilayah
                                            .filter(
                                                (w) =>
                                                    w.tingkat === 'kota' ||
                                                    w.tingkat === 'provinsi',
                                            )
                                            .map((w) => (
                                                <SelectItem
                                                    key={w.id}
                                                    value={String(w.id)}
                                                >
                                                    {w.nama} ({w.tingkat})
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="instansi_aktif"
                                checked={formInstansi.data.aktif}
                                onChange={(e) =>
                                    formInstansi.setData(
                                        'aktif',
                                        e.target.checked,
                                    )
                                }
                                className="size-4 rounded border-border text-primary accent-primary"
                            />
                            <label
                                htmlFor="instansi_aktif"
                                className="cursor-pointer text-body-sm font-medium text-foreground"
                            >
                                Status Instansi Aktif
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalInstansiBuka(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={formInstansi.processing}
                            >
                                {formInstansi.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Tambah/Edit Kategori */}
            <Dialog
                open={modalKategoriBuka}
                onOpenChange={setModalKategoriBuka}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editKategoriId
                                ? 'Ubah Data Kategori Kerusakan'
                                : 'Tambah Kategori Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Klasifikasi aduan dan parameter radius toleransi
                            deduplikasi otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanKategori} className="space-y-4 pt-1">
                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="kat-nama">
                                Nama Kategori Kerusakan{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="kat-nama"
                                type="text"
                                value={formKategori.data.nama}
                                onChange={(e) =>
                                    formKategori.setData('nama', e.target.value)
                                }
                                placeholder="Contoh: Jalan Berlubang, Jembatan Rusak"
                                required
                            />
                            {formKategori.errors.nama && (
                                <FieldError>
                                    {formKategori.errors.nama}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="kat-radius">
                                Radius Deteksi Duplikat (meter){' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="kat-radius"
                                type="number"
                                value={formKategori.data.radius_gabung_m}
                                onChange={(e) =>
                                    formKategori.setData(
                                        'radius_gabung_m',
                                        Number(e.target.value),
                                    )
                                }
                                min={5}
                                max={500}
                                required
                            />
                            <p className="text-caption-xs text-muted-foreground">
                                Radius toleransi GPS untuk mendeteksi laporan
                                serupa yang berdekatan.
                            </p>
                            {formKategori.errors.radius_gabung_m && (
                                <FieldError>
                                    {formKategori.errors.radius_gabung_m}
                                </FieldError>
                            )}
                        </Field>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="kategori_aktif"
                                checked={formKategori.data.aktif}
                                onChange={(e) =>
                                    formKategori.setData(
                                        'aktif',
                                        e.target.checked,
                                    )
                                }
                                className="size-4 rounded border-border text-primary accent-primary"
                            />
                            <label
                                htmlFor="kategori_aktif"
                                className="cursor-pointer text-body-sm font-medium text-foreground"
                            >
                                Status Kategori Aktif
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalKategoriBuka(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={formKategori.processing}
                            >
                                {formKategori.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Tambah/Edit Wilayah */}
            <Dialog open={modalWilayahBuka} onOpenChange={setModalWilayahBuka}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editWilayahId
                                ? 'Ubah Data Wilayah Administratif'
                                : 'Tambah Wilayah Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Entitas wilayah kota, kecamatan, dan kelurahan untuk
                            penugasan dan kuorum.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanWilayah} className="space-y-4 pt-1">
                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="wil-tingkat">
                                Tingkat Wilayah{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={formWilayah.data.tingkat}
                                onValueChange={(val) => {
                                    const t = val ?? 'kelurahan';
                                    formWilayah.setData('tingkat', t);
                                    if (t === 'kota') {
                                        formWilayah.setData('induk_id', '');
                                    }
                                }}
                            >
                                <SelectTrigger
                                    id="wil-tingkat"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih Tingkat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="kelurahan">
                                            Kelurahan
                                        </SelectItem>
                                        <SelectItem value="kecamatan">
                                            Kecamatan
                                        </SelectItem>
                                        <SelectItem value="kota">
                                            Kota
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {formWilayah.errors.tingkat && (
                                <FieldError>
                                    {formWilayah.errors.tingkat}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="wil-nama">
                                Nama Wilayah{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="wil-nama"
                                type="text"
                                value={formWilayah.data.nama}
                                onChange={(e) =>
                                    formWilayah.setData('nama', e.target.value)
                                }
                                placeholder="Contoh: Beji, Sukamaju Baru"
                                required
                            />
                            {formWilayah.errors.nama && (
                                <FieldError>
                                    {formWilayah.errors.nama}
                                </FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="wil-kode-bps">
                                Kode BPS (Opsional)
                            </FieldLabel>
                            <Input
                                id="wil-kode-bps"
                                type="text"
                                value={formWilayah.data.kode_bps}
                                onChange={(e) =>
                                    formWilayah.setData(
                                        'kode_bps',
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: 3276010001"
                            />
                            {formWilayah.errors.kode_bps && (
                                <FieldError>
                                    {formWilayah.errors.kode_bps}
                                </FieldError>
                            )}
                        </Field>

                        {formWilayah.data.tingkat !== 'kota' && (
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="wil-induk">
                                    Wilayah Induk{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                    value={formWilayah.data.induk_id}
                                    onValueChange={(val) =>
                                        formWilayah.setData(
                                            'induk_id',
                                            val ?? '',
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="wil-induk"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Pilih Wilayah Induk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {masterWilayah
                                                .filter((w) =>
                                                    formWilayah.data.tingkat ===
                                                    'kelurahan'
                                                        ? w.tingkat ===
                                                          'kecamatan'
                                                        : w.tingkat === 'kota',
                                                )
                                                .map((w) => (
                                                    <SelectItem
                                                        key={w.id}
                                                        value={String(w.id)}
                                                    >
                                                        {w.nama} ({w.tingkat})
                                                    </SelectItem>
                                                ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {formWilayah.errors.induk_id && (
                                    <FieldError>
                                        {formWilayah.errors.induk_id}
                                    </FieldError>
                                )}
                            </Field>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalWilayahBuka(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={formWilayah.processing}
                            >
                                {formWilayah.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
