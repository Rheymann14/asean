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
import { dashboard, participant, issuancesManagement, contactDetails, venueManagement, scanner } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ScrollText, User, Users, Building2, MapPin, ScanLine, House, CalendarDays, Table, Image } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userType = auth.user?.user_type ?? auth.user?.userType;
    const roleName = (userType?.name ?? '').toUpperCase();
    const roleSlug = (userType?.slug ?? '').toUpperCase();
    const isChed = roleName === 'CHED' || roleSlug === 'CHED';

    const mainNavItems: NavItem[] = isChed
        ? [
              {
                  title: 'Dashboard',
                  href: dashboard(),
                  icon: House,
              },
              {
                  title: 'Participant',
                  href: participant(),
                  icon: Users,
              },
              {
                  title: 'Create Table',
                  href: '/table-assignment/create',
                  icon: Table,
              },
              {
                  title: 'Table Assignment',
                  href: '/table-assignment/assignment',
                  icon: Table,
              },
              {
                  title: 'Venue',
                  href: venueManagement(),
                  icon: Building2,
              },
              {
                  title: 'Section Management',
                  href: '/section-management',
                  icon: Image,
              },
              {
                  title: 'Event & Certificate',
                  href: '/event-management',
                  icon: CalendarDays,
              },
              {
                  title: 'Issuances',
                  href: issuancesManagement(),
                  icon: ScrollText,
              },
              {
                  title: 'Contact Details',
                  href: contactDetails(),
                  icon: MapPin,
              },
          ]
        : [
              {
                  title: 'Profile',
                  href: '/participant-dashboard',
                  icon: User,
              },
              {
                  title: 'Event List',
                  href: '/event-list',
                  icon: CalendarDays,
              },
              {
                  title: 'Table Assignment',
                  href: '/table-assignment',
                  icon: Table,
              },
          ];

    const footerNavItems: NavItem[] = isChed
        ? [
              {
                  title: 'QR Code Scanner',
                  href: scanner(),
                  icon: ScanLine,
              },
          ]
        : [];

    const homeHref = isChed ? dashboard() : '/participant-dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
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
                {footerNavItems.length ? <NavFooter items={footerNavItems} className="mt-auto" /> : null}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
