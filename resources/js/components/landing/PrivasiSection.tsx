import { EyeOff, ShieldCheck, KeyRound } from 'lucide-react';

const PRIVASI_ITEMS = [
    {
        id: 1,
        judul: 'Email Tidak Pernah Disimpan',
        deskripsi:
            'Alamat email diubah menjadi hash kriptografis satu arah HMAC-SHA256 sebelum masuk ke basis data.',
        ikon: EyeOff,
    },
    {
        id: 2,
        judul: 'Pembersihan Metadata EXIF',
        deskripsi:
            'Tipe gawai, waktu presisi, dan koordinat mentah otomatis dihapus dari berkas foto saat Anda mengambil gambar.',
        ikon: ShieldCheck,
    },
    {
        id: 3,
        judul: 'Voting Anonim Terlindungi',
        deskripsi:
            'Dukungan dan suara verifikasi warga hanya ditampilkan sebagai angka bobot agregat tanpa profil pemberi suara.',
        ikon: KeyRound,
    },
];

export default function PrivasiSection() {
    return (
        <section
            id="privasi"
            className="border-y border-border/80 bg-muted/20 py-20 sm:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
                    {/* Kolom Kiri: Heading & 3 Item List Berupa Card */}
                    <div className="space-y-8 lg:col-span-6">
                        <div className="space-y-4">
                            <h2 className="font-display text-3xl leading-[1.15] font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                                Suara Anda Terdengar, Identitas Anda Terkunci
                                Aman
                            </h2>

                            <p className="sm:text-body-large text-body-base leading-relaxed text-muted-foreground">
                                Dirancang dengan arsitektur privasi ketat agar
                                pelapor terlindungi penuh dari risiko
                                intimidasi.
                            </p>
                        </div>

                        {/* 3 Item List dengan Ikon & Teks Singkat Padat (Dikembalikan seperti semula) */}
                        <div className="space-y-4 pt-2">
                            {PRIVASI_ITEMS.map((item) => {
                                const Icon = item.ikon;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-2xs transition-shadow hover:shadow-xs"
                                    >
                                        <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                            <Icon className="size-5" />
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-body-base font-display font-bold text-foreground">
                                                {item.judul}
                                            </h3>
                                            <p className="text-body-sm leading-relaxed text-muted-foreground">
                                                {item.deskripsi}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Kolom Kanan: Asset Ilustrasi person_with_lock.png langsung (tanpa card) */}
                    <div className="flex items-center justify-center lg:col-span-6">
                        <img
                            src="/images/landing/person_with_lock.png"
                            alt="Ilustrasi Privasi dan Keamanan Jagains"
                            className="mx-auto h-auto w-full max-w-md object-contain lg:max-w-lg"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
