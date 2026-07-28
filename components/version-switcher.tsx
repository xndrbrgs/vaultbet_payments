"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronsUpDownIcon } from "lucide-react";
import { SignOutButton, UserAvatar } from "@clerk/nextjs";

type VersionSwitcherUser = {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string;
  profileImage: string | null;
} | null;

export function VersionSwitcher({
  userAccount,
}: {
  userAccount: VersionSwitcherUser;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <UserAvatar />
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">
                {userAccount?.firstName} {userAccount?.lastName}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>
              <SignOutButton>
                <button className="w-full font-semibold text-red-500 text-left hover:cursor-pointer">
                  Sign Out
                </button>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
