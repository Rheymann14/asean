import * as React from 'react';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link, router, useRemember } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import RegisterLayout from '@/layouts/register-layout';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { CalendarRange, Check, CheckCircle2, ChevronsUpDown, Eye, EyeOff, Sparkles } from 'lucide-react';

type CountryOption = {
    id: number;
    code: string;
    name: string;
    flag_url: string | null;
};

type RegistrantTypeOption = {
    id: number;
    name: string;
    slug: string;
};

type ProgrammeOption = {
    id: number;
    title: string;
    description: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
};

type RegisterProps = {
    countries: CountryOption[];
    registrantTypes: RegistrantTypeOption[];
    programmes: ProgrammeOption[];
    status?: string | null;
};

export default function Register({ countries, registrantTypes, programmes, status }: RegisterProps) {
    const [formKey, setFormKey] = React.useState(0);

    const [countryOpen, setCountryOpen] = React.useState(false);
    const [typeOpen, setTypeOpen] = React.useState(false);
    const [programmeOpen, setProgrammeOpen] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [successOpen, setSuccessOpen] = React.useState(false);

    const [country, setCountry] = useRemember<string>('', 'register.country');
    const [registrantType, setRegistrantType] = useRemember<string>('', 'register.registrant_type');
    const [programmeIds, setProgrammeIds] = useRemember<string[]>([], 'register.programme_ids');

    const selectedCountry = React.useMemo(
        () => countries.find((c) => String(c.id) === country) ?? null,
        [countries, country]
    );

    const filteredRegistrantTypes = React.useMemo(
        () => registrantTypes.filter((type) => type.name !== 'CHED' && type.slug !== 'ched'),
        [registrantTypes]
    );

    const selectedType = React.useMemo(
        () => filteredRegistrantTypes.find((t) => String(t.id) === registrantType) ?? null,
        [registrantType, filteredRegistrantTypes]
    );

    const selectedProgrammes = React.useMemo(
        () => programmes.filter((programme) => programmeIds.includes(String(programme.id))),
        [programmeIds, programmes]
    );

    const formattedProgrammeLabel = React.useMemo(() => {
        if (!selectedProgrammes.length) {
            return 'Select events to join…';
        }

        if (selectedProgrammes.length === 1) {
            return selectedProgrammes[0].title;
        }

        return `${selectedProgrammes.length} events selected`;
    }, [selectedProgrammes]);

    const resetFormState = React.useCallback(() => {
        // Force remount to clear uncontrolled inputs
        setFormKey((k) => k + 1);

        setCountry('');
        setRegistrantType('');
        setProgrammeIds([]);
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [setCountry, setProgrammeIds, setRegistrantType]);

    React.useEffect(() => {
        if (status === 'registered') {
            setSuccessOpen(true);
            resetFormState();
        }
    }, [resetFormState, status]);

    const inputClass =
        'h-11 rounded-xl border-slate-200 bg-white shadow-[inset_0_1px_2px_rgba(2,6,23,0.06)] ' +
        'focus-visible:ring-2 focus-visible:ring-[#0033A0]/20';

    const comboboxTriggerClass =
        'h-11 w-full justify-between rounded-xl border border-slate-200 bg-white px-3 ' +
        'shadow-[inset_0_1px_2px_rgba(2,6,23,0.06)] hover:bg-white ' +
        'focus-visible:ring-2 focus-visible:ring-[#0033A0]/20';

    const formatProgrammeDate = (value?: string | null) => {
        if (!value) {
            return 'TBA';
        }

        return new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <RegisterLayout>
            <Head title="Register" />

            {/* Header */}
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#0033A0]/30 focus:ring-offset-2"
                    aria-label="Go to home"
                >
                    <img
                        src="/img/asean_banner_logo.png"
                        alt="ASEAN Philippines 2026"
                        className="h-10 w-auto object-contain transition-opacity hover:opacity-90 sm:h-12 md:h-14"
                        draggable={false}
                        loading="lazy"
                    />
                </Link>

                <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-700/90 sm:text-3xl">
                    <span className="relative inline-block">
                        <span className="relative z-10">Participant Registration</span>
                    </span>
                </h1>

            </div>

            <Form
                key={formKey}
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                onSuccess={() => {
                    resetFormState();
                    setSuccessOpen(true);
                }}
            >

                {({ processing, errors }) => {
                    const err = errors as Record<string, string | undefined>;

                    return (
                        <>
                            {/* Card */}
                            <div
                                className={cn(
                                    'relative rounded-2xl border border-slate-200/70 bg-white/70 p-6',
                                    'shadow-[0_18px_50px_-40px_rgba(2,6,23,0.35)] backdrop-blur-xl',
                                    'ring-1 ring-white/40'
                                )}
                            >


                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="country_id">Country</Label>
                                        <input type="hidden" name="country_id" value={country} />

                                        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={countryOpen}
                                                    className={comboboxTriggerClass}
                                                    tabIndex={1}
                                                >
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        {selectedCountry ? (
                                                            <>
                                                                {selectedCountry.flag_url ? (
                                                                    <img
                                                                        src={selectedCountry.flag_url}
                                                                        alt=""
                                                                        className="h-6 w-6 shrink-0 rounded-md border border-slate-200 object-cover"
                                                                        loading="lazy"
                                                                        draggable={false}
                                                                    />
                                                                ) : (
                                                                    <span className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                                                                        {selectedCountry.code}
                                                                    </span>
                                                                )}
                                                                <span className="truncate">{selectedCountry.name}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground">Select country…</span>
                                                        )}
                                                    </span>
                                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="w-[--radix-popover-trigger-width] p-0"
                                                align="start"
                                            >
                                                <Command>
                                                    <CommandInput placeholder="Search country…" />
                                                    <CommandEmpty>No country found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {countries.map((item) => (
                                                            <CommandItem
                                                                key={item.id}
                                                                value={item.name}
                                                                onSelect={() => {
                                                                    setCountry(String(item.id));
                                                                    setCountryOpen(false);
                                                                }}
                                                                className="gap-2"
                                                            >
                                                                {item.flag_url ? (
                                                                    <img
                                                                        src={item.flag_url}
                                                                        alt=""
                                                                        className="h-6 w-6 shrink-0 rounded-md border border-slate-200 object-cover"
                                                                        loading="lazy"
                                                                        draggable={false}
                                                                    />
                                                                ) : (
                                                                    <span className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                                                                        {item.code}
                                                                    </span>
                                                                )}
                                                                <span className="truncate">{item.name}</span>
                                                                <Check
                                                                    className={cn(
                                                                        'ml-auto h-4 w-4',
                                                                        country === String(item.id) ? 'opacity-100' : 'opacity-0'
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <InputError message={err.country_id ?? err.country} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={2}
                                            autoComplete="name"
                                            name="name"
                                            placeholder="Full name"
                                            className={inputClass}
                                        />
                                        <InputError message={err.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            tabIndex={3}
                                            autoComplete="email"
                                            name="email"
                                            placeholder="email@example.com"
                                            className={inputClass}
                                        />
                                        <InputError message={err.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_number">Contact number</Label>
                                        <Input
                                            id="contact_number"
                                            type="tel"
                                            required
                                            tabIndex={4}
                                            autoComplete="tel"
                                            name="contact_number"
                                            inputMode="numeric"

                                            placeholder="e.g. 09123456789"
                                            className={inputClass}
                                            onInput={(event) => {
                                                event.currentTarget.value = event.currentTarget.value.replace(
                                                    /[^0-9]/g,
                                                    ''
                                                );
                                            }}
                                        />
                                        <InputError message={err.contact_number} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="user_type_id">Registrant Type</Label>
                                        <input type="hidden" name="user_type_id" value={registrantType} />

                                        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={typeOpen}
                                                    className={comboboxTriggerClass}
                                                    tabIndex={5}
                                                >
                                                    <span className="truncate">
                                                        {selectedType ? (
                                                            selectedType.name
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Select registrant type…
                                                            </span>
                                                        )}
                                                    </span>
                                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="w-[--radix-popover-trigger-width] p-0"
                                                align="start"
                                            >
                                                <Command>
                                                    <CommandInput placeholder="Search type…" />
                                                    <CommandEmpty>No type found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredRegistrantTypes.map((item) => (
                                                            <CommandItem
                                                                key={item.id}
                                                                value={item.name}
                                                                onSelect={() => {
                                                                    setRegistrantType(String(item.id));
                                                                    setTypeOpen(false);
                                                                }}
                                                            >
                                                                {item.name}
                                                                <Check
                                                                    className={cn(
                                                                        'ml-auto h-4 w-4',
                                                                        registrantType === String(item.id)
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <InputError message={err.user_type_id ?? err.registrant_type} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="programme_ids">Select events to join</Label>
                                        {programmeIds.map((id) => (
                                            <input key={id} type="hidden" name="programme_ids[]" value={id} />
                                        ))}

                                        <Popover open={programmeOpen} onOpenChange={setProgrammeOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={programmeOpen}
                                                    className={comboboxTriggerClass}
                                                    tabIndex={6}
                                                >
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <Sparkles className="h-4 w-4 text-[#0033A0]" />
                                                        <span className="truncate text-left">
                                                            {formattedProgrammeLabel}
                                                        </span>
                                                    </span>
                                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                align="start"
                                                sideOffset={8}
                                                className={cn(
                                                    'p-0',
                                                    // ✅ responsive width: never exceed viewport, and keep it compact on desktop
                                                    'w-[min(calc(100vw-1.5rem),var(--radix-popover-trigger-width))]',
                                                    'sm:w-[520px]'
                                                )}
                                            >
                                                <Command className="overflow-hidden rounded-xl">
                                                    <CommandInput placeholder="Search events…" />

                                                    <CommandEmpty>No events found.</CommandEmpty>

                                                    {/* ✅ scrollable list (mobile friendly) */}
                                                    <CommandList className="max-h-[320px] overflow-auto sm:max-h-[380px]">
                                                        <CommandGroup>
                                                            {programmes.map((item) => {
                                                                const isSelected = programmeIds.includes(String(item.id));

                                                                return (
                                                                    <CommandItem
                                                                        key={item.id}
                                                                        value={`${item.title} ${item.description ?? ''}`}
                                                                        onSelect={() => {
                                                                            setProgrammeIds((prev) => {
                                                                                const next = new Set(prev);
                                                                                const id = String(item.id);

                                                                                if (next.has(id)) next.delete(id);
                                                                                else next.add(id);

                                                                                return Array.from(next);
                                                                            });
                                                                        }}
                                                                        className="items-start gap-3"
                                                                    >
                                                                        {/* ✅ show check ONLY when selected */}
                                                                        <span
                                                                            className={cn(
                                                                                'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                                                                                isSelected
                                                                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                                                                    : 'border-slate-200 bg-white'
                                                                            )}
                                                                        >
                                                                            {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                                                                        </span>

                                                                        <div className="min-w-0 flex-1 space-y-2">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <span className="min-w-0 truncate font-medium text-slate-700">
                                                                                    {item.title}
                                                                                </span>

                                                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                                                    <CalendarRange className="h-3 w-3" />
                                                                                    {formatProgrammeDate(item.starts_at)}
                                                                                </Badge>

                                                                                <Badge variant="outline" className="border-slate-200 text-slate-500">
                                                                                    Ends {formatProgrammeDate(item.ends_at)}
                                                                                </Badge>
                                                                            </div>

                                                                            {item.description && (
                                                                                <p className="text-sm text-slate-500 break-words">
                                                                                    {item.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>

                                                    {/* ✅ tiny footer so users can close on mobile easily */}
                                                    <div className="flex items-center justify-between border-t bg-white/70 px-3 py-2">
                                                        <p className="text-xs text-slate-500">
                                                            {programmeIds.length ? `${programmeIds.length} selected` : 'Select one or more events'}
                                                        </p>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="h-8 rounded-lg px-2 text-xs"
                                                            onClick={() => setProgrammeOpen(false)}
                                                        >
                                                            Done
                                                        </Button>
                                                    </div>
                                                </Command>
                                            </PopoverContent>

                                        </Popover>

                                        <InputError message={err.programme_ids ?? err['programme_ids.0']} />
                                        {selectedProgrammes.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProgrammes.map((programme) => (
                                                    <Badge
                                                        key={programme.id}
                                                        variant="secondary"
                                                        className="bg-[#0033A0]/10 text-[#0033A0]"
                                                    >
                                                        {programme.title}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    tabIndex={7}
                                                    autoComplete="new-password"
                                                    name="password"
                                                    placeholder="Password"
                                                    className={cn(inputClass, 'pr-10')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <InputError message={err.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirm password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    required
                                                    tabIndex={8}
                                                    autoComplete="new-password"
                                                    name="password_confirmation"
                                                    placeholder="Confirm password"
                                                    className={cn(inputClass, 'pr-10')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                                                    aria-label={
                                                        showConfirmPassword
                                                            ? 'Hide password confirmation'
                                                            : 'Show password confirmation'
                                                    }
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <InputError message={err.password_confirmation} />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-1 h-11 w-full rounded-xl bg-[#0033A0] text-white shadow-sm hover:bg-[#002b86]"
                                        tabIndex={9}
                                        data-test="register-user-button"
                                    >
                                        {processing && <Spinner />}
                                        Register
                                    </Button>
                                    <div className="mt-8 text-center text-sm text-muted-foreground">
                                        Already have an account?{' '}
                                        <TextLink href={login()} tabIndex={10}>
                                            Log in
                                        </TextLink>
                                    </div>
                                </div>
                            </div>

                            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                                <DialogContent className="max-w-md rounded-2xl border-none bg-gradient-to-br from-[#E8F0FF] via-white to-[#F5FBFF]">
                                    <DialogHeader className="items-center text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0033A0] text-white shadow-lg shadow-[#0033A0]/20">
                                            <CheckCircle2 className="h-7 w-7" />
                                        </div>

                                        <DialogTitle className="text-xl text-slate-800">You’re all set! 🎉</DialogTitle>

                                        <DialogDescription className="text-sm text-slate-600">
                                            Thanks for signing up! ✨ You can now try logging in using the email you provided.

                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter className="sm:justify-center">
                                        <Button
                                            type="button"
                                            className="rounded-full bg-[#0033A0] px-6 text-white hover:bg-[#002b86]"
                                            onClick={() => {
                                                setSuccessOpen(false);
                                                router.visit(login());
                                            }}
                                        >
                                            Got it
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    );
                }}
            </Form>
        </RegisterLayout>
    );
}
