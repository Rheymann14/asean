import * as React from 'react';
import { Head, Form, Link } from '@inertiajs/react';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword, canRegister }: LoginProps) {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <AuthLayout title="" description="">
            <Head title="Log in" />

            {/* ✅ use 100svh to avoid mobile vh whitespace */}
            <div className="grid min-h-[100svh] lg:min-h-[640px] lg:grid-cols-2">
                {/* LEFT: Form */}
                <div className="relative flex min-h-[100svh] flex-col bg-gradient-to-b from-background to-muted/30 lg:min-h-[640px] lg:justify-center">
                    {/* ✅ Mobile image banner (flush to top, no parent padding) */}
                    <div className="relative h-44 lg:hidden">
                        <div className="absolute inset-0 bg-[url('/img/loginbg.jpg')] bg-cover bg-center" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    </div>

                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(30,60,115,0.14),transparent_50%)]"
                    />

                    {/* ✅ padding moved here (below banner) */}
                    <div className="relative flex flex-1 flex-col justify-center px-6 py-6 sm:px-10 sm:py-10 lg:flex-none lg:p-10">
                        {/* Header */}
                        <div className="mb-8 flex items-start gap-4">
                            <Link
                                href="/"
                                className="hidden items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
                                aria-label="Go to home"
                                title="Go to home"
                            >
                                <img
                                    src="/img/bagong_pilipinas.png"
                                    alt="Bagong Pilipinas"
                                    className="h-10 w-auto object-contain"
                                    draggable={false}
                                    loading="lazy"
                                />
                                <img
                                    src="/img/asean_logo.png"
                                    alt="ASEAN Philippines 2026"
                                    className="h-10 w-auto object-contain"
                                    draggable={false}
                                    loading="lazy"
                                />
                            </Link>

                            <div className="min-w-0">
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    Log in to your account
                                </h1>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Enter your email and password below to log in
                                </p>
                            </div>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-2xl border border-green-200/70 bg-green-50/80 px-4 py-3 text-sm font-medium text-green-700 shadow-sm dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
                                {status}
                            </div>
                        )}

                        <div className="rounded-3xl border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur sm:p-6">
                            <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email" className="text-sm text-foreground">
                                                    Email address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="email@example.com"
                                                    className="h-11 rounded-xl bg-background"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-3">
                                                    <Label htmlFor="password" className="text-sm text-foreground">
                                                        Password
                                                    </Label>
                                                </div>

                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="Password"
                                                        className="h-11 rounded-xl bg-background pr-11"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword((v) => !v)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    >
                                                        {showPassword ? (
                                                            <Eye className="h-4 w-4" aria-hidden />
                                                        ) : (
                                                            <EyeOff className="h-4 w-4" aria-hidden />
                                                        )}
                                                    </button>
                                                </div>

                                                <InputError message={errors.password} />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="mt-1 h-11 w-full rounded-xl bg-gradient-to-r from-[#1e3c73] to-[#25468a] text-white shadow-sm hover:opacity-95"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing ? <Spinner /> : <LogIn className="mr-2 h-4 w-4" aria-hidden />}
                                                Log in
                                            </Button>
                                        </div>

                                        {canRegister && (
                                            <div className="text-center text-sm text-muted-foreground">
                                                Don&apos;t have an account?{' '}
                                                <TextLink href={register()} tabIndex={5} className="font-medium">
                                                    Sign up
                                                </TextLink>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Image panel (desktop) */}
                <div className="relative hidden lg:block">
                    <div className="absolute inset-0 bg-[url('/img/loginbg.jpg')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/75 via-slate-950/25 to-transparent" />

                    <div className="relative flex h-full flex-col justify-end p-10 text-white">
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight">ASEAN Philippines 2026</h2>
                            <p className="mt-1 text-sm text-white/80">“Navigating Our Future, Together”</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
