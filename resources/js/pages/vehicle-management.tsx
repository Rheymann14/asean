import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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

import { Bus, CalendarClock, MapPin, Truck, UserCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vehicle Management', href: '/vehicle-management' }];

const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

type AssignmentStatus = 'Pending' | 'Picked up' | 'Dropped off';

type Assignment = {
    id: string;
    participant: string;
    vehicle: string;
    pickupStatus: AssignmentStatus;
    pickupDateTime: string;
    pickupLocation: string;
    dropoffDateTime: string;
    dropoffLocation: string;
    lastUpdated: string;
};

const assignments: Assignment[] = [
    {
        id: 'VM-101',
        participant: 'Maria Santos',
        vehicle: 'Van 2',
        pickupStatus: 'Picked up',
        pickupDateTime: 'Mar 21, 2024 • 8:20 AM',
        pickupLocation: 'CHED Central Office Lobby',
        dropoffDateTime: 'Mar 21, 2024 • 9:05 AM',
        dropoffLocation: 'ASEAN Convention Center',
        lastUpdated: '5 minutes ago',
    },
    {
        id: 'VM-102',
        participant: 'Daniel Cruz',
        vehicle: 'Shuttle Bus 1',
        pickupStatus: 'Pending',
        pickupDateTime: 'Mar 21, 2024 • 9:00 AM',
        pickupLocation: 'Hotel Main Entrance',
        dropoffDateTime: 'Mar 21, 2024 • 9:45 AM',
        dropoffLocation: 'ASEAN Convention Center',
        lastUpdated: '10 minutes ago',
    },
    {
        id: 'VM-103',
        participant: 'Aisha Rahman',
        vehicle: 'Van 1',
        pickupStatus: 'Dropped off',
        pickupDateTime: 'Mar 21, 2024 • 7:40 AM',
        pickupLocation: 'Airport Terminal 2',
        dropoffDateTime: 'Mar 21, 2024 • 8:30 AM',
        dropoffLocation: 'CHED Central Office',
        lastUpdated: '25 minutes ago',
    },
    {
        id: 'VM-104',
        participant: 'Somchai Preecha',
        vehicle: 'Van 3',
        pickupStatus: 'Picked up',
        pickupDateTime: 'Mar 21, 2024 • 8:55 AM',
        pickupLocation: 'Hotel Lobby - Tower B',
        dropoffDateTime: 'Mar 21, 2024 • 9:35 AM',
        dropoffLocation: 'ASEAN Convention Center',
        lastUpdated: '12 minutes ago',
    },
];

function statusBadge(status: AssignmentStatus) {
    const base = 'border-transparent';

    switch (status) {
        case 'Picked up':
            return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200`;
        case 'Dropped off':
            return `${base} bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200`;
        default:
            return `${base} bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200`;
    }
}

export default function VehicleManagement() {
    const totals = React.useMemo(() => {
        const pending = assignments.filter((item) => item.pickupStatus === 'Pending').length;
        const pickedUp = assignments.filter((item) => item.pickupStatus === 'Picked up').length;
        const droppedOff = assignments.filter((item) => item.pickupStatus === 'Dropped off').length;
        return {
            total: assignments.length,
            pending,
            pickedUp,
            droppedOff,
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Management" />
            <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
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
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-4">
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

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
                                />
                                <Select defaultValue="all">
                                    <SelectTrigger className="h-10 w-full md:w-48">
                                        <SelectValue placeholder="Pickup status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="picked">Picked up</SelectItem>
                                        <SelectItem value="dropped">Dropped off</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" className="rounded-full">
                                Refresh log
                            </Button>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                        <TableHead className="w-[140px]">Assignment ID</TableHead>
                                        <TableHead>Participant</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Pickup Status</TableHead>
                                        <TableHead>Pickup Details</TableHead>
                                        <TableHead>Dropoff Details</TableHead>
                                        <TableHead className="text-right">Last Update</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignments.map((item) => (
                                        <TableRow key={item.id} className="text-sm text-slate-700 dark:text-slate-200">
                                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                {item.id}
                                            </TableCell>
                                            <TableCell>{item.participant}</TableCell>
                                            <TableCell>{item.vehicle}</TableCell>
                                            <TableCell>
                                                <Badge className={cn('font-medium', statusBadge(item.pickupStatus))}>
                                                    {item.pickupStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-slate-500">{item.pickupDateTime}</span>
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {item.pickupLocation}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-slate-500">{item.dropoffDateTime}</span>
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {item.dropoffLocation}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-slate-500">
                                                {item.lastUpdated}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
                            <CardContent className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="participant">Participant</Label>
                                    <Select defaultValue="maria-santos">
                                        <SelectTrigger id="participant" className="h-10">
                                            <SelectValue placeholder="Select participant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="maria-santos">Maria Santos</SelectItem>
                                            <SelectItem value="daniel-cruz">Daniel Cruz</SelectItem>
                                            <SelectItem value="aisha-rahman">Aisha Rahman</SelectItem>
                                            <SelectItem value="somchai-preecha">Somchai Preecha</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vehicle">Vehicle</Label>
                                    <Select defaultValue="van-2">
                                        <SelectTrigger id="vehicle" className="h-10">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="van-1">Van 1 (Driver: Carlos)</SelectItem>
                                            <SelectItem value="van-2">Van 2 (Driver: Leah)</SelectItem>
                                            <SelectItem value="van-3">Van 3 (Driver: Noel)</SelectItem>
                                            <SelectItem value="bus-1">Shuttle Bus 1 (Driver: Ana)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="pickup-location">Pickup Location</Label>
                                    <Input id="pickup-location" placeholder="e.g. Hotel Main Entrance" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pickup-datetime">Pickup Date &amp; Time</Label>
                                    <Input id="pickup-datetime" type="datetime-local" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dropoff-location">Dropoff Location</Label>
                                    <Input id="dropoff-location" placeholder="e.g. ASEAN Convention Center" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dropoff-datetime">Dropoff Date &amp; Time</Label>
                                    <Input id="dropoff-datetime" type="datetime-local" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pickup-status">Pickup Status</Label>
                                    <Select defaultValue="pending">
                                        <SelectTrigger id="pickup-status" className="h-10">
                                            <SelectValue placeholder="Set status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="picked">Picked up</SelectItem>
                                            <SelectItem value="dropped">Dropped off</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button className={cn('w-full rounded-full', PRIMARY_BTN)}>Save assignment</Button>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
