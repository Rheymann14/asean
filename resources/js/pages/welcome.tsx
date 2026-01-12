// resources/js/pages/asean_welcome.tsx
import { Button } from '@/components/ui/button';
import PublicLayout, { PUBLIC_NAV_ITEMS } from '@/layouts/public-layout';
import { cn, resolveUrl } from '@/lib/utils';
import { register } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import {
    animate,
    AnimatePresence,
    easeOut,
    motion,
    MotionValue,
    useAnimationFrame,
    useMotionValue,
    useScroll,
    useTransform,
} from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    MessageCircle,
    Star,
    X,
} from 'lucide-react';
import * as React from 'react';

// --- TYPES ---
type FlagItem = { name: string; src: string };
type AccessoryItem = { id: number; title: string; src: string; description?: string; price?: string };

// --- DATA ---
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

// Sample images with titles for the 3D ring
const ACCESSORY_ITEMS: AccessoryItem[] = [
    { id: 1, title: 'Official Summit Lanyard', price: '₱150.00', description: 'High-quality woven lanyard with safety breakaway and metal swivel hook. Features the official ASEAN 2026 pattern.', src: 'img/leaders/pbbm.jpg' },
    { id: 2, title: 'Delegate Notebook', price: '₱350.00', description: 'Hardcover Moleskine-style notebook with debossed logo. 200 lined pages of premium ivory paper.', src: 'img/leaders/ched-chair.jpg' },
    { id: 3, title: 'Commemorative Pin', price: '₱120.00', description: 'Gold-plated enamel pin featuring the summit logo. A perfect collectible for delegates.', src: 'img/leaders/ched-commissioner.jpg' },
    { id: 4, title: 'Official Summit Lanyard', price: '₱150.00', description: 'High-quality woven lanyard with safety breakaway and metal swivel hook. Features the official ASEAN 2026 pattern.', src: 'img/leaders/pbbm.jpg' },
    { id: 5, title: 'Delegate Notebook', price: '₱350.00', description: 'Hardcover Moleskine-style notebook with debossed logo. 200 lined pages of premium ivory paper.', src: 'img/leaders/ched-chair.jpg' },
    { id: 6 , title: 'Commemorative Pin', price: '₱120.00', description: 'Gold-plated enamel pin featuring the summit logo. A perfect collectible for delegates.', src: 'img/leaders/ched-commissioner.jpg' },

];

// Split flags for left/right groups
const LEFT_FLAGS = ASEAN_FLAGS.slice(0, 5);
const RIGHT_FLAGS = ASEAN_FLAGS.slice(5, 10);

/**
 * --------------------------------------------------------------------------
 * HERO SECTION COMPONENTS
 * --------------------------------------------------------------------------
 */

function FlyingFlag({
    flag,
    index,
    side,
    progress,
}: {
    flag: FlagItem;
    index: number;
    side: 'left' | 'right';
    progress: MotionValue<number>;
}) {
    // --- CUSTOM COORDINATES FOR "CLUSTER" EFFECT ---

    // X-AXIS:
    // Left Group Indices: 0=Brunei, 1=Thailand, 2=Myanmar, 3=Laos, 4=Indonesia
    // We pull Index 0 (Brunei) and Index 2 (Myanmar) inside to ~280px/360px.
    // We push others further out to ~500px+ to fill the space.
    const targetX = side === 'left'
        ? [-280, -620, -380, -540, -460][index]
        : [280, 620, 380, 540, 460][index]; // Mirrored for right side

    // Y-AXIS:
    // Adjusted specifically to prevent overlap now that X positions have changed.
    // Index 0 (Inner) -> High (-140)
    // Index 1 (Outer) -> Low (40)
    // Index 2 (Inner) -> Low (120)
    // Index 3 (Outer) -> High (-100)
    // Index 4 (Mid) -> Mid (0)
    const targetY = [-140, 40, 120, -100, 0][index];

    // ROTATION: Random tilts
    const targetRotate = side === 'left'
        ? [-12, 5, -8, 10, -4][index]
        : [12, -5, 8, -10, 4][index];

    // Map scroll progress
    const x = useTransform(progress, [0, 0.6], [0, targetX]);
    const y = useTransform(progress, [0, 0.6], [0, targetY]);
    const rotate = useTransform(progress, [0, 0.6], [0, targetRotate]);
    const opacity = useTransform(progress, [0, 0.05, 0.2], [0, 0, 1]);
    const scale = useTransform(progress, [0, 0.3], [0.4, 0.8]);

    return (
        <motion.div
            style={{ x, y, rotate, scale, opacity }}
            className={cn(
                'absolute transition-all duration-300 hover:z-50 hover:scale-100',
                `z-${(5 - index) * 10}`,
            )}
        >
            <div className="w-24 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/60 sm:w-32 md:w-36">
                <img
                    src={flag.src}
                    alt={flag.name}
                    className="aspect-[3/2] h-full w-full object-cover"
                    draggable={false}
                />
            </div>
        </motion.div>
    );
}

function HeroStickyParallax() {
    const targetRef = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start start', 'end end'],
    });

    const logoScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.85]);
    const textOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);
    const textY = useTransform(scrollYProgress, [0.4, 0.7], [30, 0]);

    return (
        <section ref={targetRef} className="relative h-[250vh]">
            <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4">
                <div className="relative flex w-full max-w-7xl flex-col items-center justify-center pb-20">
                    <div className="relative flex h-[350px] w-full items-center justify-center sm:h-[450px]">
                        {/* LEFT FLAGS */}
                        {LEFT_FLAGS.map((flag, i) => (
                            <FlyingFlag
                                key={flag.name}
                                flag={flag}
                                index={i}
                                side="left"
                                progress={scrollYProgress}
                            />
                        ))}
                        {/* RIGHT FLAGS */}
                        {RIGHT_FLAGS.map((flag, i) => (
                            <FlyingFlag
                                key={flag.name}
                                flag={flag}
                                index={i}
                                side="right"
                                progress={scrollYProgress}
                            />
                        ))}
                        {/* CENTER LOGO */}
                        <motion.div
                            style={{ scale: logoScale }}
                            className="z-[60] w-full max-w-3xl px-4"
                        >
                            <img
                                src="/img/asean_banner_logo.png"
                                alt="Banner"
                                className="mx-auto w-full drop-shadow-2xl"
                                draggable={false}
                            />
                        </motion.div>
                    </div>

                    {/* Register section */}
                    <motion.div
                        style={{ opacity: textOpacity, y: textY }}
                        className="relative z-30 mt-2 text-center sm:mt-6"
                    >
                        <p className="text-lg font-semibold tracking-[0.25em] text-slate-700">
                            “Navigating Our Future, Together”
                        </p>
                        <div className="mx-auto mt-8 w-full max-w-md px-4 sm:px-0">
                            <Button
                                asChild
                                size="lg"
                                className="group h-14 w-full rounded-2xl bg-gradient-to-r from-[#1e3c73] via-[#25468a] to-[#1e3c73] px-7 text-base font-semibold shadow-lg transition hover:brightness-110"
                            >
                                <Link
                                    href={register()}
                                    className="inline-flex w-full items-center justify-center gap-2"
                                >
                                    <span className="tracking-wide">

                                        Register Now
                                    </span>
                                    <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/**
 * --------------------------------------------------------------------------
 * MODAL COMPONENT
 * --------------------------------------------------------------------------
 */
function ProductModal({
    item,
    isOpen,
    onClose
}: {
    item: AccessoryItem | null;
    isOpen: boolean;
    onClose: () => void
}) {
    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 z-10 rounded-full bg-black/10 p-2 transition hover:bg-black/20"
                            >
                                <X className="h-5 w-5 text-slate-800" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative h-64 bg-slate-100 md:h-[500px]">
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col justify-center p-8 md:p-12">
                                    <span className="mb-2 text-sm font-bold tracking-wider text-[#1e3c73] uppercase">
                                        Official Merchandise
                                    </span>
                                    <h2 className="mb-4 text-3xl font-bold text-slate-900">
                                        {item.title}
                                    </h2>
                                    <p className="mb-6 text-lg leading-relaxed text-slate-600">
                                        {item.description || 'Premium quality accessory designed for the ASEAN Philippines 2026 Summit.'}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-6">
                                        <span className="text-2xl font-bold text-slate-900">
                                            {item.price || 'Free'}
                                        </span>
                                        <Button className="rounded-full bg-[#1e3c73] px-8 hover:bg-[#25468a]">
                                            Pre-order Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * --------------------------------------------------------------------------
 * 3D RING COMPONENT
 * --------------------------------------------------------------------------
 */

interface ThreeDImageRingProps {
    items: AccessoryItem[];
    width?: number;
    perspective?: number;
    imageDistance?: number;
    initialRotation?: number;
    animationDuration?: number;
    staggerDelay?: number;
    hoverOpacity?: number;
    containerClassName?: string;
    ringClassName?: string;
    imageClassName?: string;
    draggable?: boolean;
    ease?: string;
    mobileBreakpoint?: number;
    mobileScaleFactor?: number;
    inertiaPower?: number;
    inertiaTimeConstant?: number;
    inertiaVelocityMultiplier?: number;
    onItemClick: (item: AccessoryItem) => void;
}

function ThreeDImageRing({
    items,
    width = 300,
    perspective = 2000,
    imageDistance = 500,
    initialRotation = 180,
    animationDuration = 1.5,
    staggerDelay = 0.1,
    hoverOpacity = 0.5,
    containerClassName,
    ringClassName,
    imageClassName,
    draggable = true,
    ease = 'easeOut',
    mobileBreakpoint = 768,
    mobileScaleFactor = 0.8,
    inertiaPower = 0.8,
    inertiaTimeConstant = 300,
    inertiaVelocityMultiplier = 20,
    onItemClick,
}: ThreeDImageRingProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const ringRef = React.useRef<HTMLDivElement>(null);

    const rotationY = useMotionValue(initialRotation);
    const startX = React.useRef<number>(0);
    const currentRotationY = React.useRef<number>(initialRotation);
    const isDragging = React.useRef<boolean>(false);
    const velocity = React.useRef<number>(0);
    const [isHovering, setIsHovering] = React.useState(false);

    const [currentScale, setCurrentScale] = React.useState(1);
    const [showImages, setShowImages] = React.useState(false);

    const angle = React.useMemo(() => 360 / items.length, [items.length]);

    const getBgPos = (
        imageIndex: number,
        currentRot: number,
        scale: number,
    ) => {
        const scaledImageDistance = imageDistance * scale;
        const effectiveRotation = currentRot - 180 - imageIndex * angle;
        const parallaxOffset = ((effectiveRotation % 360) + 360) % 360 / 360;
        return `${-(parallaxOffset * (scaledImageDistance / 1.5))}px 0px`;
    };

    useAnimationFrame((t, delta) => {
        if (!isDragging.current && velocity.current === 0 && !isHovering) {
            const newRot = rotationY.get() + 0.015 * delta;
            rotationY.set(newRot);
            currentRotationY.current = newRot;
        }
    });

    const updateBgPos = (latestRotation: number) => {
        if (ringRef.current) {
            Array.from(ringRef.current.children).forEach((card, i) => {
                const bgImageDiv = card.querySelector('.ring-card-bg') as HTMLElement;
                if (bgImageDiv) {
                    bgImageDiv.style.backgroundPosition = getBgPos(i, latestRotation, currentScale);
                }
            });
        }
    }

    React.useEffect(() => {
        const unsubscribe = rotationY.on('change', (latestRotation) => {
            updateBgPos(latestRotation);
            currentRotationY.current = latestRotation;
        });
        return () => unsubscribe();
    }, [rotationY, items.length, imageDistance, currentScale, angle]);

    React.useEffect(() => {
        const handleResize = () => {
            const viewportWidth = window.innerWidth;
            const newScale =
                viewportWidth <= mobileBreakpoint ? mobileScaleFactor : 1;
            setCurrentScale(newScale);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [mobileBreakpoint, mobileScaleFactor]);

    React.useEffect(() => {
        setShowImages(true);
    }, []);

    const handleDragStart = (event: React.MouseEvent | React.TouchEvent) => {
        if (!draggable) return;
        isDragging.current = true;
        const clientX =
            'touches' in event ? event.touches[0].clientX : event.clientX;
        startX.current = clientX;
        rotationY.stop();
        velocity.current = 0;
        if (ringRef.current) {
            (ringRef.current as HTMLElement).style.cursor = 'grabbing';
        }
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDrag);
        document.addEventListener('touchend', handleDragEnd);
    };

    const handleDrag = (event: MouseEvent | TouchEvent) => {
        if (!draggable || !isDragging.current) return;
        const clientX =
            'touches' in event
                ? (event as TouchEvent).touches[0].clientX
                : (event as MouseEvent).clientX;
        const deltaX = clientX - startX.current;
        velocity.current = -deltaX * 0.5;
        rotationY.set(currentRotationY.current + velocity.current);
        startX.current = clientX;
    };

    const handleDragEnd = () => {
        isDragging.current = false;
        if (ringRef.current) {
            ringRef.current.style.cursor = 'grab';
            currentRotationY.current = rotationY.get();
        }

        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDrag);
        document.removeEventListener('touchend', handleDragEnd);

        const initial = rotationY.get();
        const velocityBoost = velocity.current * inertiaVelocityMultiplier;
        const target = initial + velocityBoost;

        animate(initial, target, {
            type: 'inertia',
            velocity: velocityBoost,
            power: inertiaPower,
            timeConstant: inertiaTimeConstant,
            restDelta: 0.5,
            modifyTarget: (target) => Math.round(target / angle) * angle,
            onUpdate: (latest) => {
                rotationY.set(latest);
            },
        });

        velocity.current = 0;
    };

    const imageVariants = {
        hidden: { y: 200, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
        },
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                'w-full h-full overflow-visible select-none relative',
                containerClassName,
            )}
            style={{
                transform: `scale(${currentScale})`,
                transformOrigin: 'center center',
            }}
            onMouseDown={draggable ? handleDragStart : undefined}
            onTouchStart={draggable ? handleDragStart : undefined}
        >
            <div
                style={{
                    perspective: `${perspective}px`,
                    width: `${width}px`,
                    height: `${width * 1.33}px`,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <motion.div
                    ref={ringRef}
                    className={cn('w-full h-full absolute', ringClassName)}
                    style={{
                        transformStyle: 'preserve-3d',
                        rotateY: rotationY,
                        cursor: draggable ? 'grab' : 'default',
                    }}
                >
                    <AnimatePresence>
                        {showImages &&
                            items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                    onClick={() => onItemClick(item)}
                                    className={cn(
                                        'group w-full h-full absolute rounded-xl shadow-2xl ring-1 ring-white/20 overflow-hidden bg-slate-900 cursor-pointer',
                                        imageClassName,
                                    )}
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        backfaceVisibility: 'hidden',
                                        rotateY: index * -angle,
                                        z: -imageDistance * currentScale,
                                        transformOrigin: `50% 50% ${imageDistance * currentScale
                                            }px`,
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    variants={imageVariants}
                                    custom={index}
                                    transition={{
                                        delay: index * staggerDelay,
                                        duration: animationDuration,
                                        ease: easeOut,
                                    }}
                                    whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                                >
                                    <div
                                        className="ring-card-bg absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                        style={{
                                            backgroundImage: `url(${item.src})`,
                                            backgroundPosition: getBgPos(index, currentRotationY.current, currentScale),
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-slate-900/30 transition-colors group-hover:bg-slate-900/60" />
                                    </div>

                                    <div className="absolute inset-0 flex flex-col items-center justify-end p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <h3 className="text-center text-lg font-bold text-white drop-shadow-md mb-4">
                                            {item.title}
                                        </h3>
                                        <Button size="sm" className="rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm shadow-lg border border-white/30">
                                            View Details
                                        </Button>
                                    </div>

                                </motion.div>
                            ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * --------------------------------------------------------------------------
 * MAIN PAGE
 * --------------------------------------------------------------------------
 */

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const [selectedAccessory, setSelectedAccessory] = React.useState<AccessoryItem | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);

    const sectionNavItems = React.useMemo(
        () => PUBLIC_NAV_ITEMS.filter((i) => i.href.startsWith('#')),
        [],
    );

    const [feedbackRating, setFeedbackRating] = React.useState(0);
    const [feedbackOpen, setFeedbackOpen] = React.useState(false);
    const [includeUserExperience, setIncludeUserExperience] =
        React.useState(true);
    const [includeEventFeedback, setIncludeEventFeedback] =
        React.useState(false);
    const [recommendations, setRecommendations] = React.useState('');
    const [feedbackStatus, setFeedbackStatus] = React.useState<
        'idle' | 'success' | 'error'
    >('idle');
    const [feedbackMessage, setFeedbackMessage] = React.useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = React.useState(false);
    const [eventRatings, setEventRatings] = React.useState<
        Record<string, number>
    >({});

    const eventCategories = React.useMemo(
        () => ['Venue', 'Food', 'Speaker', 'Program flow', 'Sound system'],
        [],
    );
    const hasEventRatings = React.useMemo(
        () =>
            includeEventFeedback &&
            Object.values(eventRatings).some((value) => value > 0),
        [eventRatings, includeEventFeedback],
    );
    const hasUserExperienceRating = includeUserExperience && feedbackRating > 0;
    const canSubmitFeedback = hasEventRatings || hasUserExperienceRating;

    const handleAccessoryClick = (item: AccessoryItem) => {
        setSelectedAccessory(item);
        setModalOpen(true);
    };

    const sendFeedback = React.useCallback(async () => {
        if (feedbackSubmitting) return;

        if (!canSubmitFeedback) {
            setFeedbackStatus('error');
            setFeedbackMessage(
                'Please add at least one rating before sending your feedback.',
            );
            return;
        }

        setFeedbackSubmitting(true);
        setFeedbackStatus('idle');
        setFeedbackMessage('');

        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';
        const eventRatingsPayload = Object.fromEntries(
            Object.entries(eventRatings).filter(([, value]) => value > 0),
        );

        const payload: Record<string, unknown> = {};

        if (includeUserExperience && feedbackRating > 0) {
            payload.user_experience_rating = feedbackRating;
        }

        if (
            includeEventFeedback &&
            Object.keys(eventRatingsPayload).length > 0
        ) {
            payload.event_ratings = eventRatingsPayload;
        }

        if (recommendations.trim()) {
            payload.recommendations = recommendations.trim();
        }

        try {
            const response = await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message =
                    errorData?.message ||
                    'We could not send your feedback. Please try again.';
                setFeedbackStatus('error');
                setFeedbackMessage(message);
                return;
            }

            setFeedbackStatus('success');
            setFeedbackMessage('Thanks for sharing your feedback!');
            setFeedbackRating(0);
            setEventRatings({});
            setRecommendations('');
        } catch (error) {
            setFeedbackStatus('error');
            setFeedbackMessage(
                'We could not send your feedback. Please try again.',
            );
        } finally {
            setFeedbackSubmitting(false);
        }
    }, [
        canSubmitFeedback,
        eventRatings,
        feedbackRating,
        feedbackSubmitting,
        includeEventFeedback,
        includeUserExperience,
        recommendations,
    ]);

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
                    if (b.intersectionRatio !== a.intersectionRatio)
                        return b.intersectionRatio - a.intersectionRatio;
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

    React.useEffect(() => {
        if (typeof document === 'undefined') return;
        const bodyStyle = document.body.style;
        const originalOverflow = bodyStyle.overflow;
        if (feedbackOpen) bodyStyle.overflow = 'hidden';
        return () => {
            bodyStyle.overflow = originalOverflow;
        };
    }, [feedbackOpen]);

    return (
        <>
            <Head title="">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <PublicLayout
                canRegister={canRegister}
                navActive={activeHref}
                onNavActiveChange={setActiveHref}
                background={
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 scale-[1.03] bg-cover bg-center bg-no-repeat opacity-70 blur-[7px]"
                            style={{
                                backgroundImage: `url(${resolveUrl(
                                    '/img/background.jpg',
                                )})`,
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#9c6700]/15" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/50 to-slate-50" />
                    </div>
                }
            >
                {/* 1. HERO */}
                <HeroStickyParallax />

                {/* 2. 3D RING ACCESSORIES */}
                <section className="h-[600px] w-full overflow-hidden py-20 relative z-30">
                    <div className="mx-auto mb-12 max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl drop-shadow-sm">
                            Event Merchandise
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Exclusive gear for delegates. Hover to view details.
                        </p>
                    </div>
                    <div className="flex h-full w-full items-start justify-center">
                        <ThreeDImageRing
                            items={ACCESSORY_ITEMS}
                            width={280}
                            imageDistance={300}
                            onItemClick={handleAccessoryClick}
                        />
                    </div>
                </section>

                {/* MODAL (Rendered outside to float on top) */}
                <ProductModal
                    item={selectedAccessory}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                />

                {/* 3. FEEDBACK FORM */}
                <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
                    <div
                        className={cn(
                            'w-[280px] max-w-[calc(100vw-2.5rem)] sm:w-[320px]',
                            'transition-all duration-300 ease-out',
                            feedbackOpen
                                ? 'translate-y-0 scale-100 opacity-100'
                                : 'pointer-events-none translate-y-4 scale-95 opacity-0',
                        )}
                    >
                        <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)] ring-1 ring-slate-200/60 backdrop-blur">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.32em] text-[#1e3c73] uppercase">
                                        ASEAN Philippines 2026
                                    </p>

                                    <p className="mt-1 text-xs text-slate-600">
                                        Share your experience to help us elevate
                                        the event.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFeedbackOpen(false)}
                                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-[#1e3c73]/40 hover:text-[#1e3c73]"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-semibold text-slate-700">
                                    Include feedback for
                                </p>
                                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-[#1e3c73]"
                                            checked={includeUserExperience}
                                            onChange={(event) =>
                                                setIncludeUserExperience(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        User experience
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-[#1e3c73]"
                                            checked={includeEventFeedback}
                                            onChange={(event) =>
                                                setIncludeEventFeedback(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        Event
                                    </label>
                                </div>
                            </div>

                            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                                {includeEventFeedback && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">
                                            Event highlights
                                        </p>
                                        <div className="mt-2 space-y-2">
                                            {eventCategories.map((category) => {
                                                const rating =
                                                    eventRatings[category] ?? 0;
                                                return (
                                                    <div
                                                        key={category}
                                                        className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2"
                                                    >
                                                        <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
                                                            {category}
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-1.5">
                                                            {[
                                                                1, 2, 3, 4, 5,
                                                            ].map((star) => {
                                                                const isActive =
                                                                    star <=
                                                                    rating;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            star
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEventRatings(
                                                                                (
                                                                                    current,
                                                                                ) => ({
                                                                                    ...current,
                                                                                    [category]:
                                                                                        star,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            'inline-flex h-8 w-8 items-center justify-center rounded-full border transition',
                                                                            isActive
                                                                                ? 'border-amber-300/60 bg-amber-100/60 text-amber-500'
                                                                                : 'border-slate-200 text-slate-400 hover:border-[#1e3c73]/40 hover:text-[#1e3c73]',
                                                                        )}
                                                                        aria-label={`Rate ${category} ${star} star${star === 1 ? '' : 's'}`}
                                                                    >
                                                                        <Star
                                                                            className={cn(
                                                                                'h-4 w-4',
                                                                                isActive
                                                                                    ? 'fill-amber-400 text-amber-400'
                                                                                    : '',
                                                                            )}
                                                                        />
                                                                    </button>
                                                                );
                                                            })}
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                {rating
                                                                    ? `${rating}/5`
                                                                    : 'Tap a star'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {includeUserExperience && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">
                                            Ease of navigation
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const isActive =
                                                    star <= feedbackRating;
                                                return (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() =>
                                                            setFeedbackRating(
                                                                star,
                                                            )
                                                        }
                                                        className={cn(
                                                            'inline-flex h-8 w-8 items-center justify-center rounded-full border transition',
                                                            isActive
                                                                ? 'border-amber-300/60 bg-amber-100/60 text-amber-500'
                                                                : 'border-slate-200 text-slate-400 hover:border-[#1e3c73]/40 hover:text-[#1e3c73]',
                                                        )}
                                                        aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                                                    >
                                                        <Star
                                                            className={cn(
                                                                'h-4 w-4',
                                                                isActive
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : '',
                                                            )}
                                                        />
                                                    </button>
                                                );
                                            })}
                                            <span className="text-[10px] font-medium text-slate-500">
                                                {feedbackRating
                                                    ? `${feedbackRating}/5`
                                                    : 'Tap a star'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <label className="block text-xs font-semibold text-slate-700">
                                    Recommendations
                                    <textarea
                                        rows={3}
                                        placeholder="Tell us what would make the experience even better..."
                                        value={recommendations}
                                        onChange={(event) =>
                                            setRecommendations(
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition outline-none focus:border-[#1e3c73] focus:ring-2 focus:ring-[#1e3c73]/20"
                                    />
                                </label>
                            </div>
                            <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                                <Button
                                    type="button"
                                    onClick={sendFeedback}
                                    disabled={
                                        !canSubmitFeedback || feedbackSubmitting
                                    }
                                    className="h-10 w-full rounded-2xl bg-[#1e3c73] text-xs font-semibold text-white shadow-lg shadow-[#1e3c73]/30 transition hover:bg-[#25468a] disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {feedbackSubmitting
                                        ? 'Sending...'
                                        : 'Send feedback'}
                                </Button>
                                {feedbackMessage && (
                                    <div
                                        className={cn(
                                            'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                                            feedbackStatus === 'success'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-rose-200 bg-rose-50 text-rose-600',
                                        )}
                                    >
                                        {feedbackStatus === 'success' && (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        <span>{feedbackMessage}</span>
                                        {feedbackStatus === 'success' && (
                                            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] tracking-[0.2em] text-emerald-700 uppercase">
                                                Sent
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setFeedbackOpen((open) => !open)}
                        className="group h-10 rounded-full bg-gradient-to-r from-[#1e3c73] via-[#25468a] to-[#1e3c73] px-4 text-xs font-semibold text-white shadow-lg shadow-[#1e3c73]/30 transition hover:brightness-110"
                    >
                        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                            <MessageCircle className="h-3.5 w-3.5" />
                        </span>
                        {feedbackOpen ? 'Hide feedback' : 'Give feedback'}
                    </Button>
                </div>
            </PublicLayout>
        </>
    );
}
