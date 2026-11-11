import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditorTablePaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (newPage: number) => void;
    itemName?: string;
}

export default function AuditorTablePagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    itemName = 'kasus',
}: AuditorTablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(totalItems, currentPage * pageSize);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-body-sm text-muted-foreground">
            <p>
                {totalItems === 0 ? (
                    <>
                        Menampilkan{' '}
                        <span className="font-medium text-foreground">0</span>{' '}
                        {itemName}
                    </>
                ) : (
                    <>
                        Menampilkan{' '}
                        <span className="font-medium text-foreground">
                            {from}
                        </span>
                        –
                        <span className="font-medium text-foreground">
                            {to}
                        </span>{' '}
                        dari{' '}
                        <span className="font-medium text-foreground">
                            {totalItems}
                        </span>{' '}
                        {itemName}
                    </>
                )}
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

                <span className="px-2 text-xs font-medium text-foreground tabular-nums">
                    {currentPage} / {totalPages}
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
