import { ShieldCheck, Lock, EyeOff, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PrivasiSection() {
    return (
        <section id="privasi" className="py-20 sm:py-28 bg-muted/30 border-y border-border/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Left Column: Gambar Illustrasi Sesuai Wireframe */}
                    <div className="lg:col-span-6">
                        <Card className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-neutral-900 text-white border-neutral-800 shadow-xl flex flex-col items-center justify-center min-h-[360px] sm:min-h-[420px]">
                            {/* Decorative Grid & Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]" />
                            <div className="absolute size-64 bg-primary/20 rounded-full blur-3xl -top-12 -left-12 pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm">
                                <div className="size-20 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-primary shadow-2xl">
                                    <Lock className="size-10 text-white" />
                                </div>

                                <div className="space-y-2">
                                    <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white block">
                                        Zero-Knowledge Privacy
                                    </span>
                                    <p className="text-body-sm text-neutral-300">
                                        Arsitektur satu arah HMAC-SHA256 menjamin email dan identitas warga tidak pernah tersimpan di basis data aplikasi.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Heading & Copy Sesuai Wireframe */}
                    <div className="lg:col-span-6 space-y-6 sm:space-y-8">
                        <div className="space-y-4">
                            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                                Suara Anda Terdengar, Identitas Anda Terkunci Aman
                            </h2>

                            <p className="text-body-base sm:text-body-large text-muted-foreground leading-relaxed">
                                Dirancang dengan arsitektur privasi ketat agar pelapor terlindungi penuh dari risiko intimidasi.
                            </p>
                        </div>

                        {/* Fitur-Fitur Keamanan */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-start gap-4">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                                    <EyeOff className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-display text-body-medium font-bold text-foreground">
                                        Email Tidak Pernah Disimpan
                                    </h3>
                                    <p className="text-body-sm text-muted-foreground">
                                        Alamat email langsung diubah menjadi hash kriptografis sebelum masuk ke sistem. Tidak ada siapa pun yang dapat membongkar email asli Anda.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-display text-body-medium font-bold text-foreground">
                                        Pembersihan Jejak Metadata Foto (ST-16)
                                    </h3>
                                    <p className="text-body-sm text-muted-foreground">
                                        Metadata EXIF (tipe gawai, waktu presisi, dan lokasi mentah) otomatis dihapus dari berkas foto saat Anda mengambil gambar kerusakan di lokasi.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                                    <KeyRound className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-display text-body-medium font-bold text-foreground">
                                        Voting Tanpa Nama di Tampilan Publik
                                    </h3>
                                    <p className="text-body-sm text-muted-foreground">
                                        Dukungan dan suara verifikasi warga hanya ditampilkan sebagai angka bobot agregat tanpa mencantumkan username atau profil pemberi suara.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
