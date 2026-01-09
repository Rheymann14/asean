import { type PropsWithChildren } from 'react';

export default function RegisterLayout({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-svh w-full overflow-hidden bg-slate-950 text-slate-900">
            <div className="absolute inset-0 bg-[url('/img/bg.png')] bg-cover bg-center" aria-hidden />
            <div
                className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/85 to-white/95"
                aria-hidden
            />

            <div className="relative z-10 flex min-h-svh w-full flex-col items-center justify-start px-4 py-10 sm:py-12">
                <div className="w-full max-w-5xl">{children}</div>
            </div>
        </div>
    );
}
