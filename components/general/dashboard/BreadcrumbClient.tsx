"use client";

import {
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

const BreadcrumbClient = () => {
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname === "/dashboard") return "";
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const pageName = getPageName();
  return (
    <>
      {pathname !== "/dashboard" && (
        <BreadcrumbSeparator className="hidden md:block" />
      )}
      <BreadcrumbItem>
        <BreadcrumbPage>{pageName}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
};

export default BreadcrumbClient;
