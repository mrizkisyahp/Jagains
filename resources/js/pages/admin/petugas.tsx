import { ReactNode, useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import {
    AlertCircle,
    Building2,
    Check,
    Copy,
    KeyRound,
    Lock,
    Power,
    RotateCw,
    Shield,
    UserCheck,
    UserPlus,
    UserX,
    Users,
    X,
} from 'lucide-react';

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
    links: PaginationLink[];
}

interface PetugasPageProps {
    daftarPetugas: PaginatedData<PetugasData>;
    daftarInstansi: InstansiData[];
    peranFilter?: string | null;
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
    sandiBaru: initialSandiBaru,
    petugasBaru: initialPetugasBaru,
}: PetugasPageProps) {
    const [modalTambahBuka, setModalTambahBuka] = useState(false);
    const [modalSandiBuka, setModalSandiBuka] = useState(false);
    const [revealedSandi, setRevealedSandi] = useState<string | null>(initialSandiBaru || null);
    const [revealedUsername, setRevealedUsername] = useState<string | null>(
        initialPetugasBaru?.username || null
    );
    const [copied, setCopied] = useState(false);

    // Watch props if new sandi is flashed
    useEffect(() => {
        if (initialSandiBaru) {
            setRevealedSandi(initialSandiBaru);
            setRevealedUsername(initialPetugasBaru?.username || null);
            setModalSandiBuka(true);
        }
    }, [initialSandiBaru, initialPetugasBaru]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
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

    const handleSimpanPetugas = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/petugas', {
            onSuccess: () => {
                tutupModalTambah();
            },
        });
    };

    const handleSalinSandi = () => {
        if (!revealedSandi) return;
        navigator.clipboard.writeText(revealedSandi);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetSandi = (petugas: PetugasData) => {
        if (
            confirm(
                `Apakah Anda yakin ingin mereset kata sandi petugas ${petugas.username}? Sandi lama tidak akan berlaku lagi.`
            )
        ) {
            router.post(`/admin/petugas/${petugas.id}/reset-sandi`);
        }
    };

    const handleToggleStatus = (petugas: PetugasData) => {
        const aksi = petugas.status_akun === 'aktif' ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${aksi} akun ${petugas.username}?`)) {
            router.patch(`/admin/petugas/${petugas.id}/toggle-status`);
        }
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

            {/* Header & Aksi */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Manajemen Akun Staf
                    </h1>
                    <p className="text-sm text-slate-500">
                        Kelola akun petugas Instansi Teknis dan Auditor Independen (FR-ADM-04).
                    </p>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={bukaModalTambah}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Tambah Akun Staf</span>
                    </button>
                </div>
            </div>

            {/* Filter Peran */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <a
                    href="/admin/petugas"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        !peranFilter
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Semua Staf ({daftarPetugas.total})
                </a>
                <a
                    href="/admin/petugas?peran=instansi"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        peranFilter === 'instansi'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Petugas Instansi
                </a>
                <a
                    href="/admin/petugas?peran=auditor"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        peranFilter === 'auditor'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Auditor Independen
                </a>
            </div>

            {/* Tabel Staf */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="p-3.5 pl-4 font-semibold">Username</th>
                                <th className="p-3.5 font-semibold">Peran</th>
                                <th className="p-3.5 font-semibold">Instansi / Unit</th>
                                <th className="p-3.5 font-semibold">Status</th>
                                <th className="p-3.5 font-semibold">Sandi Wajib Ganti</th>
                                <th className="p-3.5 font-semibold">Terdaftar</th>
                                <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {daftarPetugas.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        Tidak ada akun staf ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                daftarPetugas.data.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                                            {p.username}
                                        </td>
                                        <td className="p-3.5">
                                            {p.peran === 'instansi' ? (
                                                <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 font-medium">
                                                    <Building2 className="h-3 w-3" />
                                                    Instansi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 font-medium">
                                                    <Shield className="h-3 w-3" />
                                                    Auditor
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            {p.instansi ? (
                                                <div>
                                                    <span className="font-semibold text-slate-800">
                                                        {p.instansi.singkatan}
                                                    </span>
                                                    <span className="block text-[11px] text-slate-500">
                                                        {p.instansi.nama}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            {p.status_akun === 'aktif' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-medium">
                                                    <UserCheck className="h-3 w-3" />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[11px] font-medium">
                                                    <UserX className="h-3 w-3" />
                                                    {p.status_akun}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            {p.wajib_ganti_sandi ? (
                                                <span className="rounded bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 font-medium">
                                                    Ya
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Tidak</span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-slate-500">
                                            {formatTanggal(p.created_at)}
                                        </td>
                                        <td className="p-3.5 pr-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleResetSandi(p)}
                                                    title="Reset Kata Sandi"
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition"
                                                >
                                                    <RotateCw className="h-3 w-3" />
                                                    <span>Reset</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(p)}
                                                    title={
                                                        p.status_akun === 'aktif'
                                                            ? 'Nonaktifkan Akun'
                                                            : 'Aktifkan Akun'
                                                    }
                                                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition ${
                                                        p.status_akun === 'aktif'
                                                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    <Power className="h-3 w-3" />
                                                    <span>
                                                        {p.status_akun === 'aktif'
                                                            ? 'Nonaktifkan'
                                                            : 'Aktifkan'}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah Staf Baru */}
            {modalTambahBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-teal-600" />
                                <h3 className="font-semibold text-slate-900 text-base">
                                    Tambah Akun Staf Baru
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={tutupModalTambah}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSimpanPetugas} className="p-6 space-y-4">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Username Akun <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="contoh: petugas_bina_marga"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                {errors.username && (
                                    <p className="text-xs text-rose-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Peran */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Peran Akun <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.peran}
                                    onChange={(e) => setData('peran', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="instansi">Petugas Instansi Teknis (OPD)</option>
                                    <option value="auditor">Auditor Independen</option>
                                </select>
                                {errors.peran && (
                                    <p className="text-xs text-rose-600">{errors.peran}</p>
                                )}
                            </div>

                            {/* Instansi (hanya jika peran === 'instansi') */}
                            {data.peran === 'instansi' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Instansi Teknis <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.instansi_id}
                                        onChange={(e) => setData('instansi_id', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="">-- Pilih Instansi --</option>
                                        {daftarInstansi.map((ins) => (
                                            <option key={ins.id} value={ins.id}>
                                                {ins.singkatan} - {ins.nama}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.instansi_id && (
                                        <p className="text-xs text-rose-600">{errors.instansi_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Info Kredensial Awal */}
                            <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 space-y-1">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <KeyRound className="h-4 w-4" />
                                    <span>Kata Sandi Acak Sekali Tampil</span>
                                </div>
                                <p className="text-teal-700">
                                    Sistem akan menghasilkan kata sandi acak aman secara otomatis. Anda dapat menyalinnya setelah akun berhasil disimpan.
                                </p>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={tutupModalTambah}
                                    disabled={processing}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Kredensial Sekali Tampil */}
            {modalSandiBuka && revealedSandi && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
                        <div className="bg-amber-500 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                <h3 className="font-bold text-sm">
                                    Kredensial Akun Baru / Reset
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalSandiBuka(false)}
                                className="text-white/80 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-xs text-slate-600">
                                Kata sandi sementara telah dibuat untuk{' '}
                                <strong className="text-slate-900 font-mono">
                                    {revealedUsername || 'pengguna'}
                                </strong>
                                . Berikan kata sandi ini kepada pemilik akun. Akun akan diwajibkan mengganti kata sandi pada login pertama.
                            </p>

                            <div className="rounded-lg bg-slate-900 p-4 text-white flex items-center justify-between">
                                <span className="font-mono text-base font-bold tracking-widest text-emerald-400">
                                    {revealedSandi}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSalinSandi}
                                    className="inline-flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span>Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>
                                    PENTING: Kata sandi ini hanya ditampilkan satu kali dan tidak akan bisa dilihat kembali demi keamanan Zero-Knowledge.
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalSandiBuka(false)}
                                className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                            >
                                Saya Sudah Menyimpan Kata Sandi Ini
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

PetugasPage.layout = (page: ReactNode) => (
    <InternalLayout title="Akun Staf" breadcrumb="Admin > Manajemen">
        {page}
    </InternalLayout>
);
