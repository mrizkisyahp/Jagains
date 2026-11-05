import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import {
    Building2,
    Check,
    Copy,
    KeyRound,
    RotateCw,
    Search,
    Shield,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

interface InstansiData {
    id: number;
    nama: string;
    singkatan: string;
}

interface PetugasData {
    id: number;
    username: string;
    peran: 'instansi' | 'auditor';
    status_akun: 'aktif' | 'nonaktif' | 'dibekukan';
    wajib_ganti_sandi: boolean;
    instansi: InstansiData | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface PetugasPageProps {
    daftarPetugas: PaginatedData<PetugasData>;
    daftarInstansi: InstansiData[];
    peranFilter?: string | null;
    cariFilter?: string | null;
    sandiBaru?: string | null;
    petugasBaru?: {
        username: string;
        peran: string;
    } | null;
}

export default function PetugasPage({
    daftarPetugas,
    daftarInstansi,
    peranFilter,
    cariFilter,
    sandiBaru: initialSandiBaru,
    petugasBaru: initialPetugasBaru,
}: PetugasPageProps) {
    const [searchTerm, setSearchTerm] = useState(cariFilter || '');
    const [modalTambahBuka, setModalTambahBuka] = useState(false);
    const [modalSandiBuka, setModalSandiBuka] = useState(false);
    const [revealedSandi, setRevealedSandi] = useState<string | null>(
        initialSandiBaru || null,
    );
    const [revealedUsername, setRevealedUsername] = useState<string | null>(
        initialPetugasBaru?.username || null,
    );
    const [copied, setCopied] = useState(false);

    // State konfirmasi modal pengganti window.confirm()
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        type: 'reset-sandi' | 'toggle-status';
        petugas: PetugasData | null;
    }>({ open: false, type: 'reset-sandi', petugas: null });

    const activeTab = peranFilter || 'semua';

    useEffect(() => {
        if (initialSandiBaru) {
            setRevealedSandi(initialSandiBaru);
            setRevealedUsername(initialPetugasBaru?.username || null);
            setModalSandiBuka(true);
        }
    }, [initialSandiBaru, initialPetugasBaru]);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            username: '',
            peran: 'instansi',
            instansi_id: '',
        });

    const bukaModalTambah = () => {
        reset();
        clearErrors();
        setModalTambahBuka(true);
    };

    const tutupModalTambah = () => {
        setModalTambahBuka(false);
        reset();
        clearErrors();
    };

    const handleSimpanPetugas = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/petugas', {
            onSuccess: () => {
                tutupModalTambah();
            },
        });
    };

    const handleSalinSandi = () => {
        if (!revealedSandi) {
            return;
        }
        void navigator.clipboard.writeText(revealedSandi);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const bukaKonfirmasiResetSandi = (petugas: PetugasData) => {
        setConfirmModal({
            open: true,
            type: 'reset-sandi',
            petugas,
        });
    };

    const bukaKonfirmasiToggleStatus = (petugas: PetugasData) => {
        setConfirmModal({
            open: true,
            type: 'toggle-status',
            petugas,
        });
    };

    const eksekusiKonfirmasi = () => {
        if (!confirmModal.petugas) {
            return;
        }

        if (confirmModal.type === 'reset-sandi') {
            router.post(
                `/admin/petugas/${confirmModal.petugas.id}/reset-sandi`,
                {},
                {
                    onFinish: () =>
                        setConfirmModal({
                            open: false,
                            type: 'reset-sandi',
                            petugas: null,
                        }),
                },
            );
        } else {
            router.patch(
                `/admin/petugas/${confirmModal.petugas.id}/toggle-status`,
                {},
                {
                    onFinish: () =>
                        setConfirmModal({
                            open: false,
                            type: 'toggle-status',
                            petugas: null,
                        }),
                },
            );
        }
    };

    const handleTabChange = (value: string | null) => {
        if (!value) {
            return;
        }
        const params: Record<string, string> = {};
        if (value !== 'semua') {
            params.peran = value;
        }
        if (searchTerm.trim()) {
            params.cari = searchTerm.trim();
        }
        router.get('/admin/petugas', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (activeTab !== 'semua') {
            params.peran = activeTab;
        }
        if (searchTerm.trim()) {
            params.cari = searchTerm.trim();
        }
        router.get('/admin/petugas', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetSearch = () => {
        setSearchTerm('');
        const params: Record<string, string> = {};
        if (activeTab !== 'semua') {
            params.peran = activeTab;
        }
        router.get('/admin/petugas', params, {
            preserveState: true,
            replace: true,
        });
    };

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <Head title="Manajemen Akun Staf - Jagains Admin" />

            {/* Header & Aksi Tambah */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-body-large font-display font-semibold text-foreground">
                        Manajemen Akun Staf
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Kelola akun petugas Instansi Teknis dan Auditor
                        Independen.
                    </p>
                </div>
                <div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={bukaModalTambah}
                        title="Tambah Akun Staf"
                        aria-label="Tambah Akun Staf"
                    >
                        <UserPlus className="size-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">
                            Tambah Akun Staf
                        </span>
                    </Button>
                </div>
            </div>

            {/* Filter Peran & Pencarian */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full sm:w-auto"
                >
                    <div className="w-full scrollbar-none overflow-x-auto pb-1 sm:w-auto">
                        <TabsList className="inline-flex w-max min-w-full justify-start bg-muted/50 p-1">
                            <TabsTrigger value="semua" className="shrink-0">
                                Semua Staf ({daftarPetugas.total})
                            </TabsTrigger>
                            <TabsTrigger value="instansi" className="shrink-0">
                                Petugas Instansi
                            </TabsTrigger>
                            <TabsTrigger value="auditor" className="shrink-0">
                                Auditor Independen
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>

                <form
                    onSubmit={handleSearch}
                    className="flex w-full items-center gap-2 sm:w-auto"
                >
                    <div className="relative max-w-sm min-w-[220px] flex-1 sm:w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari username atau instansi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 pr-8 pl-9 text-xs"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleResetSearch}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Hapus pencarian"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                    >
                        Cari
                    </Button>
                </form>
            </div>

            {/* Tabel Staf */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground">
                                Username
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Peran
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Instansi / Unit
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Status
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Sandi Wajib Ganti
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">
                                Terdaftar
                            </TableHead>
                            <TableHead className="text-right font-semibold text-foreground">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {daftarPetugas.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-40 text-center"
                                >
                                    <AdminEmptyState
                                        icon={Users}
                                        title="Tidak Ada Akun Staf"
                                        description="Belum ada akun petugas yang terdaftar pada filter ini."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            daftarPetugas.data.map((p) => (
                                <TableRow
                                    key={p.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <TableCell className="text-body-sm font-normal text-foreground">
                                        {p.username}
                                    </TableCell>
                                    <TableCell>
                                        {p.peran === 'instansi' ? (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 text-caption-xs"
                                            >
                                                <Building2
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span>Instansi</span>
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="stage-audit"
                                                className="gap-1 text-caption-xs"
                                            >
                                                <Shield
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                <span>Auditor</span>
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-body-sm text-foreground">
                                        {p.instansi ? (
                                            <div>
                                                <span className="font-medium">
                                                    {p.instansi.singkatan}
                                                </span>
                                                <span className="block text-caption-xs text-muted-foreground">
                                                    {p.instansi.nama}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                p.status_akun === 'aktif'
                                                    ? 'sla-safe'
                                                    : p.status_akun ===
                                                        'dibekukan'
                                                      ? 'destructive'
                                                      : 'closed'
                                            }
                                            className="text-caption-xs capitalize"
                                        >
                                            {p.status_akun}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {p.wajib_ganti_sandi ? (
                                            <Badge
                                                variant="sla-warn"
                                                className="text-caption-xs"
                                            >
                                                Ya
                                            </Badge>
                                        ) : (
                                            <span className="text-caption-xs text-muted-foreground">
                                                Tidak
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-caption-xs text-muted-foreground tabular-nums">
                                        {formatTanggal(p.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    bukaKonfirmasiResetSandi(p)
                                                }
                                                title={`Reset sandi ${p.username}`}
                                                aria-label={`Reset sandi ${p.username}`}
                                            >
                                                <KeyRound
                                                    className="size-3 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span className="hidden sm:inline">
                                                    Reset Sandi
                                                </span>
                                            </Button>
                                            <Button
                                                variant={
                                                    p.status_akun === 'aktif'
                                                        ? 'outline'
                                                        : 'default'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    bukaKonfirmasiToggleStatus(
                                                        p,
                                                    )
                                                }
                                                title={
                                                    p.status_akun === 'aktif'
                                                        ? `Nonaktifkan akun ${p.username}`
                                                        : `Aktifkan akun ${p.username}`
                                                }
                                                aria-label={
                                                    p.status_akun === 'aktif'
                                                        ? `Nonaktifkan akun ${p.username}`
                                                        : `Aktifkan akun ${p.username}`
                                                }
                                            >
                                                <RotateCw
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                <span className="hidden sm:inline">
                                                    {p.status_akun === 'aktif'
                                                        ? 'Nonaktifkan'
                                                        : 'Aktifkan'}
                                                </span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {daftarPetugas.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                        <p className="text-body-sm text-muted-foreground">
                            Halaman{' '}
                            <span className="font-medium text-foreground">
                                {daftarPetugas.current_page}
                            </span>{' '}
                            dari{' '}
                            <span className="font-medium text-foreground">
                                {daftarPetugas.last_page}
                            </span>{' '}
                            ({daftarPetugas.total} akun staf)
                        </p>
                        <div className="flex items-center gap-1">
                            {daftarPetugas.links.map((link, idx) => {
                                if (!link.url && !link.active) {
                                    return null;
                                }
                                return (
                                    <Button
                                        key={idx}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        render={
                                            link.url ? (
                                                <Link
                                                    href={link.url}
                                                    preserveScroll
                                                    preserveState
                                                />
                                            ) : undefined
                                        }
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label
                                                    .replace('&laquo;', '‹')
                                                    .replace('&raquo;', '›'),
                                            }}
                                        />
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Dialog Tambah Akun Staf */}
            <Dialog
                open={modalTambahBuka}
                onOpenChange={(open) => !open && tutupModalTambah()}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus
                                className="size-5 text-primary"
                                aria-hidden="true"
                            />
                            <span>Tambah Akun Staf</span>
                        </DialogTitle>
                        <DialogDescription>
                            Daftarkan akun petugas baru untuk penanganan laporan
                            atau pengawasan audit.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleSimpanPetugas}
                        className="space-y-4 pt-1"
                    >
                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="username-input">
                                Username{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="username-input"
                                type="text"
                                value={data.username}
                                onChange={(e) =>
                                    setData('username', e.target.value)
                                }
                                placeholder="Contoh: staf_pupr_01"
                                required
                            />
                            {errors.username && (
                                <FieldError>{errors.username}</FieldError>
                            )}
                        </Field>

                        <Field className="space-y-1.5">
                            <FieldLabel htmlFor="peran-select">
                                Peran Akun{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                                value={data.peran}
                                onValueChange={(val) => {
                                    setData('peran', val ?? 'instansi');
                                    if (val === 'auditor') {
                                        setData('instansi_id', '');
                                    }
                                }}
                            >
                                <SelectTrigger
                                    id="peran-select"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih Peran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="instansi">
                                            Petugas Instansi Teknis
                                        </SelectItem>
                                        <SelectItem value="auditor">
                                            Auditor Independen
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.peran && (
                                <FieldError>{errors.peran}</FieldError>
                            )}
                        </Field>

                        {data.peran === 'instansi' && (
                            <Field className="space-y-1.5">
                                <FieldLabel htmlFor="petugas-instansi-select">
                                    Instansi Teknis{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                    value={data.instansi_id}
                                    onValueChange={(val) =>
                                        setData('instansi_id', val ?? '')
                                    }
                                >
                                    <SelectTrigger
                                        id="petugas-instansi-select"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Pilih Instansi / OPD" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {daftarInstansi.map((ins) => (
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
                                    <FieldError>
                                        {errors.instansi_id}
                                    </FieldError>
                                )}
                            </Field>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={tutupModalTambah}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={processing || !data.username}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Akun'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog Konfirmasi Aksi (Pengganti window.confirm) */}
            <Dialog
                open={confirmModal.open}
                onOpenChange={(open) =>
                    !open &&
                    setConfirmModal({
                        open: false,
                        type: 'reset-sandi',
                        petugas: null,
                    })
                }
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {confirmModal.type === 'reset-sandi'
                                ? 'Reset Kata Sandi Akun?'
                                : confirmModal.petugas?.status_akun === 'aktif'
                                  ? 'Nonaktifkan Akun Petugas?'
                                  : 'Aktifkan Akun Petugas?'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmModal.type === 'reset-sandi'
                                ? `Kata sandi lama untuk akun "${confirmModal.petugas?.username}" tidak akan berlaku lagi. Sistem akan menghasilkan kata sandi baru acak yang wajib diganti oleh petugas saat masuk.`
                                : confirmModal.petugas?.status_akun === 'aktif'
                                  ? `Akun "${confirmModal.petugas?.username}" tidak akan dapat masuk ke dalam panel hingga diaktifkan kembali.`
                                  : `Akun "${confirmModal.petugas?.username}" akan diaktifkan kembali dan dapat mengakses panel operasional.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setConfirmModal({
                                    open: false,
                                    type: 'reset-sandi',
                                    petugas: null,
                                })
                            }
                        >
                            Batal
                        </Button>
                        <Button
                            variant={
                                confirmModal.type === 'reset-sandi' ||
                                confirmModal.petugas?.status_akun === 'aktif'
                                    ? 'destructive'
                                    : 'default'
                            }
                            onClick={eksekusiKonfirmasi}
                        >
                            {confirmModal.type === 'reset-sandi'
                                ? 'Reset Sandi'
                                : confirmModal.petugas?.status_akun === 'aktif'
                                  ? 'Nonaktifkan Akun'
                                  : 'Aktifkan Akun'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog Kata Sandi Baru / Dibuat */}
            <Dialog open={modalSandiBuka} onOpenChange={setModalSandiBuka}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound
                                className="size-5 text-primary"
                                aria-hidden="true"
                            />
                            <span>Kata Sandi Baru Dibuat</span>
                        </DialogTitle>
                        <DialogDescription>
                            Salin dan serahkan kata sandi ini kepada petugas
                            terkait. Kata sandi ini hanya ditampilkan satu kali.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {revealedUsername && (
                            <div className="text-body-sm text-muted-foreground">
                                Username:{' '}
                                <strong className="font-mono text-foreground">
                                    {revealedUsername}
                                </strong>
                            </div>
                        )}

                        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3 text-body-medium font-mono font-semibold text-foreground">
                            <span>{revealedSandi}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSalinSandi}
                                className="gap-1.5"
                            >
                                {copied ? (
                                    <>
                                        <Check
                                            className="size-3.5 text-sla-safe"
                                            aria-hidden="true"
                                        />
                                        <span>Tersalin</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Salin</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            variant="default"
                            onClick={() => setModalSandiBuka(false)}
                        >
                            Selesai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

PetugasPage.layout = (page: ReactNode) => (
    <InternalLayout title="Akun Staf" breadcrumb="Admin > Pengguna">
        {page}
    </InternalLayout>
);
