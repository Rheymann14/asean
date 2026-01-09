import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Profile', href: '/participant-dashboard' }];

export default function ParticipantDashboard() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#00359c]" />
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Profile
                    </h1>
                </div>

                <Card className="max-w-2xl rounded-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base font-semibold">Account details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm text-muted-foreground">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Name</div>
                            <div className="text-base text-foreground">{auth.user.name}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                            <div className="text-base text-foreground">{auth.user.email}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
