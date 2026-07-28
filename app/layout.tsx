import type { Metadata } from "next";
import { Mona_Sans, Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/general/homepage/navbar";
import ReactLenis from "lenis/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const monaSans = Mona_Sans({
  variable: "--font-monaSans",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ViewTransitions>
        <html
          lang="en"
          className={cn(
            "h-full",
            "antialiased",
            monaSans.variable,
            "font-sans",
            inter.variable,
          )}
        >
          <ReactLenis root>
            <body className="min-h-full flex flex-col">
              {children}
            </body>
          </ReactLenis>
        </html>
      </ViewTransitions>
    </ClerkProvider>
  );
}
