import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

import {
    ScanLine,
    Camera,
    RefreshCcw,
    CircleCheckBig,
    CircleX,
    UserRound,
    Mail,
    MapPin,
    ShieldCheck,
    CalendarDays,
    ExternalLink,
    Keyboard,
    ChevronsUpDown,
    Check,
} from 'lucide-react';

import { BrowserQRCodeReader } from '@zxing/browser';

type EventRow = {
    id: number;
    title: string;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active?: boolean;
    phase?: 'ongoing' | 'upcoming' | 'closed';
};

type ParticipantInfo = {
    id: number;
    full_name: string;
    email?: string | null;
    country?: string | null;
    country_flag_url?: string | null;
    user_type?: string | null;
    is_verified?: boolean;
};

type ScanResponse = {
    ok: boolean;
    message: string;

    participant?: ParticipantInfo | null;
    registered_events?: Array<{ id: number; title: string; starts_at?: string | null }>;
    checked_in_event?: { id: number; title: string } | null;
    already_checked_in?: boolean;
    scanned_at?: string | null;
};

type PageProps = {
    events?: EventRow[];
    default_event_id?: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Scanner', href: '/scanner' }];

const PRIMARY_BTN =
    'bg-[#00359c] text-white hover:bg-[#00359c]/90 focus-visible:ring-[#00359c]/30 dark:bg-[#00359c] dark:hover:bg-[#00359c]/90';

const ENDPOINTS = {
    scan: '/scanner/scan',
};

function getCsrfToken() {
    const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (el?.content) return el.content;
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    if (!match) return '';
    return decodeURIComponent(match[1]);
}

function fmtDate(dateStr?: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
}

function fmtDateTime(dateStr?: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(d);
}

function resolveEventPhase(event: EventRow, now: number) {
    if (event.phase) return event.phase;
    if (event.is_active === false) return 'closed';

    const start = event.starts_at ?? event.ends_at;
    if (!start) return 'ongoing';

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return 'ongoing';

    const nowDate = new Date(now);
    if (nowDate.getTime() < startDate.getTime()) return 'upcoming';

    const sameDay =
        nowDate.getFullYear() === startDate.getFullYear() &&
        nowDate.getMonth() === startDate.getMonth() &&
        nowDate.getDate() === startDate.getDate();

    return sameDay ? 'ongoing' : 'closed';
}

function phaseLabel(phase?: EventRow['phase']) {
    switch (phase) {
        case 'ongoing':
            return 'Ongoing';
        case 'upcoming':
            return 'Upcoming';
        default:
            return 'Closed';
    }
}

function phaseBadgeClass(phase?: EventRow['phase']) {
    switch (phase) {
        case 'ongoing':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'upcoming':
            return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600/30 dark:bg-slate-800/30 dark:text-slate-300';
    }
}

function isNotFoundZXingError(err: unknown) {
    // ZXing uses name "NotFoundException" when no QR is detected in frame (normal)
    return !!err && typeof err === 'object' && 'name' in err && (err as any).name === 'NotFoundException';
}

function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'success' | 'danger' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                tone === 'success' &&
                'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                tone === 'danger' && 'bg-red-600/10 text-red-700 dark:bg-red-500/15 dark:text-red-300',
                tone === 'default' && 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
            )}
        >
            {children}
        </span>
    );
}

export default function Scanner(props: PageProps) {
    const events = props.events ?? [];
    const defaultEventId = props.default_event_id ? String(props.default_event_id) : '';
    const [selectedEventId, setSelectedEventId] = React.useState<string>(defaultEventId);
    const [eventOpen, setEventOpen] = React.useState(false);
    const [isScanning, setIsScanning] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');

    const [devices, setDevices] = React.useState<Array<{ deviceId: string; label: string }>>([]);
    const [deviceId, setDeviceId] = React.useState<string>('');
    const [cameraError, setCameraError] = React.useState<string | null>(null);

    const [lastCode, setLastCode] = React.useState<string>('');
    const [manualCode, setManualCode] = React.useState('');
    const [showManual, setShowManual] = React.useState(false);

    const [result, setResult] = React.useState<ScanResponse | null>(null);

    const nowTs = Date.now();

    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const readerRef = React.useRef<BrowserQRCodeReader | null>(null);
    const controlsRef = React.useRef<{ stop: () => void } | null>(null);
    const lockRef = React.useRef(false);
    const isScanningRef = React.useRef(false);

    React.useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const list = await BrowserQRCodeReader.listVideoInputDevices();
                if (!mounted) return;

                const mapped = list.map((d, idx) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Camera ${idx + 1}`,
                }));
                setDevices(mapped);

                const preferred =
                    mapped.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ?? mapped[0]?.deviceId ?? '';
                setDeviceId(preferred);
            } catch {
                // user may grant permission later
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    React.useEffect(() => {
        return () => stopScan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function vibrateSuccess() {
        if (navigator.vibrate) navigator.vibrate([40, 40, 90]);
    }

    function vibrateError() {
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    }

    function hardStopVideoStream() {
        const video = videoRef.current;
        if (!video) return;

        const stream = video.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
    }

    function ensureEventSelected() {
        if (!selectedEventId) {
            setResult({ ok: false, message: 'Please select an event before scanning.' });
            setStatus('error');
            return false;
        }
        return true;
    }

    async function startScan() {
        if (!ensureEventSelected()) return;
        if (!videoRef.current) return;

        setCameraError(null);
        setResult(null);
        setLastCode('');
        setStatus('scanning');
        setIsScanning(true);
        isScanningRef.current = true;
        lockRef.current = false;

        try {
            stopScan();

            const reader = new BrowserQRCodeReader(undefined, {
                delayBetweenScanAttempts: 120,
                delayBetweenScanSuccess: 600,
            });

            readerRef.current = reader;

            const controls = await reader.decodeFromVideoDevice(
                deviceId || undefined,
                videoRef.current,
                async (scanResult, err) => {
                    if (scanResult) {
                        const text = scanResult.getText?.() ?? String(scanResult);
                        if (!text) return;

                        if (lockRef.current) return;
                        lockRef.current = true;

                        setLastCode(text);
                        stopScan();
                        await verifyCode(text);

                        lockRef.current = false;
                        return;
                    }

                    // ✅ ignore normal "not found" frames
                    if (err && !isNotFoundZXingError(err) && isScanningRef.current) {
                        setCameraError('Camera scanning error. Try again.');
                        setStatus('error');
                        setIsScanning(false);
                        isScanningRef.current = false;
                    }
                },
            );

            controlsRef.current = controls as any;
        } catch (e: any) {
            const msg =
                e?.name === 'NotAllowedError'
                    ? 'Camera permission denied. Please allow camera access.'
                    : e?.name === 'NotFoundError'
                        ? 'No camera found on this device.'
                        : 'Unable to start camera. Try again.';
            setCameraError(msg);
            setStatus('error');
            setIsScanning(false);
        }
    }

    function stopScan() {
        try {
            controlsRef.current?.stop?.();
        } catch {
            // ignore
        }
        controlsRef.current = null;

        // ✅ make sure stream is stopped (prevents stuck camera)
        hardStopVideoStream();

        readerRef.current = null;

        setIsScanning(false);
        isScanningRef.current = false;
        setStatus((s) => (s === 'scanning' ? 'idle' : s));
    }

    async function verifyCode(code: string) {
        if (!ensureEventSelected()) return;
        setStatus('verifying');
        setResult(null);

        try {
            const csrf = getCsrfToken();

            const payload: any = { code, event_id: Number(selectedEventId) };

            const res = await fetch(ENDPOINTS.scan, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = (await res.json()) as ScanResponse;

            setResult(data);
            setStatus(data.ok ? 'success' : 'error');

            if (data.ok) vibrateSuccess();
            else vibrateError();
        } catch {
            setResult({ ok: false, message: 'Network/server error. Please try again.' });
            setStatus('error');
            vibrateError();
        }
    }

    function scanAgain() {
        setResult(null);
        setLastCode('');
        setStatus('idle');
        startScan();
    }

    const selectedEvent = selectedEventId ? events.find((e) => String(e.id) === selectedEventId) : null;
    const selectedEventPhase = selectedEvent ? resolveEventPhase(selectedEvent, nowTs) : undefined;
    const filteredEvents = React.useMemo(() => {
        return events.map((event) => ({
            ...event,
            phase: resolveEventPhase(event, nowTs),
        }));
    }, [events, nowTs]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scanner" />

            <div className="mx-auto flex h-full w-full max-w-md flex-1 flex-col overflow-hidden rounded-xl bg-white p-0 dark:bg-slate-950">
                <div className="relative px-4 pb-3 pt-4">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#00359c]/10 via-transparent to-transparent dark:from-[#00359c]/15"
                    />

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                QR Scanner
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Scan participant QR to verify attendance.
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Pill tone={status === 'success' ? 'success' : status === 'error' ? 'danger' : 'default'}>
                                {status === 'verifying'
                                    ? 'Verifying...'
                                    : status === 'scanning'
                                        ? 'Scanning'
                                        : status === 'success'
                                            ? 'Verified'
                                            : status === 'error'
                                                ? 'Rejected'
                                                : 'Ready'}
                            </Pill>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Event (required)</div>
                        <Popover open={eventOpen} onOpenChange={setEventOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={eventOpen}
                                    className="h-11 w-full justify-between rounded-2xl"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        {selectedEvent ? (
                                            <>
                                                <span className="truncate">{selectedEvent.title}</span>
                                                {selectedEventPhase ? (
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                                            phaseBadgeClass(selectedEventPhase),
                                                        )}
                                                    >
                                                        {phaseLabel(selectedEventPhase)}
                                                    </span>
                                                ) : null}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">Select event…</span>
                                        )}
                                    </span>
                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search event…" />
                                    <CommandEmpty>No event found.</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                            {filteredEvents.map((event) => (
                                                <CommandItem
                                                    key={event.id}
                                                    value={event.title}
                                                    onSelect={() => {
                                                        setSelectedEventId(String(event.id));
                                                        setEventOpen(false);
                                                        setResult(null);
                                                        setStatus('idle');
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <span className="truncate">{event.title}</span>
                                                    {event.phase ? (
                                                        <span
                                                            className={cn(
                                                                'ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                                                phaseBadgeClass(event.phase),
                                                            )}
                                                        >
                                                            {phaseLabel(event.phase)}
                                                        </span>
                                                    ) : null}
                                                    <Check
                                                        className={cn(
                                                            'ml-2 h-4 w-4',
                                                            selectedEventId === String(event.id) ? 'opacity-100' : 'opacity-0',
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {selectedEvent ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <CalendarDays className="h-4 w-4" />
                                <span>{fmtDate(selectedEvent.starts_at) ?? '—'}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                <Separator />

                <div className="relative flex-1 px-4 py-4">
                    <div
                        className={cn(
                            'relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900/30',
                            'aspect-[3/4] w-full',
                        )}
                    >
                        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,rgba(255,255,255,0.10),transparent_55%)]" />
                            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />

                            <div className="absolute left-6 top-6 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white/80" />
                            <div className="absolute right-6 top-6 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white/80" />
                            <div className="absolute left-6 bottom-6 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white/80" />
                            <div className="absolute right-6 bottom-6 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white/80" />

                            {isScanning ? (
                                <div className="absolute inset-x-6 top-10">
                                    <div className="h-px w-full animate-[scanline_1.8s_ease-in-out_infinite] bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
                                </div>
                            ) : null}
                        </div>

                        {!isScanning && status !== 'verifying' ? (
                            <div className="absolute inset-0 grid place-items-center p-6 text-center">
                                <div className="rounded-3xl bg-black/35 px-5 py-4 text-white backdrop-blur">
                                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/15">
                                        <ScanLine className="h-6 w-6" />
                                    </div>
                                    <div className="mt-2 text-sm font-semibold">Align QR inside the frame</div>
                                    <div className="mt-1 text-xs text-white/80">Tap “Start Scanning” to open camera</div>
                                </div>
                            </div>
                        ) : null}

                        {cameraError ? (
                            <div className="absolute inset-0 grid place-items-center p-6 text-center">
                                <div className="rounded-3xl bg-black/45 px-5 py-4 text-white backdrop-blur">
                                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/15">
                                        <CircleX className="h-6 w-6" />
                                    </div>
                                    <div className="mt-2 text-sm font-semibold">Camera Error</div>
                                    <div className="mt-1 text-xs text-white/80">{cameraError}</div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 grid gap-2">
                        {devices.length > 1 ? (
                            <Select value={deviceId} onValueChange={setDeviceId}>
                                <SelectTrigger className="h-11 rounded-2xl">
                                    <SelectValue placeholder="Select camera" />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.map((d) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2">
                            {!isScanning ? (
                                <Button onClick={startScan} className={cn('h-11 rounded-2xl', PRIMARY_BTN)}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Start Scanning
                                </Button>
                            ) : (
                                <Button onClick={stopScan} variant="secondary" className="h-11 rounded-2xl">
                                    Stop
                                </Button>
                            )}

                            <Button
                                onClick={() => setShowManual((v) => !v)}
                                variant="outline"
                                className="h-11 rounded-2xl"
                            >
                                <Keyboard className="mr-2 h-4 w-4" />
                                Manual
                            </Button>
                        </div>

                        {showManual ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Enter Participant ID</div>
                                <div className="mt-2 flex gap-2">
                                    <Input
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="Paste code here..."
                                        className="h-11 rounded-2xl"
                                    />
                                    <Button
                                        onClick={() => manualCode.trim() && verifyCode(manualCode.trim())}
                                        className={cn('h-11 rounded-2xl', PRIMARY_BTN)}
                                    >
                                        Verify
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
                    {status === 'verifying' ? (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/30">
                            <div className="flex items-center gap-3">
                                <div className="grid size-10 place-items-center rounded-2xl bg-[#00359c]/10 text-[#00359c] dark:bg-[#00359c]/15">
                                    <RefreshCcw className="h-5 w-5 animate-spin" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Verifying…</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Checking participant & registration.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : result ? (
                        <div
                            className={cn(
                                'rounded-3xl border p-4',
                                result.ok
                                    ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                    : 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20',
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'grid size-11 place-items-center rounded-2xl',
                                            result.ok
                                                ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                : 'bg-red-600/10 text-red-700 dark:bg-red-500/15 dark:text-red-300',
                                        )}
                                    >
                                        {result.ok ? (
                                            <CircleCheckBig className="h-6 w-6" />
                                        ) : (
                                            <CircleX className="h-6 w-6" />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {result.ok ? 'Verified' : 'Not Allowed'}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{result.message}</div>
                                        {result.already_checked_in && result.scanned_at ? (
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Scanned at: {fmtDateTime(result.scanned_at)}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {result.already_checked_in && (
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        Already checked in
                                    </span>
                                )}

                            </div>

                            {result.participant ? (
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <UserRound className="h-4 w-4 text-slate-500" />
                                                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {result.participant.full_name}
                                                </div>
                                            </div>

                                            <div className="mt-2 grid gap-1 text-xs text-slate-600 dark:text-slate-400">
                                                {result.participant.email ? (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        <span className="truncate">{result.participant.email}</span>
                                                    </div>
                                                ) : null}

                                                {result.participant.country || result.participant.user_type ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        {result.participant.country_flag_url ? (
                                                            <img
                                                                src={result.participant.country_flag_url}
                                                                alt=""
                                                                className="h-4 w-4 rounded-sm object-cover"
                                                                loading="lazy"
                                                                draggable={false}
                                                            />
                                                        ) : null}
                                                        <span className="truncate">
                                                            {result.participant.country ?? '—'}
                                                            {result.participant.user_type ? ` • ${result.participant.user_type}` : ''}
                                                        </span>
                                                    </div>
                                                ) : null}

                                                {result.participant.is_verified ? (
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <Pill tone="success">Verified Participant</Pill>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        {result.checked_in_event ? (
                                            <div className="text-right">
                                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    Checked-in:
                                                </div>
                                                <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                    {result.checked_in_event.title}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            Registered Events
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {result.registered_events?.length ? (
                                                result.registered_events.map((e) => (
                                                    <span
                                                        key={e.id}
                                                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                                    >
                                                        <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                                        {e.title}
                                                        {e.starts_at ? (
                                                            <span className="text-[11px] font-medium text-slate-500">
                                                                • {fmtDate(e.starts_at)}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">No events found.</span>
                                            )}
                                        </div>

                                        {selectedEvent ? (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                                <ExternalLink className="h-4 w-4" />
                                                Checking in for:{' '}
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {selectedEvent.title}
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-center text-xs text-slate-500">Tip: Select an event then scan participant QR.</div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(0px); opacity: .7; }
                    50% { transform: translateY(280px); opacity: 1; }
                    100% { transform: translateY(0px); opacity: .7; }
                }
            `}</style>
        </AppLayout>
    );
}
