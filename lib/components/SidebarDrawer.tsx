"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type Props = {
  navItems: NavItem[];
  /** Small label shown under the brand in the desktop sidebar (e.g. "Admin Portal"). */
  brandSubtitle?: string;
  /** Title shown next to the logo in the desktop sidebar (defaults to "RJ BoardHouse"). */
  brandTitle?: string;
  /** Optional override of the brand badge in the mobile top bar. */
  mobileBrandLabel?: string;
  /** Footer action — rendered at the bottom of both the desktop sidebar and the drawer. */
  onLogout: () => void;
  /** Optional label for the logout button. */
  logoutLabel?: string;
  /** Optional icon to render inside the brand badge instead of Home. */
  BrandIcon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function SidebarDrawer({
  navItems,
  brandTitle = "RJ BoardHouse",
  brandSubtitle = "Portal",
  mobileBrandLabel,
  onLogout,
  logoutLabel = "Sign out",
  BrandIcon = Home,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname?.startsWith(href);
  const close = () => setOpen(false);

  // Close drawer whenever the route changes (Link onClick fires before navigation,
  // but usePathname updates after — this catches back/forward + programmatic nav).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body scroll lock + Esc-to-close while drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("drawer-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("drawer-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const SidebarBody = (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <BrandIcon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900 leading-tight truncate">{brandTitle}</p>
          <p className="text-xs text-slate-400">{brandSubtitle}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={close}
            className={`nav-item ${isActive(href) ? "active" : ""}`}
          >
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button onClick={onLogout} className="nav-item nav-item-danger w-full">
          <X className="nav-icon" />
          {logoutLabel}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex sidebar">{SidebarBody}</aside>

      {/* ── Mobile top bar (md-) ── */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-50 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BrandIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900 truncate">
              {mobileBrandLabel ?? brandSubtitle ?? brandTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="app-drawer"
            className="btn btn-ghost btn-icon"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Drawer overlay (mobile only) ── */}
      <div
        className={`drawer-backdrop md:hidden ${open ? "open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Drawer panel (mobile only) ── */}
      <aside
        id="app-drawer"
        className={`drawer md:hidden ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="drawer-handle" />
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation menu"
            className="btn btn-ghost btn-icon absolute right-3 top-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {SidebarBody}
      </aside>
    </>
  );
}
