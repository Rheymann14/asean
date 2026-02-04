import * as React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronDown, CircleCheck, CircleX, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProgrammeRow = {
    id: number;
    title: string;
    description: string;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
};

type AttendanceEntry = {
    programme_id: number;
    scanned_at: string | null;
};

type Participant = {
    id: number;
    name: string;
    email: string;
    display_id: string;
};

type PageProps = {
    participant: Participant;
    programmes: ProgrammeRow[];
    attendance_entries: AttendanceEntry[];
    selected_programme_id?: number | null;
    errors?: Record<string, string>;
};

function formatEventWindow(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt) return 'Date TBD';
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

export default function EventKitSurvey() {
    const { participant, programmes, attendance_entries, selected_programme_id, errors } = usePage<PageProps>().props;
    const [open, setOpen] = React.useState(false);
    const form = useForm({
        programme_id: selected_programme_id ?? '',
        rating: '',
        recommend: '',
        feedback: '',
    });

    const attendanceByProgramme = React.useMemo(
        () => new Map(attendance_entries.map((entry) => [entry.programme_id, entry.scanned_at])),
        [attendance_entries],
    );
    const selectedProgrammeId = form.data.programme_id
        ? Number(form.data.programme_id)
        : selected_programme_id ?? null;
    const selectedProgramme = programmes.find((programme) => programme.id === selectedProgrammeId) ?? null;

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/event-kit/survey');
    };

    const ratingOptions = [1, 2, 3, 4, 5];

    return (
        <>
            <Head title="Event Questionnaire" />
            <PublicLayout navActive="/event">
                <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <Badge variant="outline">Event Kit</Badge>
                            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                                Event questionnaire
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Please complete the questionnaire before accessing the event kit materials.
                            </p>
                        </div>
                        <Card className="border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{participant.name}</div>
                            <div>{participant.display_id}</div>
                            <div className="text-slate-500 dark:text-slate-400">{participant.email}</div>
                        </Card>
                    </div>

                    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <Card className="border-slate-200/70 bg-white/70 p-6 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="space-y-5">
                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Select event attended
                                    </label>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                        Search or pick the event you attended for attendance verification.
                                    </p>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    'mt-3 h-11 w-full justify-between rounded-xl border-slate-200 bg-white/80 text-left',
                                                    'dark:border-slate-700 dark:bg-slate-900/60',
                                                    errors?.programme_id && 'border-rose-500',
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedProgramme ? selectedProgramme.title : 'Choose an event'}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search events..." />
                                                <CommandList>
                                                    <CommandEmpty>No events found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {programmes.map((programme) => {
                                                            const scannedAt = attendanceByProgramme.get(programme.id) ?? null;
                                                            const isSelected = programme.id === selectedProgrammeId;
                                                            return (
                                                                <CommandItem
                                                                    key={programme.id}
                                                                    value={programme.title}
                                                                    onSelect={() => {
                                                                        form.setData('programme_id', programme.id);
                                                                        setOpen(false);
                                                                    }}
                                                                >
                                                                    <div className="flex w-full flex-col gap-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                                {programme.title}
                                                                            </span>
                                                                            {isSelected ? (
                                                                                <CircleCheck className="h-4 w-4 text-emerald-500" />
                                                                            ) : null}
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                            <span>{formatEventWindow(programme.starts_at, programme.ends_at)}</span>
                                                                            {programme.location ? <span>• {programme.location}</span> : null}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-[11px]">
                                                                            {scannedAt ? (
                                                                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                                                                    <CircleCheck className="h-3 w-3" />
                                                                                    Checked-in
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 text-rose-500">
                                                                                    <CircleX className="h-3 w-3" />
                                                                                    No attendance
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors?.programme_id ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.programme_id}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Overall event rating
                                    </label>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {ratingOptions.map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => form.setData('rating', String(rating))}
                                                className={cn(
                                                    'h-10 w-10 rounded-xl border text-sm font-semibold transition',
                                                    form.data.rating === String(rating)
                                                        ? 'border-[#0033A0] bg-[#0033A0] text-white'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#0033A0]/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200',
                                                )}
                                            >
                                                {rating}
                                            </button>
                                        ))}
                                    </div>
                                    {errors?.rating ? <p className="mt-2 text-xs text-rose-500">{errors.rating}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Would you recommend this event?
                                    </label>
                                    <div className="mt-3 flex gap-2">
                                        {['yes', 'no'].map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => form.setData('recommend', option)}
                                                className={cn(
                                                    'h-10 flex-1 rounded-xl border text-sm font-semibold capitalize transition',
                                                    form.data.recommend === option
                                                        ? 'border-[#0033A0] bg-[#0033A0] text-white'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#0033A0]/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200',
                                                )}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                    {errors?.recommend ? <p className="mt-2 text-xs text-rose-500">{errors.recommend}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        What should we improve?
                                    </label>
                                    <Textarea
                                        value={form.data.feedback}
                                        onChange={(event) => form.setData('feedback', event.target.value)}
                                        className="mt-3 min-h-[120px]"
                                        placeholder="Share your feedback..."
                                    />
                                    {errors?.feedback ? <p className="mt-2 text-xs text-rose-500">{errors.feedback}</p> : null}
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <Card className="border-slate-200/70 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 rounded-xl bg-[#0033A0]/10 p-2 text-[#0033A0]">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Why we ask
                                        </h2>
                                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                            Your responses help us confirm attendance and improve future programmes. Once submitted,
                                            you can access the event kit and certificates.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Button
                                type="submit"
                                className="h-11 w-full bg-[#0033A0] text-white hover:bg-[#0033A0]/90"
                                disabled={form.processing}
                            >
                                Submit questionnaire
                            </Button>
                        </div>
                    </form>
                </section>
            </PublicLayout>
        </>
    );
}
