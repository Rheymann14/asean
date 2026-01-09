import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarClock, MapPin, Timer, CircleCheck, CircleX } from 'lucide-react';

type ProgrammeRow = {
    id: number;
    tag: string;
    title: string;
    description: string;
    starts_at: string | null;
    ends_at: string | null;
    location: string;
    image_url: string | null;
    pdf_url: string | null;
    is_active: boolean;
};

type PageProps = {
    programmes?: ProgrammeRow[];
};

type FlexHoverItem = {
    title: string;
    subtitle: string;
    body: string;
    image: string;
    tint: string;

    venue: string;
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

function daysUntil(startsAt: string, nowTs: number) {
    const startTs = new Date(startsAt).getTime();
    const diff = startTs - nowTs;
    if (diff <= 0) return 0;
    return Math.ceil(diff / 86_400_000);
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
            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
            : tone === 'danger'
              ? 'bg-rose-50 text-rose-800 ring-rose-200'
              : tone === 'info'
                ? 'bg-blue-50 text-blue-800 ring-blue-200'
                : 'bg-white/70 text-slate-700 ring-slate-200';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 backdrop-blur',
                toneClass,
            )}
        >
            {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
            <span className="whitespace-nowrap">{children}</span>
        </span>
    );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
    return (
        <div className="mt-7 flex items-center justify-between gap-4">
            <div className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{title}</div>
            {typeof count === 'number' ? (
                <div className="text-[11px] text-slate-500">
                    {count} item{count === 1 ? '' : 's'}
                </div>
            ) : null}
        </div>
    );
}

/** ✅ Compact “expanded” ongoing: still featured, but not tall/wide */
function FeaturedOngoingCompact({ item, nowTs }: { item: FlexHoverItem; nowTs: number }) {
    const d = daysUntil(item.startsAt, nowTs);

    return (
        <div
            className={cn(
                'relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/70 backdrop-blur',
                'shadow-[0_16px_44px_-44px_rgba(2,6,23,0.30)]',
            )}
        >
            <div className={cn('absolute inset-0', item.tint)} />
            <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/20 to-white/75" />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />

            <div className="relative p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <BadgePill tone="success" icon={<CircleCheck className="h-3.5 w-3.5" />}>
                        Ongoing Today
                    </BadgePill>
                    <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                        {formatEventWindow(item.startsAt, item.endsAt)}
                    </BadgePill>
                    <BadgePill icon={<MapPin className="h-3.5 w-3.5" />}>{item.venue}</BadgePill>
                    <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>{d === 0 ? 'Today' : `${d}d`}</BadgePill>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px] sm:items-start">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 sm:text-base line-clamp-1">{item.title}</div>
                        <div className="mt-0.5 text-sm font-medium text-slate-800 line-clamp-1">{item.subtitle}</div>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 line-clamp-2">{item.body}</p>
                    </div>

                    <div className="flex flex-col">
                        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-[0_12px_28px_-28px_rgba(2,6,23,0.25)]">
                            <div className="p-2.5">
                                <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="h-[108px] w-full object-cover"
                                        loading="lazy"
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {item.cta ? (
                            <div className="mt-2 flex justify-end">
                                <Button asChild className="h-9 rounded-xl bg-[#0033A0] px-3 text-white shadow hover:bg-[#0033A0]/95">
                                    <a href={item.cta.href} target="_blank" rel="noreferrer">
                                        {item.cta.label}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** ✅ Compact grid tile: good for up to 20 events, responsive, not too wide */
function EventTile({
    item,
    phase,
    nowTs,
}: {
    item: FlexHoverItem;
    phase: EventPhase;
    nowTs: number;
}) {
    const d = daysUntil(item.startsAt, nowTs);
    const isClosed = phase === 'closed';

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 backdrop-blur',
                'shadow-[0_14px_36px_-44px_rgba(2,6,23,0.22)]',
                isClosed && 'bg-slate-50/70',
            )}
        >
            <div className={cn('absolute inset-0', item.tint, isClosed && 'opacity-30')} />
            <div className={cn('absolute inset-0 bg-gradient-to-b from-white/55 via-white/20 to-white/70', isClosed && 'opacity-70')} />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />

            <div className={cn('relative p-3.5', isClosed && 'opacity-85')}>
                {/* image (small) */}
                <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <img
                        src={item.image}
                        alt={item.title}
                        className={cn('h-28 w-full object-cover', isClosed && 'grayscale')}
                        loading="lazy"
                        draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/25" />
                </div>

                {/* pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                    <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                        {formatEventWindow(item.startsAt, item.endsAt)}
                    </BadgePill>
                    {isClosed ? (
                        <BadgePill tone="danger" icon={<CircleX className="h-3.5 w-3.5" />}>
                            Closed
                        </BadgePill>
                    ) : (
                        <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>{d === 0 ? 'Today' : `${d}d`}</BadgePill>
                    )}
                </div>

                <div className={cn('mt-2 text-sm font-semibold text-slate-900 line-clamp-1', isClosed && 'text-slate-700')}>
                    {item.title}
                </div>
                <div className={cn('mt-0.5 text-sm font-medium text-slate-800 line-clamp-1', isClosed && 'text-slate-600')}>
                    {item.subtitle}
                </div>

                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span className="line-clamp-1">{item.venue}</span>
                </div>

                <p className={cn('mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2', isClosed && 'text-slate-500')}>
                    {item.body}
                </p>

                {item.cta ? (
                    <div className="mt-3 flex justify-end">
                        <Button
                            asChild
                            variant={isClosed ? 'outline' : 'default'}
                            className={cn(
                                'h-8 rounded-xl px-3',
                                isClosed
                                    ? 'border-slate-300 bg-white/60 text-slate-700 hover:bg-white'
                                    : 'bg-[#0033A0] text-white shadow hover:bg-[#0033A0]/95',
                            )}
                        >
                            <a href={item.cta.href} target="_blank" rel="noreferrer">
                                View
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

    const featured = ongoing[0];

    return (
        <div className="mt-2">
            {/* ONGOING (compact featured) */}
            <SectionTitle title="Ongoing Today" count={ongoing.length} />
            {featured ? (
                <FeaturedOngoingCompact item={featured} nowTs={nowTs} />
            ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm text-slate-600 backdrop-blur">
                    No ongoing event today.
                </div>
            )}

            {/* UPCOMING (grid, mobile friendly) */}
            <SectionTitle title="Upcoming Events" count={upcoming.length} />
            {upcoming.length ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((it) => (
                        <EventTile key={`${it.title}-${it.startsAt}`} item={it} phase="upcoming" nowTs={nowTs} />
                    ))}
                </div>
            ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm text-slate-600 backdrop-blur">
                    No upcoming events.
                </div>
            )}

            {/* CLOSED (grid + grayed) */}
            <SectionTitle title="Closed Events" count={closed.length} />
            {closed.length ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {closed.map((it) => (
                        <EventTile key={`${it.title}-${it.startsAt}`} item={it} phase="closed" nowTs={nowTs} />
                    ))}
                </div>
            ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm text-slate-600 backdrop-blur">
                    No closed events yet.
                </div>
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
                title: programme.tag || programme.title,
                subtitle: programme.title || programme.tag,
                body: programme.description,
                image: resolveImageUrl(programme.image_url),
                tint: TINTS[index % TINTS.length],
                venue: programme.location,
                startsAt,
                endsAt: programme.ends_at ?? undefined,
                cta: pdfUrl ? { label: 'View more', href: pdfUrl } : undefined,
            };
        });
    }, [programmes]);

    return (
        <>
            <Head title="Programme" />

            <PublicLayout navActive="/event">
                {/* ✅ narrower container for better “not too wide” feel */}
                <section className="relative isolate mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -left-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[#0033A0]/10 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-24 top-24 -z-10 h-64 w-64 rounded-full bg-[#FCD116]/15 blur-3xl"
                    />

                    {/* ✅ header stays centered but not overly tall */}
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0]">Programme</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px]" />
                            </span>
                        </h2>

                        <div className="mx-auto mt-5 flex items-center justify-center gap-3">
                            <span className="h-px w-10 bg-slate-200" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-10 bg-slate-200" />
                        </div>
                    </div>

                    {/* ✅ list area slightly narrower than the section (better reading width) */}
                    <div className="mx-auto max-w-5xl">
                        {items.length ? (
                            <ProgrammeGroups items={items} />
                        ) : (
                            <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-slate-600 backdrop-blur">
                                No programmes are available yet.
                            </div>
                        )}
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
