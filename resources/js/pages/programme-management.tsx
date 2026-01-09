import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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
    ImageUp,
    FileText,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

type ProgrammeRow = {
    id: number;
    tag: string;
    title: string;
    description: string;
    created_by?: {
        name: string;
    } | null;

    starts_at: string | null; // ISO string
    ends_at: string | null; // ISO string
    location: string;

    image_url: string | null; // server-provided
    pdf_url: string | null; // server-provided (for "View more")

    is_active: boolean;
    updated_at?: string | null;
};

type PageProps = {
    programmes?: ProgrammeRow[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Programme Management', href: '/programme-management' }];

const ENDPOINTS = {
    programmes: {
        store: '/programmes',
        update: (id: number) => `/programmes/${id}`,
        destroy: (id: number) => `/programmes/${id}`,
    },
};

const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

// -------------------- helpers --------------------
function formatDatePill(starts_at?: string | null, ends_at?: string | null) {
    if (!starts_at) return '—';
    const s = new Date(starts_at);
    const e = ends_at ? new Date(ends_at) : null;
    if (Number.isNaN(s.getTime())) return '—';

    const d = new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit', year: 'numeric' }).format(s);
    const time = (dt: Date) => new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(dt);

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

function toLocalInputValue(iso: string | null | undefined) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function basename(u: string) {
    const s = u.split('?')[0].split('#')[0];
    const parts = s.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? u;
}

function resolvePdfUrl(pdfUrl?: string | null) {
    if (!pdfUrl) return null;
    if (pdfUrl.startsWith('http') || pdfUrl.startsWith('/')) return pdfUrl;
    return `/downloadables/${pdfUrl}`;
}

function getEventStatus(starts_at?: string | null, ends_at?: string | null) {
    if (!starts_at) return 'open';
    const start = new Date(starts_at);
    if (Number.isNaN(start.getTime())) return 'open';

    const end = ends_at ? new Date(ends_at) : null;
    const now = new Date();

    if (end && !Number.isNaN(end.getTime()) && now > end) return 'closed';
    if (now < start) return 'open';
    return 'ongoing';
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
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function EventStatusBadge({ status }: { status: 'open' | 'ongoing' | 'closed' }) {
    const styles = {
        open: 'bg-sky-600/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
        ongoing: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        closed: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    } as const;

    const labels = {
        open: 'Open',
        ongoing: 'Ongoing',
        closed: 'Closed',
    } as const;

    return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium', styles[status])}>{labels[status]}</span>;
}

function showToastError(errors: Record<string, string | string[]>) {
    const firstError = Object.values(errors ?? {})[0];
    const message = Array.isArray(firstError) ? firstError[0] : firstError;
    toast.error(message || 'Something went wrong. Please try again.');
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

export default function ProgrammeManagement(props: PageProps) {
    const serverProgrammes: ProgrammeRow[] = props.programmes ?? [];

    const programmes: ProgrammeRow[] = React.useMemo(() => serverProgrammes, [serverProgrammes]);

    // filters
    const [q, setQ] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        return programmes.filter((p) => {
            const createdBy = p.created_by?.name ?? '';
            const matchesQuery =
                !query || `${p.title} ${p.tag} ${p.location} ${p.description} ${createdBy}`.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
            return matchesQuery && matchesStatus;
        });
    }, [programmes, q, statusFilter]);

    // dialogs + editing
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ProgrammeRow | null>(null);

    // delete
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<ProgrammeRow | null>(null);

    // ✅ existing file urls (server) when editing
    const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(null);
    const [currentPdfUrl, setCurrentPdfUrl] = React.useState<string | null>(null);

    // image preview
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

    // pdf label
    const [pdfLabel, setPdfLabel] = React.useState<string>('');

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
        image: File | null;
        pdf: File | null;
        is_active: boolean;
    }>({
        tag: '',
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
        location: '',
        image: null,
        pdf: null,
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

        setCurrentImageUrl(null);
        setCurrentPdfUrl(null);

        resetImagePreview(null);
        setPdfLabel('');

        setDialogOpen(true);
    }

    function openEdit(item: ProgrammeRow) {
        setEditing(item);

        setCurrentImageUrl(item.image_url ?? null);
        setCurrentPdfUrl(item.pdf_url ?? null);

        form.setData({
            tag: item.tag ?? '',
            title: item.title ?? '',
            description: item.description ?? '',
            starts_at: toLocalInputValue(item.starts_at),
            ends_at: toLocalInputValue(item.ends_at),
            location: item.location ?? '',
            image: null,
            pdf: null,
            is_active: !!item.is_active,
        });

        form.clearErrors();

        // show existing as "preview" until new upload
        resetImagePreview(item.image_url ?? null);
        setPdfLabel(item.pdf_url ? basename(item.pdf_url) : '');

        setDialogOpen(true);
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        form.setData('image', file);

        if (!file) {
            resetImagePreview(currentImageUrl);
            return;
        }

        resetImagePreview(URL.createObjectURL(file));
    }

    function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        form.setData('pdf', file);

        if (!file) {
            setPdfLabel(currentPdfUrl ? basename(currentPdfUrl) : '');
            return;
        }

        setPdfLabel(file.name);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        form.transform((data) => {
            const payload: any = {
                tag: data.tag.trim(),
                title: data.title.trim(),
                description: data.description.trim(),
                location: data.location.trim(),
                starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
                ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
                is_active: editing ? !!editing.is_active : !!data.is_active,
            };

            // only send if selected (so editing won't overwrite existing files)
            if (data.image) payload.image = data.image;
            if (data.pdf) payload.pdf = data.pdf;

            return payload;
        });

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setDialogOpen(false);
                setEditing(null);
                toast.success(`Programme ${editing ? 'updated' : 'created'}.`);
            },
            onError: (errors: Record<string, string | string[]>) => showToastError(errors),
        } as const;

        if (editing) form.patch(ENDPOINTS.programmes.update(editing.id), options);
        else form.post(ENDPOINTS.programmes.store, options);
    }

    function toggleActive(item: ProgrammeRow) {
        router.patch(
            ENDPOINTS.programmes.update(item.id),
            { is_active: !item.is_active },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Programme ${item.is_active ? 'deactivated' : 'activated'}.`),
                onError: () => toast.error('Unable to update programme status.'),
            },
        );
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
            onSuccess: () => toast.success('Programme deleted.'),
            onError: () => toast.error('Unable to delete programme.'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programme Management" />

            {/* ✅ removed overflow-x-auto here */}
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* header */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-[#00359c]" />
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            Programme Management
                        </h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Manage programme cards shown on the public Programme page.</p>
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
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
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
                            // ✅ scrollbar only in table area
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                                <Table className="min-w-[1280px]">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                            <TableHead className="min-w-[360px]">Programme</TableHead>
                                            <TableHead className="min-w-[200px]">Added by</TableHead>
                                            <TableHead className="min-w-[260px]">Schedule</TableHead>
                                            <TableHead className="min-w-[220px]">Location</TableHead>
                                            <TableHead className="min-w-[220px]">View more (PDF)</TableHead>
                                            <TableHead className="w-[160px]">Event Status</TableHead>
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
                                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{p.tag}</div>
                                                            <div className="truncate">{p.title}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {p.created_by?.name ?? '—'}
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    <div className="font-medium">{formatDatePill(p.starts_at, p.ends_at)}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{daysToGo(p.starts_at) ?? '—'}</div>
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">{p.location}</TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {(() => {
                                                        const pdfUrl = resolvePdfUrl(p.pdf_url);
                                                        if (!pdfUrl) {
                                                            return <span className="text-xs text-slate-500 dark:text-slate-400">—</span>;
                                                        }

                                                        return (
                                                            <a
                                                                href={pdfUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[#00359c] hover:text-[#00359c] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                                                            >
                                                                <FileText className="h-4 w-4 text-[#00359c]" />
                                                                <span className="max-w-[260px] truncate">{basename(pdfUrl)}</span>
                                                            </a>
                                                        );
                                                    })()}
                                                </TableCell>

                                                <TableCell>
                                                    <EventStatusBadge status={getEventStatus(p.starts_at, p.ends_at)} />
                                                </TableCell>

                                                <TableCell>
                                                    <StatusBadge active={p.is_active} />
                                                </TableCell>

                                                <TableCell className="text-slate-700 dark:text-slate-300">{formatDateTimeSafe(p.updated_at)}</TableCell>

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
                                                                {p.is_active ? 'Set Inactive' : 'Set Active'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => requestDelete(p)}>
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

            {/* Add/Edit Dialog (NO live preview, NO URL inputs) */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className={cn('w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-[760px]', 'max-h-[85vh] overflow-hidden p-0')}>
                    <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
                        <div className="px-6 pt-6">
                            <DialogHeader>
                                <DialogTitle>{editing ? 'Edit Programme' : 'Add Programme'}</DialogTitle>
                                <DialogDescription>Upload image + PDF for “View more” on the public page.</DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <div className="mt-4 grid gap-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <div className="text-sm font-medium">Tag (small header)</div>
                                        <Input value={form.data.tag} onChange={(e) => form.setData('tag', e.target.value)} placeholder="e.g. Plenary & Panels" />
                                        {form.errors.tag ? <div className="text-xs text-red-600">{form.errors.tag}</div> : null}
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2">
                                        <div className="text-sm font-medium">Title (big text)</div>
                                        <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} placeholder="e.g. Track Discussions" />
                                        {form.errors.title ? <div className="text-xs text-red-600">{form.errors.title}</div> : null}
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2">
                                        <div className="text-sm font-medium">Description</div>
                                        <Textarea
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            placeholder="Short description shown on the card"
                                            className="min-h-[96px]"
                                        />
                                        {form.errors.description ? <div className="text-xs text-red-600">{form.errors.description}</div> : null}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="text-sm font-medium">Starts at</div>
                                        <Input type="datetime-local" value={form.data.starts_at} onChange={(e) => form.setData('starts_at', e.target.value)} />
                                        {form.errors.starts_at ? <div className="text-xs text-red-600">{form.errors.starts_at}</div> : null}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="text-sm font-medium">Ends at</div>
                                        <Input type="datetime-local" value={form.data.ends_at} onChange={(e) => form.setData('ends_at', e.target.value)} />
                                        {form.errors.ends_at ? <div className="text-xs text-red-600">{form.errors.ends_at}</div> : null}
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2">
                                        <div className="text-sm font-medium">Location</div>
                                        <Input value={form.data.location} onChange={(e) => form.setData('location', e.target.value)} placeholder="e.g. Conference Hall B" />
                                        {form.errors.location ? <div className="text-xs text-red-600">{form.errors.location}</div> : null}
                                    </div>

                                    {/* IMAGE (upload only) */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <div className="text-sm font-medium">Image</div>

                                        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                                            <div className="space-y-2">
                                                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                                                {(form.errors as any).image ? <div className="text-xs text-red-600">{(form.errors as any).image}</div> : null}

                                                {currentImageUrl && !form.data.image ? (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        Current: <span className="font-semibold">{basename(currentImageUrl)}</span>
                                                    </div>
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

                                    {/* PDF (upload only) */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <div className="text-sm font-medium">PDF (View more)</div>

                                        <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
                                            <div className="space-y-2">
                                                <Input type="file" accept="application/pdf" onChange={handlePdfUpload} />
                                                {(form.errors as any).pdf ? <div className="text-xs text-red-600">{(form.errors as any).pdf}</div> : null}

                                                {currentPdfUrl && !form.data.pdf ? (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        Current: <span className="font-semibold">{basename(currentPdfUrl)}</span>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Selected</div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {pdfLabel || 'No PDF selected'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">Opens when users click “View more”.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

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
