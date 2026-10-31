import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { MapPin, Menu, X, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { User } from '@/types/auth';

export default function LandingNavbar() {
    const { auth } = usePage<{ auth?: { user?: User | null } }>().props;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const scrollToSection = (id: string) => {
        setMobileOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo & Brand */}
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                        <MapPin className="size-5" />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight text-foreground">
                        JAGAIns
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center gap-8 text-body-sm font-medium text-muted-foreground">
                    <button
                        type="button"
                        onClick={() => scrollToSection('alur')}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        Alur
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('janji')}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        Janji
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('privasi')}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        Keamanan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('kinerja')}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        Kinerja
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('sebaran-peta')}
                        className="hover:text-foreground transition-colors cursor-pointer text-primary font-semibold"
                    >
                        Lihat Sekitar
                    </button>
                </nav>

                {/* Desktop Action Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        <Link
                            href={
                                user.peran === 'instansi'
                                    ? '/instansi/antrean'
                                    : user.peran === 'auditor'
                                    ? '/auditor/antrean'
                                    : user.peran === 'admin'
                                    ? '/admin/antrean-routing'
                                    : '/peta'
                            }
                            className={cn(
                                buttonVariants({ variant: 'outline' }),
                                'h-10 text-body-sm font-semibold rounded-xl border-border'
                            )}
                        >
                            <span>Buka Portal {user.username}</span>
                            <ArrowRight className="size-4 ml-1.5" />
                        </Link>
                    ) : (
                        <Link
                            href="/warga/lapor"
                            className={cn(
                                buttonVariants({ variant: 'default' }),
                                'h-10 text-body-sm font-semibold rounded-xl shadow-xs'
                            )}
                        >
                            <span>Lapor Masalah</span>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="size-10 rounded-xl text-foreground"
                    >
                        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileOpen && (
                <div className="md:hidden border-b border-border bg-card px-4 pt-3 pb-6 space-y-3">
                    <div className="flex flex-col space-y-2 text-body-sm font-medium">
                        <button
                            type="button"
                            onClick={() => scrollToSection('alur')}
                            className="text-left py-2 px-3 rounded-lg hover:bg-muted text-foreground"
                        >
                            Alur
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('janji')}
                            className="text-left py-2 px-3 rounded-lg hover:bg-muted text-foreground"
                        >
                            Janji
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('privasi')}
                            className="text-left py-2 px-3 rounded-lg hover:bg-muted text-foreground"
                        >
                            Keamanan
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('kinerja')}
                            className="text-left py-2 px-3 rounded-lg hover:bg-muted text-foreground"
                        >
                            Kinerja
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('sebaran-peta')}
                            className="text-left py-2 px-3 rounded-lg hover:bg-muted text-primary font-bold"
                        >
                            Lihat Sekitar (Peta)
                        </button>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-col gap-2">
                        {user ? (
                            <Link
                                href={
                                    user.peran === 'instansi'
                                        ? '/instansi/antrean'
                                        : user.peran === 'auditor'
                                        ? '/auditor/antrean'
                                        : user.peran === 'admin'
                                        ? '/admin/antrean-routing'
                                        : '/peta'
                                }
                                className={cn(buttonVariants({ variant: 'default' }), 'w-full h-11 font-semibold rounded-xl')}
                            >
                                Buka Portal ({user.username})
                            </Link>
                        ) : (
                            <Link
                                href="/warga/lapor"
                                className={cn(buttonVariants({ variant: 'default' }), 'w-full h-11 font-semibold rounded-xl')}
                            >
                                Lapor Masalah
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
