import { type FormEvent, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Edit2,
    GitBranch,
    Info,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import {
    InstansiRow,
    KategoriRow,
    WilayahRow,
} from './KonfigurasiMasterDataTab';
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
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

export interface AturanRoutingRow {
    id: number;
    kategori_id: number;
    wilayah_id: number;
    instansi_id: number;
    prioritas: number;
    kategori?: {
        id: number;
        nama: string;
    } | null;
    wilayah?: {
        id: number;
        nama: string;
        tingkat: string;
    } | null;
    instansi?: {
        id: number;
        nama: string;
        singkatan: string;
    } | null;
}

interface KonfigurasiRoutingTabProps {
    aturanRouting: AturanRoutingRow[];
    masterKategori: KategoriRow[];
    masterWilayah: WilayahRow[];
    masterInstansi: InstansiRow[];
}

export default function KonfigurasiRoutingTab({
    aturanRouting,
    masterKategori,
    masterWilayah,
    masterInstansi,
}: KonfigurasiRoutingTabProps) {
    const [modalBuka, setModalBuka] = useState(false);
    const [editRoutingId, setEditRoutingId] = useState<number | null>(null);
    const [searchRouting, setSearchRouting] = useState('');
    const [pageRouting, setPageRouting] = useState(1);
    const PAGE_SIZE = 10;
    const [confirmHapusModal, setConfirmHapusModal] = useState<{
        open: boolean;
        aturan: AturanRoutingRow | null;
    }>({ open: false, aturan: null });

    const routingTersaring = useMemo(() => {
        return aturanRouting.filter((r) => {
            if (!searchRouting.trim()) {
                return true;
            }
            const s = searchRouting.trim().toLowerCase();
            const katNama = r.kategori?.nama?.toLowerCase() || '';
            const wilNama = r.wilayah?.nama?.toLowerCase() || '';
            const insNama = r.instansi?.nama?.toLowerCase() || '';
            const insSing = r.instansi?.singkatan?.toLowerCase() || '';
            return (
                katNama.includes(s) ||
                wilNama.includes(s) ||
                insNama.includes(s) ||
                insSing.includes(s)
            );
        });
    }, [aturanRouting, searchRouting]);

    const paginatedRouting = useMemo(() => {
        const start = (pageRouting - 1) * PAGE_SIZE;
        return routingTersaring.slice(start, start + PAGE_SIZE);
    }, [routingTersaring, pageRouting]);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            kategori_id: masterKategori[0]?.id || 1,
            wilayah_id: masterWilayah[0]?.id || 1,
            instansi_id: masterInstansi[0]?.id || 1,
            prioritas: 100,
        });

    const bukaModalTambah = () => {
        setEditRoutingId(null);
        reset();
        clearErrors();
        setModalBuka(true);
    };

    const bukaModalEdit = (r: AturanRoutingRow) => {
        setEditRoutingId(r.id);
        setData({
            kategori_id: r.kategori_id,
            wilayah_id: r.wilayah_id,
            instansi_id: r.instansi_id,
            prioritas: r.prioritas,
        });
        clearErrors();
        setModalBuka(true);
    };

    const konfirmasiHapus = (r: AturanRoutingRow) => {
        setConfirmHapusModal({ open: true, aturan: r });
    };

    const eksekusiHapus = () => {
        if (!confirmHapusModal.aturan) {
            return;
        }
        router.delete(
            `/admin/konfigurasi/routing/${confirmHapusModal.aturan.id}`,
            {
                onFinish: () =>
                    setConfirmHapusModal({ open: false, aturan: null }),
            },
        );
    };

    const simpanAturan = (e: FormEvent) => {
        e.preventDefault();
        if (editRoutingId) {
            put(`/admin/konfigurasi/routing/${editRoutingId}`, {
                onSuccess: () => {
                    setModalBuka(false);
                    setEditRoutingId(null);
                    reset();
                },
            });
        } else {
            post('/admin/konfigurasi/routing', {
                onSuccess: () => {
                    setModalBuka(false);
                    setEditRoutingId(null);
                    reset();
                },
            });
        }
    };

    // Deteksi bentrok prioritas
    const deteksiBentrok = (r: AturanRoutingRow) => {
        return aturanRouting.some(
            (other) =>
                other.id !== r.id &&
                other.kategori_id === r.kategori_id &&
                other.wilayah_id === r.wilayah_id &&
                other.prioritas === r.prioritas,
        );
    };

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h4 className="flex items-center gap-2 text-body-medium font-semibold text-foreground">
                            <GitBranch
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <span>Aturan Disposisi Routing Tiket</span>
                        </h4>
                        <p className="text-caption-xs text-muted-foreground">
                            Pemetaan otomatis kategori kerusakan dan wilayah ke
                            OPD penanggung jawab berdasarkan urutan prioritas.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 sm:w-60">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari kategori, wilayah, instansi..."
                                value={searchRouting}
                                onChange={(e) => {
                                    setSearchRouting(e.target.value);
                                    setPageRouting(1);
                                }}
                                className="h-9 pr-8 pl-9 text-xs"
                            />
                            {searchRouting && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchRouting('');
                                        setPageRouting(1);
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
                            onClick={bukaModalTambah}
                            title="Tambah Aturan Routing"
                            aria-label="Tambah Aturan Routing"
                        >
                            <Plus className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">
                                Tambah Aturan Routing
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Banner Fallback Info */}
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5 text-caption-xs text-muted-foreground">
                    <Info
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <span>
                        <strong className="text-foreground">
                            Hierarki Fallback Evaluasi:
                        </strong>{' '}
                        Kelurahan &gt; Kecamatan &gt; Kota/Kabupaten. Bila tidak
                        ada aturan cocok atau instansi dinonaktifkan, tiket
                        otomatis masuk ke Antrean Routing Manual.
                    </span>
                </div>

                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground">
                                Prioritas
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Kategori Kerusakan
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Cakupan Wilayah
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Instansi Penanggung Jawab
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRouting.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-32 text-center"
                                >
                                    <AdminEmptyState
                                        icon={GitBranch}
                                        title="Aturan Routing Tidak Ditemukan"
                                        description="Tidak ada aturan routing yang cocok dengan kata kunci pencarian."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRouting.map((r) => {
                                const bentrok = deteksiBentrok(r);
                                return (
                                    <TableRow
                                        key={r.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <TableCell className="text-body-sm font-mono font-semibold text-foreground">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className="text-caption-xs font-mono font-semibold"
                                                >
                                                    #{r.prioritas}
                                                </Badge>
                                                {bentrok && (
                                                    <Badge
                                                        variant="sla-warn"
                                                        className="gap-1 text-[10px]"
                                                    >
                                                        <AlertTriangle
                                                            className="size-2.5"
                                                            aria-hidden="true"
                                                        />
                                                        <span>Bentrok</span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-body-sm font-medium text-foreground">
                                            {r.kategori?.nama ||
                                                `Kategori #${r.kategori_id}`}
                                        </TableCell>
                                        <TableCell className="text-body-sm text-foreground">
                                            <span>
                                                {r.wilayah?.nama ||
                                                    `Wilayah #${r.wilayah_id}`}
                                            </span>
                                            {r.wilayah?.tingkat && (
                                                <span className="ml-1 text-caption-xs text-muted-foreground capitalize">
                                                    ({r.wilayah.tingkat})
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-body-sm text-foreground">
                                            <span className="font-semibold">
                                                {r.instansi?.singkatan}
                                            </span>
                                            <span className="block text-caption-xs text-muted-foreground">
                                                {r.instansi?.nama}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        bukaModalEdit(r)
                                                    }
                                                    title={`Ubah aturan routing #${r.id}`}
                                                    aria-label={`Ubah aturan routing #${r.id}`}
                                                >
                                                    <Edit2
                                                        className="size-3 text-muted-foreground"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="hidden sm:inline">
                                                        Ubah
                                                    </span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon-sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        konfirmasiHapus(r)
                                                    }
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    title="Hapus Aturan"
                                                >
                                                    <Trash2
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                <AdminTablePagination
                    currentPage={pageRouting}
                    totalItems={routingTersaring.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPageRouting}
                    itemName="aturan"
                />
            </div>

            {/* Modal Tambah/Edit Aturan Routing */}
            <Dialog open={modalBuka} onOpenChange={setModalBuka}>
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle>
                            {editRoutingId
                                ? 'Ubah Aturan Routing Disposisi'
                                : 'Tambah Aturan Routing Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Tentukan kombinasi kategori, wilayah, OPD penanggung
                            jawab, dan prioritas evaluasi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanAturan} className="space-y-4 pt-1">
                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="routing-kategori">
                                Kategori Kerusakan{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={String(data.kategori_id)}
                                onValueChange={(val) =>
                                    setData('kategori_id', Number(val))
                                }
                            >
                                <SelectTrigger
                                    id="routing-kategori"
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
                            {errors.kategori_id && (
                                <FieldError>{errors.kategori_id}</FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="routing-wilayah">
                                Cakupan Wilayah{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={String(data.wilayah_id)}
                                onValueChange={(val) =>
                                    setData('wilayah_id', Number(val))
                                }
                            >
                                <SelectTrigger
                                    id="routing-wilayah"
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
                            {errors.wilayah_id && (
                                <FieldError>{errors.wilayah_id}</FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="routing-instansi">
                                Instansi Penanggung Jawab{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={String(data.instansi_id)}
                                onValueChange={(val) =>
                                    setData('instansi_id', Number(val))
                                }
                            >
                                <SelectTrigger
                                    id="routing-instansi"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih OPD / Instansi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {masterInstansi.map((ins) => (
                                            <SelectItem
                                                key={ins.id}
                                                value={String(ins.id)}
                                            >
                                                {ins.singkatan} - {ins.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.instansi_id && (
                                <FieldError>{errors.instansi_id}</FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="routing-prioritas">
                                Nilai Prioritas (Angka Rendah = Prioritas Lebih
                                Tinggi){' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="routing-prioritas"
                                type="number"
                                value={data.prioritas}
                                onChange={(e) =>
                                    setData('prioritas', Number(e.target.value))
                                }
                                min={1}
                                max={9999}
                                required
                            />
                            {errors.prioritas && (
                                <FieldError>{errors.prioritas}</FieldError>
                            )}
                        </Field>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalBuka(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={processing}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Aturan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog Konfirmasi Hapus Aturan */}
            <Dialog
                open={confirmHapusModal.open}
                onOpenChange={(open) =>
                    !open && setConfirmHapusModal({ open: false, aturan: null })
                }
            >
                <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle>Hapus Aturan Routing?</DialogTitle>
                        <DialogDescription>
                            {confirmHapusModal.aturan && (
                                <span>
                                    Hapus aturan routing untuk "
                                    {confirmHapusModal.aturan.kategori?.nama}"
                                    di "{confirmHapusModal.aturan.wilayah?.nama}
                                    "? Tiket aduan baru berikutnya akan otomatis
                                    fallback ke tingkat wilayah di atasnya atau
                                    masuk antrean disposisi manual.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setConfirmHapusModal({
                                    open: false,
                                    aturan: null,
                                })
                            }
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={eksekusiHapus}>
                            Hapus Aturan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
