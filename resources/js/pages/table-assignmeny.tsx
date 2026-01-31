import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, Plus, Users2, XCircle, Table as TableIcon } from 'lucide-react';

type Country = {
    id: number;
    code: string;
    name: string;
    flag_url?: string | null;
};

type UserType = {
    id: number;
    name: string;
    slug: string;
};

type Participant = {
    id: number;
    full_name: string;
    country?: Country | null;
    user_type?: UserType | null;
};

type TableAssignment = {
    id: number;
    assigned_at?: string | null;
    participant?: Participant | null;
};

type TableRow = {
    id: number;
    table_number: string;
    capacity: number;
    assigned_count: number;
    assignments: TableAssignment[];
};

type EventRow = {
    id: number;
    title: string;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active: boolean;
};

type PageProps = {
    tables?: TableRow[];
    participants?: Participant[];
    events?: EventRow[];
    selected_event_id?: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Table Assignment', href: '/table-assignment' }];

const ENDPOINTS = {
    tables: {
        store: '/table-assignment/tables',
        update: (id: number) => `/table-assignment/tables/${id}`,
    },
    assignments: {
        store: '/table-assignment/assignments',
        destroy: (id: number) => `/table-assignment/assignments/${id}`,
    },
};

const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

function formatDateTime(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

type EventPhase = 'ongoing' | 'upcoming' | 'closed';

function resolveEventPhase(event: EventRow, now: number): EventPhase {
    if (!event.is_active) return 'closed';
    const startsAt = event.starts_at ? new Date(event.starts_at).getTime() : null;
    const endsAt = event.ends_at ? new Date(event.ends_at).getTime() : null;

    if (startsAt && now < startsAt) return 'upcoming';
    if (endsAt && now > endsAt) return 'closed';
    return 'ongoing';
}

function phaseLabel(phase: EventPhase) {
    return phase === 'ongoing' ? 'Ongoing' : phase === 'upcoming' ? 'Upcoming' : 'Closed';
}

function phaseBadgeClass(phase: EventPhase) {
    switch (phase) {
        case 'ongoing':
            return 'bg-emerald-100 text-emerald-700';
        case 'upcoming':
            return 'bg-amber-100 text-amber-700';
        default:
            return 'bg-slate-200 text-slate-600';
    }
}

function FlagThumb({ country, size = 18 }: { country: Country; size?: number }) {
    const src = country.flag_url || null;

    return (
        <div
            className="grid shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            style={{ width: size, height: size }}
        >
            {src ? (
                <img
                    src={src}
                    alt={`${country.name} flag`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                />
            ) : (
                <span>{country.code}</span>
            )}
        </div>
    );
}

export default function TableAssignmenyPage(props: PageProps) {
    const tables = props.tables ?? [];
    const participants = props.participants ?? [];
    const events = props.events ?? [];

    const initialEventId = props.selected_event_id ? String(props.selected_event_id) : '';

    const tableForm = useForm({
        programme_id: initialEventId,
        table_number: '',
        capacity: '',
    });

    const assignmentForm = useForm({
        programme_id: initialEventId,
        participant_table_id: '',
        participant_ids: [] as number[],
    });

    const [selectedEventId, setSelectedEventId] = React.useState<string>(initialEventId);
    const [selectedTableId, setSelectedTableId] = React.useState<string>('');
    const [selectedParticipantIds, setSelectedParticipantIds] = React.useState<Set<number>>(new Set());
    const [capacityDrafts, setCapacityDrafts] = React.useState<Record<number, string>>({});
    const hasHydrated = React.useRef(false);
    const selectedEvent = selectedEventId ? events.find((event) => String(event.id) === selectedEventId) : null;
    const selectedEventPhase = selectedEvent ? resolveEventPhase(selectedEvent, Date.now()) : null;
    const isEventClosed = selectedEventPhase === 'closed';

    React.useEffect(() => {
        const nextDrafts: Record<number, string> = {};
        tables.forEach((table) => {
            nextDrafts[table.id] = String(table.capacity ?? '');
        });
        setCapacityDrafts(nextDrafts);
    }, [tables]);

    React.useEffect(() => {
        if (!hasHydrated.current) {
            hasHydrated.current = true;
            return;
        }

        setSelectedTableId('');
        setSelectedParticipantIds(new Set());
        tableForm.reset('table_number', 'capacity');
        tableForm.clearErrors();
        assignmentForm.clearErrors();

        router.get(
            '/table-assignment',
            { event_id: selectedEventId || undefined },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }, [selectedEventId]);

    const allSelected = participants.length > 0 && participants.every((p) => selectedParticipantIds.has(p.id));

    function toggleParticipant(id: number, checked: boolean) {
        setSelectedParticipantIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }

    function toggleAllParticipants(checked: boolean) {
        setSelectedParticipantIds(() => {
            if (!checked) return new Set();
            return new Set(participants.map((p) => p.id));
        });
    }

    function submitTable(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEventId) {
            toast.error('Select an event before creating a table.');
            return;
        }

        tableForm.transform((data) => ({
            ...data,
            programme_id: selectedEventId,
        }));
        tableForm.post(ENDPOINTS.tables.store, {
            onSuccess: () => {
                toast.success('Table added.');
                tableForm.reset();
            },
            onError: () => toast.error('Unable to add table.'),
        });
    }

    function submitAssignments(e: React.FormEvent) {
        e.preventDefault();
        const ids = Array.from(selectedParticipantIds);
        if (!selectedEventId) {
            toast.error('Select an event before assigning participants.');
            return;
        }
        if (isEventClosed) {
            toast.error('This event is closed.');
            return;
        }
        if (!selectedTableId) {
            toast.error('Select a table to assign participants.');
            return;
        }
        if (ids.length === 0) {
            toast.error('Select at least one participant.');
            return;
        }

        assignmentForm.transform(() => ({
            programme_id: selectedEventId,
            participant_table_id: String(Number(selectedTableId)),
            participant_ids: ids,
        }));

        assignmentForm.post(ENDPOINTS.assignments.store, {
            onSuccess: () => {
                toast.success('Participants assigned to table.');
                setSelectedParticipantIds(new Set());
            },
            onError: () => toast.error('Unable to assign participants.'),
        });
    }

    function updateCapacity(tableId: number) {
        const capacity = Number(capacityDrafts[tableId]);
        if (!Number.isFinite(capacity) || capacity <= 0) {
            toast.error('Enter a valid capacity.');
            return;
        }

        router.patch(
            ENDPOINTS.tables.update(tableId),
            { capacity },
            {
                onSuccess: () => toast.success('Table capacity updated.'),
                onError: () => toast.error('Unable to update capacity.'),
            },
        );
    }

    function removeAssignment(id: number) {
        router.delete(ENDPOINTS.assignments.destroy(id), {
            onSuccess: () => toast.success('Participant removed from table.'),
            onError: () => toast.error('Unable to remove participant.'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Table Assignment" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <TableIcon className="h-5 w-5 text-[#00359c]" />
                                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                    Table Assignment
                                </h1>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Assign participants to tables, manage capacities, and track seating.
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-slate-200/70 dark:bg-slate-800" />
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Event context</CardTitle>
                            <CardDescription>Pick the event to manage seating assignments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-[260px,1fr] md:items-center">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Event</label>
                                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    No events available
                                                </SelectItem>
                                            ) : (
                                                events.map((event) => (
                                                    <SelectItem key={event.id} value={String(event.id)}>
                                                        {event.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    {selectedEventId ? (
                                        (() => {
                                            if (!selectedEvent) return <span className="text-slate-500">Event details unavailable.</span>;
                                            const phase = selectedEventPhase ?? 'closed';
                                            return (
                                                <>
                                                    <Badge className={phaseBadgeClass(phase)}>{phaseLabel(phase)}</Badge>
                                                    <span className="text-slate-500">
                                                        {selectedEvent.starts_at ? formatDateTime(selectedEvent.starts_at) : 'Schedule TBA'}
                                                    </span>
                                                </>
                                            );
                                        })()
                                    ) : (
                                        <span className="text-slate-500">Choose an event to load tables and participants.</span>
                                    )}
                                </div>
                            </div>
                            {isEventClosed ? (
                                <p className="text-sm text-rose-600">
                                    Table assignments are locked because this event is closed.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Create Table</CardTitle>
                            <CardDescription>Set up a new table with a number and capacity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitTable} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Table name</label>
                                    <Input
                                        type="text"
                                        value={tableForm.data.table_number}
                                        onChange={(e) => tableForm.setData('table_number', e.target.value)}
                                        placeholder="e.g. Table 1"
                                    />
                                    {tableForm.errors.table_number ? (
                                        <p className="text-xs text-rose-500">{tableForm.errors.table_number}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Capacity</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={tableForm.data.capacity}
                                        onChange={(e) => tableForm.setData('capacity', e.target.value)}
                                        placeholder="e.g. 8"
                                    />
                                    {tableForm.errors.capacity ? (
                                        <p className="text-xs text-rose-500">{tableForm.errors.capacity}</p>
                                    ) : null}
                                </div>
                                <Button type="submit" disabled={tableForm.processing} className={cn('w-full sm:w-auto', PRIMARY_BTN)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add table
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Assign Participants</CardTitle>
                            <CardDescription>Select a table and choose participants to assign.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitAssignments} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-[220px,1fr]">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Table</label>
                                        <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose table" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tables.length === 0 ? (
                                                    <SelectItem value="none" disabled>
                                                        No tables yet
                                                    </SelectItem>
                                                ) : (
                                                    tables.map((table) => (
                                                        <SelectItem key={table.id} value={String(table.id)}>
                                                            {table.table_number} ({table.assigned_count}/{table.capacity})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {assignmentForm.errors.participant_table_id ? (
                                            <p className="text-xs text-rose-500">{assignmentForm.errors.participant_table_id}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="submit"
                                            disabled={assignmentForm.processing || isEventClosed}
                                            className={cn('w-full sm:w-auto', PRIMARY_BTN)}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Assign selected
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Users2 className="h-4 w-4" />
                                        {participants.length} participants not yet assigned
                                    </div>
                                    <div>{selectedParticipantIds.size} selected</div>
                                </div>
                                {assignmentForm.errors.participant_ids ? (
                                    <p className="text-xs text-rose-500">{assignmentForm.errors.participant_ids}</p>
                                ) : null}

                                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                                <TableHead className="w-[48px]">
                                                    <Checkbox
                                                        checked={allSelected}
                                                        onCheckedChange={(checked) => toggleAllParticipants(Boolean(checked))}
                                                    />
                                                </TableHead>
                                                <TableHead>Participant</TableHead>
                                                <TableHead className="w-[180px]">Role</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {participants.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="py-6 text-center text-sm text-slate-500">
                                                        All participants are assigned to tables.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                participants.map((participant) => (
                                                    <TableRow key={participant.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedParticipantIds.has(participant.id)}
                                                                onCheckedChange={(checked) =>
                                                                    toggleParticipant(participant.id, Boolean(checked))
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                {participant.country ? (
                                                                    <FlagThumb country={participant.country} size={22} />
                                                                ) : null}
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                                        {participant.full_name}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {participant.country?.name ?? 'Country unavailable'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {participant.user_type?.name ?? 'Unassigned role'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tables & assignments</h2>
                        <span className="text-sm text-slate-500">{tables.length} tables</span>
                    </div>

                    {tables.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-slate-500">
                                No tables created yet. Add a table to start assigning participants.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {tables.map((table) => {
                                const available = table.capacity - table.assigned_count;
                                return (
                                    <Card key={table.id}>
                                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-base">{table.table_number}</CardTitle>
                                                <CardDescription>
                                                    {table.assigned_count} of {table.capacity} seats occupied
                                                </CardDescription>
                                            </div>
                                            <Badge className={cn(available > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                                                {available > 0 ? `${available} seats left` : 'Full'}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-end gap-3">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Capacity</label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={capacityDrafts[table.id] ?? ''}
                                                        onChange={(e) =>
                                                            setCapacityDrafts((prev) => ({
                                                                ...prev,
                                                                [table.id]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <Button type="button" variant="outline" onClick={() => updateCapacity(table.id)}>
                                                    Update
                                                </Button>
                                            </div>

                                            <Separator />

                                            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                                            <TableHead>Participant</TableHead>
                                                            <TableHead className="w-[140px]">Role</TableHead>
                                                            <TableHead className="w-[180px]">Assigned at</TableHead>
                                                            <TableHead className="w-[80px] text-right">Action</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {table.assignments.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={4}
                                                                    className="py-6 text-center text-sm text-slate-500"
                                                                >
                                                                    No participants assigned yet.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            table.assignments.map((assignment) => (
                                                                <TableRow key={assignment.id}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-3">
                                                                            {assignment.participant?.country ? (
                                                                                <FlagThumb
                                                                                    country={assignment.participant.country}
                                                                                    size={22}
                                                                                />
                                                                            ) : null}
                                                                            <div className="min-w-0">
                                                                                <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                                                    {assignment.participant?.full_name ?? 'Participant removed'}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500">
                                                                                    {assignment.participant?.country?.name ?? 'Country unavailable'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="secondary">
                                                                            {assignment.participant?.user_type?.name ?? 'Unassigned role'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-slate-700 dark:text-slate-300">
                                                                        {formatDateTime(assignment.assigned_at)}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => removeAssignment(assignment.id)}
                                                                            aria-label="Remove participant"
                                                                            disabled={isEventClosed}
                                                                        >
                                                                            <XCircle className="h-4 w-4 text-rose-500" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
