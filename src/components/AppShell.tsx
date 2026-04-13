"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiderBar from "@/components/SiderBar";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminFullscreen = pathname === "/admin" || pathname?.startsWith("/admin/");

  if (isAdminFullscreen) {
    return (
      <div
        className="flex min-h-screen w-full flex-col md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden"
        style={{ background: "var(--page-gradient)" }}
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SiderBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <main style={{ flex: 1 }}>{children}</main>
        <Footer type="home" />
      </div>
    </div>
  );
}
