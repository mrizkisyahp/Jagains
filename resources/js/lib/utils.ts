import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'font-size': [
                'text-display-hero',
                'text-display-xl',
                'text-display-lg',
                'text-display-md',
                'text-display-sm',
                'text-body-lg',
                'text-body-base',
                'text-body-medium',
                'text-body-sm',
                'text-caption-xs',
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return customTwMerge(clsx(inputs));
}
