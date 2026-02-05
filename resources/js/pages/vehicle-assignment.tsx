import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vehicle Assignment', href: '/vehicle-assignment' }];

type EventRow = { id: number; title: string };
type VehicleRow = { id: number; label: string };
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

export default function VehicleAssignmentPage({ events, selected_event_id, vehicles, participants }: PageProps) {
    const selectedEventId = selected_event_id ?? events[0]?.id ?? null;
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [pickupFormByAssignment, setPickupFormByAssignment] = React.useState<Record<number, { pickup_location: string; pickup_at: string }>>({});
    const [dropoffFormByAssignment, setDropoffFormByAssignment] = React.useState<Record<number, { dropoff_location: string; dropoff_at: string }>>({});

    const assignmentForm = useForm({
        programme_id: selectedEventId ? String(selectedEventId) : '',
        vehicle_id: vehicles[0] ? String(vehicles[0].id) : '',
        participant_ids: [] as number[],
    });

    const onChangeEvent = (value: string) => {
        router.get('/vehicle-assignment', { event_id: value }, { preserveState: true, replace: true });
    };

    const toggleAll = (checked: boolean) => {
        setSelectedIds(checked ? participants.map((p) => p.id) : []);
    };

    const toggleParticipant = (participantId: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...new Set([...prev, participantId])] : prev.filter((id) => id !== participantId)));
    };

    const assignBulk = () => {
        assignmentForm.setData('participant_ids', selectedIds);
        assignmentForm.post('/vehicle-assignments', { preserveScroll: true });
    };

    const assignSingle = (participantId: number) => {
        assignmentForm.setData('participant_ids', [participantId]);
        assignmentForm.post('/vehicle-assignments', { preserveScroll: true });
    };

    const removeAssignment = (assignmentId: number) => {
        router.delete(`/vehicle-assignments/${assignmentId}`, { preserveScroll: true });
    };

    const savePickup = (assignmentId: number) => {
        const data = pickupFormByAssignment[assignmentId] ?? { pickup_location: '', pickup_at: '' };
        router.patch(`/vehicle-assignments/${assignmentId}/pickup`, data, { preserveScroll: true });
    };

    const saveDropoff = (assignmentId: number) => {
        const data = dropoffFormByAssignment[assignmentId] ?? { dropoff_location: '', dropoff_at: '' };
        router.patch(`/vehicle-assignments/${assignmentId}/dropoff`, data, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Assignment" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Event</Label>
                            <Select value={selectedEventId ? String(selectedEventId) : ''} onValueChange={onChangeEvent}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event" />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={String(event.id)}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Vehicle</Label>
                            <Select value={assignmentForm.data.vehicle_id} onValueChange={(value) => assignmentForm.setData('vehicle_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((vehicle) => (
                                        <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                                            {vehicle.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Button onClick={assignBulk} disabled={!selectedIds.length} className="bg-[#00359c] text-white hover:bg-[#00359c]/90">
                                Assign Selected Participants
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Participants</CardTitle>
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
                                        <TableHead className="w-[500px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((participant) => (
                                        <TableRow key={participant.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(participant.id)}
                                                    onCheckedChange={(checked) => toggleParticipant(participant.id, Boolean(checked))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{participant.full_name}</div>
                                                <div className="text-xs text-slate-500">{participant.email || '—'}</div>
                                            </TableCell>
                                            <TableCell>{participant.assignment?.vehicle_label || '—'}</TableCell>
                                            <TableCell className="capitalize">{participant.assignment?.pickup_status?.replace('_', ' ') || 'pending'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => assignSingle(participant.id)}>
                                                        Assign
                                                    </Button>
                                                    {participant.assignment ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => removeAssignment(participant.assignment!.id)}
                                                            >
                                                                Remove Assignment
                                                            </Button>
                                                            <div className="grid w-full gap-2 rounded-md border p-2 md:grid-cols-5">
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
                                                                <Button size="sm" onClick={() => savePickup(participant.assignment!.id)}>
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
                                                                <Button size="sm" onClick={() => saveDropoff(participant.assignment!.id)}>
                                                                    Save Dropoff
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
