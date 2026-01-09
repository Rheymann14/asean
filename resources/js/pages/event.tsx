import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarClock, MapPin, Timer, CircleCheck, CircleX } from 'lucide-react';

import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';

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

function getEventStatus(startsAt: string, endsAt: string | undefined, nowTs: number): 'ongoing' | 'upcoming' | 'closed' {
    const startTs = new Date(startsAt).getTime();
    const endTs = endsAt ? new Date(endsAt).getTime() : null;

    if (endTs !== null) {
        if (nowTs < startTs) return 'upcoming';
        if (nowTs >= startTs && nowTs <= endTs) return 'ongoing';
        return 'closed';
    }

    return nowTs < startTs ? 'upcoming' : 'ongoing';
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
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium ring-1 backdrop-blur',
                toneClass,
            )}
        >
            {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
            <span className="whitespace-nowrap">{children}</span>
        </span>
    );
}

function LightFlexHoverCards({ items }: { items: FlexHoverItem[] }) {
    const [active, setActive] = React.useState<number | null>(null);
    const [nowTs, setNowTs] = React.useState(() => Date.now());

    React.useEffect(() => {
        const t = window.setInterval(() => setNowTs(Date.now()), 60_000);
        return () => window.clearInterval(t);
    }, []);

    // ✅ compact height so nothing gets cut
    const CARD_H = 'h-[360px] sm:h-[380px] lg:h-[400px]';
    const RIGHT_IMG_H = 'h-[140px] sm:h-[155px] lg:h-[165px]';

    const autoScroll = React.useMemo(
        () =>
            AutoScroll({
                playOnInit: true,
                speed: 1.15,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
        [],
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: 'start',
            dragFree: true,
            containScroll: 'trimSnaps',
        },
        [autoScroll],
    );

    React.useEffect(() => {
        if (!emblaApi) return;
        emblaApi.reInit();
    }, [emblaApi, active]);

    const onMouseLeave = React.useCallback(() => {
        setActive(null);
        autoScroll.play?.();
        emblaApi?.reInit();
    }, [autoScroll, emblaApi]);

    return (
        <div className="mt-8">
            <div className="relative" onMouseLeave={onMouseLeave}>
                {/* ✅ removed next/prev buttons + edge fade boxes */}
                <div ref={emblaRef} className="overflow-hidden">
                    <div className="flex gap-5">
                        {items.map((item, i) => {
                            const isActive = active === i;
                            const isCollapsed = active !== null && !isActive;

                            const slideBasis =
                                active === null
                                    ? 'md:basis-1/3'
                                    : isActive
                                      ? 'md:basis-[60%]'
                                      : 'md:basis-[20%]';

                            const d = daysUntil(item.startsAt, nowTs);
                            const status = getEventStatus(item.startsAt, item.endsAt, nowTs);

                            return (
                                <div
                                    key={`${item.title}-${item.startsAt}`}
                                    className={cn(
                                        'shrink-0 grow-0',
                                        'basis-[88%] sm:basis-[72%]',
                                        slideBasis,
                                        'transition-[flex-basis] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]',
                                    )}
                                >
                                    <div
                                        onMouseEnter={() => {
                                            setActive(i);
                                            autoScroll.stop?.();
                                            emblaApi?.scrollTo(i);
                                        }}
                                        className={cn(
                                            'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white',
                                            CARD_H,
                                            'shadow-[0_18px_55px_-45px_rgba(2,6,23,0.22)]',
                                            'transition-[transform,box-shadow] duration-500 ease-out',
                                            'hover:-translate-y-0.5 hover:shadow-[0_26px_80px_-58px_rgba(2,6,23,0.30)]',
                                            'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                                        )}
                                    >
                                        <div className={cn('absolute inset-0', item.tint)} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/25 to-white/70" />
                                        <div
                                            aria-hidden
                                            className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5"
                                        />

                                        {/* COLLAPSED */}
                                        <div
                                            className={cn(
                                                'absolute inset-0',
                                                isCollapsed ? 'opacity-100' : 'opacity-0',
                                                'transition-opacity duration-500',
                                            )}
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                                draggable={false}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/5 to-white/70" />

                                            <div className="absolute left-1/2 top-5 -translate-x-1/2">
                                                <div className="[writing-mode:vertical-rl] rotate-180 text-sm font-semibold tracking-wide text-slate-900/90">
                                                    {item.title}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                                                <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                                                    {formatEventWindow(item.startsAt, item.endsAt)}
                                                </BadgePill>
                                                <BadgePill icon={<MapPin className="h-3.5 w-3.5" />}>{item.venue}</BadgePill>
                                                <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>
                                                    {d === 0 ? 'Today / Started' : `${d} day${d > 1 ? 's' : ''} to go`}
                                                </BadgePill>
                                                <BadgePill
                                                    tone={status === 'ongoing' ? 'success' : status === 'upcoming' ? 'info' : 'danger'}
                                                    icon={
                                                        status === 'closed' ? (
                                                            <CircleX className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <CircleCheck className="h-3.5 w-3.5" />
                                                        )
                                                    }
                                                >
                                                    {status === 'ongoing' ? 'Ongoing' : status === 'upcoming' ? 'Upcoming' : 'Closed'}
                                                </BadgePill>
                                            </div>
                                        </div>

                                        {/* EXPANDED / DEFAULT */}
                                        <div
                                            className={cn(
                                                'relative h-full p-5 md:p-6',
                                                'flex flex-col',
                                                active === null ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-0',
                                                'transition-opacity duration-300',
                                            )}
                                        >
                                            <div className="flex flex-wrap gap-2">
                                                <BadgePill tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                                                    {formatEventWindow(item.startsAt, item.endsAt)}
                                                </BadgePill>
                                                <BadgePill icon={<MapPin className="h-3.5 w-3.5" />}>{item.venue}</BadgePill>
                                                <BadgePill icon={<Timer className="h-3.5 w-3.5" />}>
                                                    {d === 0 ? 'Today / Started' : `${d} day${d > 1 ? 's' : ''} to go`}
                                                </BadgePill>
                                                <BadgePill
                                                    tone={status === 'ongoing' ? 'success' : status === 'upcoming' ? 'info' : 'danger'}
                                                    icon={
                                                        status === 'closed' ? (
                                                            <CircleX className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <CircleCheck className="h-3.5 w-3.5" />
                                                        )
                                                    }
                                                >
                                                    {status === 'ongoing' ? 'Ongoing' : status === 'upcoming' ? 'Upcoming' : 'Closed'}
                                                </BadgePill>
                                            </div>

                                            <div className="mt-3 grid flex-1 grid-cols-[1fr_1.05fr] gap-6">
                                                {/* left */}
                                                <div className="min-w-0">
                                                    <p className="text-lg font-semibold leading-snug text-slate-900 md:text-xl">
                                                        {item.subtitle}
                                                    </p>

                                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
                                                </div>

                                                {/* right */}
                                                <div className="flex flex-col">
                                                    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_14px_40px_-30px_rgba(2,6,23,0.20)]">
                                                        <div className="p-3">
                                                            <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.title}
                                                                    className={cn('w-full object-cover', RIGHT_IMG_H)}
                                                                    loading="lazy"
                                                                    draggable={false}
                                                                />
                                                                <span className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[#0033A0]/40" />
                                                                <span className="absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-[#0033A0]/40" />
                                                                <span className="absolute left-2 bottom-2 h-3 w-3 border-b-2 border-l-2 border-[#0033A0]/40" />
                                                                <span className="absolute right-2 bottom-2 h-3 w-3 border-b-2 border-r-2 border-[#0033A0]/40" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ✅ keep CTA INSIDE (no translate) so it won’t be cropped */}
                                                    {item.cta ? (
                                                        <div className="mt-3 flex justify-end">
                                                            <Button
                                                                asChild
                                                                className="h-10 rounded-2xl bg-[#0033A0] text-white shadow hover:bg-[#0033A0]/95"
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Programme({ programmes = [] }: PageProps) {
    const items = React.useMemo<FlexHoverItem[]>(() => {
        const nowTs = Date.now();
        const statusOrder = { ongoing: 0, upcoming: 1, closed: 2 } as const;

        return programmes
            .map((programme, index) => {
                const pdfUrl = resolvePdfUrl(programme.pdf_url);
                const startsAt = programme.starts_at ?? new Date().toISOString();
                const status = getEventStatus(startsAt, programme.ends_at ?? undefined, nowTs);

                return {
                    title: programme.title,
                    subtitle: programme.title,
                    body: programme.description,
                    image: resolveImageUrl(programme.image_url),
                    tint: TINTS[index % TINTS.length],
                    venue: programme.location,
                    startsAt,
                    endsAt: programme.ends_at ?? undefined,
                    cta: pdfUrl ? { label: 'View more', href: pdfUrl } : undefined,
                    status,
                };
            })
            .sort((a, b) => {
                const orderDelta = statusOrder[a.status] - statusOrder[b.status];
                if (orderDelta !== 0) return orderDelta;
                return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
            })
            .map(({ status, ...item }) => item);
    }, [programmes]);

    return (
        <>
            <Head title="Programme" />

            <PublicLayout navActive="/event">
                <section className="relative isolate mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#0033A0]/10 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#FCD116]/15 blur-3xl"
                    />

                    <div className="mx-auto max-w-5xl text-center">
                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0]">Programme</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px]" />
                            </span>
                        </h2>

                        <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                            <span className="h-px w-12 bg-slate-200" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-12 bg-slate-200" />
                        </div>
                    </div>

                    {items.length ? (
                        <LightFlexHoverCards items={items} />
                    ) : (
                        <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
                            No programmes are available yet.
                        </div>
                    )}
                </section>
            </PublicLayout>
        </>
    );
}
