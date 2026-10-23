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
  FileExclamationPointIcon,
  ShoppingBasket,
  School,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserDialog } from "./UserDialog";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: <ListIcon />,
    },

    {
      title: "Store Management",
      url: "/admin/store",
      icon: <Store />,
    },
    {
      title: "Report Management",
      url: "/admin/reports",
      icon: <FileTextIcon />,
    },
    {
      title: "Disputes Management",
      url: "/admin/disputes",
      icon: <FileExclamationPointIcon />,
    },
    {
      title: "Seller Applications",
      url: "/admin/seller-applications",
      icon: <ShoppingBasket />,
    },
    {
      title: "Campuses",
      url: "/admin/campuses",
      icon: <School />,
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

const supabase = await createClient();

const {
  data: { user },
} = await supabase.auth.getUser();

let fullName: string | null = null;
let username: string | null = null;
let avatarUrl: string | null = null;

if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  fullName = profile?.full_name ?? null;
  username = profile?.username ?? null;
  avatarUrl = profile?.avatar_url ?? null;
}
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
      <SidebarFooter className="flex flex-row items-center gap-4 border-t p-4">
        <UserDialog fullName={fullName} avatarUrl={avatarUrl} role={null} />
        <div>
          <h1 className="text-sm">{fullName}</h1>
          <p className="text-sm text-muted-foreground">{username}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
