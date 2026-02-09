import * as React from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

const FOOD_RESTRICTION_OPTIONS = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'halal', label: 'Halal' },
    { value: 'allergies', label: 'Allergies (please specify)' },
    { value: 'other', label: 'Other (please specify)' },
] as const;

const ACCESSIBILITY_NEEDS_OPTIONS = [
    { value: 'wheelchair_access', label: 'Wheelchair access' },
    { value: 'sign_language_interpreter', label: 'Sign language interpreter' },
    { value: 'assistive_technology_support', label: 'Assistive technology support' },
    { value: 'other', label: 'Other accommodations' },
] as const;

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [selectedFoodRestrictions, setSelectedFoodRestrictions] = React.useState<string[]>(() => user.food_restrictions ?? []);
    const [selectedAccessibilityNeeds, setSelectedAccessibilityNeeds] = React.useState<string[]>(() => user.accessibility_needs ?? []);

    const honorificLabels: Record<string, string> = {
        mr: 'Mr.',
        mrs: 'Mrs.',
        ms: 'Ms.',
        miss: 'Miss',
        dr: 'Dr.',
        prof: 'Prof.',
        other: 'Other',
    };

    const sexAssignedLabels: Record<string, string> = {
        male: 'Male',
        female: 'Female',
    };

    const foodRestrictionLabelMap: Record<string, string> = {
        vegetarian: 'Vegetarian',
        halal: 'Halal',
        allergies: 'Allergies',
        other: 'Other',
    };

    const accessibilityLabels: Record<string, string> = {
        wheelchair_access: 'Wheelchair access',
        sign_language_interpreter: 'Sign language interpreter',
        assistive_technology_support: 'Assistive technology support',
        other: 'Other accommodations',
    };

    const formatValue = (value?: string | number | null) => (value ? String(value) : '—');
    const fullContactNumber = [user.contact_country_code, user.contact_number].filter(Boolean).join(' ');
    const honorificTitle =
        user.honorific_title === 'other'
            ? user.honorific_other || 'Other'
            : (user.honorific_title ? honorificLabels[user.honorific_title] : undefined);
    const foodRestrictionLabels = (user.food_restrictions ?? [])
        .map((item) => foodRestrictionLabelMap[item] ?? item)
        .filter(Boolean);
    const accessibilityNeedLabels = (user.accessibility_needs ?? [])
        .map((item) => accessibilityLabels[item] ?? item)
        .filter(Boolean);

    const toggleFoodRestriction = (value: string) => {
        setSelectedFoodRestrictions((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
        );
    };

    const toggleAccessibilityNeed = (value: string) => {
        setSelectedAccessibilityNeeds((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Dietary & accessibility
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Update your dietary restrictions and accessibility needs.
                                        </p>
                                    </div>

                                    <input type="hidden" name="has_food_restrictions" value={selectedFoodRestrictions.length > 0 ? '1' : '0'} />
                                    {selectedFoodRestrictions.map((restriction) => (
                                        <input key={restriction} type="hidden" name="food_restrictions[]" value={restriction} />
                                    ))}
                                    {selectedAccessibilityNeeds.map((need) => (
                                        <input key={need} type="hidden" name="accessibility_needs[]" value={need} />
                                    ))}

                                    <div className="grid gap-3">
                                        <Label className="text-sm font-medium">Food restrictions</Label>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {FOOD_RESTRICTION_OPTIONS.map((option) => (
                                                <label key={option.value} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                                                    <Checkbox
                                                        checked={selectedFoodRestrictions.includes(option.value)}
                                                        onCheckedChange={() => toggleFoodRestriction(option.value)}
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <InputError
                                            message={errors.food_restrictions || errors['food_restrictions.0']}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="dietary_allergies">Allergies (please specify)</Label>
                                        <Input
                                            id="dietary_allergies"
                                            name="dietary_allergies"
                                            defaultValue={user.dietary_allergies ?? ''}
                                            placeholder="List any allergies"
                                        />
                                        <InputError message={errors.dietary_allergies} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="dietary_other">Dietary notes (optional)</Label>
                                        <Input
                                            id="dietary_other"
                                            name="dietary_other"
                                            defaultValue={user.dietary_other ?? ''}
                                            placeholder="Other dietary requests"
                                        />
                                        <InputError message={errors.dietary_other} />
                                    </div>

                                    <div className="grid gap-3">
                                        <Label className="text-sm font-medium">Accessibility needs</Label>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {ACCESSIBILITY_NEEDS_OPTIONS.map((option) => (
                                                <label key={option.value} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                                                    <Checkbox
                                                        checked={selectedAccessibilityNeeds.includes(option.value)}
                                                        onCheckedChange={() => toggleAccessibilityNeed(option.value)}
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <InputError
                                            message={errors.accessibility_needs || errors['accessibility_needs.0']}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="accessibility_other">Accessibility notes (optional)</Label>
                                        <Input
                                            id="accessibility_other"
                                            name="accessibility_other"
                                            defaultValue={user.accessibility_other ?? ''}
                                            placeholder="Other accommodations"
                                        />
                                        <InputError message={errors.accessibility_other} />
                                    </div>
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>

                    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                        <HeadingSmall
                            title="Registration details"
                            description="Review the information you submitted during registration."
                        />

                        <div className="mt-6 grid gap-8 lg:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Personal information
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Honorific</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(honorificTitle)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Given name</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.given_name)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Middle name</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.middle_name)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Family name</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.family_name)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Suffix</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.suffix)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Sex assigned at birth</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(
                                                user.sex_assigned_at_birth
                                                    ? sexAssignedLabels[user.sex_assigned_at_birth]
                                                    : undefined,
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Country</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.country?.name)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Contact & organization
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Email address</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.email)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Contact number</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(fullContactNumber)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Organization</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.organization_name)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Position title</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.position_title)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Registrant type</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.user_type?.name || user.other_user_type)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">IP group name</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.ip_group_name)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Additional info
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Food restrictions</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {foodRestrictionLabels.length ? (
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {foodRestrictionLabels.map((label) => (
                                                        <Badge key={label} variant="secondary" className="rounded-full">
                                                            {label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                'None'
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Dietary allergies</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.dietary_allergies)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Dietary notes</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.dietary_other)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Accessibility needs</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {accessibilityNeedLabels.length ? (
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {accessibilityNeedLabels.map((label) => (
                                                        <Badge key={label} variant="secondary" className="rounded-full">
                                                            {label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                'None'
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Accessibility notes</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.accessibility_other)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Consent to contact sharing</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {user.consent_contact_sharing ? 'Yes' : 'No'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Consent to photo/video</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {user.consent_photo_video ? 'Yes' : 'No'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Emergency contact</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_name)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Emergency relationship</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_relationship)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Emergency phone</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_phone)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Emergency email</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_email)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <DeleteUser /> */}
            </SettingsLayout>
        </AppLayout>
    );
}
