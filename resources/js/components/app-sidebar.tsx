import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Paperclip, ScanQrCode, House, User, CalendarFold, Building, NotepadText, Headset } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: House,
    },
    {
        title: 'Participant',
        href: dashboard(),
        icon: User,
    },
    {
        title: 'Event List',
        href: dashboard(),
        icon: CalendarFold,
    },
    {
        title: 'Venue',
        href: dashboard(),
        icon: Building,
    },
    {
        title: 'Programme',
        href: dashboard(),
        icon: NotepadText,
    },
    {
        title: 'Issuances',
        href: dashboard(),
        icon: Paperclip,
    },
    {
        title: 'Contact Details',
        href: dashboard(),
        icon: Headset,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'QR Code Scanner',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: ScanQrCode,
    },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
