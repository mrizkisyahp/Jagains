import { ReactNode } from 'react';
import { PeranUser } from '@/types/auth';

export interface NavItem {
    title: string;
    href: string;
    roles: PeranUser[];
    badge?: string | number;
    exact?: boolean;
}

export interface NavGroup {
    label?: string;
    items: NavItem[];
}

export interface InternalLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: string;
}
