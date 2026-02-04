import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Bus, CalendarClock, MapPin, Truck, UserCheck, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vehicle Management', href: '/vehicle-management' }];

const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

type AssignmentStatus = 'pending' | 'picked_up' | 'dropped_off';

type Participant = {
    id: number;
    full_name: string;
    email: string | null;
};

type Assignment = {
    id: number;
    participant: Participant | null;
    vehicle_label: string;
    pickup_status: AssignmentStatus;
    pickup_at: string | null;
    pickup_location: string | null;
    dropoff_at: string | null;
    dropoff_location: string | null;
    updated_at: string | null;
};

type PageProps = {
    participants: Participant[];
    assignments: Assignment[];
};

const statusLabels: Record<AssignmentStatus, string> = {
    pending: 'Pending',
    picked_up: 'Picked up',
    dropped_off: 'Dropped off',
};

const statusBadgeStyles: Record<AssignmentStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    picked_up: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    dropped_off: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
};

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

export default function VehicleManagement({ participants, assignments }: PageProps) {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<AssignmentStatus | 'all'>('all');

    const totals = React.useMemo(() => {
        const pending = assignments.filter((item) => item.pickup_status === 'pending').length;
        const pickedUp = assignments.filter((item) => item.pickup_status === 'picked_up').length;
        const droppedOff = assignments.filter((item) => item.pickup_status === 'dropped_off').length;
        return {
            total: assignments.length,
            pending,
            pickedUp,
            droppedOff,
        };
    }, [assignments]);

    const filteredAssignments = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        return assignments.filter((item) => {
            const matchesStatus = statusFilter === 'all' || item.pickup_status === statusFilter;
            if (!matchesStatus) return false;
            if (!term) return true;
            const participantName = item.participant?.full_name?.toLowerCase() ?? '';
            const vehicleLabel = item.vehicle_label.toLowerCase();
            return participantName.includes(term) || vehicleLabel.includes(term);
        });
    }, [assignments, search, statusFilter]);

    const form = useForm({
        user_id: participants[0]?.id ?? '',
        vehicle_label: '',
        pickup_status: 'pending' as AssignmentStatus,
        pickup_location: '',
        pickup_at: '',
        dropoff_location: '',
        dropoff_at: '',
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/vehicle-assignments', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('vehicle_label', 'pickup_location', 'pickup_at', 'dropoff_location', 'dropoff_at');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Management" />
            <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">CHED Transport Operations</p>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Vehicle Management &amp; Pickup Tracking
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Assign vehicles to registered participants and track pickup/dropoff details in one place.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" className="rounded-full">
                                Export manifest
                            </Button>
                            <Button className={cn('rounded-full', PRIMARY_BTN)}>Create assignment</Button>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Total Assignments
                                </CardTitle>
                                <Truck className="h-5 w-5 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {totals.total}
                                </div>
                                <p className="text-xs text-slate-500">Vehicles currently scheduled today.</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Pending Pickup
                                </CardTitle>
                                <CalendarClock className="h-5 w-5 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {totals.pending}
                                </div>
                                <p className="text-xs text-slate-500">Awaiting driver confirmation.</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Picked Up
                                </CardTitle>
                                <UserCheck className="h-5 w-5 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {totals.pickedUp}
                                </div>
                                <p className="text-xs text-slate-500">On the way or in transit.</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Dropped Off
                                </CardTitle>
                                <Bus className="h-5 w-5 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {totals.droppedOff}
                                </div>
                                <p className="text-xs text-slate-500">Arrived at destination.</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Assignments</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Check pickup progress, locations, and time stamps for every participant.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                                <Input
                                    placeholder="Search participant or vehicle"
                                    className="h-10 w-full md:max-w-xs"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => setStatusFilter(value as AssignmentStatus | 'all')}
                                >
                                    <SelectTrigger className="h-10 w-full md:w-48">
                                        <SelectValue placeholder="Pickup status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="picked_up">Picked up</SelectItem>
                                        <SelectItem value="dropped_off">Dropped off</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" className="rounded-full">
                                Refresh log
                            </Button>
                        </div>

                        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 lg:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                        <TableHead className="w-[120px]">Assignment</TableHead>
                                        <TableHead>Participant</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Pickup Details</TableHead>
                                        <TableHead>Dropoff Details</TableHead>
                                        <TableHead className="text-right">Last Update</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssignments.length ? (
                                        filteredAssignments.map((item) => (
                                            <TableRow key={item.id} className="text-sm text-slate-700 dark:text-slate-200">
                                                <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                    VM-{item.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                                            {item.participant?.full_name ?? 'Unassigned'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{item.participant?.email ?? '—'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.vehicle_label}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn('border-transparent font-medium', statusBadgeStyles[item.pickup_status])}>
                                                        {statusLabels[item.pickup_status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            {formatDateTime(item.pickup_at)}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {item.pickup_location || '—'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            {formatDateTime(item.dropoff_at)}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {item.dropoff_location || '—'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-slate-500">
                                                    {formatDateTime(item.updated_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                                                No assignments found for the current filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="grid gap-4 lg:hidden">
                            {filteredAssignments.length ? (
                                filteredAssignments.map((item) => (
                                    <Card key={item.id} className="border border-slate-200 shadow-none dark:border-slate-800">
                                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                            <div>
                                                <CardTitle className="text-base">VM-{item.id}</CardTitle>
                                                <CardDescription>{item.participant?.full_name ?? 'Unassigned'}</CardDescription>
                                            </div>
                                            <Badge className={cn('border-transparent font-medium', statusBadgeStyles[item.pickup_status])}>
                                                {statusLabels[item.pickup_status]}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Truck className="h-4 w-4" />
                                                <span>{item.vehicle_label}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500">Pickup</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                                    {formatDateTime(item.pickup_at)}
                                                </p>
                                                <p className="flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {item.pickup_location || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500">Dropoff</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                                    {formatDateTime(item.dropoff_at)}
                                                </p>
                                                <p className="flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {item.dropoff_location || '—'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">Last update: {formatDateTime(item.updated_at)}</p>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                                    No assignments found for the current filters.
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="flex flex-col gap-4">
                        <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base">Assign Vehicle</CardTitle>
                                <CardDescription>
                                    Match a registered participant with a vehicle and schedule pickup/dropoff details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <Label htmlFor="participant">Participant</Label>
                                        <Select
                                            value={form.data.user_id ? String(form.data.user_id) : ''}
                                            onValueChange={(value) => form.setData('user_id', Number(value))}
                                        >
                                            <SelectTrigger id="participant" className="h-10">
                                                <SelectValue placeholder="Select participant" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {participants.map((participant) => (
                                                    <SelectItem key={participant.id} value={String(participant.id)}>
                                                        <div className="flex flex-col">
                                                            <span>{participant.full_name}</span>
                                                            <span className="text-xs text-slate-500">{participant.email ?? '—'}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {participants.length === 0 ? (
                                            <p className="text-xs text-amber-600">No participants found. Add participants first.</p>
                                        ) : null}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle">Vehicle</Label>
                                        <Input
                                            id="vehicle"
                                            placeholder="e.g. Van 2 (Driver: Leah)"
                                            value={form.data.vehicle_label}
                                            onChange={(event) => form.setData('vehicle_label', event.target.value)}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label htmlFor="pickup-location">Pickup Location</Label>
                                        <Input
                                            id="pickup-location"
                                            placeholder="e.g. Hotel Main Entrance"
                                            value={form.data.pickup_location}
                                            onChange={(event) => form.setData('pickup_location', event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pickup-datetime">Pickup Date &amp; Time</Label>
                                        <Input
                                            id="pickup-datetime"
                                            type="datetime-local"
                                            value={form.data.pickup_at}
                                            onChange={(event) => form.setData('pickup_at', event.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dropoff-location">Dropoff Location</Label>
                                        <Input
                                            id="dropoff-location"
                                            placeholder="e.g. ASEAN Convention Center"
                                            value={form.data.dropoff_location}
                                            onChange={(event) => form.setData('dropoff_location', event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dropoff-datetime">Dropoff Date &amp; Time</Label>
                                        <Input
                                            id="dropoff-datetime"
                                            type="datetime-local"
                                            value={form.data.dropoff_at}
                                            onChange={(event) => form.setData('dropoff_at', event.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="pickup-status">Pickup Status</Label>
                                        <Select
                                            value={form.data.pickup_status}
                                            onValueChange={(value) => form.setData('pickup_status', value as AssignmentStatus)}
                                        >
                                            <SelectTrigger id="pickup-status" className="h-10">
                                                <SelectValue placeholder="Set status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="picked_up">Picked up</SelectItem>
                                                <SelectItem value="dropped_off">Dropped off</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={form.processing || participants.length === 0}
                                        className={cn('w-full rounded-full', PRIMARY_BTN)}
                                    >
                                        Save assignment
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 shadow-sm dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Participant Coverage</CardTitle>
                                <Users className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <p>Total registered participants: {participants.length}</p>
                                <p>Assignments recorded: {assignments.length}</p>
                                <p className="text-xs text-slate-500">
                                    Ensure every registered participant has a vehicle assignment and confirmed pickup.
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
