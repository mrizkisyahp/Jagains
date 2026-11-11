import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { User } from '@/types/auth';
import Logo from '@/components/common/Logo';

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
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>

                {/* Desktop Nav Links */}
                <nav className="hidden items-center gap-8 text-body-sm font-medium text-muted-foreground md:flex">
                    <button
                        type="button"
                        onClick={() => scrollToSection('alur')}
                        className="cursor-pointer transition-colors hover:text-foreground"
                    >
                        Alur
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('janji')}
                        className="cursor-pointer transition-colors hover:text-foreground"
                    >
                        Janji
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('privasi')}
                        className="cursor-pointer transition-colors hover:text-foreground"
                    >
                        Keamanan
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('kinerja')}
                        className="cursor-pointer transition-colors hover:text-foreground"
                    >
                        Kinerja
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('sebaran-peta')}
                        className="cursor-pointer font-semibold text-primary transition-colors hover:text-foreground"
                    >
                        Lihat Sekitar
                    </button>
                </nav>

                {/* Desktop Action Buttons */}
                <div className="hidden items-center gap-3 md:flex">
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
                                'h-10 rounded-xl border-border text-body-sm font-semibold',
                            )}
                        >
                            <span>Buka Portal {user.username}</span>
                            <ArrowRight className="ml-1.5 size-4" />
                        </Link>
                    ) : (
                        <Link
                            href="/warga/lapor"
                            className={cn(
                                buttonVariants({ variant: 'default' }),
                                'h-10 rounded-xl text-body-sm font-semibold shadow-xs',
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
                        {mobileOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileOpen && (
                <div className="space-y-3 border-b border-border bg-card px-4 pt-3 pb-6 md:hidden">
                    <div className="flex flex-col space-y-2 text-body-sm font-medium">
                        <button
                            type="button"
                            onClick={() => scrollToSection('alur')}
                            className="rounded-lg px-3 py-2 text-left text-foreground hover:bg-muted"
                        >
                            Alur
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('janji')}
                            className="rounded-lg px-3 py-2 text-left text-foreground hover:bg-muted"
                        >
                            Janji
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('privasi')}
                            className="rounded-lg px-3 py-2 text-left text-foreground hover:bg-muted"
                        >
                            Keamanan
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('kinerja')}
                            className="rounded-lg px-3 py-2 text-left text-foreground hover:bg-muted"
                        >
                            Kinerja
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('sebaran-peta')}
                            className="rounded-lg px-3 py-2 text-left font-bold text-primary hover:bg-muted"
                        >
                            Lihat Sekitar (Peta)
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border pt-3">
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
                                    buttonVariants({ variant: 'default' }),
                                    'h-11 w-full rounded-xl font-semibold',
                                )}
                            >
                                Buka Portal ({user.username})
                            </Link>
                        ) : (
                            <Link
                                href="/warga/lapor"
                                className={cn(
                                    buttonVariants({ variant: 'default' }),
                                    'h-11 w-full rounded-xl font-semibold',
                                )}
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
