import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Edit2, Save, X, Settings2, History } from 'lucide-react';

export interface PengaturanRow {
    key: string;
    nilai: string;
    tipe: string;
    versi: number;
    diubah_oleh: number | null;
    waktu: string | null;
    pengubah?: {
        id: number;
        username: string;
    } | null;
}

interface KonfigurasiParameterTabProps {
    pengaturan: PengaturanRow[];
}

export default function KonfigurasiParameterTab({ pengaturan }: KonfigurasiParameterTabProps) {
    const [editingKey, setEditingKey] = useState<string | null>(null);

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        nilai: '',
        alasan: '',
    });

    const mulaiEdit = (param: PengaturanRow) => {
        setEditingKey(param.key);
        setData({
            nilai: param.nilai,
            alasan: '',
        });
        clearErrors();
    };

    const batalEdit = () => {
        setEditingKey(null);
        reset();
        clearErrors();
    };

    const simpanParam = (key: string) => {
        put(`/admin/konfigurasi/parameter/${key}`, {
            onSuccess: () => {
                setEditingKey(null);
                reset();
            },
        });
    };

    const formatTanggal = (iso: string | null) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-teal-600" />
                            <span>Parameter Global Sistem (P-01 s/d P-25)</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                            Konfigurasi operasional tingkat aplikasi dengan pencatatan nomor versi dan audit log.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="p-3.5 pl-4 font-semibold">Key Parameter</th>
                                <th className="p-3.5 font-semibold">Tipe</th>
                                <th className="p-3.5 font-semibold">Nilai Konfigurasi</th>
                                <th className="p-3.5 font-semibold">Versi</th>
                                <th className="p-3.5 font-semibold">Pengubah Terakhir</th>
                                <th className="p-3.5 pr-4 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {pengaturan.map((param) => {
                                const isEditing = editingKey === param.key;
                                return (
                                    <tr key={param.key} className="hover:bg-slate-50/70 transition">
                                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                                            {param.key}
                                        </td>
                                        <td className="p-3.5">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                                                {param.tipe}
                                            </span>
                                        </td>
                                        <td className="p-3.5">
                                            {isEditing ? (
                                                <div className="space-y-1.5 max-w-xs">
                                                    <input
                                                        type="text"
                                                        value={data.nilai}
                                                        onChange={(e) => setData('nilai', e.target.value)}
                                                        className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Alasan perubahan (opsional)..."
                                                        value={data.alasan}
                                                        onChange={(e) => setData('alasan', e.target.value)}
                                                        className="w-full rounded border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 focus:border-teal-500 focus:outline-none"
                                                    />
                                                    {errors.nilai && (
                                                        <p className="text-[10px] text-rose-600">{errors.nilai}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="font-mono font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                                                    {param.nilai}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600">
                                                <History className="h-3 w-3 text-slate-400" />
                                                v{param.versi}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-slate-500">
                                            <div>
                                                <span className="font-medium text-slate-700">
                                                    {param.pengubah?.username || 'Sistem / Seeder'}
                                                </span>
                                                <span className="block text-[10px] text-slate-400">
                                                    {formatTanggal(param.waktu)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 pr-4 text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={processing}
                                                        onClick={() => simpanParam(param.key)}
                                                        className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 text-white hover:bg-teal-700 transition"
                                                    >
                                                        <Save className="h-3 w-3" />
                                                        <span>Simpan</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={batalEdit}
                                                        className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => mulaiEdit(param)}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    <span>Ubah</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
