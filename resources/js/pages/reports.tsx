import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toDateOnlyTimestamp, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { ArrowUpDown, Check, ChevronsUpDown } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports', href: '/reports' }];

type Summary = {
    total_registered_participants: number;
    total_participants_attended: number;
    total_participants_did_not_join: number;
};

type EventRow = {
    id: number;
    title: string;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active: boolean;
};

type ReportRow = {
    id: number;
    honorific_title?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    suffix?: string | null;
    name: string;
    country_name?: string | null;
    registrant_type?: string | null;
    organization_name?: string | null;
    has_attended: boolean;
    joined_programme_ids: number[];
    attended_programme_ids: number[];
    attendance_by_programme: Record<string, string | null>;
    latest_attendance_at?: string | null;
};

type PageProps = {
    summary: Summary;
    rows: ReportRow[];
    events: EventRow[];
    now_iso?: string | null;
};

type EventPhase = 'ongoing' | 'upcoming' | 'closed';
type CheckinSort = 'desc' | 'asc';

const PAGE_SIZE_OPTIONS = [10, 50, 100, 1000] as const;
const ALL_EVENTS_VALUE = 'all';

function resolveEventPhase(event: EventRow, nowTs: number): EventPhase {
    if (!event.is_active) return 'closed';

    const startDate = event.starts_at ? new Date(event.starts_at) : null;
    const endDate = event.ends_at ? new Date(event.ends_at) : null;

    const todayTs = toDateOnlyTimestamp(new Date(nowTs));
    const startTs = startDate ? toDateOnlyTimestamp(startDate) : null;
    const endTs = endDate ? toDateOnlyTimestamp(endDate) : null;

    if (startTs !== null && todayTs < startTs) return 'upcoming';
    if (endTs !== null && todayTs > endTs) return 'closed';
    return 'ongoing';
}

function phaseLabel(phase: EventPhase) {
    return phase === 'ongoing' ? 'Ongoing' : phase === 'upcoming' ? 'Upcoming' : 'Closed';
}

function phaseBadgeClass(phase: EventPhase) {
    switch (phase) {
        case 'ongoing':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
        case 'upcoming':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
        default:
            return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function buildDisplayName(row: ReportRow) {
    const parts = [row.honorific_title, row.given_name, row.family_name, row.suffix]
        .map((item) => (item ?? '').trim())
        .filter(Boolean);

    if (parts.length) return parts.join(' ');

    return row.name;
}

function getCheckinTime(row: ReportRow, selectedEventId: number | null): string | null | undefined {
    if (selectedEventId) return row.attendance_by_programme?.[String(selectedEventId)];
    return row.latest_attendance_at;
}

export default function Reports({ summary, rows, events, now_iso }: PageProps) {
    const [search, setSearch] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedEvent, setSelectedEvent] = React.useState<string>(ALL_EVENTS_VALUE);
    const [eventsOpen, setEventsOpen] = React.useState(false);
    const [checkinSort, setCheckinSort] = React.useState<CheckinSort>('desc');
    const [entriesPerPage, setEntriesPerPage] = React.useState<number>(10);

    const referenceNowTs = React.useMemo(() => {
        const parsed = now_iso ? Date.parse(now_iso) : Number.NaN;
        return Number.isNaN(parsed) ? 0 : parsed;
    }, [now_iso]);

    const eventOptionItems = React.useMemo(() => {
        return events
            .map((event) => {
                const phase = resolveEventPhase(event, referenceNowTs);
                return {
                    ...event,
                    phase,
                    phase_label: phaseLabel(phase),
                };
            })
            .sort((a, b) => {
                const order: Record<EventPhase, number> = { ongoing: 0, upcoming: 1, closed: 2 };
                return order[a.phase] - order[b.phase];
            });
    }, [events, referenceNowTs]);

    const selectedEventData = React.useMemo(
        () => eventOptionItems.find((event) => String(event.id) === selectedEvent) ?? null,
        [eventOptionItems, selectedEvent],
    );

    const selectedEventId = React.useMemo(() => {
        if (selectedEvent === ALL_EVENTS_VALUE) return null;
        const parsed = Number(selectedEvent);
        return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
    }, [selectedEvent]);

    const rowsAfterEventFilter = React.useMemo(() => {
        if (!selectedEventId) return rows;

        return rows.filter((row) =>
            row.joined_programme_ids.includes(selectedEventId) || row.attended_programme_ids.includes(selectedEventId),
        );
    }, [rows, selectedEventId]);

    const filteredRows = React.useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return rowsAfterEventFilter;

        return rowsAfterEventFilter.filter((row) => {
            const checkinLabel = selectedEventId
                ? row.attended_programme_ids.includes(selectedEventId)
                    ? 'checked in attended'
                    : 'did not join'
                : row.has_attended
                    ? 'checked in attended'
                    : 'did not join';

            return [
                buildDisplayName(row),
                row.country_name ?? '',
                row.registrant_type ?? '',
                row.organization_name ?? '',
                checkinLabel,
            ]
                .join(' ')
                .toLowerCase()
                .includes(keyword);
        });
    }, [rowsAfterEventFilter, search, selectedEventId]);

    const sortedRows = React.useMemo(() => {
        const rowsCopy = [...filteredRows];

        return rowsCopy.sort((a, b) => {
            const aScan = getCheckinTime(a, selectedEventId);
            const bScan = getCheckinTime(b, selectedEventId);
            const aParsed = aScan ? Date.parse(aScan) : Number.NaN;
            const bParsed = bScan ? Date.parse(bScan) : Number.NaN;
            const aTs = Number.isNaN(aParsed) ? (checkinSort === 'desc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : aParsed;
            const bTs = Number.isNaN(bParsed) ? (checkinSort === 'desc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : bParsed;

            if (aTs === bTs) return buildDisplayName(a).localeCompare(buildDisplayName(b));
            return checkinSort === 'desc' ? bTs - aTs : aTs - bTs;
        });
    }, [filteredRows, selectedEventId, checkinSort]);

    const summaryCards = React.useMemo(() => {
        if (selectedEvent === ALL_EVENTS_VALUE) return summary;

        const selectedId = Number(selectedEvent);
        const totalRegisteredParticipants = rows.filter((row) => row.joined_programme_ids.includes(selectedId)).length;
        const totalParticipantsAttended = rows.filter((row) => row.attended_programme_ids.includes(selectedId)).length;
        const totalParticipantsDidNotJoin = Math.max(0, totalRegisteredParticipants - totalParticipantsAttended);

        return {
            total_registered_participants: totalRegisteredParticipants,
            total_participants_attended: totalParticipantsAttended,
            total_participants_did_not_join: totalParticipantsDidNotJoin,
        };
    }, [rows, selectedEvent, summary]);

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / entriesPerPage));

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedEvent, checkinSort, entriesPerPage]);

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedRows = React.useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return sortedRows.slice(start, start + entriesPerPage);
    }, [sortedRows, currentPage, entriesPerPage]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reports</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Total Registered Participants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summaryCards.total_registered_participants.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Total Participants Attended
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summaryCards.total_participants_attended.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Total Participants Did Not Join
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{summaryCards.total_participants_did_not_join.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <CardTitle>Participants Report</CardTitle>

                            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                <Popover open={eventsOpen} onOpenChange={setEventsOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={eventsOpen}
                                            className="
                h-auto w-full justify-between gap-2 py-2
                sm:max-w-[420px]
                md:w-[260px] md:max-w-none
            "
                                        >
                                            <span className="min-w-0 break-words whitespace-normal text-left leading-tight md:overflow-hidden md:text-ellipsis md:whitespace-nowrap">
                                                {selectedEventData ? selectedEventData.title : 'All Events'}
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        align="start"
                                        sideOffset={8}
                                        className="
            p-0
            w-[min(420px,calc(100vw-1.5rem))]
            max-h-[70vh] overflow-hidden
            md:w-[--radix-popover-trigger-width]
        "
                                    >
                                        <Command className="w-full">
                                            <CommandInput placeholder="Search event..." />
                                            <CommandEmpty>No event found.</CommandEmpty>

                                            <CommandList className="max-h-[60vh] overflow-auto">
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all events"
                                                        onSelect={() => {
                                                            setSelectedEvent(ALL_EVENTS_VALUE);
                                                            setEventsOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                selectedEvent === ALL_EVENTS_VALUE ? 'opacity-100' : 'opacity-0',
                                                            )}
                                                        />
                                                        <span className="truncate">All Events</span>
                                                    </CommandItem>

                                                    {eventOptionItems.map((event) => (
                                                        <CommandItem
                                                            key={event.id}
                                                            value={`${event.title} ${event.phase_label}`}
                                                            onSelect={() => {
                                                                setSelectedEvent(String(event.id));
                                                                setEventsOpen(false);
                                                            }}
                                                            className="flex items-start justify-between gap-2"
                                                        >
                                                            <div className="flex min-w-0 items-start gap-2">
                                                                <Check
                                                                    className={cn(
                                                                        'mt-0.5 h-4 w-4 shrink-0',
                                                                        selectedEvent === String(event.id) ? 'opacity-100' : 'opacity-0',
                                                                    )}
                                                                />
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium">{event.title}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {formatDateTime(event.starts_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge className={cn('shrink-0', phaseBadgeClass(event.phase))}>
                                                                {event.phase_label}
                                                            </Badge>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>


                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search name, country, registrant type, organization, or check-in"
                                    className="w-full md:w-80"
                                />
                            </div>
                        </div>

                        {selectedEventData ? (
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Filtered by: <span className="font-medium">{selectedEventData.title}</span>{' '}
                                <Badge className={phaseBadgeClass(selectedEventData.phase)}>{selectedEventData.phase_label}</Badge>
                            </p>
                        ) : null}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Seq</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Registrant Type</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="-ml-3 h-8 gap-1 px-3 font-semibold"
                                                onClick={() => setCheckinSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                                            >
                                                Check-in (Date and Time)
                                                <ArrowUpDown className="h-3.5 w-3.5" />
                                                <span className="text-[11px] text-slate-500">
                                                    {checkinSort === 'desc' ? 'Newest' : 'Oldest'}
                                                </span>
                                            </Button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRows.length ? (
                                        paginatedRows.map((row, index) => {
                                            const scannedAt = getCheckinTime(row, selectedEventId);
                                            const hasCheckin = Boolean(scannedAt);

                                            return (
                                                <TableRow key={row.id}>
                                                    <TableCell>{(currentPage - 1) * entriesPerPage + index + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="min-w-[240px]">
                                                            <p className="font-medium text-slate-900 dark:text-slate-100">{buildDisplayName(row)}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{row.country_name ?? '—'}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{row.registrant_type ?? '—'}</TableCell>
                                                    <TableCell>{row.organization_name ?? '—'}</TableCell>
                                                    <TableCell>
                                                        {hasCheckin ? (
                                                            <div className="flex flex-col gap-1">
                                                                <Badge className="w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                                    Checked In
                                                                </Badge>
                                                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                                                    {formatDateTime(scannedAt)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                                                Did Not Join
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-slate-500">
                                                No participants found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-600 md:flex-row dark:text-slate-300">
                            <div className="flex flex-col items-center gap-2 sm:flex-row">
                                <div className="flex items-center gap-2">
                                    <span>Show entries</span>
                                    <Select
                                        value={String(entriesPerPage)}
                                        onValueChange={(value) => setEntriesPerPage(Number(value))}
                                    >
                                        <SelectTrigger className="h-8 w-[90px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAGE_SIZE_OPTIONS.map((size) => (
                                                <SelectItem key={size} value={String(size)}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p>
                                    Showing {(currentPage - 1) * entriesPerPage + (paginatedRows.length ? 1 : 0)} to{' '}
                                    {(currentPage - 1) * entriesPerPage + paginatedRows.length} of {sortedRows.length} entries
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                >
                                    Previous
                                </Button>
                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
