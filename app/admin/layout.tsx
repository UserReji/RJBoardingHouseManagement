"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, DoorOpen, Users, FileText,
  CreditCard, AlertCircle, Settings, LogOut, Home,
} from "lucide-react";
import SidebarDrawer, { type NavItem } from "@/lib/components/SidebarDrawer";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/rooms",     label: "Rooms",       icon: DoorOpen },
  { href: "/admin/tenants",   label: "Tenants",     icon: Users },
  { href: "/admin/bills",     label: "Bills",       icon: FileText },
  { href: "/admin/payments",  label: "Payments",    icon: CreditCard },
  { href: "/admin/concerns",  label: "Concerns",    icon: AlertCircle },
  { href: "/admin/settings",  label: "Settings",    icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("adminSession");
    if (!session) { router.push("/login"); return; }
    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading admin portal…</p>
      </div>
    </div>
  );

  if (!isAuthorized) return null;

  const handleLogout = async () => {
    localStorage.removeItem("adminSession");
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch { /* ignore */ }
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f9] flex flex-col md:flex-row">
      <SidebarDrawer
        navItems={NAV_ITEMS}
        brandTitle="RJ BoardHouse"
        brandSubtitle="Admin Portal"
        mobileBrandLabel="Admin Portal"
        onLogout={handleLogout}
        logoutLabel="Sign out"
        BrandIcon={Home}
      />

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-5 py-7 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
