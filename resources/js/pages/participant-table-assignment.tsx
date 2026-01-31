import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CalendarDays, MapPin, Table } from 'lucide-react';

type TableAssignment = {
    table_number: string;
    capacity: number;
    assigned_at?: string | null;
};

type EventRow = {
    id: number;
    title: string;
    starts_at?: string | null;
    ends_at?: string | null;
    location?: string | null;
    table?: TableAssignment | null;
};

type PageProps = {
    events?: EventRow[];
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/participant-dashboard' },
    { title: 'Table Assignment', href: '/table-assignment' },
];

function formatEventWindow(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt) return 'Schedule to be announced';

    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;
    const dateFmt = new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
    const timeFmt = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' });

    const date = dateFmt.format(start);
    const startTime = timeFmt.format(start);

    if (!end) return `${date} • ${startTime}`;

    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    const endTime = timeFmt.format(end);
    if (sameDay) return `${date} • ${startTime}–${endTime}`;

    return `${dateFmt.format(start)} ${startTime} → ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

export default function ParticipantTableAssignment({ events = [] }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Table Assignment" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Table className="h-5 w-5 text-[#00359c]" />
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            Table assignments
                        </h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Review your assigned table per event. This page is view-only.
                    </p>
                </div>

                {events.length === 0 ? (
                    <Card className="border-dashed">
                        <div className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
                            No table assignments yet. Join an event to see your seating details.
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {events.map((event) => {
                            const hasTable = Boolean(event.table);

                            return (
                                <Card key={event.id} className="border-slate-200/70 dark:border-slate-800">
                                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-2">
                                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                {event.title}
                                            </h2>
                                            <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:flex-wrap sm:items-center">
                                                <span className="inline-flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400" />
                                                    {formatEventWindow(event.starts_at, event.ends_at)}
                                                </span>
                                                {event.location ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-slate-400" />
                                                        {event.location}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col items-start gap-1 text-xs text-slate-500 dark:text-slate-400 sm:items-end">
                                                <span className="uppercase tracking-wide">Table assignment</span>
                                                {hasTable ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                                        >
                                                            Table {event.table?.table_number}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">
                                                            Capacity {event.table?.capacity}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600/30 dark:bg-slate-800/30 dark:text-slate-300"
                                                    >
                                                        Pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
