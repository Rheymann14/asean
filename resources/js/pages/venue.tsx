import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, ExternalLink, ArrowUpRight, CalendarDays } from 'lucide-react';

type TourismCard = {
    title: string;
    subtitle: string;
    image: string;
    href: string; // external link
};

const TOURISM_GALLERY: TourismCard[] = [
    {
        title: 'Beach / Resort',
        subtitle: 'Sun, sand, and island stays.',
        image: '/img/tourism/beach.jpg',
        href: 'https://lovethephilippines.travel/interests?tag=Beach%20Resort',
    },
    {
        title: 'Dive / Marine',
        subtitle: 'Reefs, shipwrecks, and marine life.',
        image: '/img/tourism/dive.jpeg',
        href: 'https://lovethephilippines.travel/interests?tag=Dive%2FMarine',
    },
    {
        title: 'Festival Events',
        subtitle: 'Culture, colors, and street celebrations.',
        image: '/img/tourism/festival.jpg',
        href: 'https://lovethephilippines.travel/interests?tag=Festive',
    },
    {
        title: 'National Ecotourism Site',
        subtitle: 'Nature trails and eco-friendly adventures.',
        image: '/img/tourism/ecotourism.jpg',
        href: 'https://lovethephilippines.travel/interests?tag=National%20Ecotourism%20Site',
    },
    {
        title: 'National Park',
        subtitle: 'Mountains, forests, and protected wonders.',
        image: '/img/tourism/national-park.png',
        href: 'https://lovethephilippines.travel/interests?tag=National%20Park',
    },
    {
        title: 'Urban Attraction',
        subtitle: 'City sights, museums, and iconic spots.',
        image: '/img/tourism/urban.jpg',
        href: 'https://lovethephilippines.travel/interests?tag=Urban%20Attraction',
    },
];

type ProgrammeRow = {
    id: number;
    title: string;
    starts_at?: string | null;
    ends_at?: string | null;
};

type VenueRow = {
    id: number;
    programme_id: number | null;
    name: string;
    address: string;
    google_maps_url: string | null;
    embed_url: string | null;
    programme?: ProgrammeRow | null;
};

type EventVenue = {
    id: string;
    label: string;
    dateLabel?: string;
    venueName: string;
    address: string;
    googleMapsLink?: string;
    embedUrl?: string | null;
    tip?: string;
};

type PageProps = {
    venues?: VenueRow[];
};

function formatDateRange(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt) return null;
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;

    if (Number.isNaN(start.getTime())) return null;
    const date = new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit' }).format(start);
    const time = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(start);

    if (!end || Number.isNaN(end.getTime())) return `${date} · ${time}`;
    const endTime = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(end);
    return `${date} · ${time}–${endTime}`;
}

function MapEmbed({
    embedUrl,
    googleMapsLink,
}: {
    embedUrl?: string | null;
    googleMapsLink?: string | null;
}) {
    const [loaded, setLoaded] = React.useState(false);

    if (!embedUrl) {
        return (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300">
                <div className="space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Map preview unavailable</p>
                    <p>No pinned map location.</p>
                    {googleMapsLink ? (
                        <Button asChild className="mt-2 h-9 rounded-2xl bg-[#0033A0] text-white hover:opacity-95">
                            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                                Open in Google Maps
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="relative aspect-[16/9] w-full">
            {!loaded && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/50">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-200" />
                        <p className="text-sm text-slate-700 dark:text-slate-200">Loading map…</p>
                    </div>
                </div>
            )}

            <iframe
                title="Venue location map"
                src={embedUrl}
                className="h-full w-full"
                loading="lazy"
                allowFullScreen
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

function EventVenuePanel({ event }: { event: EventVenue }) {
    return (
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12">
            {/* Map (no backdrop-blur here to avoid iframe flakiness) */}
            <Card className="overflow-hidden rounded-2xl border-slate-200/70 bg-white shadow-[0_12px_40px_-25px_rgba(2,6,23,0.35)] dark:border-white/10 dark:bg-slate-900 lg:col-span-8">
                <MapEmbed embedUrl={event.embedUrl} googleMapsLink={event.googleMapsLink} />
            </Card>

            {/* Details */}
            <Card className="rounded-2xl border-slate-200/70 bg-white/70 p-6 shadow-[0_12px_40px_-25px_rgba(2,6,23,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40 lg:col-span-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0033A0]/10 text-[#0033A0] dark:bg-[#7aa2ff]/15 dark:text-[#7aa2ff]">
                        <MapPin className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{event.venueName}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{event.address}</p>

                        {event.dateLabel && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">
                                <CalendarDays className="h-4 w-4" />
                                {event.dateLabel}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid gap-3">
                    {event.googleMapsLink ? (
                        <Button
                            asChild
                            className="h-11 rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#1e3c73] text-white hover:opacity-95"
                        >
                            <a href={event.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                Open in Google Maps
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled
                            className="h-11 rounded-2xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                            Google Maps link unavailable
                        </Button>
                    )}
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                    <p className="font-medium text-amber-950 dark:text-amber-50">Tip</p>
                    <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
                        {event.tip ?? 'Tap “Open in Google Maps” for the exact pin and navigation directions.'}
                    </p>
                </div>
            </Card>
        </div>
    );
}

export default function Venue({ venues = [] }: PageProps) {
    const eventVenues = React.useMemo(() => {
        return venues.map((venue) => ({
            id: String(venue.id),
            label: venue.programme?.title ?? venue.name,
            dateLabel: formatDateRange(venue.programme?.starts_at ?? null, venue.programme?.ends_at ?? null) ?? undefined,
            venueName: venue.name,
            address: venue.address,
            googleMapsLink: venue.google_maps_url ?? undefined,
            embedUrl: venue.embed_url ?? undefined,
            tip: 'Tap “Open in Google Maps” for the exact pin and navigation directions.',
        }));
    }, [venues]);

    return (
        <>
            <Head title="Venue" />

            <PublicLayout navActive="/venue">
                <section className="relative isolate mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    {/* soft background */}
                    {/* <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
                    <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#0033A0]/10 blur-3xl" />
                    <div aria-hidden className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#FCD116]/15 blur-3xl" /> */}

                    <div className="mx-auto max-w-5xl text-center">
                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0]">Venue</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px]" />
                            </span>{' '}
                        </h2>

                        <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                            <span className="h-px w-12 bg-slate-200 dark:bg-slate-700" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-12 bg-slate-200 dark:bg-slate-700" />
                        </div>


                    </div>

                    {/* ✅ Event Tabs */}
                    <div className="mx-auto mt-10 max-w-6xl">
                        {eventVenues.length === 0 ? (
                            <Card
                                className="
        relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-8 text-center
        shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/55
        dark:border-white/10 dark:bg-slate-900/35
    "
                            >
                                {/* soft glow / gradient */}
                                <div
                                    aria-hidden
                                    className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.12),transparent_60%)]
            dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(56,189,248,0.10),transparent_60%)]
        "
                                />
                                <div
                                    aria-hidden
                                    className="
            pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full
            bg-slate-200/40 blur-2xl dark:bg-white/10
        "
                                />

                                <div className="relative mx-auto flex max-w-sm flex-col items-center">
                                    <div
                                        className="
                mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl
                border border-slate-200/70 bg-white/70 text-slate-700
                shadow-sm backdrop-blur
                dark:border-white/10 dark:bg-white/5 dark:text-slate-200
            "
                                    >
                                        <MapPin className="h-5 w-5" />
                                    </div>

                                    <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                                        No venues yet
                                    </p>

                                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        Please check back soon for venue updates.
                                    </p>

                                    <div className="mt-5 h-px w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

                               
                                </div>
                            </Card>
                        ) : (
                            <Tabs defaultValue={eventVenues[0]?.id ?? ''} className="w-full">
                                <div className="flex items-center justify-center">
                                    <TabsList
                                        className={[
                                            // compact container
                                            'h-auto w-full max-w-6xl justify-start gap-1.5 rounded-2xl border border-slate-200/70 bg-white/70 p-1.5',
                                            'shadow-[0_10px_30px_-28px_rgba(2,6,23,0.25)] backdrop-blur-md',
                                            // horizontal scroll (good for up to 20+)
                                            'overflow-x-auto overflow-y-hidden',
                                            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                                            'dark:border-white/10 dark:bg-slate-900/40',
                                        ].join(' ')}
                                    >
                                        {eventVenues.map((ev) => (
                                            <TabsTrigger
                                                key={ev.id}
                                                value={ev.id}
                                                className={[
                                                    // ✅ smaller pills
                                                    'h-8 shrink-0 rounded-full px-2.5 text-[11px] font-semibold leading-none',
                                                    'tracking-wide',
                                                    // ✅ subtle inactive
                                                    'data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-100/80',
                                                    // ✅ strong active
                                                    'data-[state=active]:bg-[#0033A0] data-[state=active]:text-white',
                                                    // ✅ dark mode
                                                    'dark:data-[state=inactive]:text-slate-200 dark:data-[state=inactive]:hover:bg-white/10',
                                                    // ✅ keep long labels neat
                                                    'max-w-[160px] truncate',
                                                ].join(' ')}
                                                title={ev.label}
                                            >
                                                {ev.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                <div className="mt-6">
                                    {eventVenues.map((ev) => (
                                        <TabsContent key={ev.id} value={ev.id} className="m-0 outline-none">
                                            {/* key ensures map fully resets when switching events */}
                                            <div key={ev.id} className="animate-in fade-in-0 duration-300">
                                                <EventVenuePanel event={ev} />
                                            </div>
                                        </TabsContent>
                                    ))}
                                </div>
                            </Tabs>
                        )}
                    </div>

                    {/* Tourism section (unchanged) */}
                    <div className="mx-auto mt-12 max-w-5xl text-center">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.34em] text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                            Love the Philippines
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                        </p>

                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0]">Tourism</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px]" />
                            </span>{' '}
                        </h2>

                        <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                            <span className="h-px w-12 bg-slate-200 dark:bg-slate-700" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-12 bg-slate-200 dark:bg-slate-700" />
                        </div>

                        <div className="mx-auto mt-10 max-w-6xl">
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {TOURISM_GALLERY.map((item) => (
                                    <a
                                        key={item.title}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Open ${item.title} link`}
                                        className={[
                                            'group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white',
                                            'shadow-[0_18px_55px_-45px_rgba(2,6,23,0.35)]',
                                            'transition will-change-transform hover:-translate-y-1 hover:shadow-[0_30px_70px_-45px_rgba(2,6,23,0.55)]',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0033A0]/60 focus-visible:ring-offset-2',
                                        ].join(' ')}
                                    >
                                        <div className="relative aspect-[4/3]">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                                                draggable={false}
                                            />

                                            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />

                                            <div className="absolute inset-x-0 bottom-0 p-5">
                                                <div className="flex items-end justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-semibold text-white drop-shadow-sm md:translate-y-3 md:opacity-0 md:transition md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                                                            {item.title}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-2 text-sm text-white/85 md:translate-y-3 md:opacity-0 md:transition md:duration-300 md:delay-75 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>

                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur transition group-hover:bg-white/15">
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    </span>
                                                </div>
                                            </div>

                                            <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
                                        </div>

                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-xs font-semibold tracking-wide text-slate-600">Click to explore</span>
                                            <span className="text-xs font-semibold text-[#0033A0] opacity-80 transition group-hover:opacity-100">
                                                Open
                                            </span>
                                        </div>
                                    </a>
                                ))}

                            </div>

                            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                                This will redirect to the Department of Tourism (DOT) website.
                            </p>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        </>
    );
}
