"use client";

import { LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
}

interface NavMainProps {
  items: NavItem[];
  activeItem?: string;
  onItemClick: (itemId: string) => void;
}

export function NavMain({ items, activeItem, onItemClick }: NavMainProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Check if a group has an active child
  const hasActiveChild = (item: NavItem) => {
    return item.children?.some(child => child.id === activeItem) || false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            item.children ? (
              // Grouped items with collapsible
              <Collapsible
                key={item.id}
                asChild
                defaultOpen={hasActiveChild(item)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={hasActiveChild(item)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={activeItem === child.id}
                          >
                            <button
                              onClick={() => onItemClick(child.id)}
                              className="w-full flex items-center gap-2"
                            >
                              <child.icon className="h-4 w-4" />
                              <span>{child.label}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              // Single items without collapsible
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={activeItem === item.id}
                  onClick={() => onItemClick(item.id)}
                  tooltip={item.label}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
