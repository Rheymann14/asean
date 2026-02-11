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
import { Check, ChevronsUpDown } from 'lucide-react';

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
    display_id: string | null;
    name: string;
    email: string;
    country_name: string | null;
    has_attended: boolean;
    joined_programme_ids: number[];
    attended_programme_ids: number[];
};

type PageProps = {
    summary: Summary;
    rows: ReportRow[];
    events: EventRow[];
    now_iso?: string | null;
};

type EventPhase = 'ongoing' | 'upcoming' | 'closed';

const PER_PAGE = 10;
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
    if (!value) return 'Schedule TBA';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Schedule TBA';

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export default function Reports({ summary, rows, events, now_iso }: PageProps) {
    const [search, setSearch] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedEvent, setSelectedEvent] = React.useState<string>(ALL_EVENTS_VALUE);
    const [eventsOpen, setEventsOpen] = React.useState(false);
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

    const rowsAfterEventFilter = React.useMemo(() => {
        if (selectedEvent === ALL_EVENTS_VALUE) {
            return rows;
        }

        const selectedEventId = Number(selectedEvent);
        if (!selectedEventId) {
            return rows;
        }

        return rows.filter((row) =>
            row.joined_programme_ids.includes(selectedEventId) || row.attended_programme_ids.includes(selectedEventId),
        );
    }, [rows, selectedEvent]);

    const filteredRows = React.useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return rowsAfterEventFilter;

        return rowsAfterEventFilter.filter((row) => {
            const selectedEventId = selectedEvent === ALL_EVENTS_VALUE ? null : Number(selectedEvent);
            const statusLabel =
                selectedEventId === null
                    ? row.has_attended
                        ? 'attended'
                        : 'did not join'
                    : row.attended_programme_ids.includes(selectedEventId)
                      ? 'attended'
                      : 'did not join';

            return [row.display_id ?? '', row.name, row.email, row.country_name ?? '', statusLabel]
                .join(' ')
                .toLowerCase()
                .includes(keyword);
        });
    }, [rowsAfterEventFilter, search, selectedEvent]);

    const summaryCards = React.useMemo(() => {
        if (selectedEvent === ALL_EVENTS_VALUE) {
            return summary;
        }

        const selectedEventId = Number(selectedEvent);

        const totalRegisteredParticipants = rows.filter((row) => row.joined_programme_ids.includes(selectedEventId)).length;
        const totalParticipantsAttended = rows.filter((row) => row.attended_programme_ids.includes(selectedEventId)).length;
        const totalParticipantsDidNotJoin = Math.max(0, totalRegisteredParticipants - totalParticipantsAttended);

        return {
            total_registered_participants: totalRegisteredParticipants,
            total_participants_attended: totalParticipantsAttended,
            total_participants_did_not_join: totalParticipantsDidNotJoin,
        };
    }, [rows, selectedEvent, summary]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedEvent]);

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedRows = React.useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

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
                                            className="w-full justify-between gap-2 md:w-[340px]"
                                        >
                                            <span className="min-w-0 truncate text-left">
                                                {selectedEventData ? selectedEventData.title : 'All Events'}
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search event..." />
                                            <CommandEmpty>No event found.</CommandEmpty>
                                            <CommandList>
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
                                                            <Badge className={cn('shrink-0', phaseBadgeClass(event.phase))}>{event.phase_label}</Badge>
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
                                    placeholder="Search by ID, name, email, country, or status"
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
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRows.length ? (
                                        paginatedRows.map((row) => {
                                            const selectedEventId = selectedEvent === ALL_EVENTS_VALUE ? null : Number(selectedEvent);
                                            const hasAttendedSelectedEvent =
                                                selectedEventId === null
                                                    ? row.has_attended
                                                    : row.attended_programme_ids.includes(selectedEventId);

                                            return (
                                                <TableRow key={row.id}>
                                                    <TableCell>{row.display_id ?? '-'}</TableCell>
                                                    <TableCell>{row.name}</TableCell>
                                                    <TableCell>{row.email}</TableCell>
                                                    <TableCell>{row.country_name ?? '-'}</TableCell>
                                                    <TableCell>{hasAttendedSelectedEvent ? 'Attended' : 'Did Not Join'}</TableCell>
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
                            <p>
                                Showing {(currentPage - 1) * PER_PAGE + (paginatedRows.length ? 1 : 0)} to{' '}
                                {(currentPage - 1) * PER_PAGE + paginatedRows.length} of {filteredRows.length} entries
                            </p>

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
