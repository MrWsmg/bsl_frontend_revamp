"use client";

// Main layout component with shadcn sidebar
import React from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { SiteHeader } from './SiteHeader';
import { User } from '@/types';
import { NavItem } from './NavMain';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  sidebarItems: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  sidebarItems,
  activeTab,
  onTabChange,
  children,
  title = 'Dashboard',
}) => {
  return (
    <SidebarProvider>
      <AppSidebar
        navItems={sidebarItems}
        user={{
          name: user.full_name,
          email: user.username,
          role: user.role,
        }}
        activeItem={activeTab}
        onItemClick={onTabChange}
        onLogout={onLogout}
      />
      <SidebarInset>
        <SiteHeader title={title} user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
