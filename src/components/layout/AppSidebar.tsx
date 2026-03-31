"use client";

import * as React from 'react';
import { Leaf } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain, NavItem } from './NavMain';
import { NavUser } from './NavUser';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[];
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  activeItem?: string;
  onItemClick: (itemId: string) => void;
  onLogout: () => void;
}

export function AppSidebar({
  navItems,
  user,
  activeItem,
  onItemClick,
  onLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Leaf className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">AGENTIC Farm</span>
            <span className="truncate text-xs text-muted-foreground">Tracking System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeItem={activeItem} onItemClick={onItemClick} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
