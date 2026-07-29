"use client";

import { usePathname } from "next/navigation";
const HeaderSection = () => {
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname === "/dashboard") return "Dashboard";
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const pageName = getPageName();

  return (
    <section className="text-[clamp(18px,32px)] font-semibold font-monaSans p-4">
      {pageName}
    </section>
  );
};

export default HeaderSection;
