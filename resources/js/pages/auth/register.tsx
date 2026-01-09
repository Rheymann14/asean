import * as React from 'react';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link, useRemember } from '@inertiajs/react';

import { cn } from '@/lib/utils';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Info } from 'lucide-react';

type CountryOption = {
    value: string;
    label: string;
    flag: string;
};

const ASEAN_COUNTRIES: CountryOption[] = [
    { value: 'brunei', label: 'Brunei Darussalam', flag: '/asean/brunei.jpg' },
    { value: 'cambodia', label: 'Cambodia', flag: '/asean/cambodia.jpg' },
    { value: 'indonesia', label: 'Indonesia', flag: '/asean/indonesia.jpg' },
    { value: 'laos', label: 'Lao PDR', flag: '/asean/laos.jpg' },
    { value: 'malaysia', label: 'Malaysia', flag: '/asean/malaysia.jpg' },
    { value: 'myanmar', label: 'Myanmar', flag: '/asean/myanmar.jpg' },
    { value: 'philippines', label: 'Philippines', flag: '/asean/philippines.jpg' },
    { value: 'singapore', label: 'Singapore', flag: '/asean/singapore.jpg' },
    { value: 'thailand', label: 'Thailand', flag: '/asean/thailand.jpg' },
    { value: 'vietnam', label: 'Viet Nam', flag: '/asean/vietnam.jpg' },
];

const REGISTRANT_TYPES = [
    { value: 'prime_minister', label: 'Prime Minister' },
    { value: 'staff', label: 'Staff' },
] as const;

export default function Register() {
    const [countryOpen, setCountryOpen] = React.useState(false);
    const [typeOpen, setTypeOpen] = React.useState(false);

    const [country, setCountry] = useRemember<string>('', 'register.country');
    const [registrantType, setRegistrantType] = useRemember<string>('', 'register.registrant_type');

    const selectedCountry = React.useMemo(
        () => ASEAN_COUNTRIES.find((c) => c.value === country) ?? null,
        [country]
    );

    const selectedType = React.useMemo(
        () => REGISTRANT_TYPES.find((t) => t.value === registrantType) ?? null,
        [registrantType]
    );

    const inputClass =
        'h-11 rounded-xl border-slate-200 bg-white shadow-[inset_0_1px_2px_rgba(2,6,23,0.06)] ' +
        'focus-visible:ring-2 focus-visible:ring-[#0033A0]/20';

    const comboboxTriggerClass =
        'h-11 w-full justify-between rounded-xl border border-slate-200 bg-white px-3 ' +
        'shadow-[inset_0_1px_2px_rgba(2,6,23,0.06)] hover:bg-white ' +
        'focus-visible:ring-2 focus-visible:ring-[#0033A0]/20';

    return (
        <AuthLayout title="" description="">
            <Head title="Register" />

            {/* ✅ isolate = fixes bg disappearing behind layout */}
            <div className="relative isolate overflow-hidden bg-transparent">
                {/* ✅ BIG BG pinned under the card area */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]"
                >
                    <img
                        src="/img/bg.png"
                        alt=""
                        draggable={false}
                        loading="lazy"
                        className={cn(
                            'w-[min(1600px,125vw)] max-w-none rounded-b-[2rem] sm:rounded-b-[2.5rem]',
                            'opacity-90',
                            '[mask-image:linear-gradient(to_top,black_65%,transparent)]'
                        )}
                    />
                </div>

                {/* ✅ Content above BG */}
                <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 pb-40 sm:py-12">
                    {/* ✅ Under development banner */}
                    <div className="mx-auto mb-6 w-full max-w-3xl">
                        <div
                            role="alert"
                            className={cn(
                                'relative overflow-hidden rounded-2xl border border-[#FCD116]/35 bg-white/70 p-3',
                                'shadow-[0_16px_40px_-28px_rgba(2,6,23,0.35)] backdrop-blur'
                            )}
                        >
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FCD116]/18 via-white/0 to-[#0033A0]/12"
                            />
                            <div className="relative flex items-start gap-3">
                                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FCD116]/20 text-[#0033A0]">
                                    <Info className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">
                                            This page is still under development
                                        </p>
                                     
                                    </div>
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                                       Some fields, validations, and features may change, and some features may not work yet.

                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

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
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => {
                            const err = errors as Record<string, string | undefined>;

                            return (
                                <>
                                    {/* Card */}
                                    <div className="relative rounded-2xl border border-slate-200/70 bg-white/92 p-6 shadow-[0_18px_50px_-40px_rgba(2,6,23,0.35)] backdrop-blur">
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
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
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    name="email"
                                                    placeholder="email@example.com"
                                                    className={inputClass}
                                                />
                                                <InputError message={err.email} />
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="contact_number">Contact number</Label>
                                                    <Input
                                                        id="contact_number"
                                                        type="tel"
                                                        required
                                                        tabIndex={3}
                                                        autoComplete="tel"
                                                        name="contact_number"
                                                        placeholder="e.g. +63 9xx xxx xxxx"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.contact_number} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="country">Country</Label>
                                                    <input type="hidden" name="country" value={country} />

                                                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={countryOpen}
                                                                className={comboboxTriggerClass}
                                                                tabIndex={4}
                                                            >
                                                                <span className="flex min-w-0 items-center gap-2">
                                                                    {selectedCountry ? (
                                                                        <>
                                                                            <img
                                                                                src={selectedCountry.flag}
                                                                                alt=""
                                                                                className="h-6 w-6 shrink-0 rounded-md border border-slate-200 object-cover"
                                                                                loading="lazy"
                                                                                draggable={false}
                                                                            />
                                                                            <span className="truncate">{selectedCountry.label}</span>
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
                                                                    {ASEAN_COUNTRIES.map((item) => (
                                                                        <CommandItem
                                                                            key={item.value}
                                                                            value={item.label}
                                                                            onSelect={() => {
                                                                                setCountry(item.value);
                                                                                setCountryOpen(false);
                                                                            }}
                                                                            className="gap-2"
                                                                        >
                                                                            <img
                                                                                src={item.flag}
                                                                                alt=""
                                                                                className="h-6 w-6 shrink-0 rounded-md border border-slate-200 object-cover"
                                                                                loading="lazy"
                                                                                draggable={false}
                                                                            />
                                                                            <span className="truncate">{item.label}</span>
                                                                            <Check
                                                                                className={cn(
                                                                                    'ml-auto h-4 w-4',
                                                                                    country === item.value ? 'opacity-100' : 'opacity-0'
                                                                                )}
                                                                            />
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>

                                                    <InputError message={err.country} />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="registrant_type">Registrant Type</Label>
                                                <input type="hidden" name="registrant_type" value={registrantType} />

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
                                                                    selectedType.label
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
                                                                {REGISTRANT_TYPES.map((item) => (
                                                                    <CommandItem
                                                                        key={item.value}
                                                                        value={item.label}
                                                                        onSelect={() => {
                                                                            setRegistrantType(item.value);
                                                                            setTypeOpen(false);
                                                                        }}
                                                                    >
                                                                        {item.label}
                                                                        <Check
                                                                            className={cn(
                                                                                'ml-auto h-4 w-4',
                                                                                registrantType === item.value
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

                                                <InputError message={err.registrant_type} />
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="password">Password</Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        required
                                                        tabIndex={6}
                                                        autoComplete="new-password"
                                                        name="password"
                                                        placeholder="Password"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.password} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                                    <Input
                                                        id="password_confirmation"
                                                        type="password"
                                                        required
                                                        tabIndex={7}
                                                        autoComplete="new-password"
                                                        name="password_confirmation"
                                                        placeholder="Confirm password"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.password_confirmation} />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="mt-1 h-11 w-full rounded-xl bg-[#0033A0] text-white shadow-sm hover:bg-[#002b86]"
                                                tabIndex={8}
                                                data-test="register-user-button"
                                            >
                                                {processing && <Spinner />}
                                                Register
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center text-sm text-muted-foreground">
                                        Already have an account? <TextLink href={login()} tabIndex={9}>Log in</TextLink>
                                    </div>
                                </>
                            );
                        }}
                    </Form>
                </div>
            </div>
        </AuthLayout>
    );
}
