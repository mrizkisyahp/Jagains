import { type ReactNode, useState } from 'react';
import { Head } from '@inertiajs/react';
import InternalLayout from '@/layouts/InternalLayout';
import KonfigurasiParameterTab, {
    PengaturanRow,
} from '@/components/admin/KonfigurasiParameterTab';
import KonfigurasiMasterDataTab, {
    InstansiRow,
    KategoriRow,
    WilayahRow,
} from '@/components/admin/KonfigurasiMasterDataTab';
import KonfigurasiRoutingTab, {
    AturanRoutingRow,
} from '@/components/admin/KonfigurasiRoutingTab';
import KonfigurasiSlaKuorumTab, {
    AturanSlaRow,
    ParameterKuorumRow,
} from '@/components/admin/KonfigurasiSlaKuorumTab';
import { Database, GitBranch, Settings, Sliders } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [tabAktif, setTabAktif] = useState<
        'parameter' | 'master' | 'routing' | 'sla'
    >('parameter');

    return (
        <div className="space-y-6">
            <Head title="Konfigurasi & Parameter Sistem - Jagains Admin" />

            {/* Header / Context */}
            <div className="flex flex-col gap-1">
                <h2 className="text-body-large font-display font-semibold text-foreground">
                    Konfigurasi & Parameter Sistem
                </h2>
                <p className="text-body-sm text-muted-foreground">
                    Pengaturan parameter sistem, master data OPD dan wilayah,
                    aturan routing penugasan, serta standar batas waktu SLA &
                    formula kuorum.
                </p>
            </div>

            {/* Main Tabs */}
            <Tabs
                value={tabAktif}
                onValueChange={(val) =>
                    val && setTabAktif(val as typeof tabAktif)
                }
                className="w-full space-y-6"
            >
                <div className="w-full scrollbar-none overflow-x-auto pb-1">
                    <TabsList className="inline-flex h-9 w-max min-w-full justify-start bg-muted/50 p-1">
                        <TabsTrigger
                            value="parameter"
                            className="shrink-0 gap-2"
                        >
                            <Settings className="size-4" aria-hidden="true" />
                            <span>Parameter Sistem</span>
                        </TabsTrigger>
                        <TabsTrigger value="master" className="shrink-0 gap-2">
                            <Database className="size-4" aria-hidden="true" />
                            <span>Master Data OPD & Wilayah</span>
                        </TabsTrigger>
                        <TabsTrigger value="routing" className="shrink-0 gap-2">
                            <GitBranch className="size-4" aria-hidden="true" />
                            <span>Aturan Routing Disposisi</span>
                        </TabsTrigger>
                        <TabsTrigger value="sla" className="shrink-0 gap-2">
                            <Sliders className="size-4" aria-hidden="true" />
                            <span>Standar SLA & Kuorum</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {tabAktif === 'parameter' && (
                    <KonfigurasiParameterTab pengaturan={pengaturan} />
                )}

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
            </Tabs>
        </div>
    );
}

KonfigurasiPage.layout = (page: ReactNode) => (
    <InternalLayout
        title="Parameter & Aturan"
        breadcrumb="Admin > Sistem > Konfigurasi"
    >
        {page}
    </InternalLayout>
);
