import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CalendarDays, Check, ChevronsUpDown, MapPin, Search, Users2, X } from 'lucide-react';
import { toast } from 'sonner';

const FALLBACK_IMAGE = '/img/asean_banner_logo.png';

type ProgrammeRow = {
    id: number;
    tag: string | null;
    title: string;
    description: string;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
    venue?: {
        name: string;
        address?: string | null;
    } | null;
    image_url: string | null;
    pdf_url: string | null;
    is_active: boolean;
};

type PageProps = {
    programmes?: ProgrammeRow[];
    joined_programme_ids?: number[];
};

type EventPhase = 'ongoing' | 'upcoming' | 'closed';

type EventItem = {
    id: number;
    tag: string;
    title: string;
    description: string;
    startsAt: string;
    endsAt?: string;
    location: string;
    imageUrl: string;
    pdfUrl?: string | null;
    phase: EventPhase;
};

type SelectionSummaryItem = {
    id: number;
    title: string;
    phase: EventPhase;
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/participant-dashboard' },
    { title: 'Event List', href: '/event-list' },
];

function resolveImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return FALLBACK_IMAGE;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl;
    return `/event-images/${imageUrl}`;
}

function resolvePdfUrl(pdfUrl?: string | null) {
    if (!pdfUrl) return null;
    if (pdfUrl.startsWith('http') || pdfUrl.startsWith('/')) return pdfUrl;
    return `/downloadables/${pdfUrl}`;
}

function useNowTs(intervalMs = 60_000) {
    const [nowTs, setNowTs] = React.useState(() => Date.now());
    React.useEffect(() => {
        const t = window.setInterval(() => setNowTs(Date.now()), intervalMs);
        return () => window.clearInterval(t);
    }, [intervalMs]);
    return nowTs;
}

function formatEventWindow(startsAt: string, endsAt?: string) {
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;

    const dateFmt = new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
    const timeFmt = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' });

    const date = dateFmt.format(start);
    const startTime = timeFmt.format(start);

    if (!end) return `${date} • ${startTime}`;

    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    const endTime = timeFmt.format(end);
    if (sameDay) return `${date} • ${startTime}–${endTime}`;

    return `${dateFmt.format(start)} ${startTime} → ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

function getEventPhase(startsAt: string, endsAt: string | undefined, nowTs: number): EventPhase {
    const start = new Date(startsAt);
    const startTs = start.getTime();
    const end = endsAt ? new Date(endsAt) : null;
    const endTs = end ? end.getTime() : null;

    if (endTs !== null) {
        if (nowTs < startTs) return 'upcoming';
        if (nowTs <= endTs) return 'ongoing';
        return 'closed';
    }

    if (nowTs < startTs) return 'upcoming';

    const now = new Date(nowTs);
    const sameDay =
        now.getFullYear() === start.getFullYear() &&
        now.getMonth() === start.getMonth() &&
        now.getDate() === start.getDate();

    return sameDay ? 'ongoing' : 'closed';
}

function normalizeProgrammes(programmes: ProgrammeRow[], nowTs: number): EventItem[] {
    return programmes
        .map((programme) => {
            const startsAt = programme.starts_at ?? programme.ends_at ?? new Date(nowTs).toISOString();
            const endsAt = programme.ends_at ?? undefined;
            const isActive = programme.is_active ?? true;
            const phase = isActive ? getEventPhase(startsAt, endsAt, nowTs) : 'closed';
            const venueName = programme.venue?.name?.trim() ?? '';
            const venueAddress = programme.venue?.address?.trim() ?? '';
            const venueLabel =
                venueName && venueAddress ? `${venueName} • ${venueAddress}` : venueName || venueAddress || '';

            return {
                id: programme.id,
                tag: programme.tag ?? '',
                title: programme.title,
                description: programme.description,
                startsAt,
                endsAt,
                location: venueLabel || (programme.location ?? ''),
                imageUrl: resolveImageUrl(programme.image_url),
                pdfUrl: resolvePdfUrl(programme.pdf_url),
                phase,
            };
        })
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

function phaseLabel(phase: EventPhase) {
    switch (phase) {
        case 'ongoing':
            return 'Ongoing';
        case 'upcoming':
            return 'Upcoming';
        case 'closed':
        default:
            return 'Closed';
    }
}

function phaseBadgeClass(phase: EventPhase) {
    switch (phase) {
        case 'ongoing':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'upcoming':
            return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200';
        case 'closed':
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600/30 dark:bg-slate-800/30 dark:text-slate-300';
    }
}

function EmptyState({ label }: { label: string }) {
    return (
        <Card className="border-dashed border-slate-200/70 dark:border-slate-800">
            <div className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{label}</div>
        </Card>
    );
}

function EventGrid({
    events,
    selectedIds,
    onJoin,
}: {
    events: EventItem[];
    selectedIds: number[];
    onJoin: (id: number) => void;
}) {
    if (!events.length) return <EmptyState label="No events to show here yet." />;

    return (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
                const isSelected = selectedIds.includes(event.id);
                const isClosed = event.phase === 'closed';
                const hasPdf = Boolean(event.pdfUrl);

                return (
                    <Card
                        key={event.id}
                        className={cn(
                            'border-slate-200/70 dark:border-slate-800',
                            'hover:bg-slate-50/60 dark:hover:bg-slate-900/40',
                            isClosed && 'opacity-80',
                        )}
                    >
                        <div className="flex gap-3 p-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/70 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    loading="lazy"
                                    className={cn(
                                        'h-full w-full object-cover',
                                        isClosed && 'grayscale',
                                    )}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {event.tag ? (
                                                <Badge
                                                    variant="outline"
                                                    className="h-5 px-1.5 text-[10px] uppercase tracking-wide"
                                                >
                                                    {event.tag}
                                                </Badge>
                                            ) : null}
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'h-5 px-1.5 text-[10px] uppercase tracking-wide',
                                                    phaseBadgeClass(event.phase),
                                                )}
                                            >
                                                {phaseLabel(event.phase)}
                                            </Badge>
                                        </div>

                                        <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {event.title}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {hasPdf ? (
                                            <Button
                                                asChild
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-3 text-xs"
                                            >
                                                <a href={event.pdfUrl ?? undefined} target="_blank" rel="noreferrer">
                                                    View program
                                                </a>
                                            </Button>
                                        ) : null}
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isClosed || isSelected}
                                            onClick={() => onJoin(event.id)}
                                            className={cn(
                                                'h-8 px-3 text-xs shadow-sm',
                                                'bg-[#00359c] text-white hover:bg-[#00359c]/90',
                                                (isClosed || isSelected) && 'opacity-70',
                                            )}
                                        >
                                            {isClosed ? 'Closed' : isSelected ? 'Selected' : 'Join'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span className="truncate">{formatEventWindow(event.startsAt, event.endsAt)}</span>
                                    </span>

                                    {event.location ? (
                                        <span className="inline-flex items-center gap-1.5 min-w-0">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="truncate">{event.location}</span>
                                        </span>
                                    ) : null}
                                </div>

                                <p className="mt-1 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
                                    {event.description || 'No description.'}
                                </p>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

export default function EventList({ programmes = [], joined_programme_ids = [] }: PageProps) {
    const nowTs = useNowTs();
    const [selectedIds, setSelectedIds] = React.useState<number[]>(() => joined_programme_ids);

    const [quickJoinId, setQuickJoinId] = React.useState<string>('');
    const [quickJoinOpen, setQuickJoinOpen] = React.useState(false);

    const [clearDialogOpen, setClearDialogOpen] = React.useState(false);

    const [tab, setTab] = React.useState<EventPhase>('ongoing');
    const [search, setSearch] = React.useState('');

    const normalized = React.useMemo(() => normalizeProgrammes(programmes, nowTs), [programmes, nowTs]);

    const grouped = React.useMemo(() => {
        const base = normalized.reduce(
            (acc, event) => {
                acc[event.phase].push(event);
                return acc;
            },
            { ongoing: [] as EventItem[], upcoming: [] as EventItem[], closed: [] as EventItem[] },
        );

        const q = search.trim().toLowerCase();
        if (!q) return base;

        const match = (e: EventItem) =>
            [e.title, e.description, e.tag, e.location].filter(Boolean).some((v) => v.toLowerCase().includes(q));

        return {
            ongoing: base.ongoing.filter(match),
            upcoming: base.upcoming.filter(match),
            closed: base.closed.filter(match),
        };
    }, [normalized, search]);

    const counts = React.useMemo(() => {
        const raw = normalized.reduce(
            (acc, e) => {
                acc[e.phase] += 1;
                return acc;
            },
            { ongoing: 0, upcoming: 0, closed: 0 },
        );
        return raw;
    }, [normalized]);

    React.useEffect(() => {
        setSelectedIds(joined_programme_ids);
    }, [joined_programme_ids]);

    React.useEffect(() => {
        // pick a sensible default tab
        const defaultTab: EventPhase = counts.ongoing ? 'ongoing' : counts.upcoming ? 'upcoming' : 'closed';
        setTab(defaultTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [counts.ongoing, counts.upcoming, counts.closed]);

    const handleJoin = React.useCallback((id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        router.post(
            `/event-list/${id}/join`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Event joined.'),
                onError: () => {
                    toast.error('Unable to join this event.');
                    setSelectedIds((prev) => prev.filter((item) => item !== id));
                },
            },
        );
    }, []);

    const handleLeave = React.useCallback((id: number) => {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        router.delete(`/event-list/${id}/leave`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Event removed.'),
            onError: () => {
                toast.error('Unable to remove this event.');
                setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
            },
        });
    }, []);

    const selectedSummary = React.useMemo<SelectionSummaryItem[]>(
        () =>
            normalized
                .filter((event) => selectedIds.includes(event.id))
                .map((event) => ({ id: event.id, title: event.title, phase: event.phase })),
        [normalized, selectedIds],
    );

    const handleClearAll = React.useCallback(() => {
        router.delete('/event-list/clear', {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                toast.success('All selections cleared.');
            },
            onError: () => toast.error('Unable to clear selections.'),
        });
    }, []);

    const quickJoinOptions = React.useMemo(() => normalized.filter((event) => event.phase !== 'closed'), [normalized]);

    const quickJoinSelection = React.useMemo(
        () => quickJoinOptions.find((event) => String(event.id) === quickJoinId) ?? null,
        [quickJoinOptions, quickJoinId],
    );

    const handleQuickJoin = React.useCallback(() => {
        const id = Number(quickJoinId);
        if (!Number.isNaN(id)) {
            handleJoin(id);
            setQuickJoinId('');
        }
    }, [quickJoinId, handleJoin]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event List" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-3 md:p-4">
                {/* Header (compact) */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-[#00359c]" />
                            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                Select events to join
                            </h1>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            Join ongoing or upcoming events. Closed events are read-only.
                        </p>
                    </div>
                </div>

                {/* My joined (more compact) */}
                <Card className="border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#00359c]/10 text-[#00359c]">
                                    <Users2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        My joined events
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        {selectedSummary.length} selected
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
                                <Popover open={quickJoinOpen} onOpenChange={setQuickJoinOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-9 w-full justify-between text-left text-xs font-normal text-slate-700 shadow-sm dark:text-slate-200 sm:w-64"
                                        >
                                            <span className="inline-flex items-center gap-2 truncate">
                                                {quickJoinSelection ? (
                                                    <>
                                                        <span className="truncate">{quickJoinSelection.title}</span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-[10px] uppercase tracking-wide',
                                                                phaseBadgeClass(quickJoinSelection.phase),
                                                            )}
                                                        >
                                                            {phaseLabel(quickJoinSelection.phase)}
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        Quick join an event
                                                    </span>
                                                )}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-[320px] p-0" align="end">
                                        <Command>
                                            <CommandInput placeholder="Search events..." />
                                            <CommandEmpty>No event found.</CommandEmpty>
                                            <CommandGroup>
                                                {quickJoinOptions.map((event) => (
                                                    <CommandItem
                                                        key={event.id}
                                                        value={event.title}
                                                        onSelect={() => {
                                                            setQuickJoinId(String(event.id));
                                                            setQuickJoinOpen(false);
                                                        }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="inline-flex size-4 items-center justify-center">
                                                            {quickJoinId === String(event.id) ? <Check className="h-4 w-4" /> : null}
                                                        </span>
                                                        <span className="flex-1 truncate">{event.title}</span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn('text-[10px] uppercase tracking-wide', phaseBadgeClass(event.phase))}
                                                        >
                                                            {phaseLabel(event.phase)}
                                                        </Badge>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleQuickJoin}
                                        disabled={!quickJoinId}
                                        className="h-9 flex-1 bg-[#00359c] text-white shadow-sm hover:bg-[#00359c]/90 sm:flex-none"
                                    >
                                        Join
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="h-9 shadow-sm"
                                        onClick={() => setClearDialogOpen(true)}
                                        disabled={selectedSummary.length === 0}
                                    >
                                        Clear all
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* compact chips row */}
                        {selectedSummary.length ? (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {selectedSummary.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                                    >
                                        <span className="max-w-[220px] truncate font-medium">{event.title}</span>
                                        <Badge
                                            variant="outline"
                                            className={cn('h-5 px-1.5 text-[10px] uppercase tracking-wide', phaseBadgeClass(event.phase))}
                                        >
                                            {phaseLabel(event.phase)}
                                        </Badge>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                                            onClick={() => handleLeave(event.id)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Pick an ongoing or upcoming event below to join.
                            </p>
                        )}
                    </div>
                </Card>

                <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Clear all joined events?</DialogTitle>
                            <DialogDescription>
                                This will remove all your joined events. You can rejoin ongoing or upcoming events later.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setClearDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    setClearDialogOpen(false);
                                    handleClearAll();
                                }}
                            >
                                Clear all
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Events (compact tabs + search) */}
                <Card className="border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <Tabs value={tab} onValueChange={(v) => setTab(v as EventPhase)} className="space-y-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <TabsList className="w-full justify-start bg-slate-100/70 dark:bg-slate-900/50 md:w-auto">
                                <TabsTrigger value="ongoing" className="gap-2">
                                    Ongoing
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                        {counts.ongoing}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="upcoming" className="gap-2">
                                    Upcoming
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                        {counts.upcoming}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="closed" className="gap-2">
                                    Closed
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                        {counts.closed}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="join" className="gap-2">
                                    Join
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                        {counts.ongoing}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="missed" className="gap-2">
                                    Missed
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                        {counts.ongoing}
                                    </Badge>
                                </TabsTrigger>

                            </TabsList>

                            <div className="relative w-full md:w-72">
                                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search events..."
                                    className="h-9 pl-8 text-sm"
                                />
                            </div>
                        </div>

                        <TabsContent value="ongoing" className="mt-0 space-y-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Events currently happening. Join now.
                            </p>
                            <EventGrid events={grouped.ongoing} selectedIds={selectedIds} onJoin={handleJoin} />
                        </TabsContent>

                        <TabsContent value="upcoming" className="mt-0 space-y-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Plan ahead and reserve your spot.
                            </p>
                            <EventGrid events={grouped.upcoming} selectedIds={selectedIds} onJoin={handleJoin} />
                        </TabsContent>

                        <TabsContent value="closed" className="mt-0 space-y-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Past events (read-only).
                            </p>
                            <EventGrid events={grouped.closed} selectedIds={selectedIds} onJoin={handleJoin} />
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </AppLayout>
    );
}
