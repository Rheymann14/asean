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
    pickup_location: string | null;
    pickup_at: string | null;
    dropoff_location: string | null;
    dropoff_at: string | null;
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
                className="w-[--radix-popover-trigger-width] max-w-[min(22rem,calc(100vw-2rem))] p-0"
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
                                    className="gap-2"
                                >
                                    <Check className={cn('h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
                                    <div className="min-w-0">
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
    const [pickupFormByAssignment, setPickupFormByAssignment] = React.useState<
        Record<number, { pickup_location: string; pickup_at: string }>
    >({});
    const [dropoffFormByAssignment, setDropoffFormByAssignment] = React.useState<
        Record<number, { dropoff_location: string; dropoff_at: string }>
    >({});

    const assignmentForm = useForm({
        programme_id: selectedEventId,
        vehicle_id: vehicles[0] ? String(vehicles[0].id) : '',
        participant_ids: [] as number[],
    });

    const onChangeEvent = (value: string) => {
        assignmentForm.setData('programme_id', value);
        assignmentForm.setData('vehicle_id', '');
        setSelectedIds([]);
        router.get('/vehicle-assignment', { event_id: value || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const toggleAll = (checked: boolean) => {
        setSelectedIds(checked ? participants.map((p) => p.id) : []);
    };

    const toggleParticipant = (participantId: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...new Set([...prev, participantId])] : prev.filter((id) => id !== participantId)));
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

    const savePickup = (assignmentId: number) => {
        const data = pickupFormByAssignment[assignmentId] ?? { pickup_location: '', pickup_at: '' };
        router.patch(`/vehicle-assignments/${assignmentId}/pickup`, data, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pickup details saved.'),
            onError: (errors) => showToastError(errors as Record<string, string | string[]>),
        });
    };

    const saveDropoff = (assignmentId: number) => {
        const data = dropoffFormByAssignment[assignmentId] ?? { dropoff_location: '', dropoff_at: '' };
        router.patch(`/vehicle-assignments/${assignmentId}/dropoff`, data, {
            preserveScroll: true,
            onSuccess: () => toast.success('Dropoff details saved.'),
            onError: (errors) => showToastError(errors as Record<string, string | string[]>),
        });
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
                        Assign participants to vehicles per event and update pickup/dropoff details.
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

                        <Button
                            type="button"
                            onClick={assignBulk}
                            disabled={!selectedIds.length || assignmentForm.processing}
                            className="bg-[#00359c] text-white hover:bg-[#00359c]/90"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Assign Selected Participants
                        </Button>
                        {assignmentForm.errors.participant_ids ? (
                            <p className="text-xs text-rose-500">{assignmentForm.errors.participant_ids}</p>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={participants.length > 0 && selectedIds.length === participants.length}
                                                onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                                            />
                                        </TableHead>
                                        <TableHead>Participant</TableHead>
                                        <TableHead>Assigned Vehicle</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[540px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                                                No participants found for this event.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        participants.map((participant) => (
                                            <TableRow key={participant.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(participant.id)}
                                                        onCheckedChange={(checked) =>
                                                            toggleParticipant(participant.id, Boolean(checked))
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{participant.full_name}</div>
                                                    <div className="text-xs text-slate-500">{participant.email || '—'}</div>
                                                </TableCell>
                                                <TableCell>{participant.assignment?.vehicle_label || '—'}</TableCell>
                                                <TableCell className="capitalize">
                                                    {participant.assignment?.pickup_status?.replace('_', ' ') || 'pending'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => assignSingle(participant.id)}
                                                        >
                                                            Assign
                                                        </Button>
                                                        {participant.assignment ? (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => removeAssignment(participant.assignment!.id)}
                                                                >
                                                                    Remove Assignment
                                                                </Button>
                                                                <div className="grid w-full gap-2 rounded-md border p-2 md:grid-cols-3">
                                                                    <Input
                                                                        placeholder="Pickup location"
                                                                        value={pickupFormByAssignment[participant.assignment.id]?.pickup_location ?? participant.assignment.pickup_location ?? ''}
                                                                        onChange={(e) =>
                                                                            setPickupFormByAssignment((prev) => ({
                                                                                ...prev,
                                                                                [participant.assignment!.id]: {
                                                                                    pickup_location: e.target.value,
                                                                                    pickup_at: prev[participant.assignment!.id]?.pickup_at ?? participant.assignment!.pickup_at ?? '',
                                                                                },
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Input
                                                                        type="datetime-local"
                                                                        value={pickupFormByAssignment[participant.assignment.id]?.pickup_at ?? ''}
                                                                        onChange={(e) =>
                                                                            setPickupFormByAssignment((prev) => ({
                                                                                ...prev,
                                                                                [participant.assignment!.id]: {
                                                                                    pickup_location: prev[participant.assignment!.id]?.pickup_location ?? participant.assignment!.pickup_location ?? '',
                                                                                    pickup_at: e.target.value,
                                                                                },
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Button type="button" size="sm" onClick={() => savePickup(participant.assignment!.id)}>
                                                                        Save Pickup
                                                                    </Button>
                                                                    <Input
                                                                        placeholder="Dropoff location"
                                                                        value={dropoffFormByAssignment[participant.assignment.id]?.dropoff_location ?? participant.assignment.dropoff_location ?? ''}
                                                                        onChange={(e) =>
                                                                            setDropoffFormByAssignment((prev) => ({
                                                                                ...prev,
                                                                                [participant.assignment!.id]: {
                                                                                    dropoff_location: e.target.value,
                                                                                    dropoff_at: prev[participant.assignment!.id]?.dropoff_at ?? participant.assignment!.dropoff_at ?? '',
                                                                                },
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Input
                                                                        type="datetime-local"
                                                                        value={dropoffFormByAssignment[participant.assignment.id]?.dropoff_at ?? ''}
                                                                        onChange={(e) =>
                                                                            setDropoffFormByAssignment((prev) => ({
                                                                                ...prev,
                                                                                [participant.assignment!.id]: {
                                                                                    dropoff_location: prev[participant.assignment!.id]?.dropoff_location ?? participant.assignment!.dropoff_location ?? '',
                                                                                    dropoff_at: e.target.value,
                                                                                },
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Button type="button" size="sm" onClick={() => saveDropoff(participant.assignment!.id)}>
                                                                        Save Dropoff
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
