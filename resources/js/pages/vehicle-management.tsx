import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vehicle Management', href: '/vehicle-management' }];

type EventRow = {
    id: number;
    title: string;
};

type ChedLoUser = {
    id: number;
    full_name: string;
    email: string | null;
};

type VehicleRow = {
    id: number;
    label: string;
    driver_name: string | null;
    driver_contact_number: string | null;
    incharge: {
        id: number;
        full_name: string;
        email: string | null;
    } | null;
};

type PageProps = {
    events: EventRow[];
    selected_event_id?: number | null;
    ched_lo_users: ChedLoUser[];
    vehicles: VehicleRow[];
};

export default function VehicleManagementPage({ events, selected_event_id, ched_lo_users, vehicles }: PageProps) {
    const selectedEventId = selected_event_id ?? events[0]?.id ?? null;

    const form = useForm({
        programme_id: selectedEventId ? String(selectedEventId) : '',
        label: '',
        driver_name: '',
        driver_contact_number: '',
        incharge_user_id: ched_lo_users[0] ? String(ched_lo_users[0].id) : '',
    });

    const onChangeEvent = (value: string) => {
        router.get('/vehicle-management', { event_id: value }, { preserveState: true, replace: true });
        form.setData('programme_id', value);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/transport-vehicles', {
            preserveScroll: true,
            onSuccess: () => form.reset('label', 'driver_name', 'driver_contact_number'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Management" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Management</CardTitle>
                        <CardDescription>Add vehicles per event and assign CHED LO in charge.</CardDescription>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Add Vehicle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                            <input type="hidden" value={form.data.programme_id} />
                            <div className="space-y-2">
                                <Label htmlFor="label">Vehicle Name</Label>
                                <Input
                                    id="label"
                                    placeholder="Van 1"
                                    value={form.data.label}
                                    onChange={(e) => form.setData('label', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="driver_name">Driver Name</Label>
                                <Input
                                    id="driver_name"
                                    value={form.data.driver_name}
                                    onChange={(e) => form.setData('driver_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="driver_contact_number">Driver Contact Number</Label>
                                <Input
                                    id="driver_contact_number"
                                    value={form.data.driver_contact_number}
                                    onChange={(e) => form.setData('driver_contact_number', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CHED LO In Charge</Label>
                                <Select
                                    value={form.data.incharge_user_id}
                                    onValueChange={(value) => form.setData('incharge_user_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select CHED LO" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ched_lo_users.map((user) => (
                                            <SelectItem key={user.id} value={String(user.id)}>
                                                {user.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Button type="submit" className="bg-[#00359c] text-white hover:bg-[#00359c]/90">
                                    Add Vehicle
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>CHED LO In Charge</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicles.length > 0 ? (
                                        vehicles.map((vehicle) => (
                                            <TableRow key={vehicle.id}>
                                                <TableCell className="font-medium">{vehicle.label}</TableCell>
                                                <TableCell>{vehicle.driver_name || '—'}</TableCell>
                                                <TableCell>{vehicle.driver_contact_number || '—'}</TableCell>
                                                <TableCell>{vehicle.incharge?.full_name || '—'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-slate-500">
                                                No vehicles yet for this event.
                                            </TableCell>
                                        </TableRow>
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
