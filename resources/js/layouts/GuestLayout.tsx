import { ReactNode } from "react"
import { Toaster } from "@/components/ui/toast"

interface GuestLayoutProps {
    children: ReactNode
}

const GuestLayouts = ({ children }: GuestLayoutProps) => {
    return (
        <div className="min-h-screen w-full grid place-items-center p-6 md:p-12">
            {children}
            <Toaster />
        </div>
    )
}

export default GuestLayouts;
