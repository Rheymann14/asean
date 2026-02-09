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

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

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

    const foodRestrictionLabels: Record<string, string> = {
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
    const foodRestrictions = (user.food_restrictions ?? [])
        .map((item) => foodRestrictionLabels[item] ?? item)
        .filter(Boolean);
    const accessibilityNeeds = (user.accessibility_needs ?? [])
        .map((item) => accessibilityLabels[item] ?? item)
        .filter(Boolean);

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
                                    Preferences
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Food restrictions</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {foodRestrictions.length ? (
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {foodRestrictions.map((label) => (
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
                                            {accessibilityNeeds.length ? (
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {accessibilityNeeds.map((label) => (
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
                                </dl>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Emergency contact
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_name)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Relationship</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_relationship)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Phone</dt>
                                        <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {formatValue(user.emergency_contact_phone)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt>
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
