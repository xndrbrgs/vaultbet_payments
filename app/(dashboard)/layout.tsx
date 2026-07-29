import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toast";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import BreadcrumbClient from "@/components/general/dashboard/BreadcrumbClient";
import HeaderSection from "@/components/general/dashboard/HeaderSection";

export const metadata: Metadata = {
  title: "VaultBet | Secure Payments & Digital Wallet Platform",
  description:
    "VaultBet is a secure digital payments platform that enables users to manage balances, send and receive funds, request payouts, and utilize Bitcoin and Lightning Network payments through a fast, transparent, and reliable financial ecosystem built for gaming solutions.",
  keywords: [
    "VaultBet",
    "digital wallet",
    "payments",
    "bitcoin payments",
    "lightning network",
    "payouts",
    "withdrawals",
    "financial platform",
    "transaction tracking",
    "crypto payments",
    "wallet management",
    "online gambling",
    "gaming solutions",
    "casino payments",
    "betting platform",
    "e-sports transactions",
  ],
  openGraph: {
    title: "VaultBet | Secure Payments & Digital Wallet Platform",
    description:
      "Manage balances, track transactions, and send or receive payments with support for Bitcoin and Lightning Network settlements.",
    siteName: "VaultBet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultBet | Secure Payments & Digital Wallet Platform",
    description:
      "Fast, secure payments and payouts powered by modern wallet technology and Bitcoin infrastructure.",
  },
};

export default async function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbClient />
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <HeaderSection />
        <main className="px-4">{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
