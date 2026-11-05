export default function InstansiTicketContext({
    nomorTiket,
    judul,
}: {
    nomorTiket: string;
    judul: string;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-1 border-b border-border pb-4">
            <p className="text-body-sm font-mono font-medium text-foreground">
                {nomorTiket}
            </p>
            <p className="text-body-base text-foreground">{judul}</p>
        </div>
    );
}
