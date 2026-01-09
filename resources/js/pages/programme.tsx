import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarClock, MapPin, Timer, CircleCheck, CircleX, Sparkles } from 'lucide-react';

type FlexHoverItem = {
    title: string;
    subtitle: string;
    body: string;
    image: string;
    tint: string;

    venue: string;
    startsAt: string; // ISO w/ +08:00
    endsAt?: string;

    cta?: { label: string; href: string };
};

function formatEventWindow(startsAt: string, endsAt?: string) {
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;

    const dateFmt = new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });

    const timeFmt = new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    });

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

function getEventStatus(startsAt: string, endsAt: string | undefined, nowTs: number) {
    const startTs = new Date(startsAt).getTime();
    const endTs = endsAt ? new Date(endsAt).getTime() : null;

    if (endTs !== null) {
        if (nowTs < startTs) return 'open';
        if (nowTs >= startTs && nowTs <= endTs) return 'open';
        return 'closed';
    }

    // If no end date, treat as open until it starts; closed once start is in the past.
    return nowTs <= startTs ? 'open' : 'closed';
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
            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/40'
            : tone === 'danger'
              ? 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/40'
              : tone === 'info'
                ? 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-900/40'
                : 'bg-white/70 text-slate-700 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium ring-1 backdrop-blur',
                toneClass
            )}
        >
            {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
            <span className="whitespace-nowrap">{children}</span>
        </span>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <CalendarClock className="h-6 w-6 text-slate-500 dark:text-slate-300" />
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Please check back again later.</div>
        </div>
    );
}

function SectionHeading({
    title,
    hint,
    icon,
}: {
    title: string;
    hint?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2">
                {icon ? (
                    <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/40 dark:ring-slate-800">
                        {icon}
                    </span>
                ) : null}
                <div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</div>
                    {hint ? <div className="text-sm text-slate-600 dark:text-slate-300">{hint}</div> : null}
                </div>
            </div>
        </div>
    );
}

function FeaturedEventCard({ item, nowTs }: { item: FlexHoverItem; nowTs: number }) {
    const d = daysUntil(item.startsAt, nowTs);
    const status = getEventStatus(item.startsAt, item.endsAt, nowTs);

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white',
                'shadow-[0_18px_55px_-45px_rgba(2,6,23,0.22)]',
                'dark:border-slate-800 dark:bg-slate-950/40'
            )}
        >
            <div className={cn('absolute inset-0', item.tint)} />
            <div className="absolute inset-0 bg-gradient-to-b from-white/65 via-white/20 to-white/75 dark:from-slate-950/45 dark:via-slate-950/20 dark:to-slate-950/55" />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5 dark:ring-white/10" />

            <div className="relative p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                    <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                        {formatEventWindow(item.startsAt, item.endsAt)}
                    </BadgePill>
                    <BadgePill icon={<MapPin className="h-3.5 w-3.5" />}>{item.venue}</BadgePill>
                    <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>
                        {d === 0 ? 'Today / Started' : `${d} day${d > 1 ? 's' : ''} to go`}
                    </BadgePill>
                    <BadgePill
                        tone={status === 'open' ? 'success' : 'danger'}
                        icon={status === 'open' ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                    >
                        {status === 'open' ? 'Open' : 'Closed'}
                    </BadgePill>

                    <span className="ml-auto hidden items-center gap-2 rounded-xl bg-white/70 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/40 dark:text-slate-100 dark:ring-slate-800 sm:inline-flex">
                        <Sparkles className="h-3.5 w-3.5 text-[#FCD116]" />
                        Featured
                    </span>
                </div>

                <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
                    {/* LEFT */}
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                        <p className="mt-2 text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-2xl">
                            {item.subtitle}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.body}</p>

                        {item.cta ? (
                            <div className="mt-5">
                                <Button asChild className="h-10 rounded-2xl bg-[#0033A0] text-white shadow hover:bg-[#0033A0]/95">
                                    <a href={item.cta.href}>
                                        {item.cta.label}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        ) : null}
                    </div>

                    {/* RIGHT */}
                    <div className="relative overflow-hidden rounded-3xl bg-white/70 ring-1 ring-slate-200 shadow-[0_14px_40px_-30px_rgba(2,6,23,0.20)] backdrop-blur dark:bg-slate-900/40 dark:ring-slate-800">
                        <div className="p-3">
                            <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="h-[220px] w-full object-cover sm:h-[260px]"
                                    loading="lazy"
                                    draggable={false}
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-white/35 dark:from-slate-950/15 dark:to-slate-950/35" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CompactEventCard({ item, nowTs }: { item: FlexHoverItem; nowTs: number }) {
    const d = daysUntil(item.startsAt, nowTs);
    const status = getEventStatus(item.startsAt, item.endsAt, nowTs);

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white',
                'shadow-[0_14px_40px_-34px_rgba(2,6,23,0.18)]',
                'dark:border-slate-800 dark:bg-slate-950/40'
            )}
        >
            <div className={cn('absolute inset-0', item.tint)} />
            <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/25 to-white/80 dark:from-slate-950/50 dark:via-slate-950/20 dark:to-slate-950/60" />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5 dark:ring-white/10" />

            <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:p-5">
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 sm:w-56 sm:shrink-0">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="h-44 w-full object-cover sm:h-full"
                        loading="lazy"
                        draggable={false}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                        <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                            {formatEventWindow(item.startsAt, item.endsAt)}
                        </BadgePill>
                        <BadgePill icon={<MapPin className="h-3.5 w-3.5" />}>{item.venue}</BadgePill>
                        <BadgePill
                            tone={status === 'open' ? 'success' : 'danger'}
                            icon={status === 'open' ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                        >
                            {status === 'open' ? 'Open' : 'Closed'}
                        </BadgePill>
                        {status === 'open' ? (
                            <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>
                                {d === 0 ? 'Today / Started' : `${d} day${d > 1 ? 's' : ''} to go`}
                            </BadgePill>
                        ) : null}
                    </div>

                    <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                    <p className="mt-1 text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
                        {item.subtitle}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.body}</p>

                    {item.cta ? (
                        <div className="mt-4 flex justify-end">
                            <Button
                                asChild
                                variant="secondary"
                                className="h-9 rounded-2xl bg-white/80 text-slate-900 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/40 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-900/55"
                            >
                                <a href={item.cta.href}>
                                    {item.cta.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ProgrammeEvents({ items }: { items: FlexHoverItem[] }) {
    const [nowTs, setNowTs] = React.useState(() => Date.now());

    React.useEffect(() => {
        const t = window.setInterval(() => setNowTs(Date.now()), 60_000);
        return () => window.clearInterval(t);
    }, []);

    const enriched = React.useMemo(() => {
        return items.map((it) => {
            const startTs = new Date(it.startsAt).getTime();
            const endTs = it.endsAt ? new Date(it.endsAt).getTime() : null;
            const status = getEventStatus(it.startsAt, it.endsAt, nowTs);
            return { ...it, startTs, endTs, status };
        });
    }, [items, nowTs]);

    const openItems = React.useMemo(() => {
        return enriched
            .filter((it) => it.status === 'open')
            .sort((a, b) => a.startTs - b.startTs);
    }, [enriched]);

    const closedItems = React.useMemo(() => {
        return enriched
            .filter((it) => it.status === 'closed')
            .sort((a, b) => {
                const aKey = a.endTs ?? a.startTs;
                const bKey = b.endTs ?? b.startTs;
                return bKey - aKey; // most recent closed first
            });
    }, [enriched]);

    const featured = openItems.length > 0 ? openItems[0] : null;
    const incoming = openItems.length > 1 ? openItems.slice(1) : [];

    return (
        <div className="mt-8 space-y-10">
            {/* FEATURED */}
            <div className="space-y-4">
                <SectionHeading
                    title="Featured Event"
                    hint="Highlighted activity for participants."
                    icon={<Sparkles className="h-5 w-5 text-[#0033A0]" />}
                />
                {featured ? <FeaturedEventCard item={featured} nowTs={nowTs} /> : <EmptyState label="No featured event" />}
            </div>

            {/* INCOMING */}
            <div className="space-y-4">
                <SectionHeading
                    title="Incoming Events"
                    hint="Upcoming / ongoing activities (not expanded)."
                    icon={<CircleCheck className="h-5 w-5 text-emerald-600" />}
                />
                {incoming.length === 0 ? (
                    <EmptyState label="No incoming events" />
                ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {incoming.map((item) => (
                            <CompactEventCard key={`${item.title}-${item.startsAt}`} item={item} nowTs={nowTs} />
                        ))}
                    </div>
                )}
            </div>

            {/* CLOSED */}
            <div className="space-y-4">
                <SectionHeading
                    title="Done / Closed Events"
                    hint="Completed activities (not expanded)."
                    icon={<CircleX className="h-5 w-5 text-rose-600" />}
                />
                {closedItems.length === 0 ? (
                    <EmptyState label="No closed events" />
                ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {closedItems.map((item) => (
                            <CompactEventCard key={`${item.title}-${item.startsAt}`} item={item} nowTs={nowTs} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Programme() {
    const items: FlexHoverItem[] = [
        {
            title: 'Plenary & Panels',
            subtitle: 'Track Discussions',
            body: 'Track-based panels and guided discussions. Share insights, build outputs, and align next steps across participating groups.',
            image: '/event/event1.jpg',
            tint: 'bg-gradient-to-br from-[#dbeafe] via-white to-[#fef9c3]',
            venue: 'Conference Hall B',
            startsAt: '2026-03-02T09:00:00+08:00',
            endsAt: '2026-03-02T17:00:00+08:00',
            cta: { label: 'View more', href: '#sessions' },
        },
        {
            title: 'Workshops & Outputs',
            subtitle: 'Facilitated Workshops',
            body: 'Facilitated activities for planning, drafting commitments, and building outputs participants can bring back to their institutions.',
            image: '/event/event2.jpg',
            tint: 'bg-gradient-to-br from-[#fce7f3] via-white to-[#e0e7ff]',
            venue: 'Workshop Rooms',
            startsAt: '2026-03-03T09:00:00+08:00',
            endsAt: '2026-03-03T16:30:00+08:00',
            cta: { label: 'View more', href: '#workshops' },
        },
        {
            title: 'Highlights & Closing',
            subtitle: 'Closing Session',
            body: 'Key moments, official updates, and downloadable references—kept in one place for participants and partners.',
            image: '/event/event3.jpg',
            tint: 'bg-gradient-to-br from-[#ffedd5] via-white to-[#e2e8f0]',
            venue: 'Main Auditorium',
            startsAt: '2026-03-04T09:00:00+08:00',
            endsAt: '2026-03-04T12:00:00+08:00',
            cta: { label: 'View more', href: '#highlights' },
        },
    ];

    return (
        <>
            <Head title="Programme" />

            <PublicLayout navActive="/programme">
                <section className="relative isolate mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
                    />
                    <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#0033A0]/10 blur-3xl" />
                    <div aria-hidden className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#FCD116]/15 blur-3xl" />

                    <div className="mx-auto max-w-5xl text-center">
                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0]">Event</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px]" />
                            </span>
                        </h2>

                        <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                            <span className="h-px w-12 bg-slate-200 dark:bg-slate-800" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-12 bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>

                    {/* ✅ No slider: Featured (expanded) → Incoming (compact) → Closed (compact) */}
                    {items.length === 0 ? (
                        <div className="mt-8">
                            <EmptyState label="No events available" />
                        </div>
                    ) : (
                        <ProgrammeEvents items={items} />
                    )}
                </section>
            </PublicLayout>
        </>
    );
}
