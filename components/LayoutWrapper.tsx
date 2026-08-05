"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeaderFooter =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/admin/login";

  return (
    <>
      {!hideHeaderFooter && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
