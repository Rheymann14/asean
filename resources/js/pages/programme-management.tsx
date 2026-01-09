import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    BadgeCheck,
    CalendarDays,
    MapPin,
    ImageUp,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

type ProgrammeRow = {
    id: number;
    tag: string; // small label like "Plenary & Panels"
    title: string; // big title like "Track Discussions"
    description: string;

    starts_at: string | null; // ISO string
    ends_at: string | null; // ISO string
    location: string;

    image_url: string | null; // public image path OR storage url
    is_active: boolean;

    updated_at?: string | null;
};

type PageProps = {
    programmes?: ProgrammeRow[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Programme Management', href: '/programme-management' }];

// ✅ Update these endpoints to match your Laravel routes.
const ENDPOINTS = {
    programmes: {
        store: '/programmes',
        update: (id: number) => `/programmes/${id}`,
        destroy: (id: number) => `/programmes/${id}`,
    },
};

// ✅ Accent color requested (#00359c) — apply to all primary buttons
const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

// -------------------- DEV SAMPLE DATA (matches your public screenshot) --------------------
const DEV_SAMPLE_PROGRAMMES: ProgrammeRow[] = [
    {
        id: 1,
        tag: 'Plenary & Panels',
        title: 'Track Discussions',
        description:
            'Track-based panels and guided discussions. Share insights, build outputs, and align next steps across participating groups.',
        starts_at: '2026-03-02T09:00:00+08:00',
        ends_at: '2026-03-02T17:00:00+08:00',
        location: 'Conference Hall B',
        image_url: '/event/event1.jpg', // change if you have your own
        is_active: true,
        updated_at: '2026-01-05T08:00:00+08:00',
    },
    {
        id: 2,
        tag: 'Workshops & Outputs',
        title: 'Facilitated Workshops',
        description:
            'Facilitated activities for planning, drafting commitments, and building outputs participants can bring back to their institutions.',
        starts_at: '2026-03-03T09:00:00+08:00',
        ends_at: '2026-03-03T16:30:00+08:00',
        location: 'Workshop Rooms',
        image_url: '/event/event2.jpg', // change if you have your own
        is_active: true,
        updated_at: '2026-01-05T09:15:00+08:00',
    },
    {
        id: 3,
        tag: 'Highlights & Closing',
        title: 'Closing Session',
        description:
            'Key moments, official updates, and downloadable references—kept in one place for participants and partners.',
        starts_at: '2026-03-04T09:00:00+08:00',
        ends_at: '2026-03-04T12:00:00+08:00',
        location: 'Main Auditorium',
        image_url: '/event/event3.jpg', // change if you have your own
        is_active: true,
        updated_at: '2026-01-06T10:05:00+08:00',
    },
];

// -------------------- helpers --------------------
function formatDatePill(starts_at?: string | null, ends_at?: string | null) {
    if (!starts_at) return '—';
    const s = new Date(starts_at);
    const e = ends_at ? new Date(ends_at) : null;
    if (Number.isNaN(s.getTime())) return '—';

    const d = new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit', year: 'numeric' }).format(s);

    const time = (dt: Date) =>
        new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(dt).replace(':00', ':00');

    if (!e || Number.isNaN(e.getTime())) return `${d} · ${time(s)}`;
    return `${d} · ${time(s)}–${time(e)}`;
}

function daysToGo(starts_at?: string | null) {
    if (!starts_at) return null;
    const s = new Date(starts_at);
    if (Number.isNaN(s.getTime())) return null;

    const now = new Date();
    const diff = s.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    // match your public style: "53 days to go"
    if (days < 0) return 'Ended';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day to go';
    return `${days} days to go`;
}

function formatDateTimeSafe(value?: string | null) {
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

// datetime-local wants "YYYY-MM-DDTHH:mm"
function toLocalInputValue(iso: string | null | undefined) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium',
                active
                    ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            )}
        >
            {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {active ? 'Open' : 'Closed'}
        </span>
    );
}

function EmptyState({
    icon,
    title,
    subtitle,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
            <div className="grid place-items-center gap-2">
                <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {icon}
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</div>
                <div className="max-w-md text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>
                {action ? <div className="mt-4">{action}</div> : null}
            </div>
        </div>
    );
}

function ProgrammeCardPreview({
    tag,
    title,
    description,
    starts_at,
    ends_at,
    location,
    is_active,
    image_url,
}: Partial<ProgrammeRow>) {
    const dateLabel = formatDatePill(starts_at ?? null, ends_at ?? null);
    const d2g = daysToGo(starts_at ?? null);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(2,6,23,0.25)] dark:border-slate-800 dark:bg-slate-950">
            {/* pills row */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[12px] font-medium text-[#00359c] dark:border-blue-900/40 dark:bg-blue-950/30">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dateLabel}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {location || 'Location'}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    <span className="inline-block size-2 rounded-full bg-slate-300" />
                    {d2g ?? '—'}
                </span>

                <span className="ml-auto">
                    <StatusBadge active={!!is_active} />
                </span>
            </div>

            {/* content */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tag || 'Tag'}</div>
                    <div className="mt-2 text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
                        {title || 'Programme title'}
                    </div>
                    <div className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {description || 'Programme description will appear here.'}
                    </div>

                    <div className="mt-5">
                        <div className={cn('inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold', PRIMARY_BTN)}>
                            View more
                            <span className="ml-3 inline-block">→</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="w-full max-w-[240px] rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                            {image_url ? (
                                <img
                                    src={image_url}
                                    alt="Programme"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    draggable={false}
                                />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-sm text-slate-500">
                                    No image
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProgrammeManagement(props: PageProps) {
    const serverProgrammes: ProgrammeRow[] = props.programmes ?? [];

    const programmes: ProgrammeRow[] = React.useMemo(() => {
        if (serverProgrammes.length > 0) return serverProgrammes;
        if (!import.meta.env.DEV) return [];
        return DEV_SAMPLE_PROGRAMMES;
    }, [serverProgrammes]);

    // filters
    const [q, setQ] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'open' | 'closed'>('all');

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        return programmes.filter((p) => {
            const matchesQuery =
                !query ||
                `${p.title} ${p.tag} ${p.location} ${p.description}`.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'open' ? p.is_active : !p.is_active);

            return matchesQuery && matchesStatus;
        });
    }, [programmes, q, statusFilter]);

    // dialogs + editing
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ProgrammeRow | null>(null);

    // delete
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<ProgrammeRow | null>(null);

    // image preview (if you later add uploads)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    React.useEffect(() => {
        return () => {
            if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const form = useForm<{
        tag: string;
        title: string;
        description: string;
        starts_at: string; // datetime-local
        ends_at: string; // datetime-local
        location: string;
        image_url: string; // for now: URL/path
        image: File | null; // optional upload if you wire backend
        is_active: boolean;
    }>({
        tag: '',
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
        location: '',
        image_url: '',
        image: null,
        is_active: true,
    });

    function resetImagePreview(next: string | null) {
        setImagePreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return next;
        });
    }

    function openAdd() {
        setEditing(null);
        form.reset();
        form.clearErrors();
        resetImagePreview(null);
        setDialogOpen(true);
    }

    function openEdit(item: ProgrammeRow) {
        setEditing(item);
        form.setData({
            tag: item.tag ?? '',
            title: item.title ?? '',
            description: item.description ?? '',
            starts_at: toLocalInputValue(item.starts_at),
            ends_at: toLocalInputValue(item.ends_at),
            location: item.location ?? '',
            image_url: item.image_url ?? '',
            image: null,
            is_active: !!item.is_active,
        });
        form.clearErrors();
        resetImagePreview(item.image_url ?? null);
        setDialogOpen(true);
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        form.setData('image', file);

        if (!file) {
            resetImagePreview(form.data.image_url || null);
            return;
        }

        resetImagePreview(URL.createObjectURL(file));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        // transform payload
        form.transform((data) => {
            const payload: any = {
                tag: data.tag.trim(),
                title: data.title.trim(),
                description: data.description.trim(),
                location: data.location.trim(),
                starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
                ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
                image_url: data.image_url.trim() || null,
                is_active: !!data.is_active,
            };

            // if you wire backend image upload later:
            if (data.image) payload.image = data.image;

            return payload;
        });

        const options = {
            preserveScroll: true,
            // if you use image upload, keep this on:
            forceFormData: true,
            onSuccess: () => {
                setDialogOpen(false);
                setEditing(null);
            },
        } as const;

        if (editing) form.patch(ENDPOINTS.programmes.update(editing.id), options);
        else form.post(ENDPOINTS.programmes.store, options);
    }

    function toggleActive(item: ProgrammeRow) {
        router.patch(ENDPOINTS.programmes.update(item.id), { is_active: !item.is_active }, { preserveScroll: true });
    }

    function requestDelete(item: ProgrammeRow) {
        setDeleteTarget(item);
        setDeleteOpen(true);
    }

    function confirmDelete() {
        if (!deleteTarget) return;

        router.delete(ENDPOINTS.programmes.destroy(deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteOpen(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programme Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* header */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-[#00359c]" />
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            Programme Management
                        </h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Manage programme cards shown on the public Programme page.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                            <div className="relative w-full sm:w-[360px]">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search title, tag, location..."
                                    className="pl-9"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                <SelectTrigger className="w-full sm:w-[170px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={openAdd} className={cn('w-full sm:w-auto', PRIMARY_BTN)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Programme
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filtered.length}</span>{' '}
                        item{filtered.length === 1 ? '' : 's'}
                    </div>

                    <div className="mt-4">
                        {filtered.length === 0 ? (
                            <EmptyState
                                icon={<CalendarDays className="h-5 w-5" />}
                                title="No programme items found"
                                subtitle="Try adjusting your search/filter, or add a new programme item."
                            />
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                            <TableHead className="min-w-[320px]">Programme</TableHead>
                                            <TableHead className="min-w-[260px]">Schedule</TableHead>
                                            <TableHead className="min-w-[220px]">Location</TableHead>
                                            <TableHead className="w-[140px]">Status</TableHead>
                                            <TableHead className="w-[180px]">Updated</TableHead>
                                            <TableHead className="w-[120px] text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filtered.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="grid size-10 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                            {p.image_url ? (
                                                                <img
                                                                    src={p.image_url}
                                                                    alt={p.title}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                    draggable={false}
                                                                />
                                                            ) : (
                                                                <ImageUp className="h-4 w-4 text-slate-500" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                {p.tag}
                                                            </div>
                                                            <div className="truncate">{p.title}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    <div className="font-medium">{formatDatePill(p.starts_at, p.ends_at)}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{daysToGo(p.starts_at) ?? '—'}</div>
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">{p.location}</TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <StatusBadge active={p.is_active} />
                                                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {formatDateTimeSafe(p.updated_at)}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-52">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openEdit(p)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleActive(p)}>
                                                                <BadgeCheck className="mr-2 h-4 w-4" />
                                                                {p.is_active ? 'Set Closed' : 'Set Open'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => requestDelete(p)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent
                    className={cn(
                        // ✅ smaller width
                        'w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-[960px]',
                        // ✅ limit height + prevent whole dialog from overflowing
                        'max-h-[85vh] overflow-hidden p-0',
                    )}
                >
                    <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
                        {/* header */}
                        <div className="px-6 pt-6">
                            <DialogHeader>
                                <DialogTitle>{editing ? 'Edit Programme' : 'Add Programme'}</DialogTitle>
                                <DialogDescription>
                                    This item will render as a card on the public Programme page (like your screenshot).
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* ✅ scrollable body */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_420px]">
                                {/* LEFT FORM */}
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="text-sm font-medium">Tag (small header)</div>
                                            <Input
                                                value={form.data.tag}
                                                onChange={(e) => form.setData('tag', e.target.value)}
                                                placeholder="e.g. Plenary & Panels"
                                            />
                                            {form.errors.tag ? <div className="text-xs text-red-600">{form.errors.tag}</div> : null}
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="text-sm font-medium">Title (big text)</div>
                                            <Input
                                                value={form.data.title}
                                                onChange={(e) => form.setData('title', e.target.value)}
                                                placeholder="e.g. Track Discussions"
                                            />
                                            {form.errors.title ? <div className="text-xs text-red-600">{form.errors.title}</div> : null}
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="text-sm font-medium">Description</div>
                                            <Textarea
                                                value={form.data.description}
                                                onChange={(e) => form.setData('description', e.target.value)}
                                                placeholder="Short description shown on the card"
                                                className="min-h-[96px]" // ✅ slightly shorter
                                            />
                                            {form.errors.description ? <div className="text-xs text-red-600">{form.errors.description}</div> : null}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="text-sm font-medium">Starts at</div>
                                            <Input
                                                type="datetime-local"
                                                value={form.data.starts_at}
                                                onChange={(e) => form.setData('starts_at', e.target.value)}
                                            />
                                            {form.errors.starts_at ? <div className="text-xs text-red-600">{form.errors.starts_at}</div> : null}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="text-sm font-medium">Ends at</div>
                                            <Input
                                                type="datetime-local"
                                                value={form.data.ends_at}
                                                onChange={(e) => form.setData('ends_at', e.target.value)}
                                            />
                                            {form.errors.ends_at ? <div className="text-xs text-red-600">{form.errors.ends_at}</div> : null}
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="text-sm font-medium">Location</div>
                                            <Input
                                                value={form.data.location}
                                                onChange={(e) => form.setData('location', e.target.value)}
                                                placeholder="e.g. Conference Hall B"
                                            />
                                            {form.errors.location ? <div className="text-xs text-red-600">{form.errors.location}</div> : null}
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium">Image</div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">Use image_url OR upload</div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                                                <div className="space-y-2">
                                                    <Input
                                                        value={form.data.image_url}
                                                        onChange={(e) => {
                                                            form.setData('image_url', e.target.value);
                                                            if (!form.data.image) resetImagePreview(e.target.value || null);
                                                        }}
                                                        placeholder="e.g. /event/event1.jpg"
                                                    />
                                                    <Input type="file" accept="image/*" onChange={handleImageUpload} />
                                                    {(form.errors as any).image ? (
                                                        <div className="text-xs text-red-600">{(form.errors as any).image}</div>
                                                    ) : null}
                                                </div>

                                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                    <div className="aspect-square bg-slate-100 dark:bg-slate-900">
                                                        {imagePreview ? (
                                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" draggable={false} />
                                                        ) : (
                                                            <div className="grid h-full place-items-center text-xs text-slate-500">No image</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 sm:col-span-2 dark:border-slate-800">
                                            <div className="space-y-0.5">
                                                <div className="text-sm font-medium">Open</div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                                    Closed items won’t appear as “Open” on public.
                                                </div>
                                            </div>
                                            <Switch checked={form.data.is_active} onCheckedChange={(v) => form.setData('is_active', !!v)} />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT PREVIEW */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Preview</div>

                                        {/* ✅ green badge */}
                                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-300">
                                            <span className="inline-block size-2 rounded-full bg-emerald-500" />
                                            LIVE PREVIEW (display only)
                                        </span>
                                    </div>

                                    <div className="text-xs text-emerald-700 dark:text-emerald-300">
                                        This is a preview only — buttons here won’t work. Save changes to apply.
                                    </div>

                                    {/* ✅ green broken/dashed border preview wrapper */}
                                    <div className="relative rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                                        {/* subtle watermark */}
                                        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                                            <div className="select-none rotate-[-14deg] text-5xl font-extrabold tracking-widest text-emerald-600/10 dark:text-emerald-300/10">
                                                PREVIEW
                                            </div>
                                        </div>

                                        {/* ✅ make preview non-interactive */}
                                        <div className="pointer-events-none select-none relative">
                                            <ProgrammeCardPreview
                                                tag={form.data.tag}
                                                title={form.data.title}
                                                description={form.data.description}
                                                starts_at={form.data.starts_at ? new Date(form.data.starts_at).toISOString() : null}
                                                ends_at={form.data.ends_at ? new Date(form.data.ends_at).toISOString() : null}
                                                location={form.data.location}
                                                is_active={form.data.is_active}
                                                image_url={imagePreview || form.data.image_url || null}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
                                        <div className="font-semibold">Public page will show</div>
                                        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                                            <li>Date/time pill</li>
                                            <li>Location pill</li>
                                            <li>Days-to-go pill</li>
                                            <li>Open/Closed badge</li>
                                            <li>Image on the right</li>
                                        </ul>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* ✅ sticky footer */}
                        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/85 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={form.processing}>
                                    Cancel
                                </Button>
                                <Button type="submit" className={PRIMARY_BTN} disabled={form.processing}>
                                    {editing ? 'Save changes' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>


            {/* Delete Confirm */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this programme?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteTarget?.title ?? 'this item'}</span>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
