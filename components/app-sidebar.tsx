import * as React from "react";

import { getCurrentUser } from "@/lib/actions/user-actions";
import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "next-view-transitions";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Services",
      items: [
        {
          title: "Purchases",
          url: "/dashboard/purchases",
          isActive: true,
        },
        {
          title: "Deposits",
          url: "/dashboard/deposits",
        },
        {
          title: "Withdrawals",
          url: "/dashboard/withdrawals",
        },
        {
          title: "Giveaways",
          url: "/dashboard/giveaways",
        },
        {
          title: "Invoices",
          url: "/dashboard/invoices",
        },
        {
          title: "Card",
          url: "/dashboard/card",
        },
        {
          title: "Affiliate/Split",
          url: "/dashboard/affiliate-split",
        },
      ],
    },
    {
      title: "Your Account",
      url: "#",
      items: [
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
  ],
};

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const userAccount = await getCurrentUser();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher userAccount={userAccount} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={<Link href={item.url} />}
                    >
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
