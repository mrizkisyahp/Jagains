import { ReactNode } from "react"

interface GuestLayoutProps{
    children: ReactNode
}
const GuestLayouts = ({children}: GuestLayoutProps) => {
    return <div className="h-screen w-full grid place-items-center p-12">
        {children}
    </div>
}

export default GuestLayouts;