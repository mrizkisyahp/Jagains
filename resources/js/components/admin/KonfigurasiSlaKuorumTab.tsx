import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Clock, Users, Edit2, X, Save } from 'lucide-react';
import { KategoriRow, WilayahRow } from './KonfigurasiMasterDataTab';

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
    const [selectedWilayahNama, setSelectedWilayahNama] = useState<string | null>(null);

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

    const simpanSla = (e: React.FormEvent) => {
        e.preventDefault();
        formSla.post('/admin/konfigurasi/sla', {
            onSuccess: () => setModalSlaBuka(false),
        });
    };

    const simpanKuorum = (e: React.FormEvent) => {
        e.preventDefault();
        formKuorum.post('/admin/konfigurasi/kuorum', {
            onSuccess: () => setModalKuorumBuka(false),
        });
    };

    return (
        <div className="space-y-6">
            {/* Bagian 1: Standar SLA Hari Kerja */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-teal-600" />
                            <span>Standar Batas Waktu Pelayanan (SLA Hari Kerja)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                            Batas waktu operasional instansi berdasarkan kategori kerusakan fasilitas (BR-SLA-01).
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={bukaTambahSla}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                    >
                        <span>Ubah Standar SLA</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="p-3.5 pl-4 font-semibold">Kategori</th>
                                <th className="p-3.5 font-semibold">Respons Awal</th>
                                <th className="p-3.5 font-semibold">Survei Lapangan</th>
                                <th className="p-3.5 font-semibold">Penjadwalan Anggaran</th>
                                <th className="p-3.5 font-semibold">Jawab Sengketa</th>
                                <th className="p-3.5 font-semibold">Jendela Verifikasi</th>
                                <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {aturanSla.map((sla) => (
                                <tr key={sla.id} className="hover:bg-slate-50/70 transition">
                                    <td className="p-3.5 pl-4 font-semibold text-slate-900">
                                        {sla.kategori?.nama || `Kategori #${sla.kategori_id}`}
                                    </td>
                                    <td className="p-3.5 font-mono text-teal-700">
                                        {sla.batas_respons_hk} hari kerja
                                    </td>
                                    <td className="p-3.5 font-mono text-slate-700">
                                        {sla.batas_survei_hk} hari kerja
                                    </td>
                                    <td className="p-3.5 font-mono text-slate-700">
                                        {sla.batas_anggaran_hk} hari kerja
                                    </td>
                                    <td className="p-3.5 font-mono text-amber-700">
                                        {sla.batas_jawab_sengketa_hk} hari kerja
                                    </td>
                                    <td className="p-3.5 font-mono text-slate-700">
                                        {sla.batas_verifikasi_hari} hari kalender
                                    </td>
                                    <td className="p-3.5 pr-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => bukaEditSla(sla)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition shadow-sm font-medium"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            <span>Ubah</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bagian 2: Parameter Formula Kuorum Warga */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-teal-600" />
                            <span>Formula Kuorum Verifikasi Warga (BR-QRM-01 s/d BR-QRM-03)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                            Parameter rumus dinamis kuorum K = clamp(k × N, Kmin, Kmax). Pembaruan tidak mengubah tiket aktif.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={bukaTambahKuorum}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                    >
                        <span>Ubah Parameter Kuorum</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="p-3.5 pl-4 font-semibold">Wilayah Cakupan</th>
                                <th className="p-3.5 font-semibold">Persentase Pemilih (k)</th>
                                <th className="p-3.5 font-semibold">Batas Minimum (Kmin)</th>
                                <th className="p-3.5 font-semibold">Batas Maksimum (Kmax)</th>
                                <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {parameterKuorum.map((q) => (
                                <tr key={q.id} className="hover:bg-slate-50/70 transition">
                                    <td className="p-3.5 pl-4 font-semibold text-slate-900">
                                        {q.wilayah?.nama || `Wilayah #${q.wilayah_id}`}
                                        <span className="block text-[10px] text-slate-400 font-normal capitalize">
                                            {q.wilayah?.tingkat}
                                        </span>
                                    </td>
                                    <td className="p-3.5 font-mono text-teal-700">
                                        {(q.k_bp / 100).toFixed(2)}% ({q.k_bp} bp)
                                    </td>
                                    <td className="p-3.5 font-mono text-slate-700">
                                        {Number(q.kmin).toFixed(1)} suara
                                    </td>
                                    <td className="p-3.5 font-mono text-slate-700">
                                        {Number(q.kmax).toFixed(1)} suara
                                    </td>
                                    <td className="p-3.5 pr-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => bukaEditKuorum(q)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition shadow-sm font-medium"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            <span>Ubah</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal SLA */}
            {modalSlaBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-900 text-base">
                                {masterKategori.find((k) => k.id === formSla.data.kategori_id)
                                    ? `Atur Standar SLA (${masterKategori.find((k) => k.id === formSla.data.kategori_id)?.nama})`
                                    : 'Atur Standar SLA Kategori'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalSlaBuka(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={simpanSla} className="p-6 space-y-3">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Kategori</label>
                                <select
                                    value={formSla.data.kategori_id}
                                    onChange={(e) => formSla.setData('kategori_id', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    {masterKategori.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Respons (HK)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formSla.data.batas_respons_hk}
                                        onChange={(e) => formSla.setData('batas_respons_hk', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Survei (HK)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formSla.data.batas_survei_hk}
                                        onChange={(e) => formSla.setData('batas_survei_hk', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Anggaran (HK)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formSla.data.batas_anggaran_hk}
                                        onChange={(e) => formSla.setData('batas_anggaran_hk', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Sengketa (HK)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formSla.data.batas_jawab_sengketa_hk}
                                        onChange={(e) => formSla.setData('batas_jawab_sengketa_hk', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Verifikasi Warga (Hari Kalender)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formSla.data.batas_verifikasi_hari}
                                    onChange={(e) => formSla.setData('batas_verifikasi_hari', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalSlaBuka(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSla.processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                >
                                    Simpan SLA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Kuorum */}
            {modalKuorumBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-900 text-base">
                                {selectedWilayahNama
                                    ? `Ubah Parameter Kuorum (${selectedWilayahNama})`
                                    : 'Atur Parameter Kuorum Wilayah'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalKuorumBuka(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={simpanKuorum} className="p-6 space-y-3">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Wilayah Cakupan</label>
                                <select
                                    value={formKuorum.data.wilayah_id}
                                    onChange={(e) => {
                                        const id = Number(e.target.value);
                                        formKuorum.setData('wilayah_id', id);
                                        const w = masterWilayah.find((x) => x.id === id);
                                        setSelectedWilayahNama(w ? w.nama : null);
                                    }}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    {masterWilayah.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.nama} ({w.tingkat})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Persentase Pemilih k (Basis Points)
                                    </label>
                                    <span className="font-mono text-xs font-semibold text-teal-600">
                                        {(formKuorum.data.k_bp / 100).toFixed(2)}%
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={formKuorum.data.k_bp}
                                    onChange={(e) => formKuorum.setData('k_bp', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                />
                                <p className="text-[11px] text-slate-500">
                                    200 bp setara dengan 2.00% dari jumlah pemilih (N) wilayah kelurahan.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Kmin (Batas Bawah)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={formKuorum.data.kmin}
                                        onChange={(e) => formKuorum.setData('kmin', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Kmax (Batas Atas)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={formKuorum.data.kmax}
                                        onChange={(e) => formKuorum.setData('kmax', Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalKuorumBuka(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formKuorum.processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                >
                                    Simpan Kuorum
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
