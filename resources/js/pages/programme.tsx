import * as React from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';

type FlexHoverItem = {
    title: string;
    subtitle: string;
    body: string;
    image: string;
    tint: string; // light gradient tint
    cta?: { label: string; href: string };
};

function LightFlexHoverCards({ items }: { items: FlexHoverItem[] }) {
    const [active, setActive] = React.useState<number | null>(null);

    const CARD_H = 'h-[420px] sm:h-[440px] lg:h-[460px]';
    const RIGHT_IMG_H = 'h-[180px] sm:h-[200px] lg:h-[220px]';

    // ✅ Same “smooth sliding” feel as your ASEAN flags slider (Embla + AutoScroll)
    const autoScroll = React.useMemo(
        () =>
            AutoScroll({
                playOnInit: true,
                speed: 1.15,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
        []
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: 'start',
            dragFree: true,
            containScroll: 'trimSnaps',
        },
        [autoScroll]
    );



    // When hover expands/shrinks slides, reInit keeps Embla smooth + accurate
    React.useEffect(() => {
        if (!emblaApi) return;
        emblaApi.reInit();
    }, [emblaApi, active]);

    const onMouseLeave = React.useCallback(() => {
        setActive(null);
        autoScroll.play();
        emblaApi?.reInit();
    }, [autoScroll, emblaApi]);

    return (
        <div className="mt-12">
            <div className="relative" onMouseLeave={onMouseLeave}>
                {/* ... keep fades + embla viewport code the same */}

                <div ref={emblaRef} className="overflow-hidden">
                    <div className="flex -ml-5">
                        {items.map((item, i) => {
                            const isActive = active === i;
                            const isCollapsed = active !== null && !isActive;

                            const slideBasis =
                                active === null
                                    ? 'md:basis-1/3'
                                    : isActive
                                      ? 'md:basis-[62%]'
                                      : 'md:basis-[19%]';

                            return (
                                <div
                                    key={item.title}
                                    className={cn(
                                        'pl-5 shrink-0 grow-0',
                                        'basis-[88%] sm:basis-[72%]',
                                        slideBasis,
                                        'transition-[flex-basis] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]'
                                    )}
                                >
                                    <div
                                        onMouseEnter={() => {
                                            setActive(i);
                                            autoScroll.stop();
                                            emblaApi?.scrollTo(i);
                                        }}
                                        className={cn(
                                            'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white',
                                            CARD_H, // ✅ was h-[520px]
                                            'shadow-[0_22px_70px_-55px_rgba(2,6,23,0.25)]',
                                            'transition-[transform,box-shadow] duration-500 ease-out',
                                            'hover:-translate-y-0.5 hover:shadow-[0_30px_90px_-65px_rgba(2,6,23,0.35)]',
                                            'motion-reduce:transition-none motion-reduce:hover:translate-y-0'
                                        )}
                                    >
                                        {/* soft tint */}
                                        <div className={cn('absolute inset-0', item.tint)} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/25 to-white/70" />
                                        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />

                                        {/* COLLAPSED */}
                                        <div
                                            className={cn(
                                                'absolute inset-0',
                                                isCollapsed ? 'opacity-100' : 'opacity-0',
                                                'transition-opacity duration-500'
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

                                            
                                        </div>

                                        {/* EXPANDED / DEFAULT */}
                                        <div
                                            className={cn(
                                                'relative h-full p-6 md:p-7', // ✅ was p-8
                                                active === null ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-0',
                                                'transition-opacity duration-300'
                                            )}
                                        >
                                            <div className="text-sm font-semibold text-slate-900">{item.title}</div>

                                            <div className="mt-4 grid h-[calc(100%-56px)] grid-cols-[1fr_1.15fr] gap-8">
                                                {/* left */}
                                                <div className="min-w-0">
                                                    <p className="text-xl md:text-2xl font-semibold leading-snug text-slate-900">
                                                        {item.subtitle}
                                                    </p>

                                                    <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-slate-600">
                                                        {item.body}
                                                    </p>

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {['Plenary', 'Tracks', 'Workshops'].map((t) => (
                                                            <span
                                                                key={t}
                                                                className="rounded-xl bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                                                            >
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* right */}
                                                <div className="relative">
                                                    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_18px_50px_-35px_rgba(2,6,23,0.22)]">
                                                        <div className="p-3 md:p-4">
                                                            <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.title}
                                                                    className={cn('w-full object-cover', RIGHT_IMG_H)} // ✅ was h-[260px]
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

                                                    {item.cta ? (
                                                        <Button
                                                            asChild
                                                            className="absolute bottom-0 right-0 translate-y-[12px] h-11 rounded-2xl bg-[#0033A0] text-white shadow-lg hover:bg-[#0033A0]/95"
                                                        >
                                                            <a href={item.cta.href}>
                                                                {item.cta.label}
                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                            </a>
                                                        </Button>
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

                {/* ... keep controls the same */}
            </div>
        </div>
    );
}

export default function Programme() {
    const items: FlexHoverItem[] = [
        {
            title: 'Day 1',
            subtitle: 'Event 1',
            body: 'Registration, opening ceremonies, and plenary discussions that set the agenda and align participants for the programme.',
            image: '/img/bg.png',
            tint: 'bg-gradient-to-br from-[#dbeafe] via-white to-[#fef9c3]',
            cta: { label: 'View more', href: '#opening' },
        },
        {
            title: 'Day 2',
            subtitle: 'Event 2',
            body: 'Track-based panels and guided discussions. Share insights, build outputs, and align next steps across participating groups.',
            image: '/img/bg.png',
            tint: 'bg-gradient-to-br from-[#dcfce7] via-white to-[#cffafe]',
            cta: { label: 'View more', href: '#sessions' },
        },
        {
            title: 'Day 3',
            subtitle: 'Event 3',
            body: 'Facilitated activities for planning, drafting commitments, and building outputs participants can bring back to their institutions.',
            image: '/img/bg.png',
            tint: 'bg-gradient-to-br from-[#fce7f3] via-white to-[#e0e7ff]',
            cta: { label: 'View more', href: '#workshops' },
        },
        {
            title: 'Day 4',
            subtitle: 'Event 4',
            body: 'Key moments, official updates, and downloadable references—kept in one place for participants and partners.',
            image: '/img/bg.png',
            tint: 'bg-gradient-to-br from-[#ffedd5] via-white to-[#e2e8f0]',
            cta: { label: 'View more', href: '#highlights' },
        },
    ];

    return (
        <>
            <Head title="Programme" />

            <PublicLayout navActive="/programme">
                <section className="relative isolate mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
                    <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#0033A0]/10 blur-3xl" />
                    <div aria-hidden className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-[#FCD116]/15 blur-3xl" />

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

                    <LightFlexHoverCards items={items} />
                </section>
            </PublicLayout>
        </>
    );
}
