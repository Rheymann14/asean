import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { createPortal } from 'react-dom';
import { participant } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

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
    CheckCircle2,
    XCircle,
    Users,
    Globe2,
    BadgeCheck,
    ImageUp,
    QrCode as QrCodeIcon,
    Printer,
    CalendarDays,
    MapPin,
    KeyRound,
} from 'lucide-react';
import QRCode from 'qrcode';

type Country = {
    id: number;
    code: string; // e.g. PH
    name: string; // e.g. Philippines
    is_active: boolean;
    flag_url?: string | null; // ✅ display URL from backend (e.g. /storage/flags/ph.png)
};

type UserType = {
    id: number;
    name: string; // e.g. Prime Minister
    slug?: string;
    is_active: boolean;
};

type ProgrammeRow = {
    id: number;
    tag: string | null;
    title: string;
    description: string;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
    venue?: {
        name: string;
        address?: string | null;
    } | null;
    image_url: string | null;
    is_active: boolean;
};

type ParticipantRow = {
    id: number;
    display_id?: string | null;
    qr_payload?: string | null;
    full_name: string;
    email: string;
    contact_number?: string | null;
    country_id: number | null;
    user_type_id: number | null;
    is_active: boolean;
    consent_contact_sharing?: boolean;
    consent_photo_video?: boolean;
    created_at?: string | null;
    joined_programme_ids?: number[];
    checked_in_programme_ids?: number[];
    checked_in_programmes?: {
        programme_id: number;
        scanned_at?: string | null;
    }[];

    // optional expanded props if your backend includes them
    country?: Country | null;
    user_type?: UserType | null;
};

type PageProps = {
    countries?: Country[];
    userTypes?: UserType[];
    participants?: ParticipantRow[];
    programmes?: ProgrammeRow[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Participant',
        href: participant().url,
    },
];

/**
 * ✅ Update these endpoints to match your Laravel routes.
 * Suggestion:
 * Route::resource('participants', ParticipantController::class);
 * Route::resource('participants/countries', CountryController::class);
 * Route::resource('participants/user-types', UserTypeController::class);
 */
const ENDPOINTS = {
    participants: {
        store: '/participants',
        update: (id: number) => `/participants/${id}`,
        destroy: (id: number) => `/participants/${id}`,
    },
    participantProgrammes: {
        join: (participantId: number, programmeId: number) => `/participants/${participantId}/programmes/${programmeId}`,
        leave: (participantId: number, programmeId: number) => `/participants/${participantId}/programmes/${programmeId}`,
        revertAttendance: (participantId: number, programmeId: number) =>
            `/participants/${participantId}/programmes/${programmeId}/attendance`,
    },
    countries: {
        store: '/participants/countries',
        update: (id: number) => `/participants/countries/${id}`,
        destroy: (id: number) => `/participants/countries/${id}`,
    },
    userTypes: {
        store: '/participants/user-types',
        update: (id: number) => `/participants/user-types/${id}`,
        destroy: (id: number) => `/participants/user-types/${id}`,
    },
};

// ✅ Accent color requested (#00359c) — apply to all primary buttons
const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

function formatDateSafe(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
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

const FALLBACK_EVENT_IMAGE = '/img/asean_banner_logo.png';

type EventPhase = 'ongoing' | 'upcoming' | 'closed';

function resolveProgrammeImage(imageUrl?: string | null) {
    if (!imageUrl) return FALLBACK_EVENT_IMAGE;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl;
    return `/event-images/${imageUrl}`;
}

function useNowTs(intervalMs = 60_000) {
    const [nowTs, setNowTs] = React.useState(() => Date.now());
    React.useEffect(() => {
        const t = window.setInterval(() => setNowTs(Date.now()), intervalMs);
        return () => window.clearInterval(t);
    }, [intervalMs]);
    return nowTs;
}

function formatEventWindow(startsAt: string, endsAt?: string) {
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

function getEventPhase(startsAt: string, endsAt: string | undefined, nowTs: number): EventPhase {
    const start = new Date(startsAt);
    const startTs = start.getTime();
    const end = endsAt ? new Date(endsAt) : null;
    const endTs = end ? end.getTime() : null;

    if (endTs !== null) {
        if (nowTs < startTs) return 'upcoming';
        if (nowTs <= endTs) return 'ongoing';
        return 'closed';
    }

    if (nowTs < startTs) return 'upcoming';

    const now = new Date(nowTs);
    const sameDay =
        now.getFullYear() === start.getFullYear() &&
        now.getMonth() === start.getMonth() &&
        now.getDate() === start.getDate();

    return sameDay ? 'ongoing' : 'closed';
}

function phaseBadgeClass(phase: EventPhase) {
    switch (phase) {
        case 'ongoing':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'upcoming':
            return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200';
        case 'closed':
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600/30 dark:bg-slate-800/30 dark:text-slate-300';
    }
}

function phaseLabel(phase: EventPhase) {
    switch (phase) {
        case 'ongoing':
            return 'Ongoing';
        case 'upcoming':
            return 'Upcoming';
        case 'closed':
        default:
            return 'Closed';
    }
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <Badge
            variant={active ? 'default' : 'secondary'}
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]',
                active
                    ? 'bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
            )}
        >
            {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {active ? 'Active' : 'Inactive'}
        </Badge>
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

function FlagThumb({ country, size = 20, eager = false }: { country: Country; size?: number; eager?: boolean }) {
    const candidates = React.useMemo(() => buildFlagCandidates(country.code, country.name, country.flag_url), [
        country.code,
        country.name,
        country.flag_url,
    ]);
    const candidateKey = React.useMemo(() => candidates.join('|'), [candidates]);
    const [ok, setOk] = React.useState(true);
    const [idx, setIdx] = React.useState(0);

    const src = candidates[idx] ?? null;

    React.useEffect(() => {
        setOk(true);
        setIdx(0);
    }, [candidateKey]);

    return (
        <div
            className={cn(
                'grid shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
            )}
            style={{ width: size, height: size }}
        >
            {src && ok ? (
                <img
                    src={src}
                    alt={`${country.name} flag`}
                    className="h-full w-full object-cover"
                    loading={eager ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    onError={() => {
                        if (idx < candidates.length - 1) setIdx((v) => v + 1);
                        else setOk(false);
                    }}
                />
            ) : (
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{country.code}</span>
            )}
        </div>
    );
}

function FlagCell({ country }: { country: Country }) {
    return (
        <div className="flex items-center gap-3">
            <FlagThumb country={country} size={36} eager />
            <div className="min-w-0">
                <div className="truncate font-medium text-slate-900 dark:text-slate-100">{country.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{country.code}</div>
            </div>
        </div>
    );
}

type PrintOrientation = 'portrait' | 'landscape';

function getFlagSrc(country?: Country | null) {
    if (!country) return null;
    if (country.flag_url) return country.flag_url;

    const code = (country.code || '').toLowerCase().trim();
    if (!code) return null;

    return `/asean/${code}.png`;
}

function isChedUserType(userType?: UserType | null) {
    const t = String(userType?.slug ?? userType?.name ?? '')
        .toLowerCase()
        .trim();

    // covers "ched", "ched staff", etc.
    return t === 'ched' || t.startsWith('ched ');
}

function isAdminUserType(userType?: UserType | null) {
    const t = String(userType?.slug ?? userType?.name ?? '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .trim();

    return t.includes('admin') || t.includes('administrator') || t === 'ched' || t.startsWith('ched ');
}

function isChedParticipant(p: ParticipantRow) {
    return isChedUserType(p.user_type);
}

/**
 * ✅ UPDATED:
 * - removes extra bottom space in landscape by stretching + pushing scan line to bottom (mt-auto)
 * - makes participant details larger in landscape
 * - makes QR panel fill height (h-full)
 */
function ParticipantIdPrintCard({
    participant,
    qrDataUrl,
    orientation,
}: {
    participant: ParticipantRow;
    qrDataUrl?: string;
    orientation: PrintOrientation;
}) {
    const isLandscape = orientation === 'landscape';

    // ✅ final physical print sizes
    const printSize = isLandscape ? 'print:w-[3.37in] print:h-[2.125in]' : 'print:w-[3.46in] print:h-[5.51in]';

    /**
     * ✅ IMPORTANT:
     * To be EXACTLY like participant-dashboard.tsx (Virtual ID),
     * we render at the same “design width” then SCALE DOWN in print.
     *
     * Landscape Virtual ID is designed around max-w-[520px].
     * Portrait Virtual ID is designed around max-w-[360px].
     */
    const designWrap = isLandscape ? 'w-[520px] aspect-[3.37/2.125]' : 'w-[360px] aspect-[3.46/5.51]';

    // CSS px/in ≈ 96. These scale factors keep final printed size correct.
    const printScale = isLandscape ? 'print:scale-[0.6222]' : ''; // 3.37in*96/520
    const printLayout = isLandscape ? 'print:absolute print:left-0 print:top-0 print:origin-top-left' : '';

    // ✅ changed
    const pad = isLandscape ? 'px-4 pt-3 pb-2' : 'p-4';
    const qrPanelWidth = isLandscape ? 'w-[200px]' : '';
    const qrSize = isLandscape ? 160 : 200;

    const qrImgPad = isLandscape ? 'p-1.5' : 'p-2';
    const qrPanelPad = isLandscape ? 'p-1' : 'p-3';

    const headerLogo = isLandscape ? 'h-8 w-8' : 'h-9 w-9';

    const flagSrc = getFlagSrc(participant.country);
    const name = participant.full_name || '—';
    const displayId = participant.display_id ?? '—';

    return (
        <div
            className={cn(
                // this wrapper is the "real" printed size
                'id-print-card relative overflow-hidden',
                printSize,
            )}
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            {/* This inner card is EXACTLY the Virtual ID layout, scaled down for print */}
            <div
                className={cn(
                    'id-print-card-inner relative',
                    designWrap,
                    // in print: use scaling only for landscape to avoid portrait print clipping
                    printLayout,
                    printScale,
                )}
            >
                <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                    {/* Background */}
                    <div aria-hidden className="absolute inset-0">
                        <img
                            src="/img/bg.png"
                            alt=""
                            className={cn(
                                'absolute inset-0 h-full w-full object-cover',
                                'filter brightness-80 contrast-150 saturate-200',
                                'dark:brightness-80 dark:contrast-110',
                                isLandscape ? 'opacity-100 dark:opacity-35' : 'opacity-100 dark:opacity-30',
                            )}
                            draggable={false}
                            loading="eager"
                            decoding="async"
                        />

                        <div className="absolute inset-0 bg-black/10 dark:bg-black/15" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/20 to-white/55 dark:from-slate-950/55 dark:via-slate-950/28 dark:to-slate-950/55" />
                        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-slate-200/60 blur-3xl dark:bg-slate-800/60" />
                    </div>

                    <div className={cn('relative flex h-full flex-col', pad)}>
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <img
                                    src="/img/asean_logo.svg"
                                    alt="ASEAN"
                                    className={cn('object-contain drop-shadow-sm', headerLogo)}
                                    draggable={false}
                                    loading="eager"
                                    decoding="async"
                                />
                                <img
                                    src="/img/bagong_pilipinas.svg"
                                    alt="Bagong Pilipinas"
                                    className={cn('object-contain drop-shadow-sm', headerLogo)}
                                    draggable={false}
                                    loading="eager"
                                    decoding="async"
                                />

                                <div className="min-w-0">
                                    <div
                                        className={cn(
                                            'truncate font-semibold tracking-wide text-slate-700 dark:text-slate-200',
                                            'text-[11px]',
                                        )}
                                    >
                                        ASEAN Philippines 2026
                                    </div>
                                    <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                        Participant Identification
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className={cn('bg-slate-200/70 dark:bg-white/10', isLandscape ? 'my-2' : 'my-3')} />

                        {/* Body */}
                        <div
                            className={cn(
                                'flex-1',
                                isLandscape ? 'grid grid-cols-[1fr_200px] items-stretch gap-3' : 'flex flex-col gap-3',
                            )}
                        >
                            {/* LEFT INFO */}
                            <div className="min-w-0 flex h-full flex-col">
                                <div
                                    className={cn(
                                        'font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400',
                                        isLandscape ? 'text-[13px]' : 'text-[10px]',
                                    )}
                                >
                                    Participant
                                </div>

                                <div
                                    className={cn(
                                        'mt-0.5 break-words font-semibold tracking-tight text-slate-900 dark:text-slate-100 line-clamp-2',
                                        isLandscape ? 'text-[20px] leading-[18px]' : 'text-lg leading-6',
                                    )}
                                    title={name}
                                >
                                    {name}
                                </div>

                                <div className={cn('flex items-center gap-2.5', isLandscape ? 'mt-2' : 'mt-2.5')}>
                                    <div
                                        className={cn(
                                            'overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950',
                                            isLandscape ? 'h-[60px] w-[60px]' : 'h-9 w-9',
                                        )}
                                    >
                                        {flagSrc ? (
                                            <img
                                                src={flagSrc}
                                                alt={participant.country?.name ?? 'Country flag'}
                                                className="h-full w-full object-cover"
                                                draggable={false}
                                                loading="eager"
                                                decoding="async"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                    </div>

                                    <div className="min-w-0">
                                        <div
                                            className={cn(
                                                'truncate font-semibold text-slate-900 dark:text-slate-100',
                                                isLandscape ? 'text-[18px]' : 'text-[12px]',
                                            )}
                                        >
                                            {participant.country?.name ?? '—'}
                                        </div>

                                        {participant.country?.code ? (
                                            <div
                                                className={cn(
                                                    'font-medium text-slate-500 dark:text-slate-400',
                                                    isLandscape ? 'text-[15px]' : 'text-[11px]',
                                                )}
                                            >
                                                {String(participant.country.code ?? '').toUpperCase()}

                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className={cn(isLandscape ? 'mt-2' : 'mt-3')}>
                                    <div className="text-[13px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Participant ID
                                    </div>

                                    <div
                                        className={cn(
                                            'mt-1 inline-flex max-w-full whitespace-normal break-words rounded-2xl border border-slate-200/70 bg-white/80 font-mono text-slate-900 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-100',
                                            isLandscape ? 'px-3 py-1.5 text-[16px] leading-4' : 'px-2.5 py-1.5 text-[11px] leading-4',
                                        )}
                                    >
                                        {displayId}
                                    </div>
                                </div>

                                {/* ✅ push to bottom in landscape (removes the “big empty bottom”) */}
                                <div
                                    className={cn(
                                        'text-slate-500 dark:text-slate-400',
                                        isLandscape ? 'mt-auto pt-1 text-[10px]' : 'mt-2 text-[10px]',
                                    )}
                                >
                                    Scan QR for attendance verification.
                                </div>
                            </div>

                            {/* RIGHT QR */}
                            <div
                                className={cn(
                                    'flex h-full flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/45',
                                    qrPanelWidth,
                                    qrPanelPad,
                                )}
                            >
                                <div
                                    className={cn(
                                        'inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200',
                                        isLandscape ? 'mb-1 text-[10px]' : 'mb-1.5 text-[11px]',
                                    )}
                                >
                                    <QrCodeIcon className={cn(isLandscape ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                                    QR Code
                                </div>

                                {qrDataUrl ? (
                                    <img
                                        src={qrDataUrl}
                                        alt="Participant QR code"
                                        className={cn('rounded-2xl bg-white object-contain', qrImgPad)}
                                        style={{ width: qrSize, height: qrSize }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 text-center dark:border-white/10 dark:bg-slate-950/30"
                                        style={{ width: qrSize, height: qrSize }}
                                    >
                                        <QrCodeIcon className="h-7 w-7 text-slate-400" />
                                        <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300">QR unavailable</div>
                                    </div>
                                )}

                                <div className="mt-2 w-full text-center">
                                    <div
                                        className={cn(
                                            'font-semibold text-slate-900 dark:text-slate-100',
                                            isLandscape ? 'text-[10px]' : 'text-[11px]',
                                        )}
                                    >
                                        <span className="line-clamp-2" title={`${String(participant.country?.code ?? '').toUpperCase()} • ${name}`}>
                                            {String(participant.country?.code ?? '').toUpperCase()}

                                            {participant.country?.code ? ' • ' : ''}
                                            {name}
                                        </span>
                                    </div>
                                    <div className={cn('mt-1 break-words font-mono text-slate-500 dark:text-slate-400', 'text-[10px]')}>
                                        {displayId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer omitted (matches dashboard virtual ID) */}
                    </div>
                </div>
            </div>
        </div>
    );
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // spaces -> dash
        .replace(/(^-|-$)/g, '');
}



function chunk<T>(arr: T[], size: number) {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function buildFlagCandidates(code: string, name: string, preferred?: string | null) {
    const c = code.toLowerCase();
    const n = slugify(name);

    // Tries common patterns inside public/asean/
    const candidates = [
        preferred || undefined,
        `/asean/${c}.png`,
        `/asean/${c}.jpg`,
        `/asean/${c}.jpeg`,
        `/asean/${c}.svg`,
        `/asean/${n}.png`,
        `/asean/${n}.jpg`,
        `/asean/${n}.jpeg`,
        `/asean/${n}.svg`,
    ].filter(Boolean) as string[];

    // Remove duplicates
    return Array.from(new Set(candidates));
}

function showToastError(errors: Record<string, string | string[]>) {
    const first = Object.values(errors)[0];
    const message = Array.isArray(first) ? first[0] : first;
    toast.error(message || 'Something went wrong. Please try again.');
}

function FlagImage({
    code,
    name,
    preferredSrc,
    className,
}: {
    code: string;
    name: string;
    preferredSrc?: string | null;
    className?: string;
}) {
    const candidates = React.useMemo(() => buildFlagCandidates(code, name, preferredSrc), [code, name, preferredSrc]);
    const [idx, setIdx] = React.useState(0);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        setIdx(0);
        setFailed(false);
    }, [code, name, preferredSrc]);

    if (failed || candidates.length === 0) return null;

    return (
        <img
            src={candidates[idx]}
            alt={`${name} flag`}
            className={className}
            draggable={false}
            loading="lazy"
            onError={() => {
                if (idx < candidates.length - 1) setIdx((v) => v + 1);
                else setFailed(true);
            }}
        />
    );
}

export default function ParticipantPage(props: PageProps) {
    const countries: Country[] = props.countries ?? [];
    const userTypes: UserType[] = props.userTypes ?? [];
    const participants: ParticipantRow[] = props.participants ?? [];
    const programmes: ProgrammeRow[] = props.programmes ?? [];

    // ---------------------------------------
    // UI state
    // ---------------------------------------
    const [activeTab, setActiveTab] = React.useState<'participants' | 'countries' | 'userTypes'>('participants');

    const [participantQuery, setParticipantQuery] = React.useState('');
    const [participantCountryFilter, setParticipantCountryFilter] = React.useState<string>('all');
    const [participantTypeFilter, setParticipantTypeFilter] = React.useState<string>('all');
    const [participantStatusFilter, setParticipantStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

    const [countryQuery, setCountryQuery] = React.useState('');
    const [userTypeQuery, setUserTypeQuery] = React.useState('');
    const [selectedParticipantIds, setSelectedParticipantIds] = React.useState<Set<number>>(new Set());
    const [printOrientation, setPrintOrientation] = React.useState<PrintOrientation>('portrait');
    const [qrDataUrls, setQrDataUrls] = React.useState<Record<number, string>>({});
    const qrCacheRef = React.useRef<Record<number, string>>({});

        async function ensureQrForParticipants(list: ParticipantRow[]) {
        // only generate for non-CHED participants with qr_payload
        const pending = list.filter(
            (p) => !isChedParticipant(p) && !!p.qr_payload && !qrCacheRef.current[p.id],
        );

        if (pending.length === 0) return;

        const results = await Promise.all(
            pending.map(async (p) => {
                try {
                    const dataUrl = await QRCode.toDataURL(p.qr_payload ?? '', {
                        margin: 1,
                        scale: 8,
                        errorCorrectionLevel: 'M',
                    });
                    return { id: p.id, dataUrl };
                } catch {
                    return null;
                }
            }),
        );

        const next = { ...qrCacheRef.current };
        let changed = false;

        for (const r of results) {
            if (!r) continue;
            next[r.id] = r.dataUrl;
            changed = true;
        }

        if (changed) {
            qrCacheRef.current = next;
            setQrDataUrls(next);
        }
    }


    const [printMounted, setPrintMounted] = React.useState(false);
    React.useEffect(() => setPrintMounted(true), []);

    // dialogs
    const [participantDialogOpen, setParticipantDialogOpen] = React.useState(false);
    const [countryDialogOpen, setCountryDialogOpen] = React.useState(false);
    const [userTypeDialogOpen, setUserTypeDialogOpen] = React.useState(false);
    const [programmeDialogOpen, setProgrammeDialogOpen] = React.useState(false);
    const [programmeParticipant, setProgrammeParticipant] = React.useState<ParticipantRow | null>(null);
    const [programmeQuery, setProgrammeQuery] = React.useState('');

    // delete confirm
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<{
        kind: 'participant' | 'country' | 'userType';
        id: number;
        label: string;
    } | null>(null);

    // editing state
    const [editingParticipant, setEditingParticipant] = React.useState<ParticipantRow | null>(null);
    const [editingCountry, setEditingCountry] = React.useState<Country | null>(null);
    const [editingUserType, setEditingUserType] = React.useState<UserType | null>(null);

    // ✅ Country flag preview
    const [countryFlagPreview, setCountryFlagPreview] = React.useState<string | null>(null);

    React.useEffect(() => {
        return () => {
            if (countryFlagPreview?.startsWith('blob:')) URL.revokeObjectURL(countryFlagPreview);
        };
    }, [countryFlagPreview]);

    // ---------------------------------------
    // Forms (Inertia)
    // ---------------------------------------
    const participantForm = useForm<{
        full_name: string;
        email: string;
        contact_number: string;
        country_id: string; // Select uses string
        user_type_id: string; // Select uses string
        is_active: boolean;
        password: string;
    }>({
        full_name: '',
        email: '',
        contact_number: '',
        country_id: '',
        user_type_id: '',
        is_active: true,
        password: 'aseanph2026',
    });

    const countryForm = useForm<{
        code: string;
        name: string;
        is_active: boolean;
        flag: File | null; // ✅ upload
    }>({
        code: '',
        name: '',
        is_active: true,
        flag: null,
    });

    const userTypeForm = useForm<{
        name: string;
        is_active: boolean;
    }>({
        name: '',
        is_active: true,
    });

    // ---------------------------------------
    // Derived maps/helpers
    // ---------------------------------------
    const countryById = React.useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries]);
    const userTypeById = React.useMemo(() => new Map(userTypes.map((u) => [u.id, u])), [userTypes]);

    const resolvedParticipants = React.useMemo(() => {
        // if backend didn't include relations, resolve from ids for display
        return participants.map((p) => ({
            ...p,
            country: p.country ?? (p.country_id ? countryById.get(p.country_id) ?? null : null),
            user_type: p.user_type ?? (p.user_type_id ? userTypeById.get(p.user_type_id) ?? null : null),
        }));
    }, [participants, countryById, userTypeById]);

    const nowTs = useNowTs();

    const normalizedProgrammes = React.useMemo(
        () =>
            programmes
                .map((programme) => {
                    const startsAt = programme.starts_at ?? programme.ends_at ?? new Date(nowTs).toISOString();
                    const endsAt = programme.ends_at ?? undefined;
                    const isActive = programme.is_active ?? true;
                    const phase = isActive ? getEventPhase(startsAt, endsAt, nowTs) : 'closed';
                    const venueName = programme.venue?.name?.trim() ?? '';
                    const venueAddress = programme.venue?.address?.trim() ?? '';
                    const venueLabel =
                        venueName && venueAddress ? `${venueName} • ${venueAddress}` : venueName || venueAddress || '';

                    return {
                        id: programme.id,
                        tag: programme.tag ?? '',
                        title: programme.title,
                        description: programme.description,
                        startsAt,
                        endsAt,
                        location: venueLabel || (programme.location ?? ''),
                        imageUrl: resolveProgrammeImage(programme.image_url),
                        phase,
                        isActive,
                    };
                })
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
        [programmes, nowTs],
    );

    const filteredProgrammes = React.useMemo(() => {
        const q = programmeQuery.trim().toLowerCase();
        if (!q) return normalizedProgrammes;
        return normalizedProgrammes.filter((event) => {
            return (
                event.title.toLowerCase().includes(q) ||
                event.description.toLowerCase().includes(q) ||
                event.tag.toLowerCase().includes(q) ||
                event.location.toLowerCase().includes(q)
            );
        });
    }, [normalizedProgrammes, programmeQuery]);

    React.useEffect(() => {
        // If CHED records were selected before, auto-remove them
        const chedIds = resolvedParticipants.filter(isChedParticipant).map((p) => p.id);
        if (chedIds.length === 0) return;

        setSelectedParticipantIds((prev) => {
            let changed = false;
            const next = new Set(prev);
            for (const id of chedIds) {
                if (next.delete(id)) changed = true;
            }
            return changed ? next : prev;
        });
    }, [resolvedParticipants]);

    const filteredParticipants = React.useMemo(() => {
        const q = participantQuery.trim().toLowerCase();
        return resolvedParticipants.filter((p) => {
            const matchesQuery =
                !q ||
                p.full_name.toLowerCase().includes(q) ||
                p.email.toLowerCase().includes(q) ||
                (p.contact_number ?? '').toLowerCase().includes(q) ||
                (p.country?.name ?? '').toLowerCase().includes(q) ||
                (p.user_type?.name ?? '').toLowerCase().includes(q);

            const matchesCountry = participantCountryFilter === 'all' || String(p.country_id ?? '') === participantCountryFilter;

            const matchesType = participantTypeFilter === 'all' || String(p.user_type_id ?? '') === participantTypeFilter;

            const matchesStatus =
                participantStatusFilter === 'all' || (participantStatusFilter === 'active' ? p.is_active : !p.is_active);

            return matchesQuery && matchesCountry && matchesType && matchesStatus;
        });
    }, [resolvedParticipants, participantQuery, participantCountryFilter, participantTypeFilter, participantStatusFilter]);

    const filteredCountries = React.useMemo(() => {
        const q = countryQuery.trim().toLowerCase();
        return countries.filter((c) => (!q ? true : c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)));
    }, [countries, countryQuery]);

    const filteredUserTypes = React.useMemo(() => {
        const q = userTypeQuery.trim().toLowerCase();
        return userTypes.filter((u) => (!q ? true : u.name.toLowerCase().includes(q) || (u.slug ?? '').toLowerCase().includes(q)));
    }, [userTypes, userTypeQuery]);

    const participantById = React.useMemo(() => new Map(resolvedParticipants.map((p) => [p.id, p])), [resolvedParticipants]);

    const selectableVisibleParticipants = React.useMemo(
        () => filteredParticipants.filter((p) => !isChedParticipant(p)),
        [filteredParticipants],
    );

    const selectedParticipantsPrintable = React.useMemo(() => {
        const out: ParticipantRow[] = [];
        selectedParticipantIds.forEach((id) => {
            const p = participantById.get(id);
            if (p && !isChedParticipant(p)) out.push(p);
        });
        return out;
    }, [selectedParticipantIds, participantById]);

    const allVisibleSelected =
        selectableVisibleParticipants.length > 0 &&
        selectableVisibleParticipants.every((p) => selectedParticipantIds.has(p.id));

    React.useEffect(() => {
        let active = true;
        const pending = filteredParticipants.filter((p) => !isChedParticipant(p) && p.qr_payload && !qrCacheRef.current[p.id]);

        if (pending.length === 0) return undefined;

        Promise.all(
            pending.map(async (p) => {
                try {
                    const dataUrl = await QRCode.toDataURL(p.qr_payload ?? '', {
                        margin: 1,
                        scale: 8,
                        errorCorrectionLevel: 'M',
                    });
                    return { id: p.id, dataUrl };
                } catch {
                    return null;
                }
            }),
        ).then((results) => {
            if (!active) return;
            const next = { ...qrCacheRef.current };
            let changed = false;
            results.forEach((result) => {
                if (!result) return;
                next[result.id] = result.dataUrl;
                changed = true;
            });
            if (changed) {
                qrCacheRef.current = next;
                setQrDataUrls(next);
            }
        });

        return () => {
            active = false;
        };
    }, [filteredParticipants]);

    // ---------------------------------------
    // Actions (CRUD)
    // ---------------------------------------
    function openAddParticipant() {
        setEditingParticipant(null);
        participantForm.reset();
        participantForm.clearErrors();
        setParticipantDialogOpen(true);
    }

    function openEditParticipant(p: ParticipantRow) {
        setEditingParticipant(p);
        participantForm.setData({
            full_name: p.full_name ?? '',
            email: p.email ?? '',
            contact_number: p.contact_number ?? '',
            country_id: p.country_id ? String(p.country_id) : '',
            user_type_id: p.user_type_id ? String(p.user_type_id) : '',
            is_active: !!p.is_active,
        });
        participantForm.clearErrors();
        setParticipantDialogOpen(true);
    }

    function submitParticipant(e: React.FormEvent) {
        e.preventDefault();

        participantForm.transform((data) => ({
            full_name: data.full_name.trim(),
            email: data.email.trim(),
            contact_number: data.contact_number.trim() || null,
            country_id: data.country_id ? Number(data.country_id) : null,
            user_type_id: data.user_type_id ? Number(data.user_type_id) : null,
            is_active: data.is_active,
            ...(editingParticipant ? {} : { password: data.password }),
        }));

        if (editingParticipant) {
            participantForm.patch(ENDPOINTS.participants.update(editingParticipant.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setParticipantDialogOpen(false);
                    setEditingParticipant(null);
                    toast.success('Participant updated.');
                },
                onError: showToastError,
            });
        } else {
            participantForm.post(ENDPOINTS.participants.store, {
                preserveScroll: true,
                onSuccess: () => {
                    setParticipantDialogOpen(false);
                    toast.success('Participant added.');
                },
                onError: showToastError,
            });
        }
    }

    function toggleParticipantActive(p: ParticipantRow) {
        router.patch(
            ENDPOINTS.participants.update(p.id),
            { is_active: !p.is_active },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Participant ${p.is_active ? 'deactivated' : 'activated'}.`),
                onError: () => toast.error('Unable to update participant status.'),
            },
        );
    }

    function resetParticipantPassword(p: ParticipantRow) {
        router.patch(
            ENDPOINTS.participants.update(p.id),
            { password: 'aseanph2026' },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Participant password reset.'),
                onError: () => toast.error('Unable to reset participant password.'),
            },
        );
    }

    function openProgrammeManager(p: ParticipantRow) {
        setProgrammeParticipant(p);
        setProgrammeDialogOpen(true);
        setProgrammeQuery('');
    }

    function updateProgrammeSelection(programmeId: number, isJoined: boolean) {
        setProgrammeParticipant((prev) => {
            if (!prev) return prev;
            const current = new Set(prev.joined_programme_ids ?? []);
            if (isJoined) current.add(programmeId);
            else current.delete(programmeId);
            return { ...prev, joined_programme_ids: Array.from(current) };
        });
    }

    function updateProgrammeCheckIn(programmeId: number, isCheckedIn: boolean) {
        setProgrammeParticipant((prev) => {
            if (!prev) return prev;
            const current = new Set(prev.checked_in_programme_ids ?? []);
            if (isCheckedIn) current.add(programmeId);
            else current.delete(programmeId);
            return { ...prev, checked_in_programme_ids: Array.from(current) };
        });
    }

    function toggleProgrammeJoin(participant: ParticipantRow, programmeId: number, isJoined: boolean) {
        const endpoint = isJoined
            ? ENDPOINTS.participantProgrammes.leave(participant.id, programmeId)
            : ENDPOINTS.participantProgrammes.join(participant.id, programmeId);

        if (isJoined) {
            router.delete(endpoint, {
                preserveScroll: true,
                onSuccess: () => {
                    updateProgrammeSelection(programmeId, false);
                    updateProgrammeCheckIn(programmeId, false);
                    toast.success('Event removed from participant.');
                },
                onError: () => toast.error('Unable to update participant events.'),
            });
            return;
        }

        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    updateProgrammeSelection(programmeId, true);
                    toast.success('Event added to participant.');
                },
                onError: () => toast.error('Unable to update participant events.'),
            },
        );
    }

    function revertProgrammeAttendance(participant: ParticipantRow, programmeId: number) {
        router.delete(ENDPOINTS.participantProgrammes.revertAttendance(participant.id, programmeId), {
            preserveScroll: true,
            onSuccess: () => {
                updateProgrammeCheckIn(programmeId, false);
                toast.success('Attendance reverted.');
            },
            onError: () => toast.error('Unable to revert attendance.'),
        });
    }

    function requestDelete(kind: 'participant' | 'country' | 'userType', id: number, label: string) {
        setDeleteTarget({ kind, id, label });
        setDeleteOpen(true);
    }

    function confirmDelete() {
        if (!deleteTarget) return;

        const { kind, id } = deleteTarget;

        const destroyUrl =
            kind === 'participant'
                ? ENDPOINTS.participants.destroy(id)
                : kind === 'country'
                    ? ENDPOINTS.countries.destroy(id)
                    : ENDPOINTS.userTypes.destroy(id);

        router.delete(destroyUrl, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteOpen(false);
                setDeleteTarget(null);
            },
            onSuccess: () => toast.success('Record deleted.'),
            onError: () => toast.error('Unable to delete record.'),
        });
    }

    // Countries
    function resetCountryPreview(next: string | null) {
        setCountryFlagPreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return next;
        });
    }

    function openAddCountry() {
        setEditingCountry(null);
        countryForm.reset();
        countryForm.clearErrors();
        resetCountryPreview(null);
        setCountryDialogOpen(true);
    }

    function openEditCountry(c: Country) {
        setEditingCountry(c);
        countryForm.setData({
            code: c.code ?? '',
            name: c.name ?? '',
            is_active: !!c.is_active,
            flag: null, // only send if user uploads a new file
        });
        countryForm.clearErrors();
        resetCountryPreview(c.flag_url ?? null);
        setCountryDialogOpen(true);
    }

    function handleCountryFlagChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        countryForm.setData('flag', file);

        if (!file) {
            resetCountryPreview(editingCountry?.flag_url ?? null);
            return;
        }

        resetCountryPreview(URL.createObjectURL(file));
    }

    function submitCountry(e: React.FormEvent) {
        e.preventDefault();

        countryForm.transform((data) => {
            const payload: any = {
                code: data.code.trim().toUpperCase(),
                name: data.name.trim(),
                is_active: data.is_active,
            };
            if (data.flag) payload.flag = data.flag;
            return payload;
        });

        const options = {
            preserveScroll: true,
            forceFormData: true, // ✅ required for file uploads
            onSuccess: () => {
                setCountryDialogOpen(false);
                setEditingCountry(null);
                toast.success(`Country ${editingCountry ? 'updated' : 'added'}.`);
            },
            onError: showToastError,
        } as const;

        if (editingCountry) {
            countryForm.patch(ENDPOINTS.countries.update(editingCountry.id), options);
        } else {
            countryForm.post(ENDPOINTS.countries.store, options);
        }
    }

    function toggleCountryActive(c: Country) {
        router.patch(
            ENDPOINTS.countries.update(c.id),
            { is_active: !c.is_active },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Country ${c.is_active ? 'deactivated' : 'activated'}.`),
                onError: () => toast.error('Unable to update country status.'),
            },
        );
    }

    function submitUserType(e: React.FormEvent) {
        e.preventDefault();

        userTypeForm.transform((data) => ({
            name: data.name.trim(),
            is_active: data.is_active,
        }));

        if (editingUserType) {
            userTypeForm.patch(ENDPOINTS.userTypes.update(editingUserType.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setUserTypeDialogOpen(false);
                    setEditingUserType(null);
                    toast.success('User type updated.');
                },
                onError: showToastError,
            });
        } else {
            userTypeForm.post(ENDPOINTS.userTypes.store, {
                preserveScroll: true,
                onSuccess: () => {
                    setUserTypeDialogOpen(false);
                    toast.success('User type added.');
                },
                onError: showToastError,
            });
        }
    }

    function toggleUserTypeActive(u: UserType) {
        router.patch(
            ENDPOINTS.userTypes.update(u.id),
            { is_active: !u.is_active },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`User type ${u.is_active ? 'deactivated' : 'activated'}.`),
                onError: () => toast.error('Unable to update user type status.'),
            },
        );
    }

    function openAddUserType() {
        setEditingUserType(null);
        userTypeForm.reset();
        userTypeForm.clearErrors();
        setUserTypeDialogOpen(true);
    }

    function openEditUserType(u: UserType) {
        setEditingUserType(u);
        userTypeForm.setData({
            name: u.name ?? '',
            is_active: !!u.is_active,
        });
        userTypeForm.clearErrors();
        setUserTypeDialogOpen(true);
    }

    async function requestPrintIds(orientation: PrintOrientation) {
        if (selectedParticipantsPrintable.length === 0) {
            toast.error('Select at least one NON-CHED participant to print.');
            return;
        }

        setPrintOrientation(orientation);

        await ensureQrForParticipants(selectedParticipantsPrintable);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => window.print());
        });
    }



    function toggleParticipantSelect(id: number, checked: boolean) {
        setSelectedParticipantIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }

    function toggleSelectAll(checked: boolean) {
        setSelectedParticipantIds((prev) => {
            const next = new Set(prev);
            selectableVisibleParticipants.forEach((p) => {
                if (checked) next.add(p.id);
                else next.delete(p.id);
            });
            return next;
        });
    }

    const breadcrumbItems = React.useMemo(() => breadcrumbs, []);

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Participant" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#00359c]" />
                                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                    Participant Management
                                </h1>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Manage participants, ASEAN countries, and user types.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {activeTab === 'participants' ? (
                                <Button onClick={openAddParticipant} className={cn('w-full sm:w-auto', PRIMARY_BTN)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Participant
                                </Button>
                            ) : activeTab === 'countries' ? (
                                <Button onClick={openAddCountry} className={cn('w-full sm:w-auto', PRIMARY_BTN)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Country
                                </Button>
                            ) : (
                                <Button onClick={openAddUserType} className={cn('w-full sm:w-auto', PRIMARY_BTN)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User Type
                                </Button>
                            )}
                        </div>
                    </div>

                    <Separator className="bg-slate-200/70 dark:bg-slate-800" />
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
                        <TabsTrigger value="participants">Participants</TabsTrigger>
                        <TabsTrigger value="countries">Countries</TabsTrigger>
                        <TabsTrigger value="userTypes">User Types</TabsTrigger>
                    </TabsList>

                    {/* -------------------- Participants -------------------- */}
                    <TabsContent value="participants" className="mt-4">
                        <Card className="border-slate-200/70 dark:border-slate-800">
                            <CardHeader className="space-y-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <CardTitle className="text-base">Participants</CardTitle>
                                        <CardDescription></CardDescription>
                                    </div>

                                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:justify-end">
                                        <div className="relative w-full lg:w-[320px]">
                                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                value={participantQuery}
                                                onChange={(e) => setParticipantQuery(e.target.value)}
                                                placeholder="Search name, email, country, type..."
                                                className="pl-9"
                                            />
                                        </div>

                                        <Select value={participantCountryFilter} onValueChange={setParticipantCountryFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder="Country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Countries</SelectItem>
                                                {countries.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="grid size-5 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                                <FlagImage
                                                                    code={c.code}
                                                                    name={c.name}
                                                                    preferredSrc={c.flag_url}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                            <span>{c.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={participantTypeFilter} onValueChange={setParticipantTypeFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder="User Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {userTypes.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={participantStatusFilter} onValueChange={(v) => setParticipantStatusFilter(v as any)}>
                                            <SelectTrigger className="w-full sm:w-[160px]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                                    <div>{selectedParticipantsPrintable.length} selected for ID printing</div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => requestPrintIds('portrait')}
                                            disabled={selectedParticipantsPrintable.length === 0}
                                            className={cn(
                                                'rounded-xl',
                                                'bg-sky-600 text-white hover:bg-sky-700',
                                                'focus-visible:ring-sky-600/30',
                                                'disabled:bg-sky-600/40 disabled:text-white/70 disabled:hover:bg-sky-600/40',
                                            )}
                                        >
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print IDs (Portrait)
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => requestPrintIds('landscape')}
                                            disabled={selectedParticipantsPrintable.length === 0}
                                            className={cn(
                                                'rounded-xl',
                                                'bg-emerald-600 text-white hover:bg-emerald-700',
                                                'focus-visible:ring-emerald-600/30',
                                                'disabled:bg-emerald-600/40 disabled:text-white/70 disabled:hover:bg-emerald-600/40',
                                            )}
                                        >
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print IDs (Landscape)
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {filteredParticipants.length === 0 ? (
                                    <EmptyState
                                        icon={<Users className="h-5 w-5" />}
                                        title="No participants found"
                                        subtitle="Try adjusting your search or filters, or add a new participant."
                                    />
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                                    <TableHead className="w-[220px]">Country</TableHead>
                                                    <TableHead className="w-[240px]">Name</TableHead>
                                                    <TableHead className="w-[240px]">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={allVisibleSelected}
                                                                onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                                                                aria-label="Select all participants"
                                                            />
                                                            <span>Participant ID (QR)</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead className="w-[200px]">User Type</TableHead>
                                                    <TableHead className="w-[140px]">Status</TableHead>
                                                    <TableHead className="w-[140px]">Created</TableHead>
                                                    <TableHead className="w-[80px] text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredParticipants.map((p) => {
                                                    const isChed = isChedParticipant(p);

                                                    return (
                                                        <TableRow
                                                            key={p.id}
                                                            className={cn(
                                                                'transition-colors',
                                                                isChed
                                                                    ? 'bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-950/30 dark:hover:bg-blue-950/40'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/40',
                                                            )}
                                                        >
                                                            <TableCell className="text-slate-700 dark:text-slate-300">
                                                                {p.country ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <FlagThumb country={p.country} size={18} />
                                                                        <span className="truncate">{p.country.name}</span>
                                                                    </div>
                                                                ) : (
                                                                    '—'
                                                                )}
                                                            </TableCell>

                                                            <TableCell
                                                                className={cn(
                                                                    'font-medium text-slate-900 dark:text-slate-100',
                                                                    isChed && 'text-blue-900 dark:text-blue-100',
                                                                )}
                                                            >
                                                                {p.full_name}
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Checkbox
                                                                        checked={!isChed && selectedParticipantIds.has(p.id)}
                                                                        disabled={isChed}
                                                                        onCheckedChange={(checked) => {
                                                                            if (isChed) return;
                                                                            toggleParticipantSelect(p.id, !!checked);
                                                                        }}
                                                                        aria-label={isChed ? 'CHED user type excluded from printing' : `Select ${p.full_name}`}
                                                                    />

                                                                    <div>
                                                                        <div className="text-xs text-slate-500">{isChed ? '(N/A - CHED)' : 'Participant ID'}</div>

                                                                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                                            {isChed ? '' : p.display_id ?? '—'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-slate-700 dark:text-slate-300">{p.email}</TableCell>
                                                            <TableCell className="text-slate-700 dark:text-slate-300">{p.user_type?.name ?? '—'}</TableCell>

                                                            <TableCell>
                                                                <StatusBadge active={p.is_active} />
                                                            </TableCell>

                                                            <TableCell className="text-slate-700 dark:text-slate-300">{formatDateSafe(p.created_at)}</TableCell>

                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="rounded-full">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-44">
                                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                        <DropdownMenuItem onClick={() => openEditParticipant(p)}>
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        {!isChed ? (
                                                                            <DropdownMenuItem onClick={() => openProgrammeManager(p)}>
                                                                                <CalendarDays className="mr-2 h-4 w-4" />
                                                                                Joined events
                                                                            </DropdownMenuItem>
                                                                        ) : null}
                                                                        <DropdownMenuItem onClick={() => toggleParticipantActive(p)}>
                                                                            <BadgeCheck className="mr-2 h-4 w-4" />
                                                                            {p.is_active ? 'Set Inactive' : 'Set Active'}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => resetParticipantPassword(p)}>
                                                                            <KeyRound className="mr-2 h-4 w-4" />
                                                                            Reset password
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="text-red-600 focus:text-red-600"
                                                                            onClick={() => requestDelete('participant', p.id, p.full_name)}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* -------------------- Countries -------------------- */}
                    <TabsContent value="countries" className="mt-4">
                        <Card className="border-slate-200/70 dark:border-slate-800">
                            <CardHeader className="space-y-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Globe2 className="h-4 w-4 text-[#00359c]" />
                                            ASEAN Countries
                                        </CardTitle>
                                        <CardDescription>Manage country list and upload flag image per country.</CardDescription>
                                    </div>

                                    <div className="relative w-full sm:w-[320px]">
                                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            value={countryQuery}
                                            onChange={(e) => setCountryQuery(e.target.value)}
                                            placeholder="Search country or code..."
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <Separator />
                            </CardHeader>

                            <CardContent>
                                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                                <TableHead>Country</TableHead>
                                                <TableHead className="w-[160px]">Status</TableHead>
                                                <TableHead className="w-[80px] text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCountries.map((c) => (
                                                <TableRow key={c.id}>
                                                    <TableCell>
                                                        <FlagCell country={c} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge active={c.is_active} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="rounded-full">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => openEditCountry(c)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toggleCountryActive(c)}>
                                                                    <BadgeCheck className="mr-2 h-4 w-4" />
                                                                    {c.is_active ? 'Set Inactive' : 'Set Active'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => requestDelete('country', c.id, c.name)}
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* -------------------- User Types -------------------- */}
                    <TabsContent value="userTypes" className="mt-4">
                        <Card className="border-slate-200/70 dark:border-slate-800">
                            <CardHeader className="space-y-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="text-base">User Types</CardTitle>
                                        <CardDescription>Prime Minister, Staff, CHED (and more if needed).</CardDescription>
                                    </div>

                                    <div className="relative w-full sm:w-[320px]">
                                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            value={userTypeQuery}
                                            onChange={(e) => setUserTypeQuery(e.target.value)}
                                            placeholder="Search user type..."
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <Separator />
                            </CardHeader>

                            <CardContent>
                                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                                <TableHead>User Type</TableHead>
                                                <TableHead className="w-[160px]">Status</TableHead>
                                                <TableHead className="w-[80px] text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUserTypes.map((u) => {
                                                const isAdmin = isAdminUserType(u);

                                                return (
                                                    <TableRow key={u.id}>
                                                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">{u.name}</TableCell>
                                                        <TableCell>
                                                            <StatusBadge active={u.is_active} />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        disabled={isAdmin}
                                                                        onClick={() => {
                                                                            if (isAdmin) return;
                                                                            openEditUserType(u);
                                                                        }}
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        disabled={isAdmin}
                                                                        onClick={() => {
                                                                            if (isAdmin) return;
                                                                            toggleUserTypeActive(u);
                                                                        }}
                                                                    >
                                                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                                                        {u.is_active ? 'Set Inactive' : 'Set Active'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        disabled={isAdmin}
                                                                        onClick={() => {
                                                                            if (isAdmin) return;
                                                                            requestDelete('userType', u.id, u.name);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* -------------------- Participant Events Dialog -------------------- */}
            <Dialog
                open={programmeDialogOpen}
                onOpenChange={(open) => {
                    setProgrammeDialogOpen(open);
                    if (!open) setProgrammeParticipant(null);
                }}
            >
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[900px]">
                    <DialogHeader className="space-y-1">
                        <DialogTitle>Participant joined events</DialogTitle>
                        <DialogDescription>Review and update the events this participant has joined.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-1">
                        {programmeParticipant ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            {programmeParticipant.country ? (
                                                <FlagThumb country={programmeParticipant.country} size={36} eager />
                                            ) : (
                                                <div className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                                    —
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {programmeParticipant.full_name}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                    {programmeParticipant.email} • {programmeParticipant.user_type?.name ?? '—'}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {programmeParticipant.country?.name ?? 'Country unavailable'}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="rounded-full bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                            {(programmeParticipant.joined_programme_ids ?? []).length} joined
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Use the buttons below to add or remove events from this participant.
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Events</div>
                                    <div className="relative w-full sm:w-[320px]">
                                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            value={programmeQuery}
                                            onChange={(e) => setProgrammeQuery(e.target.value)}
                                            placeholder="Search events..."
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                {normalizedProgrammes.length === 0 ? (
                                    <EmptyState
                                        icon={<CalendarDays className="h-5 w-5" />}
                                        title="No events yet"
                                        subtitle="Create events first so you can assign participants."
                                    />
                                ) : filteredProgrammes.length === 0 ? (
                                    <EmptyState
                                        icon={<Search className="h-5 w-5" />}
                                        title="No matching events"
                                        subtitle="Try adjusting the search term to find an event."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {filteredProgrammes.map((event) => {
                                                const joinedIds = programmeParticipant.joined_programme_ids ?? [];
                                                const checkedInEntries = programmeParticipant.checked_in_programmes ?? [];
                                                const checkedInIds =
                                                    programmeParticipant.checked_in_programme_ids ??
                                                    checkedInEntries.map((entry) => entry.programme_id);
                                                const checkedInEntry = checkedInEntries.find((entry) => entry.programme_id === event.id);
                                                const isJoined = joinedIds.includes(event.id);
                                                const isCheckedIn = checkedInIds.includes(event.id);
                                                const isClosed = event.phase === 'closed';
                                                const isAddDisabled = isClosed && !isJoined;

                                                return (
                                                    <Card key={event.id} className="border-slate-200/70 dark:border-slate-800">
                                                        <div className="flex h-full flex-col gap-3 p-3">
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        {event.tag ? (
                                                                            <Badge className="border-transparent bg-slate-900/80 text-[10px] text-white">
                                                                                {event.tag}
                                                                            </Badge>
                                                                        ) : null}

                                                                        <Badge className={cn('border text-[10px]', phaseBadgeClass(event.phase))}>
                                                                            {phaseLabel(event.phase)}
                                                                        </Badge>
                                                                    </div>

                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant={isJoined ? 'outline' : 'default'}
                                                                        className={cn(
                                                                            'ml-auto h-8 rounded-xl px-3 text-[11px]',
                                                                            isJoined
                                                                                ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:hover:bg-red-500/10'
                                                                                : PRIMARY_BTN,
                                                                        )}
                                                                        disabled={isAddDisabled}
                                                                        title={isAddDisabled ? 'Closed events cannot be added.' : undefined}
                                                                        onClick={() => toggleProgrammeJoin(programmeParticipant, event.id, isJoined)}
                                                                    >
                                                                        {isJoined ? 'Remove Event' : 'Add to list'}
                                                                    </Button>
                                                                </div>

                                                                <div>
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                        {event.title}
                                                                    </div>
                                                                    <div className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                                        {event.description}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                                                    <div className="flex items-center gap-2">
                                                                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                                                        <span>{formatEventWindow(event.startsAt, event.endsAt)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                                        <span>{event.location?.trim() || 'Location to be announced'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-auto flex items-center justify-between gap-2">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <Badge
                                                                        className={cn(
                                                                            'rounded-full border border-transparent px-2.5 py-1 text-[11px]',
                                                                            isJoined
                                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                                                                        )}
                                                                    >
                                                                        {isJoined ? 'Joined' : 'Not joined'}
                                                                    </Badge>
                                                                    {isCheckedIn ? (
                                                                        <>
                                                                            <Badge className="rounded-full border border-transparent bg-blue-100 px-2.5 py-1 text-[11px] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                                                                                Checked in
                                                                            </Badge>
                                                                            {checkedInEntry?.scanned_at ? (
                                                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                                    Scanned {formatDateTimeSafe(checkedInEntry.scanned_at)}
                                                                                </span>
                                                                            ) : null}
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-7 rounded-full border-red-200 px-2.5 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-500/40 dark:hover:bg-red-500/10"
                                                                                onClick={() => revertProgrammeAttendance(programmeParticipant, event.id)}
                                                                            >
                                                                                Revert
                                                                            </Button>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setProgrammeDialogOpen(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* -------------------- Participant Dialog -------------------- */}
            <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>{editingParticipant ? 'Edit Participant' : 'Add Participant'}</DialogTitle>
                        <DialogDescription>Fill out the participant details below.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitParticipant} className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <div className="text-sm font-medium">Full name</div>
                                <Input
                                    value={participantForm.data.full_name}
                                    onChange={(e) => participantForm.setData('full_name', e.target.value)}
                                    placeholder="e.g. Juan Dela Cruz"
                                />
                                {participantForm.errors.full_name ? (
                                    <div className="text-xs text-red-600">{participantForm.errors.full_name}</div>
                                ) : null}
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <div className="text-sm font-medium">Email</div>
                                <Input
                                    value={participantForm.data.email}
                                    onChange={(e) => participantForm.setData('email', e.target.value)}
                                    placeholder="e.g. juan@example.com"
                                />
                                {!editingParticipant ? (
                                    <div className="text-xs text-slate-500">
                                        We will send the welcome email with the participant QR badge after you create the record.
                                    </div>
                                ) : null}
                                {participantForm.errors.email ? <div className="text-xs text-red-600">{participantForm.errors.email}</div> : null}
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <div className="text-sm font-medium">Contact number</div>
                                <Input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={participantForm.data.contact_number}
                                    onChange={(e) => participantForm.setData('contact_number', e.target.value)}
                                    onInput={(event) => {
                                        event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, '');
                                    }}
                                    placeholder="e.g. 639123456789"
                                />
                                {participantForm.errors.contact_number ? (
                                    <div className="text-xs text-red-600">{participantForm.errors.contact_number}</div>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <div className="text-sm font-medium">Country</div>
                                <Select value={participantForm.data.country_id} onValueChange={(v) => participantForm.setData('country_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries
                                            .filter((c) => c.is_active)
                                            .map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <FlagThumb country={c} size={18} />
                                                        <span>{c.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {participantForm.errors.country_id ? <div className="text-xs text-red-600">{participantForm.errors.country_id}</div> : null}
                            </div>

                            <div className="space-y-1.5">
                                <div className="text-sm font-medium">User type</div>
                                <Select value={participantForm.data.user_type_id} onValueChange={(v) => participantForm.setData('user_type_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userTypes
                                            .filter((u) => u.is_active)
                                            .map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {participantForm.errors.user_type_id ? <div className="text-xs text-red-600">{participantForm.errors.user_type_id}</div> : null}
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 sm:col-span-2 dark:border-slate-800">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium">Active</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Inactive users will not appear in active selection lists.
                                    </div>
                                </div>
                                <Switch checked={participantForm.data.is_active} onCheckedChange={(v) => participantForm.setData('is_active', !!v)} />
                            </div>

                            {editingParticipant ? (
                                <div className="rounded-xl border border-slate-200 px-3 py-3 sm:col-span-2 dark:border-slate-800">
                                    <div className="text-sm font-medium">Consents</div>
                                    <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Contact Information Sharing</span>
                                            <Badge
                                                className={cn(
                                                    'rounded-full border border-transparent px-2.5 py-1 text-[11px]',
                                                    editingParticipant.consent_contact_sharing
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                                                )}
                                            >
                                                {editingParticipant.consent_contact_sharing ? 'Consented' : 'Not consented'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Photo and Videos Consent</span>
                                            <Badge
                                                className={cn(
                                                    'rounded-full border border-transparent px-2.5 py-1 text-[11px]',
                                                    editingParticipant.consent_photo_video
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                                                )}
                                            >
                                                {editingParticipant.consent_photo_video ? 'Consented' : 'Not consented'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setParticipantDialogOpen(false)} disabled={participantForm.processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={participantForm.processing} className={PRIMARY_BTN}>
                                {editingParticipant ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* -------------------- Country Dialog (flag upload) -------------------- */}
            <Dialog open={countryDialogOpen} onOpenChange={setCountryDialogOpen}>
                <DialogContent className="sm:max-w-[640px]">
                    <DialogHeader>
                        <DialogTitle>{editingCountry ? 'Edit Country' : 'Add Country'}</DialogTitle>
                        <DialogDescription>ASEAN country record (code + name) with optional flag image.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCountry} className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium">Code</div>
                                <Input
                                    value={countryForm.data.code}
                                    onChange={(e) => countryForm.setData('code', e.target.value)}
                                    placeholder="e.g. PH"
                                    maxLength={4}
                                />
                                {countryForm.errors.code ? <div className="text-xs text-red-600">{countryForm.errors.code}</div> : null}
                            </div>

                            <div className="space-y-1.5">
                                <div className="text-sm font-medium">Country name</div>
                                <Input
                                    value={countryForm.data.name}
                                    onChange={(e) => countryForm.setData('name', e.target.value)}
                                    placeholder="e.g. Philippines"
                                />
                                {countryForm.errors.name ? <div className="text-xs text-red-600">{countryForm.errors.name}</div> : null}
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Flag image</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">PNG/JPG • recommended 512×512</div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="grid h-14 w-full place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-[140px] dark:border-slate-800 dark:bg-slate-950">
                                        {countryFlagPreview ? (
                                            <img src={countryFlagPreview} alt="Flag preview" className="h-full w-full object-cover" draggable={false} />
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <ImageUp className="h-4 w-4" />
                                                No flag
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full space-y-1.5">
                                        <Input type="file" accept="image/*" onChange={handleCountryFlagChange} />
                                        {(countryForm.errors as any).flag ? (
                                            <div className="text-xs text-red-600">{(countryForm.errors as any).flag}</div>
                                        ) : null}
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            Uploading a new file will replace the current flag.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setCountryDialogOpen(false)} disabled={countryForm.processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={countryForm.processing} className={PRIMARY_BTN}>
                                {editingCountry ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* -------------------- User Type Dialog -------------------- */}
            <Dialog open={userTypeDialogOpen} onOpenChange={setUserTypeDialogOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>{editingUserType ? 'Edit User Type' : 'Add User Type'}</DialogTitle>
                        <DialogDescription>Example: Prime Minister, Staff, CHED.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitUserType} className="space-y-4">
                        <div className="grid gap-3">
                            <div className="space-y-1.5">
                                <div className="text-sm font-medium">Name</div>
                                <Input
                                    value={userTypeForm.data.name}
                                    onChange={(e) => userTypeForm.setData('name', e.target.value)}
                                    placeholder="e.g. Staff"
                                />
                                {userTypeForm.errors.name ? <div className="text-xs text-red-600">{userTypeForm.errors.name}</div> : null}
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-800">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium">Active</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Inactive types will not be selectable in participant forms.
                                    </div>
                                </div>
                                <Switch checked={userTypeForm.data.is_active} onCheckedChange={(v) => userTypeForm.setData('is_active', !!v)} />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setUserTypeDialogOpen(false)} disabled={userTypeForm.processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={userTypeForm.processing} className={PRIMARY_BTN}>
                                {editingUserType ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* -------------------- Delete Confirm -------------------- */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteTarget?.label ?? 'this item'}</span>. This action cannot be undone.
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

            {printMounted
                ? createPortal(
                    <div id="participant-print-root" data-orientation={printOrientation} className="hidden print:block">
                        <style>{`
                  @media print {
                      @page { size: ${printOrientation === 'landscape' ? '297mm 210mm' : '210mm 297mm'}; margin: 0; }
                      html, body { margin: 0 !important; padding: 0 !important; height: auto !important; background: #fff !important; }
                      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

                      body > * { display: none !important; }
                      #participant-print-root { display: block !important; }

                      .print-page { box-sizing: border-box; padding: 0.25in; page-break-after: always; break-after: page; }
                      .print-page:last-of-type { page-break-after: auto; break-after: auto; }

                      .print-grid {
                          display: grid;
                          gap: ${printOrientation === 'landscape' ? '0.12in' : '0.1in'};
                          align-content: start;
                          justify-content: start;
                          grid-template-columns: repeat(${printOrientation === 'landscape' ? 3 : 2}, ${printOrientation === 'landscape' ? '3.37in' : '3.46in'});
                          grid-auto-rows: ${printOrientation === 'landscape' ? '2.125in' : '5.51in'};
                          max-width: ${printOrientation === 'landscape' ? '10.35in' : '7.04in'};
                      }

                      .id-print-card { break-inside: avoid; page-break-inside: avoid; box-sizing: border-box; box-shadow: none !important; }

                      /* ✅ EXTRA PRINT SAFETY (prevents missing layers) */
                      .id-print-card { isolation: isolate; }

                      #participant-print-root[data-orientation="portrait"] .id-print-card-inner {
                          width: 100% !important;
                          height: 100% !important;
                          aspect-ratio: auto !important;
                          transform: none !important;
                          position: relative !important;
                          left: auto !important;
                          top: auto !important;
                      }
                  }
              `}</style>

                        {chunk(selectedParticipantsPrintable, printOrientation === 'landscape' ? 9 : 4).map((page, pageIndex) => (
                            <div key={pageIndex} className="print-page">
                                <div className="print-grid">
                                    {page.map((p) => (
                                        <ParticipantIdPrintCard
                                            key={p.id}
                                            participant={p}
                                            qrDataUrl={qrDataUrls[p.id]}
                                            orientation={printOrientation}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>,
                    document.body,
                )
                : null}

        </AppLayout>
    );
}
