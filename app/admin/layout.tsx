"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, DoorOpen, Users, FileText,
  CreditCard, AlertCircle, Settings, LogOut, Menu, X, Home,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/rooms",     label: "Rooms",       icon: DoorOpen },
  { href: "/admin/tenants",   label: "Tenants",     icon: Users },
  { href: "/admin/bills",     label: "Bills",       icon: FileText },
  { href: "/admin/payments",  label: "Payments",    icon: CreditCard },
  { href: "/admin/concerns",  label: "Concerns",    icon: AlertCircle },
  { href: "/admin/settings",  label: "Settings",    icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [isAuthorized,  setIsAuthorized]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);

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

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    router.push("/login");
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-[#f4f6f9] flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 leading-tight">RJ BoardHouse</p>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href) ? "active" : ""}`}
            >
              <Icon className="nav-icon" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item nav-item-danger w-full">
            <LogOut className="nav-icon" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-50 safe-top">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">Admin Portal</span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn btn-ghost btn-icon"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white pb-3 px-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`nav-item ${isActive(href) ? "active" : ""}`}
              >
                <Icon className="nav-icon" />
                {label}
              </Link>
            ))}
            <div className="divider my-2" />
            <button onClick={handleLogout} className="nav-item nav-item-danger w-full">
              <LogOut className="nav-icon" />
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-5 py-7 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
