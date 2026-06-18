"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, CreditCard,
  AlertCircle, User, LogOut, Home,
} from "lucide-react";
import SidebarDrawer, { type NavItem } from "@/lib/components/SidebarDrawer";

const NAV_ITEMS: NavItem[] = [
  { href: "/tenant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/bills",     label: "Bills",      icon: FileText },
  { href: "/tenant/payments",  label: "Payments",   icon: CreditCard },
  { href: "/tenant/concerns",  label: "Concerns",   icon: AlertCircle },
  { href: "/tenant/profile",   label: "Profile",    icon: User },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: userData } = await supabase
        .from("users")
        .select("full_name, registration_status, role")
        .eq("id", session.user.id)
        .single();

      if (!userData || userData.role !== "tenant" || userData.registration_status !== "approved") {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setTenantName(userData.full_name ?? "");
      setIsAuthorized(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading your portal…</p>
      </div>
    </div>
  );

  if (!isAuthorized) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f9] flex flex-col md:flex-row">
      <SidebarDrawer
        navItems={NAV_ITEMS}
        brandTitle={tenantName || "Tenant"}
        brandSubtitle="Tenant Portal"
        mobileBrandLabel={tenantName || "Tenant Portal"}
        onLogout={handleLogout}
        logoutLabel="Sign out"
        BrandIcon={Home}
      />

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-3xl mx-auto px-5 py-7 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
