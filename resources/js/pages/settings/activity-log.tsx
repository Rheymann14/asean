import * as React from 'react';
import { Head, Link, router } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { index as activityLog } from '@/routes/activity-log';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    Search,
    ShieldAlert,
    ShieldCheck,
    TriangleAlert,
    User2,
    XCircle,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Log', href: activityLog().url },
];

type LogStatus = 'success' | 'failed' | 'warning' | 'info';
type ActivityType =
    | 'login'
    | 'logout'
    | 'update'
    | 'create'
    | 'delete'
    | 'export'
    | 'view'
    | 'approve'
    | 'reject';

type ActivityLogRow = {
    id: number;
    page: string; // e.g. "Settings / Profile"
    pageHref?: string | null; // optional
    user: {
        name: string;
        role?: string | null;
    };
    activity: ActivityType;
    description: string | null;
    status: LogStatus;
    ip?: string | null;
    device?: string | null;
    timestamp: string; // ISO
};

type DayGroup = {
    dayLabel: string; // e.g. "Today — Jan 12, 2026"
    dayKey: string; // for stable key
    rows: ActivityLogRow[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedLogs = {
    data: ActivityLogRow[];
    links: PaginationLink[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
};

type ActivityLogFilters = {
    status?: LogStatus | null;
    search?: string | null;
    from?: string | null;
    to?: string | null;
    perPage?: number | null;
};

type ActivityLogProps = {
    logs: PaginatedLogs;
    filters: ActivityLogFilters;
};

function statusBadgeClass(status: LogStatus) {
    switch (status) {
        case 'success':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'failed':
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200';
        case 'warning':
            return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200';
        case 'info':
        default:
            return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200';
    }
}

function activityBadgeClass(type: ActivityType) {
    // subtle but still readable
    switch (type) {
        case 'delete':
        case 'reject':
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200';
        case 'approve':
        case 'create':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'update':
            return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200';
        case 'export':
            return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200';
        case 'login':
        case 'logout':
        case 'view':
        default:
            return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';
    }
}

function activityIcon(type: ActivityType) {
    switch (type) {
        case 'approve':
            return <ShieldCheck className="h-3.5 w-3.5" />;
        case 'reject':
            return <ShieldAlert className="h-3.5 w-3.5" />;
        case 'login':
            return <CheckCircle2 className="h-3.5 w-3.5" />;
        case 'logout':
            return <XCircle className="h-3.5 w-3.5" />;
        case 'update':
            return <Clock className="h-3.5 w-3.5" />;
        case 'delete':
            return <TriangleAlert className="h-3.5 w-3.5" />;
        case 'export':
            return <ExternalLink className="h-3.5 w-3.5" />;
        case 'create':
            return <CheckCircle2 className="h-3.5 w-3.5" />;
        case 'view':
        default:
            return <Search className="h-3.5 w-3.5" />;
    }
}

function formatActivity(type: ActivityType) {
    // more readable labels
    const map: Record<ActivityType, string> = {
        login: 'Login',
        logout: 'Logout',
        update: 'Update',
        create: 'Create',
        delete: 'Delete',
        export: 'Export',
        view: 'View',
        approve: 'Approve',
        reject: 'Reject',
    };
    return map[type] ?? type;
}

function dayKeyFromDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dateKey = dayKeyFromDate(date);
    const todayKey = dayKeyFromDate(today);
    const yesterdayKey = dayKeyFromDate(yesterday);
    const dateLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (dateKey === todayKey) {
        return `Today — ${dateLabel}`;
    }

    if (dateKey === yesterdayKey) {
        return `Yesterday — ${dateLabel}`;
    }

    return dateLabel;
}

function formatTimestamp(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPaginationLabel(label: string) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<\/?[^>]+(>|$)/g, '');
}

const EMPTY_LOGS: PaginatedLogs = {
    data: [],
    links: [],
    meta: {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
        from: null,
        to: null,
    },
};

export default function ActivityLog({ logs, filters }: ActivityLogProps) {
    const safeLogs = logs ?? EMPTY_LOGS;
    const safeFilters = filters ?? {};

    const [query, setQuery] = React.useState(safeFilters.search ?? '');
    const [status, setStatus] = React.useState<'all' | LogStatus>(safeFilters.status ?? 'all');
    const [from, setFrom] = React.useState(safeFilters.from ?? '');
    const [to, setTo] = React.useState(safeFilters.to ?? '');
    const [perPage, setPerPage] = React.useState<number>(safeFilters.perPage ?? safeLogs.meta.per_page ?? 25);

    React.useEffect(() => {
        setQuery(safeFilters.search ?? '');
        setStatus(safeFilters.status ?? 'all');
        setFrom(safeFilters.from ?? '');
        setTo(safeFilters.to ?? '');
        setPerPage(safeFilters.perPage ?? safeLogs.meta.per_page ?? 25);
    }, [safeFilters.search, safeFilters.status, safeFilters.from, safeFilters.to, safeFilters.perPage, safeLogs.meta.per_page]);

    const filteredGroups = React.useMemo(() => {
        const groups = new Map<string, DayGroup>();

        safeLogs.data.forEach((row) => {
            const rowDate = new Date(row.timestamp);
            const rowKey = dayKeyFromDate(rowDate);
            const group = groups.get(rowKey) ?? {
                dayKey: rowKey,
                dayLabel: formatDayLabel(rowDate),
                rows: [],
            };

            group.rows.push(row);
            groups.set(rowKey, group);
        });

        return Array.from(groups.values());
    }, [safeLogs.data]);

    const totalRows = safeLogs.meta.total;
    const hasMounted = React.useRef(false);

    const applyFilters = React.useCallback(
        (next: Partial<ActivityLogFilters>) => {
            const nextStatus = next.status ?? status;
            const nextSearch = next.search ?? query;
            const nextFrom = next.from ?? from;
            const nextTo = next.to ?? to;
            const nextPerPage = next.perPage ?? perPage;

            router.get(
                activityLog(),
                {
                    search: nextSearch || undefined,
                    status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
                    from: nextFrom || undefined,
                    to: nextTo || undefined,
                    per_page: nextPerPage,
                    page: 1,
                },
                {
                    preserveScroll: true,
                    replace: true,
                },
            );
        },
        [query, status, from, to, perPage],
    );

    React.useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            applyFilters({ search: query });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [query, applyFilters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Log" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Activity Log"
                        description="View users activity log and history"
                    />

                    {/* Filters */}
                    <Card className="rounded-2xl border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40">
    <div className="grid gap-4">
    {/* Row 1: From + To */}
    <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-300">From</Label>
            <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    type="date"
                    value={from}
                    onChange={(e) => {
                        const nextFrom = e.target.value;
                        setFrom(nextFrom);
                        applyFilters({ from: nextFrom || null });
                    }}
                    className="h-9 w-full rounded-xl pl-10"
                />
            </div>
        </div>

        <div className="grid gap-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-300">To</Label>
            <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => {
                        const nextTo = e.target.value;
                        setTo(nextTo);
                        applyFilters({ to: nextTo || null });
                    }}
                    className="h-9 w-full rounded-xl pl-10"
                />
            </div>
        </div>
    </div>

    {/* Row 2: Status + Search + Reset */}
    <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
        <div className="grid gap-1.5 sm:col-span-3">
            <Label className="text-xs text-slate-600 dark:text-slate-300">Status</Label>
            <Select
                value={status}
                onValueChange={(v) => {
                    const nextStatus = v as LogStatus | 'all';
                    setStatus(nextStatus);
                    applyFilters({ status: nextStatus === 'all' ? null : nextStatus });
                }}
            >
                <SelectTrigger className="h-9 w-full rounded-xl">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="grid gap-1.5 sm:col-span-5">
            <Label className="text-xs text-slate-600 dark:text-slate-300">Search</Label>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search page, user, activity, IP…"
                    className="h-9 w-full rounded-xl pl-10"
                />
            </div>
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs text-slate-600 dark:text-slate-300">Show entries</Label>
            <Select
                value={String(perPage)}
                onValueChange={(value) => {
                    const nextPerPage = Number(value);
                    setPerPage(nextPerPage);
                    applyFilters({ perPage: nextPerPage });
                }}
            >
                <SelectTrigger className="h-9 w-full rounded-xl">
                    <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="sm:col-span-2">
            <Label className="sr-only">Reset</Label>
            <Button
                type="button"
                variant="outline"
                className="h-9 w-full rounded-xl"
                onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setFrom('');
                    setTo('');
                    const defaultPerPage = safeFilters.perPage ?? safeLogs.meta.per_page ?? 25;
                    setPerPage(defaultPerPage);
                    applyFilters({
                        search: '',
                        status: null,
                        from: null,
                        to: null,
                        perPage: defaultPerPage,
                    });
                }}
            >
                <Filter className="mr-2 h-4 w-4" />
                Reset
            </Button>
        </div>
    </div>
</div>


                        <Separator className="my-4" />

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <div className="inline-flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {safeLogs.meta.from ?? 0}-{safeLogs.meta.to ?? 0}
                                </span>
                                <span>of</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {totalRows}
                                </span>
                                <span>result(s)</span>
                                <span className="hidden sm:inline">•</span>
                                {from || to ? (
                                    <span className="hidden sm:inline">
                                        Date range:{' '}
                                        <span className="font-medium">{from || '—'}</span> to{' '}
                                        <span className="font-medium">{to || '—'}</span>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </Card>


                    {/* Groups per day */}
                    <div className="space-y-6">
                        {filteredGroups.length === 0 ? (
                            <Card className="rounded-2xl border-dashed border-slate-200/70 bg-white/70 p-8 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300">
                                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    No activity found
                                </p>
                                <p className="mt-2">
                                    Try adjusting your search or filters.
                                </p>
                            </Card>
                        ) : (
                            filteredGroups.map((group) => (
                                <Card
                                    key={group.dayKey}
                                    className="rounded-2xl border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {group.dayLabel}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                                {group.rows.length} entr{group.rows.length === 1 ? 'y' : 'ies'}
                                            </p>
                                        </div>

                                        <Badge
                                            className={cn(
                                                'rounded-full border px-2 py-0.5 text-[11px]',
                                                'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
                                            )}
                                        >
                                            {group.dayKey}
                                        </Badge>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/10">
                                        <Table className="text-sm">
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/60 dark:bg-white/5">
                                                    <TableHead className="w-[26%] py-2 text-xs">
                                                        Page
                                                    </TableHead>
                                                    <TableHead className="w-[18%] py-2 text-xs">
                                                        User
                                                    </TableHead>
                                                    <TableHead className="w-[14%] py-2 text-xs">
                                                        Activity
                                                    </TableHead>
                                                    <TableHead className="py-2 text-xs">
                                                        Description
                                                    </TableHead>
                                                    <TableHead className="w-[10%] py-2 text-xs">
                                                        Status
                                                    </TableHead>
                                                    <TableHead className="w-[12%] py-2 text-xs text-right">
                                                        Timestamp
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {group.rows.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        className="hover:bg-slate-50/70 dark:hover:bg-white/5"
                                                    >
                                                        {/* Page */}
                                                        <TableCell className="py-2 align-top">
                                                            <div className="min-w-0 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        className={cn(
                                                                            'rounded-full border px-2 py-0.5 text-[11px]',
                                                                            'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
                                                                        )}
                                                                    >
                                                                        {row.page}
                                                                    </Badge>

                                                                    {row.pageHref ? (
                                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {row.pageHref}
                                                                        </span>
                                                                    ) : null}
                                                                </div>

                                                                {/* extra micro info */}
                                                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                                                    {row.ip ? (
                                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-white/5">
                                                                            IP: {row.ip}
                                                                        </span>
                                                                    ) : null}
                                                                    {row.device ? (
                                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-white/5">
                                                                            {row.device}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* User */}
                                                        <TableCell className="py-2 align-top">
                                                            <div className="space-y-1">
                                                                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                                    {row.user.name}
                                                                </p>
                                                                {row.user.role ? (
                                                                    <Badge
                                                                        className={cn(
                                                                            'rounded-full border px-2 py-0.5 text-[11px]',
                                                                            'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
                                                                        )}
                                                                    >
                                                                        {row.user.role}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Activity */}
                                                        <TableCell className="py-2 align-top">
                                                            <Badge
                                                                className={cn(
                                                                    'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]',
                                                                    activityBadgeClass(row.activity),
                                                                )}
                                                            >
                                                                {activityIcon(row.activity)}
                                                                {formatActivity(row.activity)}
                                                            </Badge>
                                                        </TableCell>

                                                        {/* Description */}
                                                        <TableCell className="py-2 align-top">
                                                            <p className="line-clamp-2 text-[13px] leading-5 text-slate-700 dark:text-slate-200">
                                                                {row.description}
                                                            </p>
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell className="py-2 align-top">
                                                            <Badge
                                                                className={cn(
                                                                    'rounded-full border px-2 py-0.5 text-[11px]',
                                                                    statusBadgeClass(row.status),
                                                                )}
                                                            >
                                                                {row.status === 'success'
                                                                    ? 'Success'
                                                                    : row.status === 'failed'
                                                                        ? 'Failed'
                                                                        : row.status === 'warning'
                                                                            ? 'Warning'
                                                                            : 'Info'}
                                                            </Badge>
                                                        </TableCell>

                                                        {/* Timestamp */}
                                                        <TableCell className="py-2 align-top text-right">
                                                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                                                {formatTimestamp(row.timestamp)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {safeLogs.links.length > 1 ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <span>
                                Showing{' '}
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {safeLogs.meta.from ?? 0}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {safeLogs.meta.to ?? 0}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {safeLogs.meta.total}
                                </span>{' '}
                                entries
                            </span>

                            <div className="flex flex-wrap items-center gap-1">
                                {safeLogs.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url ?? '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-medium transition',
                                            link.active
                                                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-white/10',
                                            !link.url && 'pointer-events-none opacity-50',
                                        )}
                                    >
                                        {formatPaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
