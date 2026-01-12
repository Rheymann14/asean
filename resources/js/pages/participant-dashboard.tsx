import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { toast } from 'sonner';
import QRCode from 'qrcode';
import {
    Copy,
    Download,
    Flag,
    Mail,
    Phone,
    QrCode as QrCodeIcon,
    Smartphone,
    IdCard,
    User2,

} from 'lucide-react';

type Country = {
    code: string;
    name: string;
    flag_url?: string | null;
};

type Participant = {
    display_id: string; // ✅ safe display ID (NOT user.id)
    qr_payload: string; // ✅ encrypted/opaque payload (NOT user.id)
    name: string;
    email: string;
    contact_number?: string | null;
    country?: Country | null;
};

type PageProps = {
    participant: Participant;
};

function getFlagSrc(country?: Country | null) {
    if (!country) return null;
    if (country.flag_url) return country.flag_url;

    const code = (country.code || '').toLowerCase().trim();
    if (!code) return null;

    return `/asean/${code}.png`;
}

function InfoRow({
    icon,
    label,
    value,
    right,
}: {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
    right?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                    {icon}
                </div>

                <div className="min-w-0">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {label}
                    </div>
                    <div className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {value ?? <span className="font-medium text-slate-500 dark:text-slate-400">—</span>}
                    </div>
                </div>
            </div>

            {right ? <div className="flex flex-none items-center gap-2">{right}</div> : null}
        </div>
    );
}

function IdCardPreview({
    participant,
    flagSrc,
    qrDataUrl,
    loading,
    orientation,
}: {
    participant: Participant;
    flagSrc: string | null;
    qrDataUrl: string | null;
    loading: boolean;
    orientation: 'portrait' | 'landscape';
}) {
    const isLandscape = orientation === 'landscape';

    // ✅ correct ID aspect ratios
    const aspect = isLandscape ? 'aspect-[3.37/2.125]' : 'aspect-[3.46/5.51]';

    // ✅ print sizes (keep accurate)
    const printSize = isLandscape
        ? 'print:w-[3.37in] print:h-[2.125in]'
        : 'print:w-[3.46in] print:h-[5.51in]';

    // ✅ screen preview sizing (THIS fixes “portrait too big”)
    const maxW = isLandscape ? 'max-w-[520px]' : 'max-w-[320px] sm:max-w-[360px]';

    const qrPanelWidth = isLandscape ? 'w-[150px]' : '';
    // ✅ reduce portrait QR size so the card height is less visually heavy
    const qrSize = isLandscape ? 108 : 160;

    // ✅ tighten padding + typography a bit
    const pad = isLandscape ? 'p-3' : 'p-4';
    const headerLogo = isLandscape ? 'h-8 w-8' : 'h-9 w-9';

    return (
        <div
            className={cn(
                'relative mx-auto w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950',
                maxW,
                aspect,
                'print:max-w-none',
                printSize,
            )}
        >
            {/* Background */}
            <div aria-hidden className="absolute inset-0">
                <img
                    src="/img/bg.png"
                    alt=""
                    className={cn(
                        'absolute inset-0 h-full w-full object-cover',
                        // ✅ slightly darker + higher contrast
                        'filter brightness-80 contrast-150 saturate-200',
                        // ✅ keep dark mode readable
                        'dark:brightness-80 dark:contrast-110',
                        // ✅ keep your original opacity behavior
                        isLandscape ? 'opacity-100 dark:opacity-35' : 'opacity-100 dark:opacity-30',
                    )}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                />

                {/* ✅ tiny dark veil for extra punch */}
                <div className="absolute inset-0 bg-black/10 dark:bg-black/15" />

                <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/20 to-white/55 dark:from-slate-950/55 dark:via-slate-950/28 dark:to-slate-950/55" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-slate-200/60 blur-3xl dark:bg-slate-800/60" />
            </div>


            <div className={cn('relative flex h-full flex-col', pad)}>
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <img
                            src="/img/asean_logo.png"
                            alt="ASEAN"
                            className={cn('object-contain drop-shadow-sm', headerLogo)}
                            draggable={false}
                            loading="lazy"
                        />
                        <img
                            src="/img/bagong_pilipinas.png"
                            alt="Bagong Pilipinas"
                            className={cn('object-contain drop-shadow-sm', headerLogo)}
                            draggable={false}
                            loading="lazy"
                        />

                        <div className="min-w-0">
                            <div
                                className={cn(
                                    'truncate font-semibold tracking-wide text-slate-700 dark:text-slate-200',
                                    isLandscape ? 'text-[11px]' : 'text-[11px]',
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
                        isLandscape ? 'grid grid-cols-[1fr_150px] items-start gap-3' : 'flex flex-col gap-3',
                    )}
                >
                    {/* LEFT INFO */}
                    <div className="min-w-0">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Participant
                        </div>

                        <div
                            className={cn(
                                'mt-0.5 break-words font-semibold tracking-tight text-slate-900 dark:text-slate-100',
                                isLandscape ? 'text-sm leading-4' : 'text-lg leading-6',
                                'line-clamp-2',
                            )}
                            title={participant.name}
                        >
                            {participant.name}
                        </div>

                        <div className={cn('flex items-center gap-2.5', isLandscape ? 'mt-2' : 'mt-2.5')}>
                            <div
                                className={cn(
                                    'overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950',
                                    isLandscape ? 'h-9 w-9' : 'h-9 w-9',
                                )}
                            >
                                {flagSrc ? (
                                    <img
                                        src={flagSrc}
                                        alt={participant.country?.name ?? 'Country flag'}
                                        className="h-full w-full object-cover"
                                        draggable={false}
                                        loading="lazy"
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
                                        isLandscape ? 'text-[12px]' : 'text-[12px]',
                                    )}
                                >
                                    {participant.country?.name ?? '—'}
                                </div>
                                {participant.country?.code ? (
                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {participant.country.code.toUpperCase()}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className={cn(isLandscape ? 'mt-2' : 'mt-3')}>
                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Participant ID
                            </div>

                            <div
                                className={cn(
                                    'mt-1 inline-flex max-w-full whitespace-normal break-words rounded-2xl border border-slate-200/70 bg-white/80 px-2.5 py-1.5 font-mono text-slate-900 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-100',
                                    isLandscape ? 'text-[10px] leading-4' : 'text-[11px] leading-4',
                                )}
                            >
                                {participant.display_id}
                            </div>
                        </div>

                        <div className={cn('text-[10px] text-slate-500 dark:text-slate-400', isLandscape ? 'mt-1.5' : 'mt-2')}>
                            Scan QR for attendance verification.
                        </div>
                    </div>

                    {/* RIGHT QR */}
                    <div
                        className={cn(
                            'flex flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/45',
                            qrPanelWidth,
                            isLandscape ? 'p-2.5' : 'p-3',
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

                        {loading ? (
                            <Skeleton className="rounded-2xl" style={{ width: qrSize, height: qrSize }} />
                        ) : qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="Participant QR code"
                                className="rounded-2xl bg-white p-2 object-contain"
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
                            <div className={cn('font-semibold text-slate-900 dark:text-slate-100', isLandscape ? 'text-[10px]' : 'text-[11px]')}>
                                <span className="line-clamp-2" title={`${participant.country?.code?.toUpperCase() ?? ''} • ${participant.name}`}>
                                    {participant.country?.code?.toUpperCase() ?? ''}
                                    {participant.country?.code ? ' • ' : ''}
                                    {participant.name}
                                </span>
                            </div>
                            <div className={cn('mt-1 break-words font-mono text-slate-500 dark:text-slate-400', isLandscape ? 'text-[10px]' : 'text-[10px]')}>
                                {participant.display_id}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {/* <div className={cn('mt-3 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400')}>
                    <span>Keep this ID for event entry</span>
                    <span className="font-medium">ASEAN PH 2026</span>
                </div> */}
            </div>
        </div>
    );
}

export default function ParticipantDashboard({ participant }: PageProps) {
    const flagSrc = getFlagSrc(participant.country);
    const qrValue = participant.qr_payload;

    const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
    const [qrLoading, setQrLoading] = React.useState(true);

    // ✅ opens full-size preview only when needed
    const [previewOpen, setPreviewOpen] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;

        async function buildQr() {
            try {
                setQrLoading(true);

                if (!qrValue || qrValue.trim().length < 10) {
                    if (mounted) setQrDataUrl(null);
                    return;
                }

                const dataUrl = await QRCode.toDataURL(qrValue, {
                    margin: 1,
                    scale: 8,
                    errorCorrectionLevel: 'M',
                });

                if (mounted) setQrDataUrl(dataUrl);
            } catch {
                if (mounted) {
                    setQrDataUrl(null);
                    toast.error('Failed to generate QR code.');
                }
            } finally {
                if (mounted) setQrLoading(false);
            }
        }

        buildQr();
        return () => {
            mounted = false;
        };
    }, [qrValue]);

    const copyToClipboard = async (text: string, label = 'Copied!') => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(label);
        } catch {
            toast.error('Copy failed. Please try again.');
        }
    };

    const downloadQr = () => {
        if (!qrDataUrl) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `asean-id-qr-${participant.display_id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('QR code downloaded.');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/participant-dashboard' },
                { title: 'My Profile', href: '/participant-dashboard' },
            ]}
        >
            <Head title="Participant ID" />

            <div className="relative">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-64 w-full rounded-[3rem]
                    bg-gradient-to-b from-slate-200/60 via-white to-transparent blur-2xl
                    dark:from-slate-800/50 dark:via-slate-950 dark:to-transparent"
                />

                <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
                    <Card className="overflow-hidden rounded-3xl border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40">
                        <div className="relative">
                            <img
                                src="/img/bg.png"
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover opacity-25 dark:opacity-20"
                                draggable={false}
                                loading="lazy"
                            />
                            <div
                                aria-hidden
                                className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/55 to-white/75 dark:from-slate-950/70 dark:via-slate-950/45 dark:to-slate-950/70"
                            />

                            <CardHeader className="relative py-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <CardTitle className="text-balance text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                                Participant ID
                                            </CardTitle>

                                            <Badge
                                                className={cn(
                                                    'rounded-full px-3 py-1 font-mono text-xs font-semibold',
                                                    'border border-sky-200 bg-sky-50 text-sky-700',
                                                    'dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
                                                )}
                                            >
                                                {participant.display_id}
                                            </Badge>
                                        </div>

                                        <div className="text-sm text-slate-600 dark:text-slate-300">
                                            ID card for attendance verification
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() => copyToClipboard(participant.display_id, 'Participant ID copied')}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy ID
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={downloadQr}
                                            disabled={!qrDataUrl || qrLoading}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download QR
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </div>

                        <CardContent className="space-y-4 p-4 sm:p-5">
                            {/* ✅ narrower right column so it doesn't eat space */}
                            <div className="grid gap-5 lg:grid-cols-[1fr_460px]">
                                {/* LEFT: Details */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Details</div>
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Check your details to make sure they're correct.
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                                        <div className="divide-y divide-slate-200/60 dark:divide-white/10">
                                            <InfoRow
                                                icon={<Flag className="h-4 w-4" />}
                                                label="Country"
                                                value={
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                                                            {flagSrc ? (
                                                                <img
                                                                    src={flagSrc}
                                                                    alt={participant.country?.name ?? 'Country flag'}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                    draggable={false}
                                                                    onError={(e) => {
                                                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate">{participant.country?.name ?? '—'}</div>
                                                            {participant.country?.code ? (
                                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                    {participant.country.code.toUpperCase()}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                }
                                            />

                                            <InfoRow
                                                icon={<User2 className="h-4 w-4" />}
                                                label="Name"
                                                value={participant.name}
                                                right={
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="rounded-xl"
                                                        onClick={() => copyToClipboard(participant.name, 'Name copied')}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />

                                            <InfoRow
                                                icon={<Mail className="h-4 w-4" />}
                                                label="Email"
                                                value={participant.email}
                                                right={
                                                    <a href={`mailto:${participant.email}`} className="inline-flex">
                                                        <Button size="sm" variant="ghost" className="rounded-xl">
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                }
                                            />

                                            <InfoRow
                                                icon={<Phone className="h-4 w-4" />}
                                                label="Contact number"
                                                value={participant.contact_number ?? '—'}
                                                right={
                                                    participant.contact_number ? (
                                                        <a href={`tel:${participant.contact_number}`} className="inline-flex">
                                                            <Button size="sm" variant="ghost" className="rounded-xl">
                                                                <Phone className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                    ) : null
                                                }
                                            />
                                        </div>
                                    </div>

                                    {!participant.qr_payload ? (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                                            QR payload is missing. Please generate it on the server for secure scanning.
                                        </div>
                                    ) : null}
                                </div>

                                {/* RIGHT: Virtual ID (compact + scroll frame) */}
                                <div className="space-y-3 lg:sticky lg:top-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">Virtual ID</div>
                                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                Use this virtual ID card for attendance verification.
                                            </div>
                                        </div>



                                    </div>

                                    <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                                        {/* Controls row (compact) */}
                                        <div className="flex items-center justify-between gap-2">
                                            <Tabs value={orientation} onValueChange={(v) => setOrientation(v as 'portrait' | 'landscape')}>
                                                <TabsList className="rounded-2xl bg-white/70 p-1 dark:bg-slate-950/40">
                                                    <TabsTrigger
                                                        value="portrait"
                                                        className={cn(
                                                            'rounded-xl px-3 text-xs',
                                                            'data-[state=active]:bg-sky-600 data-[state=active]:text-white',
                                                            'dark:data-[state=active]:bg-sky-500',
                                                        )}
                                                    >
                                                        <Smartphone className="mr-2 h-4 w-4" />
                                                        Portrait
                                                    </TabsTrigger>

                                                    <TabsTrigger
                                                        value="landscape"
                                                        className={cn(
                                                            'rounded-xl px-3 text-xs',
                                                            'data-[state=active]:bg-emerald-600 data-[state=active]:text-white',
                                                            'dark:data-[state=active]:bg-emerald-500',
                                                        )}
                                                    >
                                                        <IdCard className="mr-2 h-4 w-4" />
                                                        Landscape
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>

                                            {/* <Badge
                                                variant="secondary"
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setPreviewOpen(true)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') setPreviewOpen(true);
                                                }}
                                                className="rounded-full cursor-pointer select-none transition-colors hover:bg-[#00359c]/10 hover:text-[#00359c] dark:hover:bg-[#00359c]/20 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00359c]/30"
                                            >
                                                <QrCodeIcon className="mr-1 h-4 w-4" />
                                                Preview
                                            </Badge> */}

                                        </div>

                                        <Separator className="my-3 bg-slate-200/70 dark:bg-white/10" />

                                        {/* ✅ fixed-height frame so portrait won't push page */}
                                        <div
                                            className={cn(
                                                'rounded-2xl border border-slate-200/70 bg-white/70 p-2 shadow-sm dark:border-white/10 dark:bg-slate-950/30',
                                                orientation === 'portrait' ? 'max-h-[520px]' : 'max-h-[340px]',
                                                'overflow-auto',
                                            )}
                                        >
                                            <IdCardPreview
                                                participant={participant}
                                                flagSrc={flagSrc}
                                                qrDataUrl={qrDataUrl}
                                                loading={qrLoading}
                                                orientation={orientation}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ✅ Large Preview Dialog (only when user wants full size) */}
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-[900px]">
                        <DialogHeader>
                            <DialogTitle>Virtual ID (Large Preview)</DialogTitle>
                            <DialogDescription>

                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                            <IdCardPreview
                                participant={participant}
                                flagSrc={flagSrc}
                                qrDataUrl={qrDataUrl}
                                loading={qrLoading}
                                orientation={orientation}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
