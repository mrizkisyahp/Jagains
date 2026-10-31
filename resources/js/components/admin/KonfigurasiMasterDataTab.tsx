import { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { Building2, Plus, Edit2, X, Layers, MapPin, Search } from 'lucide-react';

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
    const [subTab, setSubTab] = useState<'instansi' | 'kategori' | 'wilayah'>('instansi');

    // State Instansi
    const [modalInstansiBuka, setModalInstansiBuka] = useState(false);
    const [editInstansiId, setEditInstansiId] = useState<number | null>(null);

    // State Kategori
    const [modalKategoriBuka, setModalKategoriBuka] = useState(false);
    const [editKategoriId, setEditKategoriId] = useState<number | null>(null);

    // State Wilayah
    const [modalWilayahBuka, setModalWilayahBuka] = useState(false);
    const [editWilayahId, setEditWilayahId] = useState<number | null>(null);
    const [searchWilayah, setSearchWilayah] = useState('');
    const [filterTingkatWilayah, setFilterTingkatWilayah] = useState('');

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

    const simpanInstansi = (e: React.FormEvent) => {
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

    const simpanKategori = (e: React.FormEvent) => {
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
        const kotaDefault = masterWilayah.find((w) => w.tingkat === 'kecamatan') || masterWilayah[0];
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

    const simpanWilayah = (e: React.FormEvent) => {
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

    // Filter Wilayah
    const wilayahTersaring = useMemo(() => {
        return masterWilayah.filter((wil) => {
            const cocokNama =
                !searchWilayah ||
                wil.nama.toLowerCase().includes(searchWilayah.toLowerCase()) ||
                (wil.kode_bps && wil.kode_bps.toLowerCase().includes(searchWilayah.toLowerCase()));
            const cocokTingkat = !filterTingkatWilayah || wil.tingkat === filterTingkatWilayah;
            return cocokNama && cocokTingkat;
        });
    }, [masterWilayah, searchWilayah, filterTingkatWilayah]);

    return (
        <div className="space-y-4">
            {/* Sub-tab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    type="button"
                    onClick={() => setSubTab('instansi')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        subTab === 'instansi'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Instansi Teknis ({masterInstansi.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('kategori')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        subTab === 'kategori'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Kategori Kerusakan ({masterKategori.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('wilayah')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        subTab === 'wilayah'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Wilayah Administratif ({masterWilayah.length})</span>
                </button>
            </div>

            {/* Sub-Tab 1: Instansi */}
            {subTab === 'instansi' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-900 text-sm">Daftar Instansi Teknis</h4>
                            <p className="text-xs text-slate-500">
                                Organisasi Perangkat Daerah (OPD) penanggung jawab pekerjaan fisik di lapangan.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={bukaTambahInstansi}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Instansi</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs min-w-[650px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5 pl-4 font-semibold">Singkatan</th>
                                    <th className="p-3.5 font-semibold">Nama Lengkap Instansi</th>
                                    <th className="p-3.5 font-semibold">Wilayah Induk</th>
                                    <th className="p-3.5 font-semibold">Status</th>
                                    <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {masterInstansi.map((ins) => (
                                    <tr key={ins.id} className="hover:bg-slate-50/70 transition">
                                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                                            {ins.singkatan}
                                        </td>
                                        <td className="p-3.5 font-medium text-slate-800">{ins.nama}</td>
                                        <td className="p-3.5 text-slate-500">{ins.wilayah?.nama || '-'}</td>
                                        <td className="p-3.5">
                                            {ins.aktif ? (
                                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 pr-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => bukaEditInstansi(ins)}
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
            )}

            {/* Sub-Tab 2: Kategori */}
            {subTab === 'kategori' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-900 text-sm">Daftar Kategori Kerusakan</h4>
                            <p className="text-xs text-slate-500">
                                Klasifikasi fasilitas publik dan batas radius deteksi kemiripan/duplikasi aduan (meter).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={bukaTambahKategori}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Kategori</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs min-w-[650px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5 pl-4 font-semibold">ID</th>
                                    <th className="p-3.5 font-semibold">Nama Kategori Kerusakan</th>
                                    <th className="p-3.5 font-semibold">Radius Deteksi Duplikat</th>
                                    <th className="p-3.5 font-semibold">Status</th>
                                    <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {masterKategori.map((kat) => (
                                    <tr key={kat.id} className="hover:bg-slate-50/70 transition">
                                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                                            #{kat.id}
                                        </td>
                                        <td className="p-3.5 font-medium text-slate-900">{kat.nama}</td>
                                        <td className="p-3.5 text-slate-600 font-mono">
                                            {kat.radius_gabung_m ?? 25} meter
                                        </td>
                                        <td className="p-3.5">
                                            {kat.aktif ? (
                                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 pr-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => bukaEditKategori(kat)}
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
            )}

            {/* Sub-Tab 3: Wilayah */}
            {subTab === 'wilayah' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h4 className="font-semibold text-slate-900 text-sm">Daftar Wilayah Administratif</h4>
                            <p className="text-xs text-slate-500">
                                Struktur hierarki teritorial Kota, Kecamatan, dan Kelurahan di Kota Depok.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={bukaTambahWilayah}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Wilayah</span>
                        </button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-2 text-xs">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchWilayah}
                                onChange={(e) => setSearchWilayah(e.target.value)}
                                placeholder="Cari nama wilayah atau kode BPS..."
                                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                            />
                        </div>
                        <select
                            value={filterTingkatWilayah}
                            onChange={(e) => setFilterTingkatWilayah(e.target.value)}
                            className="w-full sm:w-44 h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                        >
                            <option value="">Semua Tingkat</option>
                            <option value="kota">Kota</option>
                            <option value="kecamatan">Kecamatan</option>
                            <option value="kelurahan">Kelurahan</option>
                        </select>
                        <span className="text-slate-500 text-[11px] sm:ml-auto">
                            Menampilkan <strong>{Math.min(wilayahTersaring.length, 50)}</strong> dari <strong>{wilayahTersaring.length}</strong> wilayah
                        </span>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs min-w-[650px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5 pl-4 font-semibold">Kode BPS</th>
                                    <th className="p-3.5 font-semibold">Nama Wilayah</th>
                                    <th className="p-3.5 font-semibold">Tingkat</th>
                                    <th className="p-3.5 font-semibold">Wilayah Induk</th>
                                    <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {wilayahTersaring.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400">
                                            Tidak ada wilayah yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    wilayahTersaring.slice(0, 50).map((wil) => (
                                        <tr key={wil.id} className="hover:bg-slate-50/70 transition">
                                            <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                                                {wil.kode_bps || wil.kode || '-'}
                                            </td>
                                            <td className="p-3.5 font-medium text-slate-900">{wil.nama}</td>
                                            <td className="p-3.5 capitalize">
                                                <span
                                                    className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                                        wil.tingkat === 'kota'
                                                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                            : wil.tingkat === 'kecamatan'
                                                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    }`}
                                                >
                                                    {wil.tingkat}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-slate-600">
                                                {wil.induk?.nama || (wil.tingkat === 'kota' ? 'Pusat (Pemerintah Kota)' : '-')}
                                            </td>
                                            <td className="p-3.5 pr-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => bukaEditWilayah(wil)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition shadow-sm font-medium"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    <span>Ubah</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Instansi */}
            {modalInstansiBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-900 text-base">
                                {editInstansiId ? 'Ubah Data Instansi' : 'Tambah Instansi Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalInstansiBuka(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={simpanInstansi} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Singkatan OPD <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formInstansi.data.singkatan}
                                    onChange={(e) => formInstansi.setData('singkatan', e.target.value)}
                                    placeholder="contoh: DISHUB"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                    required
                                />
                                {formInstansi.errors.singkatan && (
                                    <p className="text-xs text-rose-600">{formInstansi.errors.singkatan}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Nama Lengkap Instansi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formInstansi.data.nama}
                                    onChange={(e) => formInstansi.setData('nama', e.target.value)}
                                    placeholder="contoh: Dinas Perhubungan Kota Depok"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                    required
                                />
                                {formInstansi.errors.nama && (
                                    <p className="text-xs text-rose-600">{formInstansi.errors.nama}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Wilayah Induk <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formInstansi.data.wilayah_id}
                                    onChange={(e) => formInstansi.setData('wilayah_id', Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    {masterWilayah
                                        .filter((w) => w.tingkat === 'kota' || w.tingkat === 'provinsi')
                                        .map((w) => (
                                            <option key={w.id} value={w.id}>
                                                {w.nama} ({w.tingkat})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="instansi_aktif"
                                    checked={formInstansi.data.aktif}
                                    onChange={(e) => formInstansi.setData('aktif', e.target.checked)}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <label htmlFor="instansi_aktif" className="text-xs font-semibold text-slate-700">
                                    Status Instansi Aktif
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalInstansiBuka(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formInstansi.processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Kategori */}
            {modalKategoriBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-900 text-base">
                                {editKategoriId ? 'Ubah Data Kategori Kerusakan' : 'Tambah Kategori Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalKategoriBuka(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={simpanKategori} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Nama Kategori Kerusakan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formKategori.data.nama}
                                    onChange={(e) => formKategori.setData('nama', e.target.value)}
                                    placeholder="contoh: Jalan Berlubang, Jembatan Rusak"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                    required
                                />
                                {formKategori.errors.nama && (
                                    <p className="text-xs text-rose-600">{formKategori.errors.nama}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Radius Deteksi Duplikat (meter) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formKategori.data.radius_gabung_m}
                                    onChange={(e) => formKategori.setData('radius_gabung_m', Number(e.target.value))}
                                    min={5}
                                    max={500}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                    required
                                />
                                <p className="text-[11px] text-slate-500">
                                    Radius toleransi GPS untuk mendeteksi laporan serupa yang berdekatan.
                                </p>
                                {formKategori.errors.radius_gabung_m && (
                                    <p className="text-xs text-rose-600">{formKategori.errors.radius_gabung_m}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="kategori_aktif"
                                    checked={formKategori.data.aktif}
                                    onChange={(e) => formKategori.setData('aktif', e.target.checked)}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <label htmlFor="kategori_aktif" className="text-xs font-semibold text-slate-700">
                                    Status Kategori Aktif
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalKategoriBuka(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formKategori.processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Wilayah */}
            {modalWilayahBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-900 text-base">
                                {editWilayahId ? 'Ubah Data Wilayah Administratif' : 'Tambah Wilayah Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalWilayahBuka(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={simpanWilayah} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Tingkat Wilayah <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formWilayah.data.tingkat}
                                    onChange={(e) => {
                                        const t = e.target.value;
                                        formWilayah.setData('tingkat', t);
                                        if (t === 'kota') {
                                            formWilayah.setData('induk_id', '');
                                        }
                                    }}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                >
                                    <option value="kelurahan">Kelurahan</option>
                                    <option value="kecamatan">Kecamatan</option>
                                    <option value="kota">Kota</option>
                                </select>
                                {formWilayah.errors.tingkat && (
                                    <p className="text-xs text-rose-600">{formWilayah.errors.tingkat}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Nama Wilayah <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formWilayah.data.nama}
                                    onChange={(e) => formWilayah.setData('nama', e.target.value)}
                                    placeholder="contoh: Beji, Sukamaju Baru"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                    required
                                />
                                {formWilayah.errors.nama && (
                                    <p className="text-xs text-rose-600">{formWilayah.errors.nama}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Kode BPS (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={formWilayah.data.kode_bps}
                                    onChange={(e) => formWilayah.setData('kode_bps', e.target.value)}
                                    placeholder="contoh: 3276010001"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                />
                                {formWilayah.errors.kode_bps && (
                                    <p className="text-xs text-rose-600">{formWilayah.errors.kode_bps}</p>
                                )}
                            </div>

                            {formWilayah.data.tingkat !== 'kota' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Wilayah Induk <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formWilayah.data.induk_id}
                                        onChange={(e) => formWilayah.setData('induk_id', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                                        required
                                    >
                                        <option value="">-- Pilih Wilayah Induk --</option>
                                        {masterWilayah
                                            .filter((w) =>
                                                formWilayah.data.tingkat === 'kelurahan'
                                                    ? w.tingkat === 'kecamatan'
                                                    : w.tingkat === 'kota'
                                            )
                                            .map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    {w.nama} ({w.tingkat})
                                                </option>
                                            ))}
                                    </select>
                                    {formWilayah.errors.induk_id && (
                                        <p className="text-xs text-rose-600">{formWilayah.errors.induk_id}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalWilayahBuka(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formWilayah.processing}
                                    className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
