import { lazy, Suspense, useState } from 'react';

import { Link } from '@inertiajs/react';

import {
    ArrowLeft,
    FileText,
    ImageIcon,
    MapPin,
    Share2,
    EyeOff,
    ZoomIn,
} from 'lucide-react';

import InternalLayout from '@/layouts/InternalLayout';

import InstansiStatusBadge, {
    formatInstansiMessage,
} from './InstansiStatusBadge';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

import { toast } from '@/components/ui/toast';

import { antrean } from '@/routes/instansi';

import type { TiketDetail, LampiranFoto } from '@/types/tiket';

const LocationMap = lazy(() => import('./InstansiLocationMap'));

const date = (value: string) =>
    new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

function EvidencePhoto({
    photo,
    title,
    description,
    onPreview,
}: {
    photo: LampiranFoto | null;
    title: string;
    description: string;
    onPreview: (photo: LampiranFoto) => void;
}) {
    const [failed, setFailed] = useState(false);

    return (
        <figure className="overflow-hidden rounded-lg border border-border">
            <figcaption className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 text-body-sm font-medium">
                {title}
                {photo && (
                    <span className="font-normal text-muted-foreground">
                        {date(photo.created_at)}
                    </span>
                )}
            </figcaption>

            {photo && !failed ? (
                <button
                    type="button"
                    onClick={() => onPreview(photo)}
                    className="group relative block aspect-video w-full bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Perbesar ${title.toLowerCase()}`}
                >
                    <img
                        src={photo.url}
                        alt={title}
                        onError={() => setFailed(true)}
                        className="size-full object-cover"
                    />
                    <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-caption-xs">
                        <ZoomIn className="size-3" />
                        Perbesar
                    </span>
                </button>
            ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-muted/25 p-5 text-center">
                    <ImageIcon className="size-7 text-muted-foreground" />
                    <p className="text-body-sm font-medium">
                        {failed ? 'Foto gagal dimuat' : 'Foto belum tersedia'}
                    </p>
                    <p className="max-w-xs text-body-sm text-muted-foreground">
                        {failed
                            ? 'Buka ulang halaman untuk mencoba memuat foto kembali.'
                            : description}
                    </p>
                </div>
            )}
        </figure>
    );
}

export default function InstansiTiketDetail({ tiket }: { tiket: TiketDetail }) {
    const [preview, setPreview] = useState<LampiranFoto | null>(null);

    const [documentPage, setDocumentPage] = useState(1);

    const documentPages = Math.max(1, Math.ceil(tiket.berita_acara.length / 3));

    const latitude = Number(tiket.lintang);

    const longitude = Number(tiket.bujur);

    const validLocation =
        tiket.lintang != null &&
        tiket.bujur != null &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180;

    const share = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Tautan tiket disalin');
        } catch {
            toast.error(
                'Tautan gagal disalin',
                'Salin alamat halaman melalui peramban.',
            );
        }
    };

    return (
        <InternalLayout
            title="Detail tiket"
            breadcrumb="Instansi / Antrean tiket"
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        className="h-11 px-0 text-body-sm md:h-9"
                        render={<Link href={antrean()} />}
                    >
                        <ArrowLeft />
                        Antrean tiket
                    </Button>
                    <Button
                        variant="outline"
                        className="h-11 shadow-none md:h-9"
                        onClick={share}
                    >
                        <Share2 />
                        Bagikan
                    </Button>
                </div>

                {tiket.disembunyikan ? (
                    <div className="rounded-lg border border-border p-8 text-center">
                        <EyeOff className="mx-auto mb-3 size-7 text-muted-foreground" />
                        <h2 className="text-body-base font-semibold">
                            Laporan disembunyikan
                        </h2>
                        <p className="mt-2 text-body-sm text-muted-foreground">
                            Konten laporan ini sedang dibatasi oleh moderasi.
                        </p>
                    </div>
                ) : (
                    <>
                        <header className="space-y-4 border-b border-border pb-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-2 text-body-sm text-muted-foreground">
                                    #{tiket.nomor_tiket}
                                </span>
                                <InstansiStatusBadge status={tiket.status} />
                                <Badge
                                    variant="outline"
                                    className="h-auto py-1 text-caption-xs"
                                >
                                    Tingkat {tiket.keparahan}
                                </Badge>
                            </div>

                            <h2 className="max-w-4xl text-2xl leading-snug font-semibold tracking-tight">
                                {tiket.judul}
                            </h2>

                            <dl className="grid gap-x-6 gap-y-4 text-body-sm sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    [
                                        'Instansi terkait',
                                        tiket.instansi_nama ??
                                            'Belum ditetapkan',
                                    ],
                                    ['Kategori', tiket.kategori_nama],
                                    [
                                        'Lokasi',
                                        `Kel. ${tiket.kelurahan_nama}, Kec. ${tiket.kecamatan_nama}`,
                                    ],
                                    ['Tanggal laporan', date(tiket.created_at)],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="mb-1 text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="font-medium">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            <p className="max-w-4xl text-body-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {tiket.keterangan}
                            </p>
                        </header>

                        <div className="grid items-start gap-6 lg:grid-cols-3">
                            <div className="min-w-0 space-y-6 lg:col-span-2">
                                <section
                                    aria-labelledby="bukti-title"
                                    className="space-y-3"
                                >
                                    <h3
                                        id="bukti-title"
                                        className="text-body-base font-semibold"
                                    >
                                        Bukti foto
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <EvidencePhoto
                                            key={tiket.foto_awal?.url ?? 'awal'}
                                            photo={tiket.foto_awal}
                                            title="Sebelum perbaikan"
                                            description="Foto kondisi awal laporan akan ditampilkan di sini."
                                            onPreview={setPreview}
                                        />
                                        <EvidencePhoto
                                            key={
                                                tiket.foto_sesudah?.url ??
                                                'sesudah'
                                            }
                                            photo={tiket.foto_sesudah}
                                            title="Sesudah perbaikan"
                                            description="Foto hasil perbaikan tersedia setelah petugas mengajukan penyelesaian."
                                            onPreview={setPreview}
                                        />
                                    </div>
                                </section>

                                <section
                                    aria-labelledby="dokumen-title"
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3
                                            id="dokumen-title"
                                            className="text-body-base font-semibold"
                                        >
                                            Berita acara
                                        </h3>
                                        <span className="text-body-sm text-muted-foreground">
                                            {tiket.berita_acara.length} versi
                                        </span>
                                    </div>

                                    {tiket.berita_acara.length ? (
                                        <div className="divide-y divide-border rounded-lg border border-border">
                                            {tiket.berita_acara
                                                .slice(
                                                    (documentPage - 1) * 3,
                                                    documentPage * 3,
                                                )
                                                .map((ba) => (
                                                    <details
                                                        key={ba.id}
                                                        className="group px-4 py-3"
                                                    >
                                                        <summary className="cursor-pointer text-body-sm focus-visible:outline-2 focus-visible:outline-ring">
                                                            <span className="font-medium">
                                                                Berita acara ·
                                                                Versi {ba.versi}
                                                            </span>
                                                            <span className="mt-1 block text-muted-foreground">
                                                                {date(
                                                                    ba.created_at,
                                                                )}{' '}
                                                                ·{' '}
                                                                {
                                                                    ba.instansi_nama
                                                                }
                                                            </span>
                                                        </summary>
                                                        <dl className="mt-4 space-y-3 text-body-sm">
                                                            {[
                                                                [
                                                                    'Kegiatan',
                                                                    ba.kegiatan,
                                                                ],
                                                                [
                                                                    'Hasil',
                                                                    ba.hasil,
                                                                ],
                                                                [
                                                                    'Hambatan',
                                                                    ba.hambatan,
                                                                ],
                                                            ]
                                                                .filter(
                                                                    ([
                                                                        ,
                                                                        value,
                                                                    ]) => value,
                                                                )
                                                                .map(
                                                                    ([
                                                                        label,
                                                                        value,
                                                                    ]) => (
                                                                        <div
                                                                            key={
                                                                                label
                                                                            }
                                                                        >
                                                                            <dt className="font-medium">
                                                                                {
                                                                                    label
                                                                                }
                                                                            </dt>
                                                                            <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                                                                {
                                                                                    value
                                                                                }
                                                                            </dd>
                                                                        </div>
                                                                    ),
                                                                )}
                                                        </dl>
                                                    </details>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
                                            <FileText className="size-7 text-muted-foreground" />
                                            <p className="text-body-sm font-medium">
                                                Belum ada berita acara
                                            </p>
                                            <p className="text-body-sm text-muted-foreground">
                                                Catatan kegiatan dan hasil
                                                pekerjaan akan tersedia setelah
                                                dibuat oleh petugas.
                                            </p>
                                        </div>
                                    )}

                                    {documentPages > 1 && (
                                        <div className="flex items-center justify-between gap-3 text-body-sm">
                                            <span>
                                                {documentPage} dari{' '}
                                                {documentPages} halaman
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        documentPage === 1
                                                    }
                                                    onClick={() =>
                                                        setDocumentPage(
                                                            (p) => p - 1,
                                                        )
                                                    }
                                                >
                                                    Sebelumnya
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    disabled={
                                                        documentPage ===
                                                        documentPages
                                                    }
                                                    onClick={() =>
                                                        setDocumentPage(
                                                            (p) => p + 1,
                                                        )
                                                    }
                                                >
                                                    Berikutnya
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section
                                    aria-labelledby="riwayat-title"
                                    className="space-y-4"
                                >
                                    <h3
                                        id="riwayat-title"
                                        className="text-body-base font-semibold"
                                    >
                                        Riwayat penanganan
                                    </h3>
                                    <ol className="ml-2 border-l border-border">
                                        {tiket.riwayat_status.map((item) => (
                                            <li
                                                key={item.id}
                                                className="relative pb-5 pl-5 before:absolute before:top-2 before:-left-1 before:size-2 before:rounded-full before:bg-muted-foreground"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <InstansiStatusBadge
                                                        status={
                                                            item.status_baru
                                                        }
                                                    />
                                                    <time className="text-body-sm text-muted-foreground">
                                                        {new Date(
                                                            item.waktu,
                                                        ).toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </time>
                                                </div>
                                                <p className="mt-2 text-body-sm text-muted-foreground">
                                                    {item.instansi_nama ??
                                                        (item.peran_pelaku ===
                                                        'sistem'
                                                            ? 'Sistem Jagains'
                                                            : `Petugas ${item.peran_pelaku}`)}
                                                </p>
                                                {item.catatan && (
                                                    <p className="mt-1 text-body-sm whitespace-pre-wrap">
                                                        {formatInstansiMessage(
                                                            item.catatan,
                                                        )}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                    {!tiket.riwayat_status.length && (
                                        <p className="text-body-sm text-muted-foreground">
                                            Belum ada riwayat penanganan.
                                        </p>
                                    )}
                                </section>

                                {tiket.pengalihan.length > 0 && (
                                    <section className="space-y-3">
                                        <h3 className="text-body-base font-semibold">
                                            Riwayat pengalihan
                                        </h3>
                                        {tiket.pengalihan.map((item) => (
                                            <div
                                                key={item.id}
                                                className="border-b border-border pb-3 text-body-sm"
                                            >
                                                <p className="font-medium">
                                                    {item.instansi_asal} →{' '}
                                                    {item.instansi_tujuan}
                                                </p>
                                                <p className="mt-1 text-muted-foreground">
                                                    {date(item.waktu)} ·{' '}
                                                    {item.alasan}
                                                </p>
                                            </div>
                                        ))}
                                    </section>
                                )}
                            </div>

                            <aside className="min-w-0 space-y-5">
                                <section className="overflow-hidden rounded-lg border border-border">
                                    <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-body-sm font-semibold">
                                        <MapPin className="size-4" />
                                        Lokasi laporan
                                    </div>
                                    {validLocation ? (
                                        <Suspense
                                            fallback={
                                                <Skeleton className="h-64 w-full rounded-none" />
                                            }
                                        >
                                            <LocationMap
                                                latitude={latitude}
                                                longitude={longitude}
                                            />
                                        </Suspense>
                                    ) : (
                                        <p className="p-5 text-body-sm text-muted-foreground">
                                            Titik lokasi belum tersedia.
                                        </p>
                                    )}
                                    <div className="space-y-1 p-4 text-body-sm">
                                        <p className="font-medium">
                                            Kel. {tiket.kelurahan_nama}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Kec. {tiket.kecamatan_nama}
                                        </p>
                                        {validLocation && (
                                            <p className="text-caption-xs text-muted-foreground">
                                                {latitude.toFixed(6)},{' '}
                                                {longitude.toFixed(6)}
                                            </p>
                                        )}
                                        <a
                                            href={
                                                validLocation
                                                    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
                                                    : undefined
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-block text-body-sm underline underline-offset-4"
                                        >
                                            {validLocation &&
                                                'Buka peta lebih besar'}
                                        </a>
                                    </div>
                                </section>

                                <div className="rounded-lg border border-border p-4">
                                    <p className="text-body-sm font-medium">
                                        Batas waktu layanan
                                    </p>
                                    <Badge
                                        variant={
                                            tiket.kondisi_sla === 'lewat_sla'
                                                ? 'sla-late'
                                                : tiket.kondisi_sla ===
                                                    'hampir_lewat'
                                                  ? 'sla-warn'
                                                  : tiket.kondisi_sla ===
                                                      'dalam_sla'
                                                    ? 'sla-safe'
                                                    : 'outline'
                                        }
                                        className="mt-2 h-auto max-w-full py-1 text-caption-xs whitespace-normal"
                                    >
                                        {tiket.sisa_sla_teks ||
                                            'Batas waktu belum tersedia.'}
                                    </Badge>
                                </div>

                                <div className="rounded-lg border border-border p-4">
                                    <p className="text-body-sm text-muted-foreground">
                                        Dukungan masyarakat
                                    </p>
                                    <p className="mt-1 text-xl font-semibold tabular-nums">
                                        {tiket.total_dukungan}
                                    </p>
                                </div>

                                {tiket.kuorum_verifikasi && (
                                    <section className="space-y-3 rounded-lg border border-border p-4 text-body-sm">
                                        <h3 className="font-semibold">
                                            Verifikasi warga
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Ronde{' '}
                                            {
                                                tiket.kuorum_verifikasi
                                                    .nomor_ronde
                                            }{' '}
                                            ·{' '}
                                            {
                                                tiket.kuorum_verifikasi
                                                    .total_pemilih
                                            }{' '}
                                            pemilih
                                        </p>
                                        <dl className="space-y-2">
                                            {[
                                                [
                                                    'Target bobot',
                                                    tiket.kuorum_verifikasi
                                                        .target_k,
                                                ],
                                                [
                                                    'Bobot setuju',
                                                    tiket.kuorum_verifikasi
                                                        .suara_setuju_bobot,
                                                ],
                                                [
                                                    'Bobot menolak',
                                                    tiket.kuorum_verifikasi
                                                        .suara_tolak_bobot,
                                                ],
                                                [
                                                    'Hasil',
                                                    tiket.kuorum_verifikasi
                                                        .hasil ??
                                                        'Belum diputuskan',
                                                ],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="flex justify-between gap-3"
                                                >
                                                    <dt className="text-muted-foreground">
                                                        {label}
                                                    </dt>
                                                    <dd>{value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {tiket.kuorum_verifikasi
                                            .batas_waktu && (
                                            <p className="text-muted-foreground">
                                                Batas verifikasi:{' '}
                                                {date(
                                                    tiket.kuorum_verifikasi
                                                        .batas_waktu,
                                                )}
                                            </p>
                                        )}
                                        {tiket.kuorum_verifikasi.alasan_penolakan.map(
                                            (item, index) => (
                                                <p
                                                    key={index}
                                                    className="border-t border-border pt-2"
                                                >
                                                    {item.alasan}
                                                    <span className="mt-1 block text-muted-foreground">
                                                        {date(item.waktu)} ·
                                                        Jalur {item.jalur}
                                                    </span>
                                                </p>
                                            ),
                                        )}
                                    </section>
                                )}

                                {tiket.catatan_auditor.length > 0 && (
                                    <section className="space-y-3 rounded-lg border border-border p-4 text-body-sm">
                                        <h3 className="font-semibold">
                                            Catatan Auditor
                                        </h3>
                                        {tiket.catatan_auditor.map((item) => (
                                            <div
                                                key={item.id}
                                                className="space-y-2 border-t border-border pt-3"
                                            >
                                                <p className="font-medium">
                                                    {(
                                                        {
                                                            PERINTAH:
                                                                'Perintah',
                                                            KERJAKAN_ULANG:
                                                                'Kerjakan ulang',
                                                            TUTUP: 'Penutupan',
                                                            SETUJU_TOLAK:
                                                                'Penolakan disetujui',
                                                            TOLAK_USULAN:
                                                                'Usulan ditolak',
                                                        } as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[item.jenis] ??
                                                        item.jenis
                                                            .replaceAll(
                                                                '_',
                                                                ' ',
                                                            )
                                                            .toLowerCase()}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {date(item.waktu)}
                                                </p>
                                                {item.alasan && (
                                                    <p>
                                                        {formatInstansiMessage(
                                                            item.alasan,
                                                        )}
                                                    </p>
                                                )}
                                                {item.perintah && (
                                                    <p>
                                                        {formatInstansiMessage(
                                                            item.perintah,
                                                        )}
                                                    </p>
                                                )}
                                                {item.tenggat && (
                                                    <p className="font-medium">
                                                        Tenggat:{' '}
                                                        {date(item.tenggat)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </section>
                                )}
                            </aside>
                        </div>
                    </>
                )}
            </div>

            <Dialog
                open={!!preview}
                onOpenChange={(open) => !open && setPreview(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {preview?.tahap === 'awal'
                                ? 'Foto sebelum perbaikan'
                                : 'Foto sesudah perbaikan'}
                        </DialogTitle>
                        <DialogDescription>
                            Dokumentasi lapangan tiket {tiket.nomor_tiket}.
                        </DialogDescription>
                    </DialogHeader>
                    {preview && (
                        <img
                            src={preview.url}
                            alt="Dokumentasi laporan diperbesar"
                            className="max-h-[70vh] w-full object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </InternalLayout>
    );
}
