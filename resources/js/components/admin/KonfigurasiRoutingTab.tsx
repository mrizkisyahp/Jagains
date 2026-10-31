import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { GitBranch, Plus, X, AlertTriangle, Edit2, Trash2, Info } from 'lucide-react';
import { InstansiRow, KategoriRow, WilayahRow } from './KonfigurasiMasterDataTab';

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

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
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

    const handleHapus = (r: AturanRoutingRow) => {
        const pesan = `Hapus aturan routing untuk "${r.kategori?.nama || 'Kategori'}" di "${r.wilayah?.nama || 'Wilayah'}"?\n\nFallback: Tiket berikutnya akan otomatis fallback ke aturan tingkat wilayah di atasnya (Kecamatan/Kota Depok) atau masuk antrean disposisi manual (FR-ADM-05).`;
        if (confirm(pesan)) {
            router.delete(`/admin/konfigurasi/routing/${r.id}`);
        }
    };

    const simpanAturan = (e: React.FormEvent) => {
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

    // Deteksi bentrok prioritas (BR-STS-05 & FR-ADM-02)
    const deteksiBentrok = (r: AturanRoutingRow) => {
        return aturanRouting.some(
            (other) =>
                other.id !== r.id &&
                other.kategori_id === r.kategori_id &&
                other.wilayah_id === r.wilayah_id &&
                other.prioritas === r.prioritas
        );
    };

    // Deteksi aturan yang sama persis (untuk indikator fallback update)
    const isExactDuplicate = aturanRouting.some(
        (other) =>
            other.id !== editRoutingId &&
            other.kategori_id === data.kategori_id &&
            other.wilayah_id === data.wilayah_id &&
            other.instansi_id === data.instansi_id
    );

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-teal-600" />
                            <span>Aturan Disposisi Routing Tiket (FR-ADM-02)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                            Pemetaan otomatis kategori kerusakan dan wilayah ke OPD penanggung jawab berdasarkan urutan prioritas.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={bukaModalTambah}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Aturan Routing</span>
                    </button>
                </div>

                {/* Banner Fallback Info */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                        <strong>Hierarki Fallback Evaluasi (BR-STS-05):</strong> Kelurahan &gt; Kecamatan &gt; Kota Depok. Bila tidak ada aturan cocok atau instansi dinonaktifkan, tiket otomatis masuk ke <strong>Antrean Routing Manual (FR-ADM-05)</strong>.
                    </span>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="p-3.5 pl-4 font-semibold">Prioritas</th>
                                <th className="p-3.5 font-semibold">Kategori Kerusakan</th>
                                <th className="p-3.5 font-semibold">Cakupan Wilayah</th>
                                <th className="p-3.5 font-semibold">Instansi Penanggung Jawab</th>
                                <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {aturanRouting.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">
                                        Belum ada aturan routing disposisi yang dikonfigurasi.
                                    </td>
                                </tr>
                            ) : (
                                aturanRouting.map((r) => {
                                    const bentrok = deteksiBentrok(r);
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/70 transition">
                                            <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="rounded bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 font-semibold">
                                                        #{r.prioritas}
                                                    </span>
                                                    {bentrok && (
                                                        <span
                                                            className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5"
                                                            title="Potensi bentrok prioritas dengan aturan lain pada kategori dan wilayah yang sama"
                                                        >
                                                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                                                            <span>Bentrok</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3.5 font-medium text-slate-900">
                                                {r.kategori?.nama || `Kategori #${r.kategori_id}`}
                                            </td>
                                            <td className="p-3.5">
                                                <span className="text-slate-700 font-medium">
                                                    {r.wilayah?.nama || `Wilayah #${r.wilayah_id}`}
                                                </span>
                                                <span className="block text-[10px] text-slate-400 capitalize">
                                                    {r.wilayah?.tingkat}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                <span className="font-semibold text-slate-800">
                                                    {r.instansi?.singkatan}
                                                </span>
                                                <span className="block text-[11px] text-slate-500">
                                                    {r.instansi?.nama}
                                                </span>
                                            </td>
                                            <td className="p-3.5 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => bukaModalEdit(r)}
                                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition shadow-sm font-medium"
                                                        title="Ubah Aturan Routing"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                        <span>Ubah</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleHapus(r)}
                                                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 hover:bg-rose-100 transition shadow-sm font-medium"
                                                        title="Hapus Aturan Routing"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        <span>Hapus</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah/Edit Routing */}
            {modalBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-900 text-base">
                                {editRoutingId ? 'Ubah Aturan Disposisi Routing' : 'Tambah Aturan Disposisi Routing'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalBuka(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={simpanAturan} className="p-6 space-y-4">
                            {/* Fallback Duplicate Notice */}
                            {isExactDuplicate && (
                                <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 flex items-start gap-2">
                                    <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Aturan Serupa Ditemukan:</strong> Kombinasi Kategori, Wilayah, dan Instansi ini sudah terdaftar. Menyimpan form ini akan melakukan <em>fallback update</em> pada prioritas aturan yang ada tanpa menimbulkan duplikasi.
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Kategori Kerusakan <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.kategori_id}
                                    onChange={(e) => setData('kategori_id', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    {masterKategori.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.kategori_id && (
                                    <p className="text-xs text-rose-600">{errors.kategori_id}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Cakupan Wilayah <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.wilayah_id}
                                    onChange={(e) => setData('wilayah_id', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    {masterWilayah.slice(0, 50).map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.nama} ({w.tingkat})
                                        </option>
                                    ))}
                                </select>
                                {errors.wilayah_id && (
                                    <p className="text-xs text-rose-600">{errors.wilayah_id}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Instansi Penanggung Jawab <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.instansi_id}
                                    onChange={(e) => setData('instansi_id', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    {masterInstansi.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.singkatan} - {i.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.instansi_id && (
                                    <p className="text-xs text-rose-600">{errors.instansi_id}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Nilai Prioritas (1 - 1000) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={data.prioritas}
                                    onChange={(e) => setData('prioritas', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">
                                    Angka lebih kecil diprioritaskan lebih dulu ketika ada aturan yang beririsan.
                                </p>
                                {errors.prioritas && (
                                    <p className="text-xs text-rose-600">{errors.prioritas}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                >
                                    {editRoutingId ? 'Simpan Perubahan' : 'Simpan Aturan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
