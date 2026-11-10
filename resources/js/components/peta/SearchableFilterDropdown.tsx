import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from 'cn';

export interface DropdownFilterOption {
    value: string;
    label: string;
    group?: string;
    sublabel?: string;
    count?: number;
}

interface SearchableFilterDropdownProps {
    value: string;
    placeholder: string;
    searchPlaceholder?: string;
    options: DropdownFilterOption[];
    onSelect: (value: string | null) => void;
    align?: 'start' | 'center' | 'end';
    className?: string;
}

export default function SearchableFilterDropdown({
    value,
    placeholder,
    searchPlaceholder = 'Ketik untuk mencari...',
    options,
    onSelect,
    align = 'start',
    className,
}: SearchableFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Cari opsi terpilih saat ini
    const selectedOption = useMemo(() => {
        if (!value || value === 'semua') return null;
        return options.find((opt) => opt.value === value) || null;
    }, [value, options]);

    // Tutup dropdown saat klik di luar kontainer
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Fokus otomatis ke input pencarian ketika dropdown terbuka
    useEffect(() => {
        if (isOpen) {
            // Beri sedikit jeda mikro agar DOM mount sempurna
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 30);
            return () => clearTimeout(timer);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Handle tombol keyboard (Escape untuk tutup)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Filter daftar opsi berdasarkan query pencarian yang diketik user
    const filteredOptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return options;

        return options.filter((opt) => {
            if (opt.value === 'semua') return true; // Tetap sertakan opsi reset "Semua"
            const matchLabel = opt.label.toLowerCase().includes(query);
            const matchGroup = opt.group?.toLowerCase().includes(query) ?? false;
            const matchSublabel = opt.sublabel?.toLowerCase().includes(query) ?? false;
            return matchLabel || matchGroup || matchSublabel;
        });
    }, [options, searchQuery]);

    // Kelompokkan opsi berdasarkan field `group` (jika ada)
    const groupedOptions = useMemo(() => {
        const groups: Array<{ name: string | null; items: DropdownFilterOption[] }> = [];
        const groupMap = new Map<string | null, DropdownFilterOption[]>();

        // Opsi 'semua' diletakkan tersendiri di paling atas
        const semuaItem = filteredOptions.find((opt) => opt.value === 'semua');
        const normalItems = filteredOptions.filter((opt) => opt.value !== 'semua');

        for (const item of normalItems) {
            const key = item.group ?? null;
            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key)!.push(item);
        }

        groupMap.forEach((items, name) => {
            groups.push({ name, items });
        });

        return { semuaItem, groups };
    }, [filteredOptions]);

    const handleSelectOption = (optValue: string) => {
        onSelect(optValue === 'semua' ? null : optValue);
        setIsOpen(false);
    };

    const handleClearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(null);
    };

    // Tentukan alignment posisi floating popover
    const alignmentClasses =
        align === 'end'
            ? 'right-0 origin-top-right'
            : align === 'center'
            ? 'left-1/2 -translate-x-1/2 origin-top'
            : 'left-0 origin-top-left';

    return (
        <div ref={containerRef} className={cn('relative w-full', className)} onKeyDown={handleKeyDown}>
            {/* Trigger Button (3 Kolom Sejajar) */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    'group flex h-8 w-full cursor-pointer items-center justify-between gap-1 rounded-lg border border-border bg-background px-2 text-[11px] font-medium text-foreground shadow-none transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    selectedOption && 'border-primary/40 bg-primary/5 text-primary font-semibold',
                    isOpen && 'border-primary ring-1 ring-primary/30',
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                title={selectedOption ? selectedOption.label : placeholder}
            >
                <span className="truncate text-left">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                    {selectedOption && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClearSelection}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleClearSelection(e as unknown as React.MouseEvent);
                                }
                            }}
                            className="flex size-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Hapus filter ${placeholder}`}
                            title="Hapus filter ini"
                        >
                            <X className="size-2.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            'size-3 shrink-0 text-muted-foreground transition-transform duration-150',
                            isOpen && 'rotate-180 text-foreground',
                        )}
                    />
                </div>
            </button>

            {/* Dropdown Popover dengan Kolom Pengetikan (Search Input) */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute top-full mt-1.5 z-50 w-64 sm:w-72 rounded-xl border border-border bg-card/98 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-100',
                        alignmentClasses,
                    )}
                >
                    {/* Input Pengetikan / Pencarian */}
                    <div className="border-b border-border p-2">
                        <div className="relative flex items-center">
                            <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        // Jika ada hasil pertama selain 'semua', pilih yang pertama
                                        const firstNonSemua = filteredOptions.find((o) => o.value !== 'semua');
                                        if (firstNonSemua) {
                                            handleSelectOption(firstNonSemua.value);
                                        } else if (groupedOptions.semuaItem) {
                                            handleSelectOption('semua');
                                        }
                                    }
                                }}
                                placeholder={searchPlaceholder}
                                className="h-8 w-full rounded-lg border border-border bg-muted/40 pl-8 pr-7 text-caption-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                                    aria-label="Bersihkan pencarian"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Daftar Opsi yang Telah Difilter */}
                    <div className="max-h-64 overflow-y-auto overscroll-contain p-1 divide-y divide-border/20" role="listbox">
                        {/* Opsi Reset "Semua" di Paling Atas */}
                        {groupedOptions.semuaItem && (
                            <div className="pb-1">
                                <button
                                    type="button"
                                    onClick={() => handleSelectOption('semua')}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-caption-xs transition-colors hover:bg-muted/80',
                                        (!value || value === 'semua')
                                            ? 'bg-primary/10 font-semibold text-primary'
                                            : 'text-foreground font-medium',
                                    )}
                                    role="option"
                                    aria-selected={!value || value === 'semua'}
                                >
                                    <span>{groupedOptions.semuaItem.label}</span>
                                    {(!value || value === 'semua') && (
                                        <Check className="size-3.5 text-primary shrink-0" />
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Opsi Berkelompok */}
                        {groupedOptions.groups.map((group, gIdx) => (
                            <div key={group.name ?? `group-${gIdx}`} className="py-1">
                                {group.name && (
                                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {group.name}
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    {group.items.map((opt) => {
                                        const isSelected = value === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleSelectOption(opt.value)}
                                                className={cn(
                                                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-caption-xs text-left transition-colors hover:bg-muted/80',
                                                    isSelected
                                                        ? 'bg-primary/10 font-semibold text-primary'
                                                        : 'text-foreground',
                                                )}
                                                role="option"
                                                aria-selected={isSelected}
                                            >
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="truncate">{opt.label}</span>
                                                    {opt.sublabel && (
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {opt.sublabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {opt.count !== undefined && opt.count > 0 && (
                                                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                                            {opt.count}
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <Check className="size-3.5 text-primary" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Keadaan Tidak Ada Hasil Pencarian */}
                        {filteredOptions.length === 0 && (
                            <div className="py-4 px-2 text-center text-caption-xs text-muted-foreground">
                                Tidak ada hasil untuk "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

