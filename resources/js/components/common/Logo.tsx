import { cn } from 'cn';

interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
    return (
        <span className={cn('font-display text-xl font-bold tracking-tight text-foreground', className)}>
            Jagains
        </span>
    );
}

export default Logo;
