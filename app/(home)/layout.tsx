import Navbar from "@/components/general/homepage/navbar";

export default function HomeRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <> <Navbar />{children}</>;
}
