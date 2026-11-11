import { Link } from '@inertiajs/react';
import { LogIn, UserPlus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { buttonVariants } from '@/components/ui/button';

interface ModalKonfirmasiLoginProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    judulAksi?: string;
}

export default function ModalKonfirmasiLogin({
    open,
    onOpenChange,
    judulAksi = 'memberikan dukungan',
}: ModalKonfirmasiLoginProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-2xl sm:p-8">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-display text-lg text-foreground">
                        <LogIn className="size-5 text-primary" />
                        Masuk Akun Warga
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
                        Untuk {judulAksi} pada laporan fasilitas publik ini,
                        Anda perlu masuk menggunakan akun warga Jabodetabek yang
                        aktif.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">
                        Privasi Warga Terlindungi
                    </p>
                    <p>
                        Dukungan dan tindakan Anda dienkripsi secara
                        aman. Identitas Anda tidak akan pernah
                        dipublikasikan di halaman ini.
                    </p>
                </div>

                <DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <Link
                        href="/login"
                        className={buttonVariants({
                            variant: 'default',
                            className: 'w-full sm:w-auto gap-2',
                        })}
                    >
                        <LogIn className="size-4" />
                        Masuk Sekarang
                    </Link>
                    <Link
                        href="/daftar"
                        className={buttonVariants({
                            variant: 'outline',
                            className: 'w-full sm:w-auto gap-2',
                        })}
                    >
                        <UserPlus className="size-4" />
                        Daftar Akun Baru
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
