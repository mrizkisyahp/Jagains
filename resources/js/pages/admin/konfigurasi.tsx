import { ReactNode, useState } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import KonfigurasiParameterTab, { PengaturanRow } from '@/components/admin/KonfigurasiParameterTab';
import KonfigurasiMasterDataTab, {
    InstansiRow,
    KategoriRow,
    WilayahRow,
} from '@/components/admin/KonfigurasiMasterDataTab';
import KonfigurasiRoutingTab, { AturanRoutingRow } from '@/components/admin/KonfigurasiRoutingTab';
import KonfigurasiSlaKuorumTab, {
    AturanSlaRow,
    ParameterKuorumRow,
} from '@/components/admin/KonfigurasiSlaKuorumTab';
import { Settings, Database, GitBranch, Sliders } from 'lucide-react';

interface KonfigurasiPageProps {
    pengaturan: PengaturanRow[];
    masterInstansi: InstansiRow[];
    masterKategori: KategoriRow[];
    masterWilayah: WilayahRow[];
    aturanRouting: AturanRoutingRow[];
    aturanSla: AturanSlaRow[];
    parameterKuorum: ParameterKuorumRow[];
}

export default function KonfigurasiPage({
    pengaturan,
    masterInstansi,
    masterKategori,
    masterWilayah,
    aturanRouting,
    aturanSla,
    parameterKuorum,
}: KonfigurasiPageProps) {
    const [tabAktif, setTabAktif] = useState<'parameter' | 'master' | 'routing' | 'sla'>('parameter');

    return (
        <div className="space-y-6">
            <Head title="Konfigurasi & Parameter Sistem - Jagains Admin" />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Konfigurasi & Parameter Sistem
                </h1>
                <p className="text-sm text-slate-500">
                    Pengaturan dinamis aturan routing (FR-ADM-02), standar batas waktu SLA & formula kuorum (FR-ADM-03), serta master data (FR-ADM-01).
                </p>
            </div>

            {/* Main Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                    type="button"
                    onClick={() => setTabAktif('parameter')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        tabAktif === 'parameter'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    <span>Parameter Sistem (P-01 s/d P-25)</span>
                </button>

                <button
                    type="button"
                    onClick={() => setTabAktif('master')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        tabAktif === 'master'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Database className="h-4 w-4" />
                    <span>Master Data OPD & Wilayah</span>
                </button>

                <button
                    type="button"
                    onClick={() => setTabAktif('routing')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        tabAktif === 'routing'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <GitBranch className="h-4 w-4" />
                    <span>Aturan Routing Disposisi</span>
                </button>

                <button
                    type="button"
                    onClick={() => setTabAktif('sla')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        tabAktif === 'sla'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Sliders className="h-4 w-4" />
                    <span>SLA Kerja & Kuorum Warga</span>
                </button>
            </div>

            {/* Tab Contents */}
            {tabAktif === 'parameter' && <KonfigurasiParameterTab pengaturan={pengaturan} />}
            {tabAktif === 'master' && (
                <KonfigurasiMasterDataTab
                    masterInstansi={masterInstansi}
                    masterKategori={masterKategori}
                    masterWilayah={masterWilayah}
                />
            )}
            {tabAktif === 'routing' && (
                <KonfigurasiRoutingTab
                    aturanRouting={aturanRouting}
                    masterKategori={masterKategori}
                    masterWilayah={masterWilayah}
                    masterInstansi={masterInstansi}
                />
            )}
            {tabAktif === 'sla' && (
                <KonfigurasiSlaKuorumTab
                    aturanSla={aturanSla}
                    parameterKuorum={parameterKuorum}
                    masterKategori={masterKategori}
                    masterWilayah={masterWilayah}
                />
            )}
        </div>
    );
}

KonfigurasiPage.layout = (page: ReactNode) => (
    <InternalLayout title="Parameter" breadcrumb="Admin > Pengaturan">
        {page}
    </InternalLayout>
);
