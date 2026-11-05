import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminTablePaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (newPage: number) => void;
    itemName?: string;
}

export default function AdminTablePagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    itemName = 'data',
}: AdminTablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(totalItems, currentPage * pageSize);

    if (totalItems <= pageSize && totalPages <= 1) {
        return (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-body-sm text-muted-foreground">
                <p>
                    Menampilkan{' '}
                    <span className="font-medium text-foreground">
                        {totalItems}
                    </span>{' '}
                    {itemName}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-body-sm text-muted-foreground">
            <p>
                Menampilkan{' '}
                <span className="font-medium text-foreground">{from}</span>–
                <span className="font-medium text-foreground">{to}</span> dari{' '}
                <span className="font-medium text-foreground">
                    {totalItems}
                </span>{' '}
                {itemName}
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-8 gap-1 text-xs"
                    title="Halaman Sebelumnya"
                    aria-label="Halaman Sebelumnya"
                >
                    <ChevronLeft className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                <span className="px-1 text-caption-xs text-muted-foreground sm:px-2">
                    Halaman{' '}
                    <strong className="font-medium text-foreground">
                        {currentPage}
                    </strong>{' '}
                    dari{' '}
                    <strong className="font-medium text-foreground">
                        {totalPages}
                    </strong>
                </span>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-8 gap-1 text-xs"
                    title="Halaman Berikutnya"
                    aria-label="Halaman Berikutnya"
                >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
