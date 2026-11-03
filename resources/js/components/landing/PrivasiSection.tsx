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
        <section id="privasi" className="py-20 sm:py-28 bg-muted/20 border-y border-border/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Kolom Kiri: Heading & 3 Item List Berupa Card */}
                    <div className="lg:col-span-6 space-y-8">
                        <div className="space-y-4">
                            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                                Suara Anda Terdengar, Identitas Anda Terkunci Aman
                            </h2>

                            <p className="text-body-base sm:text-body-large text-muted-foreground leading-relaxed">
                                Dirancang dengan arsitektur privasi ketat agar pelapor terlindungi penuh dari risiko intimidasi.
                            </p>
                        </div>

                        {/* 3 Item List dengan Ikon & Teks Singkat Padat (Dikembalikan seperti semula) */}
                        <div className="space-y-4 pt-2">
                            {PRIVASI_ITEMS.map((item) => {
                                const Icon = item.ikon;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/60 shadow-2xs hover:shadow-xs transition-shadow"
                                    >
                                        <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                            <Icon className="size-5" />
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-display text-body-base font-bold text-foreground">
                                                {item.judul}
                                            </h3>
                                            <p className="text-body-sm text-muted-foreground leading-relaxed">
                                                {item.deskripsi}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Kolom Kanan: Asset Ilustrasi person_with_lock.png langsung (tanpa card) */}
                    <div className="lg:col-span-6 flex items-center justify-center">
                        <img
                            src="/images/landing/person_with_lock.png"
                            alt="Ilustrasi Privasi dan Keamanan Jagains"
                            className="w-full max-w-md lg:max-w-lg h-auto object-contain mx-auto"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
