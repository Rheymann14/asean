import * as React from 'react';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link, router, useRemember, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarRange, Check, CheckCircle2, ChevronsUpDown, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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

const FOOD_RESTRICTION_OPTIONS = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
    { value: 'gluten_free', label: 'Gluten-free' },
    { value: 'lactose_intolerant', label: 'Lactose intolerant' },
    { value: 'nut_allergy', label: 'Nut allergy' },
    { value: 'seafood_allergy', label: 'Seafood allergy' },
    { value: 'allergies', label: 'Allergies' },
    { value: 'other', label: 'Other' },
] as const;

const ACCESSIBILITY_NEEDS_OPTIONS = [
    { value: 'wheelchair_access', label: 'Wheelchair access' },
    { value: 'sign_language_interpreter', label: 'Sign language interpreter' },
    { value: 'assistive_technology_support', label: 'Assistive technology support' },
    { value: 'other', label: 'Other accommodations' },
] as const;

const HONORIFIC_OPTIONS = [
    { value: 'mr', label: 'Mr.' },
    { value: 'mrs', label: 'Mrs.' },
    { value: 'ms', label: 'Ms.' },
    { value: 'miss', label: 'Miss' },
    { value: 'dr', label: 'Dr.' },
    { value: 'prof', label: 'Prof.' },
    { value: 'other', label: 'Other' },
] as const;

const SEX_ASSIGNED_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
] as const;

const PHONE_CODE_OPTIONS = [
    { value: '+673', label: 'Brunei (+673)' },
    { value: '+855', label: 'Cambodia (+855)' },
    { value: '+62', label: 'Indonesia (+62)' },
    { value: '+856', label: 'Laos (+856)' },
    { value: '+60', label: 'Malaysia (+60)' },
    { value: '+95', label: 'Myanmar (+95)' },
    { value: '+63', label: 'Philippines (+63)' },
    { value: '+65', label: 'Singapore (+65)' },
    { value: '+66', label: 'Thailand (+66)' },
    { value: '+84', label: 'Vietnam (+84)' },
    { value: '+670', label: 'Timor-Leste (+670)' },
] as const;

const COUNTRY_PHONE_CODE_MAP: Record<string, string> = {
    BN: '+673',
    KH: '+855',
    ID: '+62',
    LA: '+856',
    MY: '+60',
    MM: '+95',
    PH: '+63',
    SG: '+65',
    TH: '+66',
    VN: '+84',
    TL: '+670',
};

export default function Register({ countries, registrantTypes, programmes, status }: RegisterProps) {
    const [formKey, setFormKey] = React.useState(0);

    const [currentStep, setCurrentStep] = React.useState(0);
    const page = usePage();
    const serverErrors = (page.props.errors ?? {}) as Record<string, string | undefined>;

    const FIELD_STEP_MAP: Array<{ step: number; fields: string[] }> = [
        {
            step: 0,
            fields: [
                'country_id',
                'honorific_title',
                'honorific_other',
                'given_name',
                'middle_name',
                'family_name',
                'suffix',
                'sex_assigned_at_birth',
            ],
        },
        {
            step: 1,
            fields: [
                'email',
                'contact_country_code',
                'contact_number',
                'organization_name',
                'position_title',
                'user_type_id',
                'other_user_type',
                'programme_ids',
                'programme_ids.0',
            ],
        },
        {
            step: 2,
            fields: ['password', 'password_confirmation'],
        },
        {
            step: 3,
            fields: [
                'dietary_allergies',
                'dietary_other',
                'ip_group_name',
                'accessibility_other',
                'emergency_contact_name',
                'emergency_contact_relationship',
                'emergency_contact_phone',
                'emergency_contact_email',
            ],
        },
        {
            step: 4,
            fields: ['consent_contact_sharing', 'consent_photo_video'],
        },
    ];

    const findStepFromErrors = React.useCallback(
        (errs: Record<string, string | undefined>) => {
            const keys = Object.keys(errs).filter((k) => errs[k]);
            if (!keys.length) return null;

            for (const group of FIELD_STEP_MAP) {
                if (keys.some((k) => group.fields.includes(k))) return group.step;
            }

            return 0;
        },
        [FIELD_STEP_MAP]
    );


    React.useEffect(() => {
        const step = findStepFromErrors(serverErrors);
        if (step === null) return;

        setCurrentStep(step);

        // Wait for DOM to show that step, then report validity to highlight fields
        requestAnimationFrame(() => {
            const form = getFormElement();
            const fieldsets = Array.from(form?.querySelectorAll('fieldset') ?? []) as HTMLFieldSetElement[];
            const target = fieldsets[step];
            target?.reportValidity();

            toast.error('Please check the highlighted fields.');
        });
    }, [serverErrors, findStepFromErrors]);

    const [countryOpen, setCountryOpen] = React.useState(false);
    const [typeOpen, setTypeOpen] = React.useState(false);
    const [programmeOpen, setProgrammeOpen] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [successOpen, setSuccessOpen] = React.useState(false);

    const [consentContact, setConsentContact] = React.useState(false);
    const [consentMedia, setConsentMedia] = React.useState(false);
    const [foodRestrictions, setFoodRestrictions] = useRemember<string[]>([], 'register.food_restrictions');
    const [accessibilityNeeds, setAccessibilityNeeds] = useRemember<string[]>([], 'register.accessibility_needs');
    const [dietaryAllergies, setDietaryAllergies] = useRemember<string>('', 'register.dietary_allergies');
    const [dietaryOther, setDietaryOther] = useRemember<string>('', 'register.dietary_other');
    const [accessibilityOther, setAccessibilityOther] = useRemember<string>('', 'register.accessibility_other');
    const [ipAffiliation, setIpAffiliation] = useRemember<string>('', 'register.ip_affiliation');
    const [ipGroupName, setIpGroupName] = useRemember<string>('', 'register.ip_group_name');
    const [emergencyContactName, setEmergencyContactName] = useRemember<string>('', 'register.emergency_contact_name');
    const [emergencyContactRelationship, setEmergencyContactRelationship] = useRemember<string>(
        '',
        'register.emergency_contact_relationship'
    );
    const [emergencyContactPhone, setEmergencyContactPhone] = useRemember<string>('', 'register.emergency_contact_phone');
    const [emergencyContactEmail, setEmergencyContactEmail] = useRemember<string>('', 'register.emergency_contact_email');

    const canContinue = consentContact && consentMedia;

    const [country, setCountry] = useRemember<string>('', 'register.country');
    const [honorificTitle, setHonorificTitle] = useRemember<string>('', 'register.honorific_title');
    const [sexAssignedAtBirth, setSexAssignedAtBirth] = useRemember<string>('', 'register.sex_assigned_at_birth');
    const [contactCountryCode, setContactCountryCode] = useRemember<string>('', 'register.contact_country_code');
    const [registrantType, setRegistrantType] = useRemember<string>('', 'register.registrant_type');
    const [programmeIds, setProgrammeIds] = useRemember<string[]>([], 'register.programme_ids');
    const [otherRegistrantType, setOtherRegistrantType] = useRemember<string>('', 'register.other_user_type');

    const selectedCountry = React.useMemo(
        () => countries.find((c) => String(c.id) === country) ?? null,
        [countries, country]
    );

    React.useEffect(() => {
        // if country is cleared, also clear the phone code
        if (!selectedCountry?.code) {
            if (contactCountryCode) setContactCountryCode('');
            return;
        }

        const nextCode = COUNTRY_PHONE_CODE_MAP[selectedCountry.code.toUpperCase()] ?? '';
        if (nextCode && nextCode !== contactCountryCode) {
            setContactCountryCode(nextCode);
        }
    }, [selectedCountry?.code, contactCountryCode, setContactCountryCode]);


    const filteredRegistrantTypes = React.useMemo(() => {
        return registrantTypes.filter((type) => {
            const name = type.name.trim().toLowerCase();
            const slug = (type.slug ?? '').trim().toLowerCase();

            return !name.startsWith('ched') && !slug.startsWith('ched');
        });
    }, [registrantTypes]);

    const selectedType = React.useMemo(
        () => filteredRegistrantTypes.find((t) => String(t.id) === registrantType) ?? null,
        [registrantType, filteredRegistrantTypes]
    );
    const isOtherRegistrantType =
        (selectedType?.slug ?? '').toLowerCase() === 'other' || (selectedType?.name ?? '').toLowerCase() === 'other';

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

    const steps = [
        {
            title: 'Personal details',
            description: 'Personal Details.',
        },
        {
            title: 'Contact & role',
            description: 'Organization, contact, and registrant type.',
        },
        {
            title: 'Account',
            description: 'Set your password.',
        },
        {
            title: 'Preferences',
            description: 'Food Restrictions, accessibility, and emergency contact.',
        },
        {
            title: 'Consents',
            description: 'Review required consents and submit.',
        },
    ] as const;

    const getFormElement = () => {
        const fallback = document.getElementById('register-form') as HTMLFormElement | null;
        if (fallback) {
            return fallback;
        }

        return document.querySelector('form[data-test="register-form"]') as HTMLFormElement | null;
    };

    const findFirstInvalidStep = () => {
        const form = getFormElement();
        if (!form) {
            return null;
        }

        const fieldsets = Array.from(form.querySelectorAll('fieldset')) as HTMLFieldSetElement[];
        const disabledStates = fieldsets.map((fieldset) => fieldset.disabled);
        fieldsets.forEach((fieldset) => {
            fieldset.disabled = false;
        });

        let invalidStep: number | null = null;
        for (let index = 0; index < fieldsets.length; index += 1) {
            const fieldset = fieldsets[index];
            if (fieldset.checkValidity()) {
                continue;
            }

            invalidStep = index;
            break;
        }

        fieldsets.forEach((fieldset, index) => {
            fieldset.disabled = disabledStates[index];
        });

        return invalidStep;
    };

    const validateActiveStep = () => {
        const form = getFormElement();
        if (!form) {
            return true;
        }

        const activeFieldset = form.querySelector('fieldset[data-active="true"]') as HTMLFieldSetElement | null;
        if (!activeFieldset) {
            return true;
        }

        const isValid = activeFieldset.checkValidity();
        if (!isValid) {
            activeFieldset.reportValidity();
            toast.error('Please complete the required fields before continuing.');
        }

        return isValid;
    };

    const validateForm = () => {
        const form = getFormElement();
        if (!form) {
            return true;
        }

        const invalidStep = findFirstInvalidStep();
        if (invalidStep !== null) {
            setCurrentStep(invalidStep);
            requestAnimationFrame(() => {
                const targetForm = getFormElement();
                const fieldsets = Array.from(targetForm?.querySelectorAll('fieldset') ?? []) as HTMLFieldSetElement[];
                const target = fieldsets[invalidStep];
                target?.reportValidity();
            });
            toast.error('Please complete the required fields before submitting.');
            return false;
        }

        return true;
    };

    const goNext = () => {
        if (!validateActiveStep()) {
            return;
        }
        const errorStep = findStepFromErrors(serverErrors);
        if (errorStep !== null && errorStep !== currentStep) {
            setCurrentStep(errorStep);
            return;
        }
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const goPrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const resetFormState = React.useCallback(() => {
        // Force remount to clear uncontrolled inputs
        setFormKey((k) => k + 1);

        setCountry('');
        setRegistrantType('');
        setProgrammeIds([]);
        setShowPassword(false);
        setShowConfirmPassword(false);
        setConsentContact(false);
        setConsentMedia(false);
        setFoodRestrictions([]);
        setAccessibilityNeeds([]);
        setDietaryAllergies('');
        setDietaryOther('');
        setAccessibilityOther('');
        setIpAffiliation('');
        setIpGroupName('');
        setEmergencyContactName('');
        setEmergencyContactRelationship('');
        setEmergencyContactPhone('');
        setEmergencyContactEmail('');
        setOtherRegistrantType('');
        setHonorificTitle('');
        setSexAssignedAtBirth('');
        setContactCountryCode('');
        setCurrentStep(0);
    }, [
        setCountry,
        setProgrammeIds,
        setRegistrantType,
        setOtherRegistrantType,
        setAccessibilityNeeds,
        setDietaryAllergies,
        setDietaryOther,
        setAccessibilityOther,
        setFoodRestrictions,
        setIpAffiliation,
        setIpGroupName,
        setEmergencyContactName,
        setEmergencyContactRelationship,
        setEmergencyContactPhone,
        setEmergencyContactEmail,
        setHonorificTitle,
        setSexAssignedAtBirth,
        setContactCountryCode,
        setCurrentStep,
    ]);

    React.useEffect(() => {
        if (status === 'registered') {
            setSuccessOpen(true);
            resetFormState();
        }
    }, [resetFormState, status]);

    React.useEffect(() => {
        if (!isOtherRegistrantType && otherRegistrantType) {
            setOtherRegistrantType('');
        }
    }, [isOtherRegistrantType, otherRegistrantType, setOtherRegistrantType]);

    React.useEffect(() => {
        if (!foodRestrictions.includes('allergies') && dietaryAllergies) {
            setDietaryAllergies('');
        }
        if (!foodRestrictions.includes('other') && dietaryOther) {
            setDietaryOther('');
        }
    }, [dietaryAllergies, dietaryOther, foodRestrictions, setDietaryAllergies, setDietaryOther]);

    React.useEffect(() => {
        if (!accessibilityNeeds.includes('other') && accessibilityOther) {
            setAccessibilityOther('');
        }
    }, [accessibilityNeeds, accessibilityOther, setAccessibilityOther]);

    React.useEffect(() => {
        if (ipAffiliation !== 'yes' && ipGroupName) {
            setIpGroupName('');
        }
    }, [ipAffiliation, ipGroupName, setIpGroupName]);

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

    const errorSteps = React.useMemo(() => {
        const keys = Object.keys(serverErrors).filter((key) => serverErrors[key]);
        if (!keys.length) return new Set<number>();

        const stepsWithErrors = new Set<number>();
        for (const group of FIELD_STEP_MAP) {
            if (keys.some((key) => group.fields.includes(key))) {
                stepsWithErrors.add(group.step);
            }
        }

        return stepsWithErrors;
    }, [FIELD_STEP_MAP, serverErrors]);

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
                id="register-form"
                key={formKey}
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                noValidate
                data-test="register-form"
                onSubmitCapture={(event) => {
                    if (!canContinue) {
                        event.preventDefault();
                        event.stopPropagation();
                        toast.error('Please tick both required consent boxes.');
                        return;
                    }
                    if (!validateForm()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }}
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
                                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Step {currentStep + 1} of {steps.length}
                                                </p>
                                                <h2 className="text-lg font-semibold text-slate-800">{steps[currentStep].title}</h2>
                                                <p className="text-sm text-slate-500">{steps[currentStep].description}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {steps.map((step, index) => {
                                                    const isActive = index === currentStep;
                                                    const isError = errorSteps.has(index);
                                                    const isComplete = index < currentStep && !isError;

                                                    return (
                                                        <button
                                                            key={step.title}
                                                            type="button"
                                                            onClick={() => setCurrentStep(index)}
                                                            className={cn(
                                                                'rounded-full px-3 py-1 text-xs font-medium transition',
                                                                isActive
                                                                    ? 'bg-[#0033A0] text-white'
                                                                    : isError
                                                                      ? 'border border-red-200 bg-red-50 text-red-600 hover:border-red-300'
                                                                      : isComplete
                                                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                                                                        : 'border border-slate-200 text-slate-500 hover:border-[#0033A0] hover:text-[#0033A0]'
                                                            )}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <input type="hidden" name="consent_contact_sharing" value={consentContact ? '1' : '0'} />
                                    <input type="hidden" name="consent_photo_video" value={consentMedia ? '1' : '0'} />
                                    <input type="hidden" name="has_food_restrictions" value={foodRestrictions.length > 0 ? '1' : '0'} />
                                    <input type="hidden" name="ip_affiliation" value={ipAffiliation === 'yes' ? '1' : '0'} />
                                    {foodRestrictions.map((restriction) => (
                                        <input key={restriction} type="hidden" name="food_restrictions[]" value={restriction} />
                                    ))}
                                    {accessibilityNeeds.map((need) => (
                                        <input key={need} type="hidden" name="accessibility_needs[]" value={need} />
                                    ))}

                                    <fieldset
                                        data-active={currentStep === 0}
                                        aria-hidden={currentStep !== 0}
                                        className={cn('grid gap-5', currentStep === 0 ? '' : 'hidden')}
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="country_id">
                                                Country of Origin <span className="text-[11px] font-semibold text-red-600"> *</span>
                                            </Label>
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

                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                                                            country === String(item.id) ? 'opacity-100' : 'opacity-0',
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
                                            <Label htmlFor="honorific_title">
                                                Honorific / Title <span className="text-[11px] font-semibold text-red-600"> *</span>
                                            </Label>
                                            <select
                                                id="honorific_title"
                                                name="honorific_title"
                                                required
                                                tabIndex={2}
                                                value={honorificTitle}
                                                onChange={(event) => setHonorificTitle(event.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="">Select honorific…</option>
                                                {HONORIFIC_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={err.honorific_title} />
                                        </div>

                                        {honorificTitle === 'other' ? (
                                            <div className="grid gap-2">
                                                <Label htmlFor="honorific_other">Other honorific</Label>
                                                <Input
                                                    id="honorific_other"
                                                    type="text"
                                                    name="honorific_other"
                                                    required
                                                    tabIndex={3}
                                                    placeholder="Please specify"
                                                    className={inputClass}
                                                />
                                                <InputError message={err.honorific_other} />
                                            </div>
                                        ) : null}

                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="given_name">
                                                    Given Name / First Name <span className="text-[11px] font-semibold text-red-600"> *</span>
                                                </Label>
                                                <Input
                                                    id="given_name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    tabIndex={honorificTitle === 'other' ? 4 : 3}
                                                    autoComplete="given-name"
                                                    name="given_name"
                                                    placeholder="e.g. JUAN"
                                                    className={inputClass}
                                                />
                                                <InputError message={err.given_name} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="middle_name">Middle Name</Label>
                                                <Input
                                                    id="middle_name"
                                                    type="text"
                                                    tabIndex={honorificTitle === 'other' ? 5 : 4}
                                                    autoComplete="additional-name"
                                                    name="middle_name"
                                                    placeholder="e.g. SANTOS"
                                                    className={inputClass}
                                                />
                                                <InputError message={err.middle_name} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="family_name">
                                                    Family Name / Surname <span className="text-[11px] font-semibold text-red-600"> *</span>
                                                </Label>
                                                <Input
                                                    id="family_name"
                                                    type="text"
                                                    required
                                                    tabIndex={honorificTitle === 'other' ? 6 : 5}
                                                    autoComplete="family-name"
                                                    name="family_name"
                                                    placeholder="e.g. DELA CRUZ"
                                                    className={inputClass}
                                                />
                                                <InputError message={err.family_name} />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="suffix">Suffix</Label>
                                            <Input
                                                id="suffix"
                                                type="text"
                                                tabIndex={honorificTitle === 'other' ? 7 : 6}
                                                name="suffix"
                                                placeholder="e.g. Jr., III"
                                                className={inputClass}
                                            />
                                            <InputError message={err.suffix} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="sex_assigned_at_birth">
                                                Sex assigned at birth <span className="text-[11px] font-semibold text-red-600"> *</span>
                                            </Label>
                                            <select
                                                id="sex_assigned_at_birth"
                                                name="sex_assigned_at_birth"
                                                required
                                                tabIndex={honorificTitle === 'other' ? 8 : 7}
                                                value={sexAssignedAtBirth}
                                                onChange={(event) => setSexAssignedAtBirth(event.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="">Select…</option>
                                                {SEX_ASSIGNED_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={err.sex_assigned_at_birth} />
                                        </div>
                                    </fieldset>

                                    <fieldset
                                        data-active={currentStep === 1}
                                        aria-hidden={currentStep !== 1}
                                        className={cn('grid gap-5', currentStep === 1 ? '' : 'hidden')}
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email address  <span className="text-[11px] font-semibold text-red-600"> *</span></Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={honorificTitle === 'other' ? 9 : 8}
                                                autoComplete="email"
                                                name="email"
                                                placeholder="email@example.com"
                                                className={inputClass}
                                            />
                                            <InputError message={err.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="contact_number">
                                                Contact number  <span className="text-[11px] font-semibold text-red-600"> *</span>
                                            </Label>
                                            <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
                                                <select
                                                    id="contact_country_code"
                                                    name="contact_country_code"
                                                    required
                                                    tabIndex={honorificTitle === 'other' ? 10 : 9}
                                                    value={contactCountryCode}
                                                    onChange={(event) => setContactCountryCode(event.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Country code…</option>
                                                    {PHONE_CODE_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    id="contact_number"
                                                    type="tel"
                                                    required
                                                    tabIndex={honorificTitle === 'other' ? 11 : 10}
                                                    autoComplete="tel"
                                                    name="contact_number"
                                                    inputMode="numeric"
                                                    placeholder="e.g. 9123456789"
                                                    className={inputClass}
                                                    onInput={(event) => {
                                                        event.currentTarget.value = event.currentTarget.value.replace(
                                                            /[^0-9]/g,
                                                            ''
                                                        );
                                                    }}
                                                />
                                            </div>
                                            <InputError message={err.contact_country_code ?? err.contact_number} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="organization_name">
                                                Agency / Organization / Institution <span className="text-[11px] font-semibold text-red-600"> *</span>
                                            </Label>
                                            <Input
                                                id="organization_name"
                                                type="text"
                                                required
                                                tabIndex={honorificTitle === 'other' ? 12 : 11}
                                                name="organization_name"
                                                placeholder="Name of organization"
                                                className={inputClass}
                                            />
                                            <InputError message={err.organization_name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="position_title">
                                                Position / Designation <span className="text-[11px] font-semibold text-red-600"> *</span>
                                            </Label>
                                            <Input
                                                id="position_title"
                                                type="text"
                                                required
                                                tabIndex={honorificTitle === 'other' ? 13 : 12}
                                                name="position_title"
                                                placeholder="Job title / role"
                                                className={inputClass}
                                            />
                                            <InputError message={err.position_title} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="user_type_id">Registrant Type  <span className="text-[11px] font-semibold text-red-600"> *</span></Label>
                                            <input type="hidden" name="user_type_id" value={registrantType} />

                                            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={typeOpen}
                                                        className={comboboxTriggerClass}
                                                        tabIndex={honorificTitle === 'other' ? 14 : 13}
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

                                        {isOtherRegistrantType ? (
                                            <div className="grid gap-2">
                                                <Label htmlFor="other_user_type">Please specify</Label>
                                                <Input
                                                    id="other_user_type"
                                                    name="other_user_type"
                                                    value={otherRegistrantType}
                                                    onChange={(event) => setOtherRegistrantType(event.target.value)}
                                                    required
                                                    placeholder="Enter your role"
                                                    className={inputClass}
                                                />
                                                <InputError message={err.other_user_type} />
                                            </div>
                                        ) : null}

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
                                    </fieldset>

                                    <fieldset
                                        data-active={currentStep === 2}
                                        aria-hidden={currentStep !== 2}
                                        className={cn('grid gap-5 sm:grid-cols-2', currentStep === 2 ? '' : 'hidden')}
                                    >
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password  <span className="text-[11px] font-semibold text-red-600"> *</span></Label>
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
                                            <Label htmlFor="password_confirmation">Confirm password  <span className="text-[11px] font-semibold text-red-600"> *</span></Label>
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
                                    </fieldset>




                                    <fieldset
                                        data-active={currentStep === 3}
                                        aria-hidden={currentStep !== 3}
                                        className={cn('grid gap-3 text-left', currentStep === 3 ? '' : 'hidden')}
                                    >
                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                        Food Restrictions
                                                    </p>
                                                    <p className="mt-1 text-sm leading-snug text-slate-600">
                                                        Select all that apply.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                {FOOD_RESTRICTION_OPTIONS.map((option) => {
                                                    const checked = foodRestrictions.includes(option.value);

                                                    return (
                                                        <label key={option.value} className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-sm">
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(value) => {
                                                                    setFoodRestrictions((prev) => {
                                                                        if (value) {
                                                                            return prev.includes(option.value) ? prev : [...prev, option.value];
                                                                        }

                                                                        return prev.filter((item) => item !== option.value);
                                                                    });
                                                                }}
                                                            />
                                                            <span>{option.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                            {foodRestrictions.includes('allergies') ? (
                                                <div className="mt-3 grid gap-2">
                                                    <Label htmlFor="dietary_allergies">Allergies (please specify)</Label>
                                                    <Input
                                                        id="dietary_allergies"
                                                        name="dietary_allergies"
                                                        value={dietaryAllergies}
                                                        onChange={(event) => setDietaryAllergies(event.target.value)}
                                                        placeholder="e.g. Nuts, seafood"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.dietary_allergies} />
                                                </div>
                                            ) : null}

                                            {foodRestrictions.includes('other') ? (
                                                <div className="mt-3 grid gap-2">
                                                    <Label htmlFor="dietary_other">Other dietary needs</Label>
                                                    <Input
                                                        id="dietary_other"
                                                        name="dietary_other"
                                                        value={dietaryOther}
                                                        onChange={(event) => setDietaryOther(event.target.value)}
                                                        placeholder="Please specify"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.dietary_other} />
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                        Indigenous Peoples (IP) Affiliation
                                                    </p>
                                                    <p className="mt-1 text-sm leading-snug text-slate-600">
                                                        Are you part of an Indigenous Peoples group?
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="ip_affiliation_choice"
                                                        value="yes"
                                                        checked={ipAffiliation === 'yes'}
                                                        onChange={() => setIpAffiliation('yes')}
                                                        required
                                                    />
                                                    Yes
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="ip_affiliation_choice"
                                                        value="no"
                                                        checked={ipAffiliation === 'no'}
                                                        onChange={() => setIpAffiliation('no')}
                                                    />
                                                    No
                                                </label>
                                            </div>

                                            {ipAffiliation === 'yes' ? (
                                                <div className="mt-3 grid gap-2">
                                                    <Label htmlFor="ip_group_name">If yes, please specify</Label>
                                                    <Input
                                                        id="ip_group_name"
                                                        name="ip_group_name"
                                                        value={ipGroupName}
                                                        onChange={(event) => setIpGroupName(event.target.value)}
                                                        placeholder="Name of IP group"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.ip_group_name} />
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                        Accessibility Needs
                                                    </p>
                                                    <p className="mt-1 text-sm leading-snug text-slate-600">
                                                        Select all applicable needs.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                {ACCESSIBILITY_NEEDS_OPTIONS.map((option) => {
                                                    const checked = accessibilityNeeds.includes(option.value);

                                                    return (
                                                        <label key={option.value} className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-sm">
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(value) => {
                                                                    setAccessibilityNeeds((prev) => {
                                                                        if (value) {
                                                                            return prev.includes(option.value) ? prev : [...prev, option.value];
                                                                        }

                                                                        return prev.filter((item) => item !== option.value);
                                                                    });
                                                                }}
                                                            />
                                                            <span>{option.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                            {accessibilityNeeds.includes('other') ? (
                                                <div className="mt-3 grid gap-2">
                                                    <Label htmlFor="accessibility_other">Other accommodations</Label>
                                                    <Input
                                                        id="accessibility_other"
                                                        name="accessibility_other"
                                                        value={accessibilityOther}
                                                        onChange={(event) => setAccessibilityOther(event.target.value)}
                                                        placeholder="Please specify"
                                                        className={inputClass}
                                                    />
                                                    <InputError message={err.accessibility_other} />
                                                </div>
                                            ) : null}
                                        </div>



                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    Emergency Contact Information
                                                </p>
                                            </div>
                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="emergency_contact_name">Name</Label>
                                                    <Input
                                                        id="emergency_contact_name"
                                                        name="emergency_contact_name"
                                                        value={emergencyContactName}
                                                        onChange={(event) => setEmergencyContactName(event.target.value)}
                                                        placeholder="Full name"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                                                    <Input
                                                        id="emergency_contact_relationship"
                                                        name="emergency_contact_relationship"
                                                        value={emergencyContactRelationship}
                                                        onChange={(event) => setEmergencyContactRelationship(event.target.value)}
                                                        placeholder="Relationship"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="emergency_contact_phone">Phone Number</Label>
                                                    <Input
                                                        id="emergency_contact_phone"
                                                        name="emergency_contact_phone"
                                                        value={emergencyContactPhone}
                                                        onChange={(event) => setEmergencyContactPhone(event.target.value)}
                                                        placeholder="Contact number"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="emergency_contact_email">Email Address</Label>
                                                    <Input
                                                        id="emergency_contact_email"
                                                        type="email"
                                                        name="emergency_contact_email"
                                                        value={emergencyContactEmail}
                                                        onChange={(event) => setEmergencyContactEmail(event.target.value)}
                                                        placeholder="Email"
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>



                                    <fieldset
                                        data-active={currentStep === 4}
                                        aria-hidden={currentStep !== 4}
                                        className={cn('grid gap-3 text-left', currentStep === 4 ? '' : 'hidden')}
                                    >
                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    Contact Information Sharing
                                                    <span className="text-[11px] font-semibold text-red-600"> *</span>
                                                </p>

                                            </div>

                                            <p className="mt-1 text-sm leading-snug text-slate-600">
                                                To promote networking between institutions with common interests, I give my consent to CHED to share my full name,
                                                designation, institution, and email address to other attendees of the event.
                                            </p>

                                            <div className="mt-2 flex items-start gap-3">
                                                <Checkbox
                                                    id="consent-contact"
                                                    checked={consentContact}
                                                    onCheckedChange={(v) => setConsentContact(Boolean(v))}
                                                    className="border-emerald-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white focus-visible:ring-emerald-600/30"
                                                />
                                                <Label htmlFor="consent-contact" className="text-sm font-medium text-slate-700">
                                                    I consent.
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                                    Photo and Videos Consent
                                                    <span className="text-[11px] font-semibold text-red-600"> *</span>
                                                </p>

                                            </div>

                                            <p className="mt-1 text-sm leading-snug text-slate-600">
                                                I hereby grant permission to the conference organizers to photograph and record me during the event. I understand that
                                                these images and recordings may be used for social media, event documentation, promotional materials for future events,
                                                and other purposes deemed appropriate by the organizers.
                                            </p>

                                            <div className="mt-2 flex items-start gap-3">
                                                <Checkbox
                                                    id="consent-media"
                                                    checked={consentMedia}
                                                    onCheckedChange={(v) => setConsentMedia(Boolean(v))}
                                                    className="border-emerald-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white focus-visible:ring-emerald-600/30"
                                                />
                                                <Label htmlFor="consent-media" className="text-sm font-medium text-slate-700">
                                                    I consent.
                                                </Label>
                                            </div>
                                        </div>

                                        {!canContinue && (
                                            <p className="px-1 text-xs text-slate-600">
                                                Please tick both required consent boxes to continue.
                                            </p>
                                        )}
                                    </fieldset>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 rounded-xl px-5"
                                            onClick={goPrev}
                                            disabled={currentStep === 0}
                                        >
                                            Back
                                        </Button>
                                        {currentStep < steps.length - 1 ? (
                                            <Button
                                                type="button"
                                                className="h-11 w-full rounded-xl bg-[#0033A0] text-white shadow-sm hover:bg-[#002b86] sm:w-auto"
                                                onClick={goNext}
                                            >
                                                Next
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                className="h-11 w-full rounded-xl bg-[#0033A0] text-white shadow-sm hover:bg-[#002b86] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                                tabIndex={9}
                                                disabled={!canContinue || processing}
                                                data-test="register-user-button"
                                                onClick={(event) => {
                                                    if (!canContinue) {
                                                        event.preventDefault();
                                                        toast.error('Please tick both required consent boxes.');
                                                        return;
                                                    }
                                                    if (!validateForm()) event.preventDefault();
                                                }}
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                        Registering…
                                                    </>
                                                ) : (
                                                    'Register'
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    {processing && (
                                        <p className="text-center text-sm text-slate-500" role="status" aria-live="polite">
                                            Creating your account, generating your QR badge, and sending your confirmation email. Please wait…
                                        </p>
                                    )}
                                    <div className="mt-8 text-center text-sm text-muted-foreground">
                                        Already have an account?{' '}
                                        <TextLink href={login()} tabIndex={10}>
                                            Log in
                                        </TextLink>
                                    </div>
                                </div>
                            </div>


                            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>

                                <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-3xl rounded-2xl border-none bg-gradient-to-br from-[#E8F0FF] via-white to-[#F5FBFF]">
                                    <DialogHeader className="items-center text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0033A0] text-white shadow-lg shadow-[#0033A0]/20">
                                            <CheckCircle2 className="h-7 w-7" />
                                        </div>

                                        <DialogTitle className="text-xl text-slate-800">You’re all set! 🎉</DialogTitle>

                                        <DialogDescription className="text-sm text-slate-600">
                                            Thanks for signing up! ✨ You can now try logging in using the email you provided.
                                            <span className="mt-2 block rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                                                <span className="font-semibold">Please check your EMAIL.</span> Please find your QR code and participant details attached.
                                                Also check your <span className="font-semibold">Spam/Junk</span> folder if you don’t see it.
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter className="sm:justify-center">
                                        <Button
                                            type="button"
                                            className="rounded-full bg-[#0033A0] px-6 text-white hover:bg-[#002b86] disabled:cursor-not-allowed disabled:opacity-60"
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
