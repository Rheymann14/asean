import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

import { ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

import { Check, ChevronsUpDown, Users, CalendarFold, QrCode, Filter, House } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

type CountryOption = { value: string; label: string; flag: string };

const ASEAN_COUNTRIES: CountryOption[] = [
    { value: 'brunei', label: 'Brunei Darussalam', flag: '/asean/brunei.jpg' },
    { value: 'cambodia', label: 'Cambodia', flag: '/asean/cambodia.jpg' },
    { value: 'indonesia', label: 'Indonesia', flag: '/asean/indonesia.jpg' },
    { value: 'laos', label: 'Lao PDR', flag: '/asean/laos.jpg' },
    { value: 'malaysia', label: 'Malaysia', flag: '/asean/malaysia.jpg' },
    { value: 'myanmar', label: 'Myanmar', flag: '/asean/myanmar.jpg' },
    { value: 'philippines', label: 'Philippines', flag: '/asean/philippines.jpg' },
    { value: 'singapore', label: 'Singapore', flag: '/asean/singapore.jpg' },
    { value: 'thailand', label: 'Thailand', flag: '/asean/thailand.jpg' },
    { value: 'vietnam', label: 'Viet Nam', flag: '/asean/vietnam.jpg' },
];

function fmtShortDate(d: Date) {
    return new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit' }).format(d);
}

function KpiCard({
    title,
    value,
    icon: Icon,
    hint,
    badge,
    tint,
}: {
    title: string;
    value: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    hint?: React.ReactNode;
    badge?: React.ReactNode;
    tint: string;
}) {
    return (
        <Card className="relative overflow-hidden rounded-2xl border border-sidebar-border/70 dark:border-sidebar-border">
            <div aria-hidden className={cn('pointer-events-none absolute inset-0 opacity-70', tint)} />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background"
            />

            <CardHeader className="relative flex flex-row items-start justify-between space-y-0 p-4">
                <div className="min-w-0 space-y-1">
                    <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</CardTitle>
                    <div className="truncate text-2xl font-semibold tracking-tight text-foreground">{value}</div>
                    {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
                </div>

                <div className="flex items-center gap-2">
                    {badge}
                    <div className="grid size-9 place-items-center rounded-xl border bg-background/70 backdrop-blur">
                        <Icon className="size-4 text-foreground/70" />
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

export default function Dashboard() {
    const [open, setOpen] = React.useState(false);
    const [country, setCountry] = React.useState<string | null>(null);

    const current = country ? ASEAN_COUNTRIES.find((c) => c.value === country) : null;

    // ✅ Subtle chart colors (no gradients)
    const CHART_PRIMARY = '#60a5fa'; // soft blue
    const CHART_ACCENT = '#fcd34d'; // soft amber
    const PIE_SCANNED = '#86efac'; // soft green
    const PIE_NOT = '#fda4af'; // soft rose

    // ✅ mock stats (UI only)
    const stats = React.useMemo(() => {
        const base = { participants_total: 842, events_total: 14, scans_total: 623 };
        if (!current) return { ...base, participants_filtered: base.participants_total, scans_total: base.scans_total };

        const factor = 0.12 + (current.value.length % 5) * 0.02;
        return {
            ...base,
            participants_filtered: Math.max(12, Math.round(base.participants_total * factor)),
            scans_total: Math.max(6, Math.round(base.scans_total * factor)),
        };
    }, [current]);

    // ✅ mock attendance per event (UI only)
    const attendanceByEvent = React.useMemo(() => {
        const items = [
            { id: 1, title: 'Opening Ceremony', date: 'Jan 12, 2026', scanned: 210 },
            { id: 2, title: 'Plenary Session A', date: 'Jan 13, 2026', scanned: 176 },
            { id: 3, title: 'Ministerial Roundtable', date: 'Jan 13, 2026', scanned: 124 },
            { id: 4, title: 'Cultural Night', date: 'Jan 14, 2026', scanned: 198 },
            { id: 5, title: 'Closing Ceremony', date: 'Jan 15, 2026', scanned: 160 },
            { id: 6, title: 'Press Briefing', date: 'Jan 12, 2026', scanned: 98 },
            { id: 7, title: 'B2B / Networking', date: 'Jan 14, 2026', scanned: 132 },
        ];

        if (!current) return items;

        const f = 0.15 + (current.value.length % 4) * 0.03;
        return items.map((x) => ({ ...x, scanned: Math.max(1, Math.round(x.scanned * f)) }));
    }, [current]);

    /** ✅ Top events table rows (up to 20) */
    const topEventsRows = React.useMemo(() => {
        return attendanceByEvent.slice().sort((a, b) => b.scanned - a.scanned).slice(0, 20);
    }, [attendanceByEvent]);

    const maxScanned = React.useMemo(() => Math.max(1, ...topEventsRows.map((x) => x.scanned)), [topEventsRows]);

    // ✅ area chart data (7 days)
    const lineData = React.useMemo(() => {
        const today = new Date();
        const points = Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - idx));
            const base = current ? 8 : 45;
            const jitter = (d.getDate() % 7) * (current ? 1.2 : 4.3);
            return { day: fmtShortDate(d), scans: Math.max(0, Math.round(base + jitter)) };
        });

        const last = points[points.length - 1];
        if (last) last.scans = current ? Math.min(40, last.scans + 6) : Math.min(90, last.scans + 14);
        return points;
    }, [current]);

    // ✅ donut chart data (scanned vs remaining)
    const donut = React.useMemo(() => {
        const scanned = Math.max(0, stats.scans_total);
        const remaining = Math.max(0, stats.participants_filtered - scanned);
        const total = Math.max(1, scanned + remaining);
        const rate = Math.round((scanned / total) * 100);

        return {
            scanned,
            remaining,
            total,
            rate,
            data: [
                { name: 'Scanned', value: scanned },
                { name: 'Not scanned', value: remaining },
            ],
        };
    }, [stats.participants_filtered, stats.scans_total]);

    const currentBadge = current ? (
        <Badge variant="secondary" className="rounded-full">
            Filtered
        </Badge>
    ) : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-3 overflow-x-auto rounded-xl p-4">
                {/* Header (compact) */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <House className="h-5 w-5 text-[#00359c]" />
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                Dashboard
                            </h1>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {current ? (
                                <span className="inline-flex items-center gap-2">
                                    Showing for
                                    <span className="inline-flex items-center gap-2 rounded-full border bg-background px-2 py-1 text-foreground">
                                        <img src={current.flag} alt="" className="size-4 rounded-full object-cover" />
                                        <span className="max-w-[170px] truncate font-medium">{current.label}</span>
                                    </span>
                                </span>
                            ) : (
                                <>Showing for all countries</>
                            )}
                        </div>
                    </div>

                    {/* Country filter */}
                    <div className="flex items-center gap-2">
                        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                            <Filter className="size-4" />
                            Filter:
                        </div>

                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-9 justify-between rounded-xl px-3 text-xs">
                                    <span className="inline-flex items-center gap-2">
                                        {current ? (
                                            <>
                                                <img src={current.flag} alt="" className="size-5 rounded-full object-cover" />
                                                <span className="max-w-[180px] truncate">{current.label}</span>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">All countries</span>
                                        )}
                                    </span>
                                    <ChevronsUpDown className="ml-2 size-4 opacity-60" />
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-[300px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Search country..." />
                                    <CommandEmpty>No results.</CommandEmpty>

                                    <CommandGroup>
                                        <CommandItem
                                            value="__all__"
                                            onSelect={() => {
                                                setCountry(null);
                                                setOpen(false);
                                            }}
                                            className="gap-2"
                                        >
                                            <span className="inline-flex size-4 items-center justify-center">
                                                {!country ? <Check className="size-4" /> : null}
                                            </span>
                                            <span>All countries</span>
                                        </CommandItem>

                                        {ASEAN_COUNTRIES.map((c) => (
                                            <CommandItem
                                                key={c.value}
                                                value={c.label}
                                                onSelect={() => {
                                                    setCountry(c.value);
                                                    setOpen(false);
                                                }}
                                                className="gap-2"
                                            >
                                                <span className="inline-flex size-4 items-center justify-center">
                                                    {country === c.value ? <Check className="size-4" /> : null}
                                                </span>
                                                <img src={c.flag} alt="" className="size-5 rounded-full object-cover" />
                                                <span className="truncate">{c.label}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* KPI row */}
                <div className="grid gap-3 md:grid-cols-3">
                    <KpiCard
                        title="Participants"
                        value={stats.participants_filtered.toLocaleString()}
                        icon={Users}
                        badge={currentBadge}
                        hint={
                            <span>
                                Overall: <span className="font-medium text-foreground">{stats.participants_total.toLocaleString()}</span>
                            </span>
                        }
                        tint="bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/10"
                    />

                    <KpiCard
                        title="Events"
                        value={stats.events_total.toLocaleString()}
                        icon={CalendarFold}
                        hint="Total events in the programme"
                        tint="bg-gradient-to-br from-emerald-500/12 via-transparent to-cyan-500/10"
                    />

                    <KpiCard
                        title="QR Scans"
                        value={stats.scans_total.toLocaleString()}
                        icon={QrCode}
                        hint={
                            <span className="inline-flex items-center gap-2">
                                Scan rate
                                <Badge className="rounded-full" variant="secondary">
                                    {donut.rate}%
                                </Badge>
                            </span>
                        }
                        tint="bg-gradient-to-br from-amber-500/12 via-transparent to-rose-500/10"
                    />
                </div>

                {/* Table + Charts */}
                <div className="grid gap-3 lg:grid-cols-3">
                    {/* Top Events table */}
                    <Card className="rounded-2xl border border-sidebar-border/70 dark:border-sidebar-border lg:col-span-1">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-sm">Top Events</CardTitle>
                                    <div className="text-xs text-muted-foreground">Sorted by successful scans (up to 20)</div>
                                </div>

                                <Badge variant="secondary" className="rounded-full text-[11px]">
                                    {topEventsRows.length} shown
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="max-h-[230px] overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
                                        <tr className="text-muted-foreground">
                                            <th className="w-10 px-4 py-2 text-left font-semibold">#</th>
                                            <th className="px-2 py-2 text-left font-semibold">Event</th>
                                            <th className="w-24 px-2 py-2 text-left font-semibold">Date</th>
                                            <th className="w-20 px-4 py-2 text-right font-semibold">Scans</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {topEventsRows.map((ev, idx) => {
                                            const pct = Math.max(0, Math.min(100, Math.round((ev.scanned / maxScanned) * 100)));

                                            return (
                                                <tr key={ev.id} className="hover:bg-muted/40">
                                                    {/* ✅ removed dots after number */}
                                                    <td className="px-4 py-2 align-top">
                                                        <span className="font-semibold text-foreground">{idx + 1}</span>
                                                    </td>

                                                    <td className="px-2 py-2">
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium text-foreground" title={ev.title}>
                                                                {ev.title}
                                                            </div>

                                                            {/* ✅ subtle solid indicator bar (NO gradient) */}
                                                            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                                                                <div
                                                                    className="h-1.5 rounded-full"
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                        backgroundColor: CHART_PRIMARY,
                                                                        opacity: 0.9,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-2 py-2 align-top whitespace-nowrap text-muted-foreground">{ev.date}</td>

                                                    <td className="px-4 py-2 align-top text-right">
                                                        <div className="font-semibold text-foreground">{ev.scanned.toLocaleString()}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scan Trend (Area) - no gradient */}
                    <Card className="rounded-2xl border border-sidebar-border/70 dark:border-sidebar-border lg:col-span-1">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-sm">Scan Trend</CardTitle>
                                    <div className="text-xs text-muted-foreground">Last 7 days</div>
                                </div>

                                <Badge variant="secondary" className="rounded-full text-[11px]">
                                    Live
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="h-[230px] p-4 pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-[11px]" />
                                    <YAxis tickLine={false} axisLine={false} className="text-[11px]" />

                                    <Tooltip
                                        content={({ active, payload, label }: any) => {
                                            if (!active || !payload?.length) return null;
                                            return (
                                                <div className="rounded-xl border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
                                                    <div className="font-medium text-foreground">{String(label ?? '')}</div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        <span className="font-semibold text-foreground">
                                                            {Number(payload[0]?.value ?? 0).toLocaleString()}
                                                        </span>{' '}
                                                        scans
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="scans"
                                        stroke={CHART_PRIMARY}
                                        strokeWidth={2.25}
                                        fill={CHART_PRIMARY}
                                        fillOpacity={0.16}
                                        dot={false}
                                        activeDot={{ r: 4, stroke: CHART_ACCENT, fill: 'white' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Donut (subtle solid colors) */}
                    <Card className="relative overflow-hidden rounded-2xl border border-sidebar-border/70 dark:border-sidebar-border lg:col-span-1">
                        <CardHeader className="relative p-4 pb-2">
                            <CardTitle className="text-sm">Scan Rate</CardTitle>
                            <div className="text-xs text-muted-foreground">Scanned vs not scanned</div>
                        </CardHeader>

                        <CardContent className="relative h-[230px] p-4 pt-2">
                            <div className="absolute inset-0 grid place-items-center pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-semibold tracking-tight">{donut.rate}%</div>
                                    <div className="text-xs text-muted-foreground">completed</div>
                                </div>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (!active || !payload?.length) return null;
                                            const item = payload[0];
                                            return (
                                                <div className="rounded-xl border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
                                                    <div className="font-medium text-foreground">{String(item?.name ?? '')}</div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        <span className="font-semibold text-foreground">
                                                            {Number(item?.value ?? 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Pie
                                        data={donut.data}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        stroke="transparent"
                                    >
                                        <Cell fill={PIE_SCANNED} />
                                        <Cell fill={PIE_NOT} />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="mt-2 flex items-center justify-center gap-3 text-xs">
                                <div className="inline-flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2 rounded-full" style={{ background: PIE_SCANNED }} />
                                    Scanned: <span className="font-medium text-foreground">{donut.scanned.toLocaleString()}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2 rounded-full" style={{ background: PIE_NOT }} />
                                    Not: <span className="font-medium text-foreground">{donut.remaining.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
