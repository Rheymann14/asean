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
import { Truck } from 'lucide-react';
import { toast } from 'sonner';

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

function showToastError(errors: Record<string, string | string[]>) {
    const first = Object.values(errors ?? {})[0];
    toast.error(Array.isArray(first) ? first[0] : first || 'Please review the form and try again.');
}

export default function VehicleManagementPage({ events, selected_event_id, ched_lo_users, vehicles }: PageProps) {
    const selectedEventId = selected_event_id ? String(selected_event_id) : events[0] ? String(events[0].id) : '';

    const form = useForm({
        programme_id: selectedEventId,
        label: '',
        driver_name: '',
        driver_contact_number: '',
        incharge_user_id: ched_lo_users[0] ? String(ched_lo_users[0].id) : '',
    });

    const onChangeEvent = (value: string) => {
        form.setData('programme_id', value);
        router.get('/vehicle-management', { event_id: value || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/transport-vehicles', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Vehicle added successfully.');
                form.reset('label', 'driver_name', 'driver_contact_number');
            },
            onError: (errors) => showToastError(errors as Record<string, string | string[]>),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-[#00359c]" />
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Vehicle Management</h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Add vehicles per event, set driver details, and assign CHED LO in charge.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Event filter</CardTitle>
                        <CardDescription>Show and add vehicles by event.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label>Event <span className="text-[11px] font-semibold text-red-600">*</span></Label>
                            <Select value={form.data.programme_id} onValueChange={onChangeEvent}>
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
                            {form.errors.programme_id ? <p className="text-xs text-rose-500">{form.errors.programme_id}</p> : null}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Add Vehicle</CardTitle>
                        <CardDescription>Example: Van 1, Van 2</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="label">Vehicle name <span className="text-[11px] font-semibold text-red-600">*</span></Label>
                                    <Input
                                        id="label"
                                        placeholder="Van 1"
                                        value={form.data.label}
                                        onChange={(e) => form.setData('label', e.target.value)}
                                    />
                                    {form.errors.label ? <p className="text-xs text-rose-500">{form.errors.label}</p> : null}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="driver_name">Driver name <span className="text-[11px] font-semibold text-red-600">*</span></Label>
                                    <Input
                                        id="driver_name"
                                        value={form.data.driver_name}
                                        onChange={(e) => form.setData('driver_name', e.target.value)}
                                    />
                                    {form.errors.driver_name ? <p className="text-xs text-rose-500">{form.errors.driver_name}</p> : null}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="driver_contact_number">Driver contact number <span className="text-[11px] font-semibold text-red-600">*</span></Label>
                                    <Input
                                        id="driver_contact_number"
                                        value={form.data.driver_contact_number}
                                        onChange={(e) => form.setData('driver_contact_number', e.target.value)}
                                    />
                                    {form.errors.driver_contact_number ? (
                                        <p className="text-xs text-rose-500">{form.errors.driver_contact_number}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-1">
                                    <Label>CHED LO in charge <span className="text-[11px] font-semibold text-red-600">*</span></Label>
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
                                    {form.errors.incharge_user_id ? <p className="text-xs text-rose-500">{form.errors.incharge_user_id}</p> : null}
                                </div>
                            </div>
                            <Button type="submit" className="bg-[#00359c] text-white hover:bg-[#00359c]/90" disabled={form.processing}>
                                {form.processing ? 'Adding...' : 'Add Vehicle'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Vehicle List</CardTitle>
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
                                            <TableCell colSpan={4} className="py-6 text-center text-slate-500">
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
