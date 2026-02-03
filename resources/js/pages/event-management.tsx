import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import printJS from '@/lib/print-js';

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

type ProgrammeParticipant = {
    id: number;
    name: string;
    email?: string | null;
    display_id?: string | null;
    checked_in_at?: string | null;
};

type ProgrammeRow = {
    id: number;
    title: string;
    description: string;
    created_by?: {
        name: string;
    } | null;

    starts_at: string | null; // ISO string
    ends_at: string | null; // ISO string
    location?: string | null;
    venue?: {
        name: string;
        address?: string | null;
    } | null;

    image_url: string | null; // server-provided
    pdf_url: string | null; // server-provided (for "View more")
    signatory_name?: string | null;
    signatory_title?: string | null;
    signatory_signature_url?: string | null;

    is_active: boolean;
    updated_at?: string | null;
    participants?: ProgrammeParticipant[];
};

type PageProps = {
    programmes?: ProgrammeRow[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Event Management', href: '/event-management' }];

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

function formatDateRange(starts_at?: string | null, ends_at?: string | null) {
    if (!starts_at) return '—';
    const start = new Date(starts_at);
    if (Number.isNaN(start.getTime())) return '—';
    const end = ends_at ? new Date(ends_at) : null;
    const sameDay = end && !Number.isNaN(end.getTime()) && start.toDateString() === end.toDateString();
    const date = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(start);
    if (!end || Number.isNaN(end.getTime()) || sameDay) {
        return date;
    }
    const endDate = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(end);
    return `${date} – ${endDate}`;
}

function formatGivenDate(starts_at?: string | null) {
    if (!starts_at) return '—';
    const start = new Date(starts_at);
    if (Number.isNaN(start.getTime())) return '—';
    return new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(start);
}

function formatVenueLabel(programme: ProgrammeRow) {
    if (programme.venue?.name) {
        return programme.venue.address ? `${programme.venue.name}, ${programme.venue.address}` : programme.venue.name;
    }
    return programme.location || '—';
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

function resolveImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl;
    return `/event-images/${imageUrl}`;
}

function resolveSignatureUrl(signatureUrl?: string | null) {
    if (!signatureUrl) return null;
    if (signatureUrl.startsWith('http') || signatureUrl.startsWith('/')) return signatureUrl;
    return `/signatures/${signatureUrl}`;
}

function getEventStatus(starts_at?: string | null, ends_at?: string | null) {
    if (!starts_at) return 'upcoming';
    const start = new Date(starts_at);
    if (Number.isNaN(start.getTime())) return 'upcoming';

    const end = ends_at ? new Date(ends_at) : null;
    const now = new Date();

    if (end && !Number.isNaN(end.getTime()) && now > end) return 'closed';
    if (now < start) return 'upcoming';
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

function EventStatusBadge({ status }: { status: 'upcoming' | 'ongoing' | 'closed' }) {
    const styles = {
        upcoming: 'bg-sky-600/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
        ongoing: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        closed: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    } as const;

    const labels = {
        upcoming: 'Upcoming',
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

export default function EventManagement(props: PageProps) {
    const serverProgrammes: ProgrammeRow[] = props.programmes ?? [];

    const programmes: ProgrammeRow[] = React.useMemo(() => serverProgrammes, [serverProgrammes]);

    // filters
    const [q, setQ] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
    const [eventFilter, setEventFilter] = React.useState<'all' | 'upcoming' | 'ongoing' | 'closed'>('all');

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        return programmes.filter((p) => {
            const createdBy = p.created_by?.name ?? '';
            const matchesQuery = !query || `${p.title} ${p.description} ${createdBy}`.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
            const phase = getEventStatus(p.starts_at, p.ends_at);
            const matchesEvent = eventFilter === 'all' || phase === eventFilter;
            return matchesQuery && matchesStatus && matchesEvent;
        });
    }, [programmes, q, statusFilter, eventFilter]);

    // dialogs + editing
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ProgrammeRow | null>(null);

    // delete
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<ProgrammeRow | null>(null);

    // participants dialog
    const [participantsOpen, setParticipantsOpen] = React.useState(false);
    const [participantsTarget, setParticipantsTarget] = React.useState<ProgrammeRow | null>(null);
    const [signatoryName, setSignatoryName] = React.useState('Shirley C. Agrupis, Ph.D.');
    const [signatoryTitle, setSignatoryTitle] = React.useState('CHED Chairperson');
    const [signatorySignature, setSignatorySignature] = React.useState<string | null>(null);
    const [signatorySignatureLabel, setSignatorySignatureLabel] = React.useState<string>('');
    const signatorySyncEnabledRef = React.useRef(false);
    const signatorySyncTimeoutRef = React.useRef<number | null>(null);

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

    React.useEffect(() => {
        if (!participantsTarget) return;
        signatorySyncEnabledRef.current = false;

        const defaultName = 'Shirley C. Agrupis, Ph.D.';
        const defaultTitle = 'CHED Chairperson';
        const signatureUrl = resolveSignatureUrl(participantsTarget.signatory_signature_url);

        if (signatorySignature?.startsWith('blob:')) {
            URL.revokeObjectURL(signatorySignature);
        }

        setSignatoryName(participantsTarget.signatory_name ?? defaultName);
        setSignatoryTitle(participantsTarget.signatory_title ?? defaultTitle);
        setSignatorySignature(signatureUrl);
        setSignatorySignatureLabel(signatureUrl ? basename(signatureUrl) : '');

        const enableTimeout = window.setTimeout(() => {
            signatorySyncEnabledRef.current = true;
        }, 0);

        return () => {
            window.clearTimeout(enableTimeout);
        };
    }, [participantsTarget?.id]);

    React.useEffect(() => {
        return () => {
            if (signatorySignature?.startsWith('blob:')) URL.revokeObjectURL(signatorySignature);
        };
    }, [signatorySignature]);

    React.useEffect(() => {
        if (!participantsTarget || !participantsOpen || !signatorySyncEnabledRef.current) return;
        if (signatorySyncTimeoutRef.current) {
            window.clearTimeout(signatorySyncTimeoutRef.current);
        }

        signatorySyncTimeoutRef.current = window.setTimeout(() => {
            persistSignatoryData({
                name: signatoryName,
                title: signatoryTitle,
            });
        }, 700);

        return () => {
            if (signatorySyncTimeoutRef.current) {
                window.clearTimeout(signatorySyncTimeoutRef.current);
            }
        };
    }, [participantsOpen, participantsTarget?.id, signatoryName, signatoryTitle]);

    function persistSignatoryData({
        name,
        title,
        signatureFile,
        removeSignature,
    }: {
        name?: string;
        title?: string;
        signatureFile?: File | null;
        removeSignature?: boolean;
    }) {
        if (!participantsTarget) return;

        const payload = new FormData();
        payload.append('_method', 'patch');
        payload.append('signatory_name', name ?? signatoryName ?? '');
        payload.append('signatory_title', title ?? signatoryTitle ?? '');
        if (signatureFile) payload.append('signatory_signature', signatureFile);
        if (removeSignature) payload.append('signatory_signature_remove', '1');

        router.post(ENDPOINTS.programmes.update(participantsTarget.id), payload, {
            preserveScroll: true,
            forceFormData: true,
            onError: () => toast.error('Unable to save signatory details.'),
        });
    }

    function handleSignatureUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file for the signature.');
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setSignatorySignature((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return previewUrl;
        });
        setSignatorySignatureLabel(file.name);
        persistSignatoryData({ signatureFile: file });
        toast.success('Signature attached.');
    }

    function handleSignatureRemove() {
        if (signatorySignature?.startsWith('blob:')) {
            URL.revokeObjectURL(signatorySignature);
        }
        setSignatorySignature(null);
        setSignatorySignatureLabel('');
        persistSignatoryData({ removeSignature: true });
        toast.success('Signature removed.');
    }

    const form = useForm<{
        title: string;
        description: string;
        starts_at: string; // datetime-local
        ends_at: string; // datetime-local
        image: File | null;
        pdf: File | null;
        is_active: boolean;
    }>({
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
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

        setCurrentImageUrl(resolveImageUrl(item.image_url));
        setCurrentPdfUrl(resolvePdfUrl(item.pdf_url));

        form.setData({
            title: item.title ?? '',
            description: item.description ?? '',
            starts_at: toLocalInputValue(item.starts_at),
            ends_at: toLocalInputValue(item.ends_at),
            image: null,
            pdf: null,
            is_active: !!item.is_active,
        });

        form.clearErrors();

        // show existing as "preview" until new upload
        resetImagePreview(resolveImageUrl(item.image_url));
        setPdfLabel(item.pdf_url ? basename(resolvePdfUrl(item.pdf_url) ?? item.pdf_url) : '');

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

        const hasUploads = Boolean(form.data.image || form.data.pdf);

        form.transform((data) => {
            const payload: any = {
                title: data.title.trim(),
                description: data.description.trim(),
                starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
                ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
                is_active: editing ? !!editing.is_active : !!data.is_active,
            };

            // only send if selected (so editing won't overwrite existing files)
            if (data.image) payload.image = data.image;
            if (data.pdf) payload.pdf = data.pdf;
            if (editing) payload._method = 'patch';

            return payload;
        });

        const options = {
            preserveScroll: true,
            forceFormData: hasUploads,
            onSuccess: () => {
                setDialogOpen(false);
                setEditing(null);
                toast.success(`Event ${editing ? 'updated' : 'created'}.`);
            },
            onError: (errors: Record<string, string | string[]>) => showToastError(errors),
        } as const;

        if (editing) form.post(ENDPOINTS.programmes.update(editing.id), options);
        else form.post(ENDPOINTS.programmes.store, options);
    }

    function toggleActive(item: ProgrammeRow) {
        router.patch(
            ENDPOINTS.programmes.update(item.id),
            { is_active: !item.is_active },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Event ${item.is_active ? 'deactivated' : 'activated'}.`),
                onError: () => toast.error('Unable to update event status.'),
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
            onSuccess: () => toast.success('Event deleted.'),
            onError: () => toast.error('Unable to delete event.'),
        });
    }

    function openParticipants(item: ProgrammeRow) {
        setParticipantsTarget(item);
        setParticipantsOpen(true);
    }

    function printParticipantCertificates(
        programme: ProgrammeRow,
        participant: ProgrammeParticipant,
    ) {
        const html = buildCertificatePrintBody(programme, [participant]);
        if (!html.trim()) {
            toast.error('Unable to generate certificates.');
            return;
        }
        printJS({ printable: html, type: 'raw-html', style: printStyles, documentTitle: 'Certificates' });
    }

    const printStyles = `
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: "Times New Roman", serif; color: #111; margin: 0; }
        .page { width: 210mm; min-height: 297mm; margin: 0 auto 12mm; display: flex; flex-direction: column; gap: 10mm; }
        .certificate { flex: 1; border: 1px solid #e5e7eb; padding: 10mm; display: flex; flex-direction: column; justify-content: center; }
        .certificate--appearance {
            background: url('/img/appearance_bg.png') center/cover no-repeat;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .certificate--participation {
            background:
                linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)),
                url('/img/bg.png') center/cover no-repeat;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .certificate-logo { display: block; max-width: 100%; margin: 0 auto 10px; }
        .certificate-logo--appearance { max-height: 64px; }
        .certificate-logo--participation { max-height: 54px; }
        .title { text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 1px; margin: 10px 0 14px; }
        .subtitle { text-align: center; font-size: 14px; margin-bottom: 4px; }
        .lead { text-align: center; font-size: 15px; margin-top: 6px; }
        .recipient { text-align: center; font-size: 20px; font-weight: 700; margin-top: 6px; }
        .text { text-align: center; font-size: 15px; line-height: 1.6; margin: 10px auto 0; max-width: 620px; }
        .value { font-weight: 700; }
        .given { text-align: center; font-size: 14px; margin-top: 16px; }
        .signatory { margin-top: 24px; text-align: center; }
        .signatory-signature { display: block; margin: 0 auto -6px; max-height: 60px; object-fit: contain; }
        .sign-name { font-size: 15px; font-weight: 700; }
        .sign-title { font-size: 13px; }
        .page:last-child { margin-bottom: 0; }
        @media print {
            .page { margin: 0 auto; page-break-after: always; }
            .page:last-child { page-break-after: auto; }
        }
    `;

    function buildCertificatePrintBody(programme: ProgrammeRow, participants: ProgrammeParticipant[]) {
        const eventName = programme.title;
        const eventDate = formatDateRange(programme.starts_at, programme.ends_at);
        const givenDate = formatGivenDate(programme.ends_at ?? programme.starts_at);
        const venue = formatVenueLabel(programme);

        const renderCertificate = (participantName: string, type: 'appearance' | 'participation') => {
            const typeTitle = type === 'appearance' ? 'CERTIFICATE OF APPEARANCE' : 'CERTIFICATE OF PARTICIPATION';
            const lead =
                type === 'appearance' ? 'This is to certify that' : 'This certificate is hereby given to';
            const body =
                type === 'appearance'
                    ? `has appeared during the conduct of <span class="value">${eventName}</span> on <span class="value">${eventDate}</span> at <span class="value">${venue}</span>.`
                    : `for actively participating in <span class="value">${eventName}</span> on <span class="value">${eventDate}</span> at <span class="value">${venue}</span>.`;
            const logo =
                type === 'appearance' ? '/img/ched_logo_bagong_pilipinas.png' : '/img/ched_logo_bagong_pilipinas_asean.png';

            return `
                <section class="certificate certificate--${type}">
                    <img class="certificate-logo certificate-logo--${type}" src="${logo}" alt="" />
                    <div class="title">${typeTitle}</div>
                    <div class="lead">${lead}</div>
                    <div class="recipient">${participantName}</div>
                    <div class="text">${body}</div>
                    <div class="given">Given this ${givenDate} at ${venue}.</div>
                    <div class="signatory">
                        ${signatorySignature ? `<img class="signatory-signature" src="${signatorySignature}" alt="Signature" />` : ''}
                        <div class="sign-name">${signatoryName}</div>
                        <div class="sign-title">${signatoryTitle}</div>
                    </div>
                </section>
            `;
        };

        const pages = participants
            .map((participant) => {
                return `
                    <div class="page">
                        ${renderCertificate(participant.name, 'appearance')}
                        ${renderCertificate(participant.name, 'participation')}
                    </div>
                `;
            })
            .join('');

        return pages;
    }

    function printAllCertificates() {
        if (!participantsTarget) return;
        const checkedInParticipants = (participantsTarget.participants ?? []).filter((participant) => participant.checked_in_at);
        if (checkedInParticipants.length === 0) {
            toast.error('No checked-in participants to print.');
            return;
        }
        const html = buildCertificatePrintBody(participantsTarget, checkedInParticipants);
        if (!html.trim()) {
            toast.error('Unable to generate certificates.');
            return;
        }
        printJS({ printable: html, type: 'raw-html', style: printStyles, documentTitle: 'Certificates' });
    }

    const participantsList = participantsTarget?.participants ?? [];
    const checkedInCount = participantsList.filter((participant) => participant.checked_in_at).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Management" />

            {/* ✅ removed overflow-x-auto here */}
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* header */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-[#00359c]" />
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            Event Management
                        </h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Manage event cards shown on the public Event page.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                            <div className="relative w-full sm:w-[360px]">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search title or description..."
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

                            <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as any)}>
                                <SelectTrigger className="w-full sm:w-[190px]">
                                    <SelectValue placeholder="Event phase" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All phases</SelectItem>
                                    <SelectItem value="ongoing">Ongoing</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={openAdd} className={cn('w-full sm:w-auto', PRIMARY_BTN)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Event
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
                                title="No event items found"
                                subtitle="Try adjusting your search/filter, or add a new event item."
                            />
                        ) : (
                            // ✅ scrollbar only in table area
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                                <Table className="min-w-[1480px]">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                            <TableHead className="min-w-[360px]">Event</TableHead>

                                            <TableHead className="min-w-[260px]">Schedule</TableHead>
                                            <TableHead className="min-w-[220px]">View more (PDF)</TableHead>
                                            <TableHead className="w-[160px]">Event Status</TableHead>
                                            <TableHead className="w-[140px]">Status</TableHead>
                                            <TableHead className="w-[200px]">Participants</TableHead>
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
                                                            {(() => {
                                                                const imageUrl = resolveImageUrl(p.image_url);
                                                                if (!imageUrl) {
                                                                    return <ImageUp className="h-4 w-4 text-slate-500" />;
                                                                }

                                                                return (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={p.title}
                                                                        className="h-full w-full object-cover"
                                                                        loading="lazy"
                                                                        draggable={false}
                                                                    />
                                                                );
                                                            })()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate">{p.title}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>



                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    <div className="font-medium">{formatDatePill(p.starts_at, p.ends_at)}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{daysToGo(p.starts_at) ?? '—'}</div>
                                                </TableCell>

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

                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        onClick={() => openParticipants(p)}
                                                        className="inline-flex items-center gap-2 rounded-full border border-[#00359c]/20 bg-[#00359c]/5 px-3 py-1 text-sm font-semibold text-[#00359c] shadow-sm hover:bg-[#00359c]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00359c]/30"
                                                    >
                                                        {(p.participants?.length ?? 0).toLocaleString()} joined
                                                        <span className="text-xs font-medium opacity-70">View</span>
                                                    </button>
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
                                                            <DropdownMenuItem onSelect={() => openEdit(p)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => toggleActive(p)}>
                                                                <BadgeCheck className="mr-2 h-4 w-4" />
                                                                {p.is_active ? 'Set Inactive' : 'Set Active'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => requestDelete(p)}>
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
                                <DialogTitle>{editing ? 'Edit Event' : 'Add Event'}</DialogTitle>
                                <DialogDescription>Upload image + PDF for “View more” on the public page.</DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <div className="mt-4 grid gap-4">
                                <div className="grid gap-3 sm:grid-cols-2">
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

            <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[920px] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Participants</DialogTitle>
                        <DialogDescription>
                            {participantsTarget?.title ?? 'Event'} · {participantsList.length.toLocaleString()} joined ·{' '}
                            {checkedInCount.toLocaleString()} checked in
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Signatory name</div>
                                    <Input
                                        value={signatoryName}
                                        onChange={(e) => setSignatoryName(e.target.value)}
                                        placeholder="Signatory name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Signatory title</div>
                                    <Input
                                        value={signatoryTitle}
                                        onChange={(e) => setSignatoryTitle(e.target.value)}
                                        placeholder="Signatory title"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Signature upload</div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Input type="file" accept="image/*" onChange={handleSignatureUpload} />
                                        {signatorySignature ? (
                                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                                                <span className="truncate">{signatorySignatureLabel || 'Signature attached'}</span>
                                            </div>
                                        ) : null}
                                        {signatorySignature ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={handleSignatureRemove}
                                            >
                                                Remove
                                            </Button>
                                        ) : null}
                                    </div>
                                    {signatorySignature ? (
                                        <div className="flex items-center gap-3">
                                            <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                <img src={signatorySignature} alt="Signature preview" className="h-10 w-auto object-contain" />
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Preview</div>
                                        </div>
                                    ) : null}
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Upload a signature image to embed in the certificate PDF view.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">
                            <div className="text-slate-600 dark:text-slate-300">
                                Print certificates for checked-in participants only.
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                className={PRIMARY_BTN}
                                onClick={printAllCertificates}
                                disabled={checkedInCount === 0}
                            >
                                Print All Certificates
                            </Button>
                        </div>
                        {participantsList.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                                No participants have joined this event yet.
                            </div>
                        ) : (
                            participantsList.map((participant) => (
                                <div
                                    key={participant.id}
                                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{participant.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {participant.display_id || participant.email || '—'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {participant.checked_in_at ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Checked in
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                                    Not checked in
                                                </span>
                                            )}
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => printParticipantCertificates(participantsTarget!, participant)}
                                                    disabled={!participant.checked_in_at}
                                                >
                                                    Print Certificates
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {participant.checked_in_at ? (
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Scanned {formatDateTimeSafe(participant.checked_in_at)}
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
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
