"use client";

import * as React from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
  Store,
} from "lucide-react";
import { CurrentUserAvatar } from "./current-user-avatar";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: <ListIcon />,
    },

    {
      title: "Store Management",
      url: "/admin/stores",
      icon: <Store />,
    },
    {
      title: "Report Management",
      url: "/admin/reports",
      icon: <FileTextIcon />,
    },
    {
      title: "Team",
      url: "/admin/team",
      icon: <UsersIcon />,
    },
  ],

  navSecondary: [
    {
      title: "Eduvos Docs",
      url: "/docs",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "/get-help",
      icon: <CircleHelpIcon />,
    },
  ],
};
export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <span className="text-base font-semibold">HubConnect</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-start gap-2 border-t p-4">
        <div className="flex flex-row justify-start gap-3 items-center">
          <CurrentUserAvatar />
          <h1 className="text-sm font-semibold">Admin</h1>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
