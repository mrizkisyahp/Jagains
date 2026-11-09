import { type FormEvent, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Clock, Edit2, Search, Sliders, Users, X } from 'lucide-react';
import { KategoriRow, WilayahRow } from './KonfigurasiMasterDataTab';
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
import { Field, FieldLabel } from '@/components/ui/field';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export interface AturanSlaRow {
    id: number;
    kategori_id: number;
    batas_respons_hk: number;
    batas_survei_hk: number;
    batas_anggaran_hk: number;
    batas_jawab_sengketa_hk: number;
    batas_verifikasi_hari: number;
    kategori?: {
        id: number;
        nama: string;
    } | null;
}

export interface ParameterKuorumRow {
    id: number;
    wilayah_id: number;
    k_bp: number;
    kmin: number | string;
    kmax: number | string;
    wilayah?: {
        id: number;
        nama: string;
        tingkat: string;
    } | null;
}

interface KonfigurasiSlaKuorumTabProps {
    aturanSla: AturanSlaRow[];
    parameterKuorum: ParameterKuorumRow[];
    masterKategori: KategoriRow[];
    masterWilayah: WilayahRow[];
}

export default function KonfigurasiSlaKuorumTab({
    aturanSla,
    parameterKuorum,
    masterKategori,
    masterWilayah,
}: KonfigurasiSlaKuorumTabProps) {
    const [modalSlaBuka, setModalSlaBuka] = useState(false);
    const [modalKuorumBuka, setModalKuorumBuka] = useState(false);
    const [selectedWilayahNama, setSelectedWilayahNama] = useState<
        string | null
    >(null);

    const [searchSla, setSearchSla] = useState('');
    const [pageSla, setPageSla] = useState(1);
    const [searchKuorum, setSearchKuorum] = useState('');
    const [pageKuorum, setPageKuorum] = useState(1);
    const PAGE_SIZE = 10;

    const slaTersaring = useMemo(() => {
        return aturanSla.filter((sla) => {
            if (!searchSla.trim()) {
                return true;
            }
            const katNama = sla.kategori?.nama?.toLowerCase() || '';
            return katNama.includes(searchSla.trim().toLowerCase());
        });
    }, [aturanSla, searchSla]);

    const paginatedSla = useMemo(() => {
        const start = (pageSla - 1) * PAGE_SIZE;
        return slaTersaring.slice(start, start + PAGE_SIZE);
    }, [slaTersaring, pageSla]);

    const kuorumTersaring = useMemo(() => {
        return parameterKuorum.filter((q) => {
            if (!searchKuorum.trim()) {
                return true;
            }
            const wilNama = q.wilayah?.nama?.toLowerCase() || '';
            return wilNama.includes(searchKuorum.trim().toLowerCase());
        });
    }, [parameterKuorum, searchKuorum]);

    const paginatedKuorum = useMemo(() => {
        const start = (pageKuorum - 1) * PAGE_SIZE;
        return kuorumTersaring.slice(start, start + PAGE_SIZE);
    }, [kuorumTersaring, pageKuorum]);

    const formSla = useForm({
        kategori_id: masterKategori[0]?.id || 1,
        batas_respons_hk: 3,
        batas_survei_hk: 5,
        batas_anggaran_hk: 10,
        batas_jawab_sengketa_hk: 7,
        batas_verifikasi_hari: 14,
    });

    const formKuorum = useForm({
        wilayah_id: masterWilayah[0]?.id || 1,
        k_bp: 200,
        kmin: 2.0,
        kmax: 5.0,
    });

    const bukaTambahSla = () => {
        formSla.setData({
            kategori_id: masterKategori[0]?.id || 1,
            batas_respons_hk: 3,
            batas_survei_hk: 5,
            batas_anggaran_hk: 10,
            batas_jawab_sengketa_hk: 7,
            batas_verifikasi_hari: 14,
        });
        formSla.clearErrors();
        setModalSlaBuka(true);
    };

    const bukaEditSla = (sla: AturanSlaRow) => {
        formSla.setData({
            kategori_id: sla.kategori_id,
            batas_respons_hk: sla.batas_respons_hk,
            batas_survei_hk: sla.batas_survei_hk,
            batas_anggaran_hk: sla.batas_anggaran_hk,
            batas_jawab_sengketa_hk: sla.batas_jawab_sengketa_hk,
            batas_verifikasi_hari: sla.batas_verifikasi_hari,
        });
        formSla.clearErrors();
        setModalSlaBuka(true);
    };

    const bukaTambahKuorum = () => {
        setSelectedWilayahNama(null);
        formKuorum.setData({
            wilayah_id: masterWilayah[0]?.id || 1,
            k_bp: 200,
            kmin: 2.0,
            kmax: 5.0,
        });
        formKuorum.clearErrors();
        setModalKuorumBuka(true);
    };

    const bukaEditKuorum = (q: ParameterKuorumRow) => {
        setSelectedWilayahNama(q.wilayah?.nama || `Wilayah #${q.wilayah_id}`);
        formKuorum.setData({
            wilayah_id: q.wilayah_id,
            k_bp: q.k_bp,
            kmin: Number(q.kmin),
            kmax: Number(q.kmax),
        });
        formKuorum.clearErrors();
        setModalKuorumBuka(true);
    };

    const simpanSla = (e: FormEvent) => {
        e.preventDefault();
        formSla.post('/admin/konfigurasi/sla', {
            onSuccess: () => setModalSlaBuka(false),
        });
    };

    const simpanKuorum = (e: FormEvent) => {
        e.preventDefault();
        formKuorum.post('/admin/konfigurasi/kuorum', {
            onSuccess: () => setModalKuorumBuka(false),
        });
    };

    return (
        <div className="space-y-6">
            {/* Bagian 1: Standar SLA Hari Kerja */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h4 className="flex items-center gap-2 text-body-medium font-semibold text-foreground">
                            <Clock
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <span>
                                Standar Batas Waktu Pelayanan (SLA Hari Kerja)
                            </span>
                        </h4>
                        <p className="text-caption-xs text-muted-foreground">
                            Batas waktu operasional instansi berdasarkan
                            kategori kerusakan fasilitas publik.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 sm:w-56">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari kategori SLA..."
                                value={searchSla}
                                onChange={(e) => {
                                    setSearchSla(e.target.value);
                                    setPageSla(1);
                                }}
                                className="h-9 pr-8 pl-9 text-xs"
                            />
                            {searchSla && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchSla('');
                                        setPageSla(1);
                                    }}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label="Hapus filter pencarian"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={bukaTambahSla}
                            title="Ubah Standar SLA"
                            aria-label="Ubah Standar SLA"
                        >
                            <Clock className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">
                                Ubah Standar SLA
                            </span>
                        </Button>
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground">
                                Kategori
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Respons Awal
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Survei Lapangan
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Penjadwalan Anggaran
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Jawab Sengketa
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Jendela Verifikasi
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedSla.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-32 text-center"
                                >
                                    <AdminEmptyState
                                        icon={Clock}
                                        title="Standar SLA Tidak Ditemukan"
                                        description="Tidak ada aturan SLA yang cocok dengan kata kunci pencarian."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedSla.map((sla) => (
                                <TableRow
                                    key={sla.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <TableCell className="text-body-sm font-semibold text-foreground">
                                        {sla.kategori?.nama ||
                                            `Kategori #${sla.kategori_id}`}
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono font-semibold text-foreground">
                                        {sla.batas_respons_hk} hari kerja
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                        {sla.batas_survei_hk} hari kerja
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                        {sla.batas_anggaran_hk} hari kerja
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                        {sla.batas_jawab_sengketa_hk} hari kerja
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                        {sla.batas_verifikasi_hari} hari
                                        kalender
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => bukaEditSla(sla)}
                                            title={`Ubah SLA ${sla.kategori?.nama || ''}`}
                                            aria-label={`Ubah SLA ${sla.kategori?.nama || ''}`}
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
                    currentPage={pageSla}
                    totalItems={slaTersaring.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPageSla}
                    itemName="standar SLA"
                />
            </div>

            {/* Bagian 2: Parameter Kuorum Wilayah */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h4 className="flex items-center gap-2 text-body-medium font-semibold text-foreground">
                            <Users
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <span>Parameter Kuorum Verifikasi Dinamis</span>
                        </h4>
                        <p className="text-caption-xs text-muted-foreground">
                            Formula kuorum berbasis DPT dan kepadatan
                            partisipasi warga tiap kelurahan/kecamatan.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 sm:w-56">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari wilayah kuorum..."
                                value={searchKuorum}
                                onChange={(e) => {
                                    setSearchKuorum(e.target.value);
                                    setPageKuorum(1);
                                }}
                                className="h-9 pr-8 pl-9 text-xs"
                            />
                            {searchKuorum && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchKuorum('');
                                        setPageKuorum(1);
                                    }}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label="Hapus filter pencarian"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={bukaTambahKuorum}
                            title="Atur Parameter Kuorum"
                            aria-label="Atur Parameter Kuorum"
                        >
                            <Sliders className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">
                                Atur Parameter Kuorum
                            </span>
                        </Button>
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground">
                                Wilayah
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Tingkat
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Bobot Basis (K_BP)
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Kuorum Minimal (Kmin)
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Kuorum Maksimal (Kmax)
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedKuorum.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-32 text-center"
                                >
                                    <AdminEmptyState
                                        icon={Users}
                                        title="Parameter Kuorum Tidak Ditemukan"
                                        description="Tidak ada parameter kuorum yang cocok dengan kata kunci pencarian."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedKuorum.map((q) => (
                                <TableRow
                                    key={q.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <TableCell className="text-body-sm font-semibold text-foreground">
                                        {q.wilayah?.nama ||
                                            `Wilayah #${q.wilayah_id}`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="text-caption-xs capitalize"
                                        >
                                            {q.wilayah?.tingkat || '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono text-muted-foreground">
                                        {q.k_bp}
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono font-semibold text-foreground">
                                        {Number(q.kmin).toFixed(1)} suara
                                    </TableCell>
                                    <TableCell className="text-caption-xs font-mono font-semibold text-foreground">
                                        {Number(q.kmax).toFixed(1)} suara
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => bukaEditKuorum(q)}
                                            title={`Ubah kuorum ${q.wilayah?.nama || ''}`}
                                            aria-label={`Ubah kuorum ${q.wilayah?.nama || ''}`}
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
                    currentPage={pageKuorum}
                    totalItems={kuorumTersaring.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPageKuorum}
                    itemName="parameter kuorum"
                />
            </div>

            {/* Modal Dialog Atur SLA */}
            <Dialog open={modalSlaBuka} onOpenChange={setModalSlaBuka}>
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock
                                className="size-5 text-primary"
                                aria-hidden="true"
                            />
                            <span>Atur Standar Batas Waktu SLA</span>
                        </DialogTitle>
                        <DialogDescription>
                            Tentukan batas waktu tahapan penanganan untuk
                            kategori kerusakan terpilih.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanSla} className="space-y-4 pt-1">
                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="sla-kategori">
                                Kategori Kerusakan{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={String(formSla.data.kategori_id)}
                                onValueChange={(val) =>
                                    formSla.setData('kategori_id', Number(val))
                                }
                            >
                                <SelectTrigger
                                    id="sla-kategori"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {masterKategori.map((k) => (
                                            <SelectItem
                                                key={k.id}
                                                value={String(k.id)}
                                            >
                                                {k.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="sla-respons">
                                    Respons Awal (HK) *
                                </FieldLabel>
                                <Input
                                    id="sla-respons"
                                    type="number"
                                    value={formSla.data.batas_respons_hk}
                                    onChange={(e) =>
                                        formSla.setData(
                                            'batas_respons_hk',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={1}
                                    required
                                />
                            </Field>

                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="sla-survei">
                                    Survei Lapangan (HK) *
                                </FieldLabel>
                                <Input
                                    id="sla-survei"
                                    type="number"
                                    value={formSla.data.batas_survei_hk}
                                    onChange={(e) =>
                                        formSla.setData(
                                            'batas_survei_hk',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={1}
                                    required
                                />
                            </Field>

                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="sla-anggaran">
                                    Jadwal Anggaran (HK) *
                                </FieldLabel>
                                <Input
                                    id="sla-anggaran"
                                    type="number"
                                    value={formSla.data.batas_anggaran_hk}
                                    onChange={(e) =>
                                        formSla.setData(
                                            'batas_anggaran_hk',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={1}
                                    required
                                />
                            </Field>

                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="sla-sengketa">
                                    Jawab Sengketa (HK) *
                                </FieldLabel>
                                <Input
                                    id="sla-sengketa"
                                    type="number"
                                    value={formSla.data.batas_jawab_sengketa_hk}
                                    onChange={(e) =>
                                        formSla.setData(
                                            'batas_jawab_sengketa_hk',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={1}
                                    required
                                />
                            </Field>
                        </div>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="sla-verifikasi">
                                Jendela Verifikasi Warga (Hari Kalender) *
                            </FieldLabel>
                            <Input
                                id="sla-verifikasi"
                                type="number"
                                value={formSla.data.batas_verifikasi_hari}
                                onChange={(e) =>
                                    formSla.setData(
                                        'batas_verifikasi_hari',
                                        Number(e.target.value),
                                    )
                                }
                                min={1}
                                required
                            />
                        </Field>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalSlaBuka(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={formSla.processing}
                            >
                                {formSla.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan SLA'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog Atur Kuorum */}
            <Dialog open={modalKuorumBuka} onOpenChange={setModalKuorumBuka}>
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sliders
                                className="size-5 text-primary"
                                aria-hidden="true"
                            />
                            <span>
                                {selectedWilayahNama
                                    ? `Atur Kuorum: ${selectedWilayahNama}`
                                    : 'Atur Parameter Kuorum'}
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Kalibrasi ambang batas minimal dan maksimal dukungan
                            verifikasi warga per wilayah.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanKuorum} className="space-y-4 pt-1">
                        {!selectedWilayahNama && (
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="kuorum-wilayah">
                                    Wilayah{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                    value={String(formKuorum.data.wilayah_id)}
                                    onValueChange={(val) =>
                                        formKuorum.setData(
                                            'wilayah_id',
                                            Number(val),
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="kuorum-wilayah"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Pilih Wilayah" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {masterWilayah.map((w) => (
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
                        )}

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="kuorum-kbp">
                                Bobot Basis Pemilih (K_BP){' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="kuorum-kbp"
                                type="number"
                                value={formKuorum.data.k_bp}
                                onChange={(e) =>
                                    formKuorum.setData(
                                        'k_bp',
                                        Number(e.target.value),
                                    )
                                }
                                min={1}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="kuorum-kmin">
                                    Kuorum Min (Kmin) *
                                </FieldLabel>
                                <Input
                                    id="kuorum-kmin"
                                    type="number"
                                    step="0.1"
                                    value={formKuorum.data.kmin}
                                    onChange={(e) =>
                                        formKuorum.setData(
                                            'kmin',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={1}
                                    required
                                />
                            </Field>

                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="kuorum-kmax">
                                    Kuorum Max (Kmax) *
                                </FieldLabel>
                                <Input
                                    id="kuorum-kmax"
                                    type="number"
                                    step="0.1"
                                    value={formKuorum.data.kmax}
                                    onChange={(e) =>
                                        formKuorum.setData(
                                            'kmax',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={1}
                                    required
                                />
                            </Field>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalKuorumBuka(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={formKuorum.processing}
                            >
                                {formKuorum.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Kuorum'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
