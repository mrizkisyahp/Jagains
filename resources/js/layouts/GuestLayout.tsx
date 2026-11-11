import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toast';

interface GuestLayoutProps {
    children: ReactNode;
}

const GuestLayouts = ({ children }: GuestLayoutProps) => {
    return (
        <div className="grid min-h-screen w-full place-items-center bg-background p-4 text-foreground sm:p-6 md:p-12">
            {children}
            <Toaster />
        </div>
    );
};

export default GuestLayouts;
