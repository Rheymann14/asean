import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Bus, Check, CheckCircle2, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vehicle Assignment', href: '/vehicle-assignment' }];

type EventRow = { id: number; title: string };
type VehicleRow = { id: number; label: string; plate_number?: string | null };
type Assignment = {
    id: number;
    vehicle_id: number | null;
    vehicle_label: string | null;
    pickup_status: 'pending' | 'picked_up' | 'dropped_off';
};
type Participant = {
    id: number;
    full_name: string;
    email: string | null;
    assignment: Assignment | null;
};

type PageProps = {
    events: EventRow[];
    selected_event_id?: number | null;
    vehicles: VehicleRow[];
    participants: Participant[];
};

type SearchItem = {
    value: string;
    label: string;
    description?: string;
};

function SearchableDropdown({
    value,
    onValueChange,
    items,
    placeholder,
    searchPlaceholder,
    emptyText,
}: {
    value: string;
    onValueChange: (value: string) => void;
    items: SearchItem[];
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
}) {
    const [open, setOpen] = React.useState(false);
    const selected = items.find((item) => item.value === value) ?? null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between" type="button">
                    <span className={cn('truncate', !selected && 'text-slate-500')}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[min(var(--radix-popover-trigger-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] p-0"
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={`${item.label} ${item.description ?? ''}`.trim()}
                                    onSelect={() => {
                                        onValueChange(item.value);
                                        setOpen(false);
                                    }}
                                    className="min-w-0 gap-2"
                                >
                                    <Check className={cn('h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate">{item.label}</div>
                                        {item.description ? (
                                            <div className="truncate text-xs text-slate-500">{item.description}</div>
                                        ) : null}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function showToastError(errors: Record<string, string | string[]>) {
    const first = Object.values(errors ?? {})[0];
    toast.error(Array.isArray(first) ? first[0] : first || 'Please review the form and try again.');
}

export default function VehicleAssignmentPage({ events, selected_event_id, vehicles, participants }: PageProps) {
    const selectedEventId = selected_event_id ? String(selected_event_id) : events[0] ? String(events[0].id) : '';
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [selectedAssignedIds, setSelectedAssignedIds] = React.useState<number[]>([]);
    const [assignedSearch, setAssignedSearch] = React.useState('');
    const [unassignedSearch, setUnassignedSearch] = React.useState('');
    const [assignedPage, setAssignedPage] = React.useState(1);
    const [unassignedPage, setUnassignedPage] = React.useState(1);
    const perPage = 10;

    const assignmentForm = useForm({
        programme_id: selectedEventId,
        vehicle_id: vehicles[0] ? String(vehicles[0].id) : '',
        participant_ids: [] as number[],
    });

    React.useEffect(() => {
        if (!selectedEventId) return;
        if (assignmentForm.data.programme_id !== selectedEventId) {
            assignmentForm.setData('programme_id', selectedEventId);
        }
    }, [assignmentForm.data.programme_id, assignmentForm.setData, selectedEventId]);

    const onChangeEvent = (value: string) => {
        assignmentForm.setData('programme_id', value);
        assignmentForm.setData('vehicle_id', '');
        setSelectedIds([]);
        setSelectedAssignedIds([]);
        router.get('/vehicle-assignment', { event_id: value || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const assignedParticipants = React.useMemo(() => participants.filter((participant) => participant.assignment), [participants]);
    const unassignedParticipants = React.useMemo(() => participants.filter((participant) => !participant.assignment), [participants]);

    const filteredAssignedParticipants = React.useMemo(() => {
        if (!assignedSearch.trim()) return assignedParticipants;
        const query = assignedSearch.trim().toLowerCase();
        return assignedParticipants.filter((participant) =>
            [participant.full_name, participant.email].filter(Boolean).some((value) => value!.toLowerCase().includes(query)),
        );
    }, [assignedParticipants, assignedSearch]);

    const filteredUnassignedParticipants = React.useMemo(() => {
        if (!unassignedSearch.trim()) return unassignedParticipants;
        const query = unassignedSearch.trim().toLowerCase();
        return unassignedParticipants.filter((participant) =>
            [participant.full_name, participant.email].filter(Boolean).some((value) => value!.toLowerCase().includes(query)),
        );
    }, [unassignedParticipants, unassignedSearch]);

    const assignedTotalPages = Math.max(1, Math.ceil(filteredAssignedParticipants.length / perPage));
    const unassignedTotalPages = Math.max(1, Math.ceil(filteredUnassignedParticipants.length / perPage));

    React.useEffect(() => {
        setAssignedPage(1);
    }, [assignedSearch, selectedEventId]);

    React.useEffect(() => {
        setUnassignedPage(1);
    }, [unassignedSearch, selectedEventId]);

    const assignedPageItems = filteredAssignedParticipants.slice((assignedPage - 1) * perPage, assignedPage * perPage);
    const unassignedPageItems = filteredUnassignedParticipants.slice((unassignedPage - 1) * perPage, unassignedPage * perPage);

    const toggleAllUnassigned = (checked: boolean) => {
        setSelectedIds(checked ? unassignedPageItems.map((p) => p.id) : []);
    };

    const toggleUnassignedParticipant = (participantId: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...new Set([...prev, participantId])] : prev.filter((id) => id !== participantId)));
    };

    const toggleAllAssigned = (checked: boolean) => {
        setSelectedAssignedIds(checked ? assignedPageItems.map((p) => p.id) : []);
    };

    const toggleAssignedParticipant = (participantId: number, checked: boolean) => {
        setSelectedAssignedIds((prev) =>
            checked ? [...new Set([...prev, participantId])] : prev.filter((id) => id !== participantId),
        );
    };

    const doAssign = (participantIds: number[], successMessage: string) => {
        if (!assignmentForm.data.programme_id) {
            toast.error('Please select an event.');
            return;
        }
        if (!assignmentForm.data.vehicle_id) {
            toast.error('Please select a vehicle.');
            return;
        }
        if (!participantIds.length) {
            toast.error('Please select participant(s) to assign.');
            return;
        }

        assignmentForm.clearErrors();

        router.post(
            '/vehicle-assignments',
            {
                programme_id: assignmentForm.data.programme_id,
                vehicle_id: assignmentForm.data.vehicle_id,
                participant_ids: participantIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(successMessage);
                    setSelectedIds([]);
                },
                onError: (errors) => {
                    assignmentForm.setError(errors as Record<string, string>);
                    showToastError(errors as Record<string, string | string[]>);
                },
            },
        );
    };

    const assignBulk = () => doAssign(selectedIds, 'Participants assigned to vehicle.');
    const assignSingle = (participantId: number) => doAssign([participantId], 'Participant assigned to vehicle.');

    const removeAssignment = (assignmentId: number) => {
        router.delete(`/vehicle-assignments/${assignmentId}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Participant assignment removed.'),
            onError: () => toast.error('Unable to remove assignment.'),
        });
    };

    const removeBulkAssignments = () => {
        const assignmentsToRemove = assignedParticipants.filter((participant) => selectedAssignedIds.includes(participant.id));
        if (!assignmentsToRemove.length) {
            toast.error('Please select participant(s) to unassign.');
            return;
        }
        assignmentsToRemove.forEach((participant) => {
            if (participant.assignment) {
                removeAssignment(participant.assignment.id);
            }
        });
        setSelectedAssignedIds([]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Assignment" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Bus className="h-5 w-5 text-[#00359c]" />
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Vehicle Assignment</h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Assign participants to vehicles per event.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Assign Participants</CardTitle>
                        <CardDescription>Select event and vehicle, then assign individual or bulk participants.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Event <span className="text-[11px] font-semibold text-red-600">*</span></Label>
                                <SearchableDropdown
                                    value={assignmentForm.data.programme_id}
                                    onValueChange={onChangeEvent}
                                    placeholder="Select event"
                                    searchPlaceholder="Search events..."
                                    emptyText="No events found."
                                    items={events.map((event) => ({ value: String(event.id), label: event.title }))}
                                />
                                {assignmentForm.errors.programme_id ? (
                                    <p className="text-xs text-rose-500">{assignmentForm.errors.programme_id}</p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <Label>Vehicle <span className="text-[11px] font-semibold text-red-600">*</span></Label>
                                <SearchableDropdown
                                    value={assignmentForm.data.vehicle_id}
                                    onValueChange={(value) => assignmentForm.setData('vehicle_id', value)}
                                    placeholder="Select vehicle"
                                    searchPlaceholder="Search vehicles..."
                                    emptyText="No vehicles found."
                                    items={vehicles.map((vehicle) => ({
                                        value: String(vehicle.id),
                                        label: vehicle.label,
                                        description: vehicle.plate_number || '',
                                    }))}
                                />
                                {assignmentForm.errors.vehicle_id ? (
                                    <p className="text-xs text-rose-500">{assignmentForm.errors.vehicle_id}</p>
                                ) : null}
                            </div>
                        </div>

                        {assignmentForm.errors.participant_ids ? (
                            <p className="text-xs text-rose-500">{assignmentForm.errors.participant_ids}</p>
                        ) : null}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Assigned Participants</CardTitle>
                            <CardDescription>Remove assignments from participants already assigned to a vehicle.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="w-full sm:max-w-xs">
                                    <Label htmlFor="assigned-search">Search participant</Label>
                                    <Input
                                        id="assigned-search"
                                        placeholder="Search assigned participant..."
                                        value={assignedSearch}
                                        onChange={(event) => setAssignedSearch(event.target.value)}
                                    />
                                </div>
                                <Button type="button" variant="outline" onClick={removeBulkAssignments} disabled={!selectedAssignedIds.length}>
                                    Remove Selected
                                </Button>
                            </div>
                            <div className="overflow-hidden rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">
                                                <Checkbox
                                                    checked={assignedPageItems.length > 0 && selectedAssignedIds.length === assignedPageItems.length}
                                                    onCheckedChange={(checked) => toggleAllAssigned(Boolean(checked))}
                                                />
                                            </TableHead>
                                            <TableHead>Participant</TableHead>
                                            <TableHead>Assigned Vehicle</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignedPageItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-6 text-center text-sm text-slate-500">
                                                    No assigned participants found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            assignedPageItems.map((participant) => (
                                                <TableRow key={participant.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedAssignedIds.includes(participant.id)}
                                                            onCheckedChange={(checked) =>
                                                                toggleAssignedParticipant(participant.id, Boolean(checked))
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{participant.full_name}</div>
                                                        <div className="text-xs text-slate-500">{participant.email || '—'}</div>
                                                    </TableCell>
                                                    <TableCell>{participant.assignment?.vehicle_label || '—'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => removeAssignment(participant.assignment!.id)}
                                                        >
                                                            Remove Assignment
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>
                                    Page {assignedPage} of {assignedTotalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={assignedPage <= 1}
                                        onClick={() => setAssignedPage((page) => Math.max(1, page - 1))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={assignedPage >= assignedTotalPages}
                                        onClick={() => setAssignedPage((page) => Math.min(assignedTotalPages, page + 1))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Unassigned Participants</CardTitle>
                            <CardDescription>Select participants and assign them to a vehicle.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                <div className="space-y-1">
                                    <Label htmlFor="unassigned-search">Search participant</Label>
                                    <Input
                                        id="unassigned-search"
                                        placeholder="Search unassigned participant..."
                                        value={unassignedSearch}
                                        onChange={(event) => setUnassignedSearch(event.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={assignBulk}
                                    disabled={!selectedIds.length || assignmentForm.processing}
                                    className="bg-[#00359c] text-white hover:bg-[#00359c]/90"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Assign Selected
                                </Button>
                            </div>
                            {assignmentForm.errors.participant_ids ? (
                                <p className="text-xs text-rose-500">{assignmentForm.errors.participant_ids}</p>
                            ) : null}
                            <div className="overflow-hidden rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">
                                                <Checkbox
                                                    checked={unassignedPageItems.length > 0 && selectedIds.length === unassignedPageItems.length}
                                                    onCheckedChange={(checked) => toggleAllUnassigned(Boolean(checked))}
                                                />
                                            </TableHead>
                                            <TableHead>Participant</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unassignedPageItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-6 text-center text-sm text-slate-500">
                                                    No unassigned participants found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            unassignedPageItems.map((participant) => (
                                                <TableRow key={participant.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedIds.includes(participant.id)}
                                                            onCheckedChange={(checked) =>
                                                                toggleUnassignedParticipant(participant.id, Boolean(checked))
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{participant.full_name}</div>
                                                        <div className="text-xs text-slate-500">{participant.email || '—'}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => assignSingle(participant.id)}
                                                        >
                                                            Assign
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>
                                    Page {unassignedPage} of {unassignedTotalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={unassignedPage <= 1}
                                        onClick={() => setUnassignedPage((page) => Math.max(1, page - 1))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={unassignedPage >= unassignedTotalPages}
                                        onClick={() => setUnassignedPage((page) => Math.min(unassignedTotalPages, page + 1))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
