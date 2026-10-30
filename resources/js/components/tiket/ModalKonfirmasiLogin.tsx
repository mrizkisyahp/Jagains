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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground font-display text-lg">
                        <LogIn className="size-5 text-primary" />
                        Masuk Akun Warga
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm leading-relaxed pt-2">
                        Untuk {judulAksi} pada laporan fasilitas publik ini, Anda perlu masuk menggunakan akun warga Kota Depok yang aktif.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border border-border/60">
                    <p className="font-medium text-foreground mb-1">Privasi Warga Terlindungi</p>
                    <p>
                        Dukungan dan tindakan Anda dienkripsi secara Zero-Knowledge. Identitas Anda tidak akan pernah dipublikasikan di halaman ini.
                    </p>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link
                        href="/login"
                        className={buttonVariants({ variant: 'default', className: 'w-full sm:w-auto gap-2' })}
                    >
                        <LogIn className="size-4" />
                        Masuk Sekarang
                    </Link>
                    <Link
                        href="/daftar"
                        className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto gap-2' })}
                    >
                        <UserPlus className="size-4" />
                        Daftar Akun Baru
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
