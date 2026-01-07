import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, ExternalLink, RefreshCcw, ArrowUpRight } from 'lucide-react';
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

function MapEmbed({
    googleSrc,
    fallbackSrc,
    googleMapsLink,
    timeoutMs = 7000,
}: {
    googleSrc: string;
    fallbackSrc: string;
    googleMapsLink: string;
    timeoutMs?: number;
}) {
    const [src, setSrc] = React.useState(googleSrc);
    const [loaded, setLoaded] = React.useState(false);
    const [usingFallback, setUsingFallback] = React.useState(false);
    const [reloadKey, setReloadKey] = React.useState(0);

    // Use refs to avoid stale state inside setTimeout
    const loadedRef = React.useRef(false);
    const timerRef = React.useRef<number | null>(null);

    const clearTimer = React.useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startGoogleAttempt = React.useCallback(() => {
        clearTimer();

        loadedRef.current = false;
        setLoaded(false);
        setUsingFallback(false);

        // Reset back to Google first
        setSrc(googleSrc);
        setReloadKey((k) => k + 1);

        timerRef.current = window.setTimeout(() => {
            // Use ref so the timeout never reads stale `loaded`
            if (!loadedRef.current) {
                setSrc(fallbackSrc);
                setUsingFallback(true);
                setReloadKey((k) => k + 1);
            }
        }, timeoutMs);
    }, [clearTimer, googleSrc, fallbackSrc, timeoutMs]);

    React.useEffect(() => {
        startGoogleAttempt();
        return clearTimer;
    }, [startGoogleAttempt, clearTimer]);

    const handleLoad = () => {
        loadedRef.current = true;
        setLoaded(true);
        clearTimer();
    };

  

    return (
        <div className="relative aspect-[16/9] w-full">
            {/* Loading overlay */}
            {!loaded && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/50">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-200" />
                        <p className="text-sm text-slate-700 dark:text-slate-200">Loading map…</p>
                    </div>
                </div>
            )}

            <iframe
                key={reloadKey}
                title="Venue location map"
                src={src}
                className="h-full w-full"
                loading="lazy"
                allowFullScreen
                onLoad={handleLoad}
            />

            {/* Fallback notice */}
            {usingFallback && loaded && (
                <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/90 p-3 text-amber-950 shadow-sm backdrop-blur dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs sm:text-sm">
                        Google Maps didn’t load (privacy/adblock sometimes blocks it). Showing a preview map instead.
                    </p>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9 rounded-2xl"
                            onClick={startGoogleAttempt}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>

                        <Button asChild className="h-9 rounded-2xl bg-[#0033A0] text-white hover:opacity-95">
                            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                                Open Google Maps
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Venue() {
    const googleMapsLink = 'https://maps.app.goo.gl/9pLGF39s6FWwedoTA';

    // Google embed (can be blocked sometimes by privacy/adblock)
    const googleEmbedSrc = 'https://www.google.com/maps?q=14.653624,121.0580601&z=17&output=embed';

    // Fallback embed (stable, no cookies) — OpenStreetMap
    const osmEmbedSrc =
        'https://www.openstreetmap.org/export/embed.html?bbox=121.0480601%2C14.647624%2C121.0680601%2C14.659624&layer=mapnik&marker=14.653624%2C121.0580601';

    return (
        <>
            <Head title="Venue" />

            <PublicLayout navActive="/venue">
                <section className="relative isolate mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    {/* soft background */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
                    <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#0033A0]/10 blur-3xl" />
                    <div aria-hidden className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#FCD116]/15 blur-3xl" />


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

                    <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-12">
                        {/* Map (IMPORTANT: no backdrop-blur here to avoid iframe flakiness) */}
                        <Card className="overflow-hidden rounded-2xl border-slate-200/70 bg-white shadow-[0_12px_40px_-25px_rgba(2,6,23,0.35)] dark:border-white/10 dark:bg-slate-900 lg:col-span-8">
                            <MapEmbed
                                googleSrc={googleEmbedSrc}
                                fallbackSrc={osmEmbedSrc}
                                googleMapsLink={googleMapsLink}
                                timeoutMs={7000}
                            />
                        </Card>

                        {/* Details (keep the glass effect here) */}
                        <Card className="rounded-2xl border-slate-200/70 bg-white/70 p-6 shadow-[0_12px_40px_-25px_rgba(2,6,23,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40 lg:col-span-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0033A0]/10 text-[#0033A0] dark:bg-[#7aa2ff]/15 dark:text-[#7aa2ff]">
                                    <MapPin className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                        Commission on Higher Education (CHED)
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        55 C.P. Garcia Ave, Diliman, Quezon City, 1101 Metro Manila
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3">
                                <Button
                                    asChild
                                    className="h-11 rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#1e3c73] text-white hover:opacity-95"
                                >
                                    <a href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                                        Open in Google Maps
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>

                            <div className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                                <p className="font-medium text-amber-950 dark:text-amber-50">Tip</p>
                                <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
                                    Tap “Open in Google Maps” for the exact pin and navigation directions.
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="mx-auto mt-10 max-w-5xl text-center">
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

                                            {/* soft overlay */}
                                            <div
                                                aria-hidden
                                                className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent"
                                            />

                                            {/* content */}
                                            <div className="absolute inset-x-0 bottom-0 p-5">
                                                <div className="flex items-end justify-between gap-3">
                                                    <div className="min-w-0">
                                                        {/* Title: visible on mobile, appears on hover on md+ */}
                                                        <h3 className="text-lg font-semibold text-white drop-shadow-sm md:translate-y-3 md:opacity-0 md:transition md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                                                            {item.title}
                                                        </h3>

                                                        {/* Subtitle */}
                                                        <p className="mt-1 line-clamp-2 text-sm text-white/85 md:translate-y-3 md:opacity-0 md:transition md:duration-300 md:delay-75 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>

                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur transition group-hover:bg-white/15">
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    </span>
                                                </div>
                                            </div>

                                            {/* subtle border glow */}
                                            <div
                                                aria-hidden
                                                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
                                            />
                                        </div>

                                        {/* bottom hint (optional, very subtle) */}
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <span className="text-xs font-semibold tracking-wide text-slate-600">
                                                Click to explore
                                            </span>
                                            <span className="text-xs font-semibold text-[#0033A0] opacity-80 transition group-hover:opacity-100">
                                                Open
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                </section>
            </PublicLayout>
        </>
    );
}
