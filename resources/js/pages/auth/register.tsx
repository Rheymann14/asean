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
import RegisterLayout from '@/layouts/register-layout';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Eye, EyeOff, Info } from 'lucide-react';

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

type RegisterProps = {
    countries: CountryOption[];
    registrantTypes: RegistrantTypeOption[];
};

export default function Register({ countries, registrantTypes }: RegisterProps) {
    const [countryOpen, setCountryOpen] = React.useState(false);
    const [typeOpen, setTypeOpen] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const [country, setCountry] = useRemember<string>('', 'register.country');
    const [registrantType, setRegistrantType] = useRemember<string>('', 'register.registrant_type');

    const selectedCountry = React.useMemo(
        () => countries.find((c) => String(c.id) === country) ?? null,
        [countries, country]
    );

    const selectedType = React.useMemo(
        () => registrantTypes.find((t) => String(t.id) === registrantType) ?? null,
        [registrantType, registrantTypes]
    );

    const inputClass =
        'h-11 rounded-xl border-slate-200 bg-white shadow-[inset_0_1px_2px_rgba(2,6,23,0.06)] ' +
        'focus-visible:ring-2 focus-visible:ring-[#0033A0]/20';

    const comboboxTriggerClass =
        'h-11 w-full justify-between rounded-xl border border-slate-200 bg-white px-3 ' +
        'shadow-[inset_0_1px_2px_rgba(2,6,23,0.06)] hover:bg-white ' +
        'focus-visible:ring-2 focus-visible:ring-[#0033A0]/20';

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
                <p className="text-sm text-slate-500">
                    Join the ASEAN Philippines 2026 initiative with a quick registration.
                </p>
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
                            <div
                                className={cn(
                                    'relative rounded-2xl border border-slate-200/70 bg-white/70 p-6',
                                    'shadow-[0_18px_50px_-40px_rgba(2,6,23,0.35)] backdrop-blur-xl',
                                    'ring-1 ring-white/40'
                                )}
                            >

                                
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
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="e.g. 639123456789"
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
                                                        tabIndex={4}
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
                                                                <span className="text-muted-foreground">
                                                                    Select country…
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
                                                                            country === String(item.id)
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

                                            <InputError message={err.country_id ?? err.country} />
                                        </div>
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
                                                        {registrantTypes.map((item) => (
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

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    tabIndex={6}
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
                                                    tabIndex={7}
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
                                        tabIndex={8}
                                        data-test="register-user-button"
                                    >
                                        {processing && <Spinner />}
                                        Register
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-8 text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <TextLink href={login()} tabIndex={9}>
                                    Log in
                                </TextLink>
                            </div>
                        </>
                    );
                }}
            </Form>
        </RegisterLayout>
    );
}
