import { useState } from 'react';
import {
    AlertTriangle,
    Eye,
    Lock,
    Shield,
    User,
    X,
    Calendar,
    MapPin,
    FileText,
} from 'lucide-react';

interface PelaporInfo {
    id: number;
    username: string;
    status_akun: string;
    poin_peringatan: number;
    kelurahan: string | null;
    jumlah_laporan: number;
    terdaftar_pada: string;
}

interface ModalBukaIdentitasPelaporProps {
    nomorTiket: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ModalBukaIdentitasPelapor({
    nomorTiket,
    isOpen,
    onClose,
}: ModalBukaIdentitasPelaporProps) {
    const [alasan, setAlasan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pelaporData, setPelaporData] = useState<PelaporInfo | null>(null);

    if (!isOpen) return null;

    const handleTutup = () => {
        setAlasan('');
        setError(null);
        setPelaporData(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

            const response = await fetch(`/api/tiket/${nomorTiket}/buka-identitas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({ alasan }),
            });

            const resData = await response.json();

            if (!response.ok) {
                if (resData.errors?.alasan) {
                    setError(resData.errors.alasan[0]);
                } else {
                    setError(resData.message || resData.pesan || 'Gagal membuka identitas.');
                }
                setLoading(false);
                return;
            }

            setPelaporData(resData.pelapor);
        } catch {
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    const formatTanggal = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        <h3 className="font-bold text-base">
                            Pembukaan Identitas Pelapor (Khusus Investigasi)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleTutup}
                        className="rounded-lg p-1 text-white/80 hover:text-white hover:bg-rose-700 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Hasil Tampil Data Pelapor */}
                    {pelaporData ? (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                                Identitas pelapor berhasil dibuka dan dicatat secara permanen di Audit Log Anti-Tamper.
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-slate-200 p-2.5 text-slate-600">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {pelaporData.username}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            ID Pengguna: #{pelaporData.id}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                                    <div>
                                        <span className="text-slate-500">Status Akun:</span>
                                        <span className="font-semibold text-slate-800 block capitalize">
                                            {pelaporData.status_akun}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Poin Peringatan:</span>
                                        <span className="font-semibold text-slate-800 block">
                                            {pelaporData.poin_peringatan}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Wilayah Domisili:</span>
                                        <span className="font-semibold text-slate-800 block">
                                            {pelaporData.kelurahan || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Total Aduan Dikirim:</span>
                                        <span className="font-semibold text-slate-800 block">
                                            {pelaporData.jumlah_laporan} tiket
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-500">Terdaftar Sejak:</span>
                                        <span className="font-semibold text-slate-800 block">
                                            {formatTanggal(pelaporData.terdaftar_pada)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleTutup}
                                className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                            >
                                Selesai
                            </button>
                        </div>
                    ) : (
                        /* Form Alasan Investigasi */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex gap-2">
                                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                                <div>
                                    <strong className="block font-semibold">
                                        PERINGATAN HUKUM & PRIVASI ZERO-KNOWLEDGE
                                    </strong>
                                    <span>
                                        Sistem Jagains melindungi identitas pelapor. Tindakan ini hanya boleh dilakukan untuk keperluan investigasi hukum atau audit resmi. Aksi ini, identitas Anda, dan alasan tertulis akan dicatat secara permanen di Audit Log Anti-Tamper.
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Alasan Investigasi Hukum / Audit <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={alasan}
                                    onChange={(e) => setAlasan(e.target.value)}
                                    rows={3}
                                    placeholder="Tuliskan nomor surat tugas, dasar hukum, atau alasan audit resmi (minimal 10 karakter)..."
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                                <div className="flex justify-between text-[11px] text-slate-400">
                                    <span>Minimal 10 karakter</span>
                                    <span className={alasan.length < 10 ? 'text-amber-600' : 'text-slate-600'}>
                                        {alasan.length} karakter
                                    </span>
                                </div>
                                {error && <p className="text-xs text-rose-600">{error}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleTutup}
                                    disabled={loading}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || alasan.length < 10}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>{loading ? 'Membuka...' : 'Buka Identitas & Catat Audit'}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
