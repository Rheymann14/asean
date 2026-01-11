import * as React from 'react';
import PublicLayout, { PUBLIC_NAV_ITEMS } from '@/layouts/public-layout';
import { register } from '@/routes';
import { cn, resolveUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';

import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';

type FlagItem = { name: string; src: string };

const ASEAN_FLAGS = [
    { name: 'Brunei', src: '/asean/brunei.jpg' },
    { name: 'Thailand', src: '/asean/thailand.jpg' },
    { name: 'Myanmar', src: '/asean/myanmar.jpg' },
    { name: 'Laos', src: '/asean/laos.jpg' },
    { name: 'Indonesia', src: '/asean/indonesia.jpg' },
    { name: 'Malaysia', src: '/asean/malaysia.jpg' },
    { name: 'Philippines', src: '/asean/philippines.jpg' },
    { name: 'Cambodia', src: '/asean/cambodia.jpg' },
    { name: 'Singapore', src: '/asean/singapore.jpg' },
    { name: 'Vietnam', src: '/asean/vietnam.jpg' },
] as const;

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false);

    React.useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(mq.matches);
        onChange();
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, []);

    return reduced;
}

function AseanFlagsSlider({ items }: { items: readonly FlagItem[] }) {
    const prefersReducedMotion = usePrefersReducedMotion();

    const autoScroll = React.useRef(
        AutoScroll({
            speed: 0.9,
            startDelay: 0,
            direction: 'forward',
            stopOnInteraction: false,
            stopOnMouseEnter: true,
        }),
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: 'start',
            containScroll: false,
            dragFree: true,
            skipSnaps: true,
        },
        prefersReducedMotion ? [] : [autoScroll.current],
    );

    const [selectedSnap, setSelectedSnap] = React.useState(0);
    const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        setSelectedSnap(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    React.useEffect(() => {
        if (!emblaApi) return;

        setScrollSnaps(emblaApi.scrollSnapList());
        onSelect();

        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', () => {
            setScrollSnaps(emblaApi.scrollSnapList());
            onSelect();
        });
    }, [emblaApi, onSelect]);

    React.useEffect(() => {
        if (!emblaApi || prefersReducedMotion) return;

        const stop = () => autoScroll.current?.stop?.();
        const play = () => autoScroll.current?.play?.();

        emblaApi.on('pointerDown', stop);
        emblaApi.on('pointerUp', play);

        return () => {
            emblaApi.off('pointerDown', stop);
            emblaApi.off('pointerUp', play);
        };
    }, [emblaApi, prefersReducedMotion]);

    const pauseThen = React.useCallback(
        (fn: () => void) => {
            if (prefersReducedMotion) return fn();

            autoScroll.current?.stop?.();
            fn();

            window.setTimeout(() => {
                autoScroll.current?.play?.();
            }, 900);
        },
        [prefersReducedMotion],
    );

    const scrollPrev = React.useCallback(() => pauseThen(() => emblaApi?.scrollPrev()), [emblaApi, pauseThen]);
    const scrollNext = React.useCallback(() => pauseThen(() => emblaApi?.scrollNext()), [emblaApi, pauseThen]);
    const scrollTo = React.useCallback((i: number) => pauseThen(() => emblaApi?.scrollTo(i)), [emblaApi, pauseThen]);

    return (
        <div className="relative">
            <div
                ref={emblaRef}
                className="overflow-hidden"
                role="region"
                aria-roledescription="carousel"
                aria-label="ASEAN flags carousel"
                onMouseEnter={() => autoScroll.current?.stop?.()}
                onMouseLeave={() => autoScroll.current?.play?.()}
                onFocusCapture={() => autoScroll.current?.stop?.()}
                onBlurCapture={() => autoScroll.current?.play?.()}
            >
                <div className="flex touch-pan-y -ml-3 py-2 transform-gpu will-change-transform sm:-ml-6">
                    {items.map((c, idx) => (
                        <div
                            key={c.name}
                            className={cn(
                                'min-w-0 pl-3 sm:pl-6',
                                'flex-[0_0_33.333%] sm:flex-[0_0_25%] md:flex-[0_0_20%] lg:flex-[0_0_16.666%] xl:flex-[0_0_14.285%]',
                            )}
                            aria-roledescription="slide"
                            aria-label={`${idx + 1} of ${items.length}`}
                        >
                            <div className="mx-auto flex max-w-[140px] flex-col items-center sm:max-w-[180px] md:max-w-[220px]">
                                <div className="w-full overflow-hidden rounded-xl bg-white shadow-[0_18px_45px_-30px_rgba(2,6,23,0.45)]">
                                    <img
                                        src={c.src}
                                        alt={`${c.name} flag`}
                                        className="aspect-[3/2] w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                    />
                                </div>

                                <p className="mt-2 text-center text-[10px] font-semibold tracking-[0.22em] text-slate-700 sm:mt-4 sm:text-xs">
                                    {c.name.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={scrollPrev}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                    aria-label="Previous flags"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    {scrollSnaps.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => scrollTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={cn(
                                'h-2.5 w-2.5 rounded-full transition-all',
                                i === selectedSnap ? 'w-7 bg-[#1e3c73]' : 'bg-slate-300 hover:bg-slate-400',
                            )}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={scrollNext}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                    aria-label="Next flags"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const sectionNavItems = React.useMemo(() => PUBLIC_NAV_ITEMS.filter((i) => i.href.startsWith('#')), []);
    const [feedbackRating, setFeedbackRating] = React.useState(0);

    const [activeHref, setActiveHref] = React.useState<string>(() => {
        if (typeof window === 'undefined') return '#home';
        return window.location.hash || '#home';
    });

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const headerOffset = 84;
        const sections = sectionNavItems
            .map((i) => document.querySelector(i.href) as HTMLElement | null)
            .filter(Boolean) as HTMLElement[];

        if (!sections.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (!visible.length) return;

                visible.sort((a, b) => {
                    if (b.intersectionRatio !== a.intersectionRatio) return b.intersectionRatio - a.intersectionRatio;
                    return a.boundingClientRect.top - b.boundingClientRect.top;
                });

                const id = (visible[0].target as HTMLElement).id;
                if (id) setActiveHref(`#${id}`);
            },
            {
                root: null,
                threshold: [0.15, 0.25, 0.35, 0.5],
                rootMargin: `-${headerOffset}px 0px -60% 0px`,
            },
        );

        sections.forEach((s) => observer.observe(s));

        const onHash = () => setActiveHref(window.location.hash || '#home');
        window.addEventListener('hashchange', onHash);

        return () => {
            observer.disconnect();
            window.removeEventListener('hashchange', onHash);
        };
    }, [sectionNavItems]);

    return (
        <>
            <Head title="">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <PublicLayout
                canRegister={canRegister}
                navActive={activeHref}
                onNavActiveChange={setActiveHref}
                background={
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div
                            className="absolute inset-0 scale-[1.03] bg-cover bg-center bg-no-repeat opacity-70 blur-[7px]"
                            style={{ backgroundImage: `url(${resolveUrl('/img/background.jpg')})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#9c6700]/15" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/50 to-slate-50" />
                    </div>
                }
            >
                {/* HERO */}
                <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
                    <div className="w-full">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="animate-in fade-in zoom-in-95 duration-700">
                                <img
                                    src="/img/asean_banner_logo.png"
                                    alt="ASEAN Philippines 2026 Banner"
                                    className="mx-auto w-full max-w-3xl drop-shadow-sm"
                                    draggable={false}
                                />
                            </div>

                            <p className="mt-4 animate-in fade-in slide-in-from-bottom-3 duration-700 text-lg font-semibold tracking-[0.25em] text-slate-700">
                                “Navigating Our Future, Together”
                            </p>

                            <div className="mx-auto mt-8 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="relative overflow-hidden">
                                    <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />

                                    <div className="relative text-center">
                                        <div className="mt-7">
                                            <Button
                                                asChild
                                                size="lg"
                                                className="group h-14 w-full rounded-2xl bg-gradient-to-r from-[#1e3c73] via-[#25468a] to-[#1e3c73] px-7 text-base font-semibold shadow-[0_16px_40px_-22px_rgba(2,6,23,0.55)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 focus-visible:ring-offset-2"
                                            >
                                                <Link href={register()} className="inline-flex w-full items-center justify-center gap-2">
                                                    <span className="tracking-wide">Register Now</span>
                                                    <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                </Link>
                                            </Button>

                                         
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ASEAN FLAGS */}
                <section id="asean-flags" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-5xl text-center">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.34em] text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                            MEMBERS
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                        </p>

                        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            <span className="relative inline-block">
                                <span className="relative z-10 text-[#0033A0]">ASEAN</span>
                                <span className="pointer-events-none absolute inset-x-0 bottom-1 -z-0 h-2 rounded-full bg-[#0033A0]/15 blur-[1px]" />
                            </span>{' '}
                            Countries
                        </h2>

                        <div className="mx-auto mt-6 flex items-center justify-center gap-3">
                            <span className="h-px w-12 bg-slate-200" />
                            <span className="h-2 w-2 rounded-full bg-[#FCD116] shadow-[0_0_0_6px_rgba(252,209,22,0.12)]" />
                            <span className="h-px w-12 bg-slate-200" />
                        </div>
                    </div>

                    <div className="mt-10">
                        <AseanFlagsSlider items={ASEAN_FLAGS} />
                    </div>

             


                </section>

                <div className="fixed bottom-6 right-6 z-40 w-[320px] max-w-[calc(100vw-3rem)] sm:w-96">
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.6)] backdrop-blur">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#1e3c73]">
                                    Normalized Migration
                                </p>
                                <h3 className="mt-2 text-lg font-semibold text-slate-900">Floating Feedback</h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    Share your experience to help us elevate the event.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-[#1e3c73]/10 px-3 py-1 text-xs font-semibold text-[#1e3c73]">
                                2026
                            </div>
                        </div>

                        <div className="mt-4 space-y-4">
                            <label className="block text-sm font-semibold text-slate-700">
                                Rate category
                                <select
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1e3c73] focus:ring-2 focus:ring-[#1e3c73]/20"
                                    defaultValue="user-experience"
                                >
                                    <option value="user-experience">User experience</option>
                                    <option value="venue">Venue</option>
                                    <option value="food">Food</option>
                                    <option value="sound-system">Sound system</option>
                                    <option value="speaker">Speaker</option>
                                    <option value="program-flow">Program flow</option>
                                </select>
                            </label>

                            <div>
                                <p className="text-sm font-semibold text-slate-700">Your rating</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const isActive = star <= feedbackRating;
                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFeedbackRating(star)}
                                                className={cn(
                                                    'inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
                                                    isActive
                                                        ? 'border-[#1e3c73]/30 bg-[#1e3c73]/10 text-[#1e3c73]'
                                                        : 'border-slate-200 text-slate-400 hover:border-[#1e3c73]/40 hover:text-[#1e3c73]',
                                                )}
                                                aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                                            >
                                                <Star className={cn('h-5 w-5', isActive ? 'fill-[#1e3c73]' : '')} />
                                            </button>
                                        );
                                    })}
                                    <span className="text-xs font-medium text-slate-500">
                                        {feedbackRating ? `${feedbackRating}/5` : 'Tap a star'}
                                    </span>
                                </div>
                            </div>

                            <label className="block text-sm font-semibold text-slate-700">
                                Recommendations
                                <textarea
                                    rows={3}
                                    placeholder="Tell us what would make the experience even better..."
                                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1e3c73] focus:ring-2 focus:ring-[#1e3c73]/20"
                                />
                            </label>

                            <Button className="h-11 w-full rounded-2xl bg-[#1e3c73] text-sm font-semibold text-white shadow-lg shadow-[#1e3c73]/30 hover:bg-[#25468a]">
                                Send feedback
                            </Button>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
