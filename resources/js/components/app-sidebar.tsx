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
import { dashboard, participant, issuancesManagement, contactDetails, venueManagement, programmeManagement, scanner } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Paperclip, House, User, CalendarFold, Building, NotepadText, Headset, ScanLine } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: House,
    },
    {
        title: 'Participant',
        href: participant(),
        icon: User,
    },
 
    {
        title: 'Venue',
        href: venueManagement(),
        icon: Building,
    },
    {
        title: 'Event',
        href: programmeManagement(),
        icon: NotepadText,
    },
    {
        title: 'Issuances',
        href: issuancesManagement(),
        icon: Paperclip,
    },
    {
        title: 'Contact Details',
        href: contactDetails(),
        icon: Headset,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'QR Code Scanner',
        href: scanner(),
        icon: ScanLine,
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
