import * as React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CalendarDays, Download, FileText, MapPin, Medal, RotateCcw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import printJS from '@/lib/print-js';
import { buildCertificatePrintBody, CERTIFICATE_PRINT_STYLES } from '@/lib/certificates';

type Programme = {
    id: number;
    title: string;
    description: string;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
    image_url: string | null;
    pdf_url: string | null;
    materials: {
        id: number;
        file_name: string;
        file_path: string;
        file_type: string | null;
    }[];
    signatory_name: string | null;
    signatory_title: string | null;
    signatory_signature_url: string | null;
};

type Participant = {
    id: number;
    name: string;
    email: string;
    display_id: string;
};

type Attendance = {
    scanned_at: string | null;
} | null;

type PageProps = {
    participant: Participant;
    programme: Programme;
    attendance: Attendance;
};

function resolvePdfUrl(pdfUrl?: string | null) {
    if (!pdfUrl) return null;
    if (pdfUrl.startsWith('http') || pdfUrl.startsWith('/')) return pdfUrl;
    return `/downloadables/${pdfUrl}`;
}

function resolveMaterialUrl(filePath?: string | null) {
    if (!filePath) return null;
    if (filePath.startsWith('http') || filePath.startsWith('/')) return filePath;
    return `/event-materials/${filePath}`;
}

function resolveSignatureUrl(signatureUrl?: string | null) {
    if (!signatureUrl) return null;
    if (signatureUrl.startsWith('http') || signatureUrl.startsWith('/')) return signatureUrl;
    return `/signatures/${signatureUrl}`;
}

function formatEventWindow(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt) return 'Date TBD';
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

function formatDateRange(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt) return '—';
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return '—';
    const end = endsAt ? new Date(endsAt) : null;
    const sameDay = end && !Number.isNaN(end.getTime()) && start.toDateString() === end.toDateString();
    const date = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(start);
    if (!end || Number.isNaN(end.getTime()) || sameDay) {
        return date;
    }
    const endDate = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(end);
    return `${date} – ${endDate}`;
}

function formatGivenDate(startsAt?: string | null) {
    if (!startsAt) return '—';
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return '—';
    return new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(start);
}

export default function EventKitMaterials() {
    const { participant, programme, attendance } = usePage<PageProps>().props;
    const resetForm = useForm({});
    const hasAttendance = Boolean(attendance?.scanned_at);
    const pdfUrl = resolvePdfUrl(programme.pdf_url);
    const signatorySignature = resolveSignatureUrl(programme.signatory_signature_url);
    const materials = programme.materials.map((material) => ({
        ...material,
        url: resolveMaterialUrl(material.file_path),
    }));

    const eventDate = formatDateRange(programme.starts_at, programme.ends_at);
    const givenDateLabel = formatGivenDate(programme.ends_at ?? programme.starts_at);
    const venue = programme.location || '—';

    const handlePrint = () => {
        if (!hasAttendance) return;
        const html = buildCertificatePrintBody({
            data: {
                eventName: programme.title,
                eventDate,
                givenDate: givenDateLabel,
                venue,
                signatoryName: programme.signatory_name ?? 'Shirley C. Agrupis, Ph.D.',
                signatoryTitle: programme.signatory_title ?? 'CHED Chairperson',
                signatorySignature,
            },
            participants: [{ name: participant.name }],
        });
        if (!html.trim()) return;
        printJS({ printable: html, type: 'raw-html', style: CERTIFICATE_PRINT_STYLES, documentTitle: 'Certificate' });
    };

    return (
        <>
            <Head title="Event Kit Materials" />
            <PublicLayout navActive="/event">
                <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <Badge variant="outline">Event Kit</Badge>
                            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                                Event kit & certificates
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Download event materials and access your certificates if you checked in.
                            </p>
                        </div>
                        <Card className="border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{participant.name}</div>
                            <div>{participant.display_id}</div>
                            <div className="text-slate-500 dark:text-slate-400">{participant.email}</div>
                        </Card>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <Card className="border-slate-200/70 bg-white/70 p-6 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{programme.title}</h2>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{programme.description}</p>

                                    <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-[#0033A0]" />
                                            {formatEventWindow(programme.starts_at, programme.ends_at)}
                                        </span>
                                        {programme.location ? (
                                            <span className="inline-flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-[#0033A0]" />
                                                {programme.location}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'self-start border-emerald-200 bg-emerald-50 text-emerald-700',
                                        !hasAttendance && 'border-rose-200 bg-rose-50 text-rose-600',
                                    )}
                                >
                                    {hasAttendance ? 'Checked in' : 'No attendance recorded'}
                                </Badge>
                            </div>
                            {attendance?.scanned_at ? (
                                <div className="mt-3 text-xs text-emerald-600">
                                    Attendance scanned: {new Date(attendance.scanned_at).toLocaleString('en-PH')}
                                </div>
                            ) : null}

                            <div className="mt-6 border-t border-slate-200/60 pt-5 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    <Download className="h-4 w-4 text-[#0033A0]" />
                                    Event Kit (Materials)
                                </div>
                                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                    Download the official event materials and guide for this programme.
                                </p>
                                <div className="mt-4 space-y-2">
                                    {pdfUrl ? (
                                        <Button
                                            asChild
                                            className="h-10 bg-[#0033A0] text-white hover:bg-[#0033A0]/90"
                                        >
                                            <a href={pdfUrl} target="_blank" rel="noreferrer">
                                                Download event guide
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    ) : null}

                                    {materials.length ? (
                                        <div className="space-y-2">
                                            {materials.map((material) => (
                                                <div
                                                    key={material.id}
                                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold">{material.file_name}</div>
                                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {material.file_type?.toUpperCase() ?? 'FILE'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {material.url ? (
                                                        <Button asChild size="sm" variant="outline" className="h-8">
                                                            <a href={material.url} target="_blank" rel="noreferrer">
                                                                Download
                                                            </a>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    ) : !pdfUrl ? (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Materials are not available yet. Please check back later.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <Card className="border-slate-200/70 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Certificates</h3>
                                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                            {hasAttendance
                                                ? 'Your attendance has been verified. Download both certificates below.'
                                                : 'Certificates become available after your QR attendance is scanned.'}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        'mt-4 flex items-center justify-between rounded-xl border p-3 text-xs',
                                        hasAttendance
                                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                                            : 'border-slate-200 bg-white/70 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Medal className="h-4 w-4" />
                                        <span className="font-semibold">Print certificates (appearance & participation)</span>
                                    </div>
                                    {hasAttendance ? (
                                        <Button size="sm" variant="outline" className="h-8" onClick={handlePrint}>
                                            Print
                                        </Button>
                                    ) : (
                                        <span className="text-[11px]">Pending attendance</span>
                                    )}
                                </div>
                            </Card>

                            <Card className="border-slate-200/70 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                                    <span>Need to switch participant?</span>
                                    <form onSubmit={(event) => event.preventDefault()}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => resetForm.post('/event-kit/reset')}
                                        >
                                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                            Start over
                                        </Button>
                                    </form>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
