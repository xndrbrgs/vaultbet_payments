import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/general/homepage/navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <ViewTransitions>
      <html
        lang="en"
        className={cn(
          "h-full",
          "antialiased",
          geistSans.variable,
          geistMono.variable,
          "font-sans",
          inter.variable,
        )}
      >
        <body className="min-h-full flex flex-col">
          <ClerkProvider>
            <Navbar />
            {children}
          </ClerkProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
