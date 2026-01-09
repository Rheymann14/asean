import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CalendarClock,
    Timer,
    CircleCheck,
    CircleX,
    Sparkles,
    ZoomIn,
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type ProgrammeRow = {
    id: number;
    title: string;
    description: string;
    starts_at: string | null;
    ends_at: string | null;
    image_url: string | null;
    pdf_url: string | null;
    is_active: boolean;
};

type PageProps = {
    programmes?: ProgrammeRow[];
};

type FlexHoverItem = {
    id: number;
    title: string;
    body: string;
    image: string;
    tint: string;

    startsAt: string;
    endsAt?: string;

    cta?: { label: string; href: string };
};

const TINTS = [
    'bg-gradient-to-br from-[#dbeafe] via-white to-[#fef9c3]',
    'bg-gradient-to-br from-[#fce7f3] via-white to-[#e0e7ff]',
    'bg-gradient-to-br from-[#ffedd5] via-white to-[#e2e8f0]',
];

const FALLBACK_IMAGE = '/img/asean_banner_logo.png';

function resolveImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return FALLBACK_IMAGE;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl;
    return `/event-images/${imageUrl}`;
}

function resolvePdfUrl(pdfUrl?: string | null) {
    if (!pdfUrl) return null;
    if (pdfUrl.startsWith('http') || pdfUrl.startsWith('/')) return pdfUrl;
    return `/downloadables/${pdfUrl}`;
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

/**
 * ✅ “Days to go” that won’t show 1 day when the event is later *today*
 * It compares calendar days (start-of-day) not milliseconds.
 */
function daysUntil(startsAt: string, nowTs: number) {
    const start = new Date(startsAt);
    const now = new Date(nowTs);

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const diffDays = Math.floor((startDay - nowDay) / 86_400_000);
    return diffDays <= 0 ? 0 : diffDays;
}

function daysToGoLabel(d: number) {
    if (d <= 0) return 'Today';
    return `${d} day${d === 1 ? '' : 's'} to go`;
}

type EventPhase = 'ongoing' | 'upcoming' | 'closed';

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

function BadgePill({
    icon,
    children,
    tone = 'neutral',
}: {
    icon?: React.ReactNode;
    children: React.ReactNode;
    tone?: 'neutral' | 'info' | 'success' | 'danger';
}) {
    const toneClass =
        tone === 'success'
            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-500/30'
            : tone === 'danger'
                ? 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-500/30'
                : tone === 'info'
                    ? 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-500/30'
                    : 'bg-white/70 text-slate-700 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 backdrop-blur',
                'shadow-[0_10px_22px_-20px_rgba(2,6,23,0.25)]',
                toneClass,
            )}
        >
            {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
            <span className="whitespace-nowrap">{children}</span>
        </span>
    );
}

/** ✅ Beautified section header */
type SectionTone = 'ongoing' | 'upcoming' | 'closed';

function SectionTitle({
    title,
    count,
    subtitle,
    tone,
}: {
    title: string;
    count?: number;
    subtitle?: string;
    tone: SectionTone;
}) {
    const meta =
        tone === 'ongoing'
            ? {
                  icon: <CircleCheck className="h-4 w-4" />,
                  iconWrap: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
                  titleAccent: 'text-emerald-800 dark:text-emerald-200',
                  line: 'from-emerald-500/35 via-emerald-500/10 to-transparent',
                  countPill:
                      'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-500/30',
              }
            : tone === 'upcoming'
              ? {
                    icon: <CalendarClock className="h-4 w-4" />,
                    iconWrap: 'bg-[#0033A0]/10 text-[#0033A0] dark:bg-[#7aa2ff]/15 dark:text-[#b9ccff]',
                    titleAccent: 'text-[#0033A0] dark:text-[#b9ccff]',
                    line: 'from-[#0033A0]/35 via-[#0033A0]/10 to-transparent',
                    countPill:
                        'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-500/30',
                }
              : {
                    icon: <CircleX className="h-4 w-4" />,
                    iconWrap: 'bg-rose-600/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
                    titleAccent: 'text-rose-800 dark:text-rose-200',
                    line: 'from-rose-500/35 via-rose-500/10 to-transparent',
                    countPill:
                        'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-500/30',
                };

    return (
        <div className="mt-10">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        <span
                            className={cn(
                                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10',
                                meta.iconWrap,
                            )}
                        >
                            {meta.icon}
                        </span>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <div
                                    className={cn(
                                        'text-base font-semibold tracking-tight sm:text-lg',
                                        meta.titleAccent,
                                    )}
                                >
                                    {title}
                                </div>

                                {typeof count === 'number' ? (
                                    <span
                                        className={cn(
                                            'inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 backdrop-blur',
                                            meta.countPill,
                                        )}
                                    >
                                        {count} item{count === 1 ? '' : 's'}
                                    </span>
                                ) : null}
                            </div>

                            {subtitle ? (
                                <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                                    {subtitle}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div
                aria-hidden
                className={cn('mt-3 h-px w-full bg-gradient-to-r', meta.line)}
            />
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0033A0]/10 text-[#0033A0] dark:bg-[#0033A0]/20">
                <Sparkles className="h-4 w-4" />
            </div>
            {text}
        </div>
    );
}

function ImagePreviewDialog({
    src,
    title,
    subtitle,
    children,
}: {
    src: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="max-w-5xl overflow-hidden p-0">
                <div className="relative bg-slate-950">
                    <img
                        src={src}
                        alt={title}
                        className="max-h-[78vh] w-full object-contain"
                        loading="lazy"
                        draggable={false}
                    />
                </div>

                <div className="p-4 sm:p-5">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-slate-100">{title}</DialogTitle>
                        {subtitle ? (
                            <DialogDescription className="text-slate-600 dark:text-slate-300">
                                {subtitle}
                            </DialogDescription>
                        ) : null}
                    </DialogHeader>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** ✅ Compact grid tile: good for up to 20 events, responsive */
function EventTile({
    item,
    phase,
    nowTs,
    featured = false,
}: {
    item: FlexHoverItem;
    phase: EventPhase;
    nowTs: number;
    featured?: boolean;
}) {
    const d = daysUntil(item.startsAt, nowTs);

    const isClosed = phase === 'closed';
    const isUpcoming = phase === 'upcoming';
    const isOngoing = phase === 'ongoing';

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 backdrop-blur',
                'shadow-[0_14px_40px_-44px_rgba(2,6,23,0.22)]',
                'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-52px_rgba(2,6,23,0.34)]',
                'dark:border-slate-700 dark:bg-slate-900/40',
                isClosed && 'bg-slate-50/70 dark:bg-slate-950/30',
                featured && !isClosed && 'ring-1 ring-emerald-300/40 dark:ring-emerald-500/25',
            )}
        >
            <div className={cn('absolute inset-0', item.tint, isClosed && 'opacity-30')} />
            <div
                className={cn(
                    'absolute inset-0 bg-gradient-to-b from-white/55 via-white/20 to-white/70 dark:from-slate-900/30 dark:via-slate-900/10 dark:to-slate-900/55',
                    isClosed && 'opacity-70',
                )}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5 dark:ring-white/10" />

            <div className={cn('relative p-3.5 sm:p-4', isClosed && 'opacity-90')}>
                {/* image (click to preview) */}
                <ImagePreviewDialog
                    src={item.image}
                    title={item.title}
                    subtitle={formatEventWindow(item.startsAt, item.endsAt)}
                >
                    <button
                        type="button"
                        className={cn(
                            'relative w-full overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0033A0]/35',
                        )}
                        aria-label={`View image for ${item.title}`}
                    >
                        <img
                            src={item.image}
                            alt={item.title}
                            className={cn(
                                featured ? 'h-36 sm:h-40' : 'h-28 sm:h-32',
                                'w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
                                isClosed && 'grayscale',
                            )}
                            loading="lazy"
                            draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/25" />

                        {/* top-right zoom hint */}
                        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                            <ZoomIn className="h-3.5 w-3.5" />
                            View
                        </div>

                        {/* top-left status chip */}
                        <div className="absolute left-2 top-2 flex items-center gap-2">
                            {featured && !isClosed ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 px-2 py-1 text-[11px] font-semibold text-white shadow">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Featured
                                </span>
                            ) : null}

                            {isClosed ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600/90 px-2 py-1 text-[11px] font-semibold text-white shadow">
                                    <CircleX className="h-3.5 w-3.5" />
                                    Closed
                                </span>
                            ) : isOngoing ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 px-2 py-1 text-[11px] font-semibold text-white shadow">
                                    <CircleCheck className="h-3.5 w-3.5" />
                                    Ongoing
                                </span>
                            ) : isUpcoming ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-[#0033A0]/90 px-2 py-1 text-[11px] font-semibold text-white shadow">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    Upcoming
                                </span>
                            ) : null}
                        </div>
                    </button>
                </ImagePreviewDialog>

                {/* pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                    <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                        {formatEventWindow(item.startsAt, item.endsAt)}
                    </BadgePill>

                    {isClosed ? (
                        <BadgePill tone="danger" icon={<CircleX className="h-3.5 w-3.5" />}>
                            Closed
                        </BadgePill>
                    ) : isOngoing ? (
                        <BadgePill tone="success" icon={<CircleCheck className="h-3.5 w-3.5" />}>
                            Ongoing Today
                        </BadgePill>
                    ) : (
                        <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>{daysToGoLabel(d)}</BadgePill>
                    )}
                </div>

                {/* ✅ nicer typography for item */}
                <div
                    className={cn(
                        'mt-2 text-[15px] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100',
                        'line-clamp-2',
                        isClosed && 'text-slate-700 dark:text-slate-200',
                    )}
                >
                    {item.title}
                </div>

                <p
                    className={cn(
                        'mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300',
                        'line-clamp-3',
                        isClosed && 'text-slate-500 dark:text-slate-400',
                    )}
                >
                    {item.body}
                </p>

                {item.cta ? (
                    <div className="mt-4 flex justify-end">
                        <Button
                            asChild
                            variant={isClosed ? 'outline' : 'default'}
                            className={cn(
                                'h-9 rounded-xl px-3.5 transition',
                                isClosed
                                    ? 'border-slate-300 bg-white/60 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200 dark:hover:bg-slate-950/45'
                                    : 'bg-[#0033A0] text-white shadow hover:bg-[#0033A0]/95 focus-visible:ring-2 focus-visible:ring-[#0033A0]/30',
                            )}
                        >
                            <a href={item.cta.href} target="_blank" rel="noreferrer">
                                {item.cta.label ?? 'View details'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ProgrammeGroups({ items }: { items: FlexHoverItem[] }) {
    const nowTs = useNowTs(60_000);

    const enriched = React.useMemo(() => {
        return items
            .map((it) => ({
                ...it,
                _startTs: new Date(it.startsAt).getTime(),
                _endOrStartTs: new Date(it.endsAt ?? it.startsAt).getTime(),
                _phase: getEventPhase(it.startsAt, it.endsAt, nowTs),
            }))
            .sort((a, b) => a._startTs - b._startTs);
    }, [items, nowTs]);

    const ongoing = enriched.filter((x) => x._phase === 'ongoing').sort((a, b) => a._startTs - b._startTs);
    const upcoming = enriched.filter((x) => x._phase === 'upcoming').sort((a, b) => a._startTs - b._startTs);
    const closed = enriched.filter((x) => x._phase === 'closed').sort((a, b) => b._endOrStartTs - a._endOrStartTs);

    return (
        <div className="mt-3">
            {/* ONGOING (CENTERED) */}
            <SectionTitle tone="ongoing" title="Ongoing Today" count={ongoing.length} subtitle="Happening today." />

            {ongoing.length ? (
                ongoing.length === 1 ? (
                    <div className="mt-4 flex justify-center">
                        <div className="w-full max-w-md">
                            <EventTile item={ongoing[0]} phase="ongoing" nowTs={nowTs} featured />
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {ongoing.map((it) => (
                            <EventTile key={it.id} item={it} phase="ongoing" nowTs={nowTs} featured />
                        ))}
                    </div>
                )
            ) : (
                <EmptyState text="No ongoing event today." />
            )}

            {/* UPCOMING */}
            <SectionTitle tone="upcoming" title="Upcoming Events" count={upcoming.length} subtitle="Plan ahead—see what’s next." />
            {upcoming.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((it) => (
                        <EventTile key={it.id} item={it} phase="upcoming" nowTs={nowTs} />
                    ))}
                </div>
            ) : (
                <EmptyState text="No upcoming events." />
            )}

            {/* CLOSED */}
            <SectionTitle tone="closed" title="Closed Events" count={closed.length} subtitle="Past activities." />
            {closed.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {closed.map((it) => (
                        <EventTile key={it.id} item={it} phase="closed" nowTs={nowTs} />
                    ))}
                </div>
            ) : (
                <EmptyState text="No closed events yet." />
            )}
        </div>
    );
}

export default function Programme({ programmes = [] }: PageProps) {
    const items = React.useMemo<FlexHoverItem[]>(() => {
        return programmes.map((programme, index) => {
            const pdfUrl = resolvePdfUrl(programme.pdf_url);
            const startsAt = programme.starts_at ?? new Date().toISOString();

            return {
                id: programme.id,
                title: programme.title,
                body: programme.description,
                image: resolveImageUrl(programme.image_url),
                tint: TINTS[index % TINTS.length],
                startsAt,
                endsAt: programme.ends_at ?? undefined,
                cta: pdfUrl ? { label: 'View more', href: pdfUrl } : undefined,
            };
        });
    }, [programmes]);

    return (
        <>
            <Head title="Event" />

            <PublicLayout navActive="/event">
                <section className="relative isolate mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    {/* background */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950/60 dark:to-slate-950"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -left-28 -top-28 -z-10 h-72 w-72 rounded-full bg-[#0033A0]/12 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-28 top-28 -z-10 h-72 w-72 rounded-full bg-[#FCD116]/18 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [background:radial-gradient(1200px_circle_at_20%_0%,rgba(0,51,160,0.12),transparent_55%),radial-gradient(900px_circle_at_90%_20%,rgba(252,209,22,0.16),transparent_55%)]"
                    />

                    {/* header */}
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0] dark:text-[#7aa2ff]">Event</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px] dark:bg-[#7aa2ff]/20" />
                            </span>
                        </h2>

                        <div className="mx-auto mt-5 flex items-center justify-center gap-3">
                            <span className="h-px w-10 bg-slate-200 dark:bg-slate-700" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-10 bg-slate-200 dark:bg-slate-700" />
                        </div>
                    </div>

                    {/* list area */}
                    <div className="mx-auto mt-2 max-w-5xl">
                        {items.length ? (
                            <ProgrammeGroups items={items} />
                        ) : (
                            <EmptyState text="No programmes are available yet." />
                        )}
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
