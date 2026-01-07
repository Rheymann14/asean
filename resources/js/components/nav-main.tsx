import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    // ✅ Start "Page Settings" group from Venue (i.e., after Event List)
    const pageSettingsStartIndex = items.findIndex(
        (item) => item.title === 'Venue',
    );

    const registrationItems =
        pageSettingsStartIndex > -1 ? items.slice(0, pageSettingsStartIndex) : items;

    const pageSettingsItems =
        pageSettingsStartIndex > -1 ? items.slice(pageSettingsStartIndex) : [];

    const renderMenu = (menuItems: NavItem[]) => (
        <SidebarMenu>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={page.url.startsWith(resolveUrl(item.href))}
                        tooltip={{ children: item.title }}
                    >
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );

    return (
        <>
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Registration</SidebarGroupLabel>
                {renderMenu(registrationItems)}
            </SidebarGroup>

            {pageSettingsItems.length > 0 && (
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Page Settings</SidebarGroupLabel>
                    {renderMenu(pageSettingsItems)}
                </SidebarGroup>
            )}
        </>
    );
}
