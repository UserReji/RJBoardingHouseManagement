"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import {
  DoorOpen, Banknote, AlertCircle, Users,
  ArrowRight, TrendingUp, ClipboardList,
} from "lucide-react";

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalTenants: number;
  pendingRegistrations: number;
  pendingVerifications: number;
  monthlyCollected: number;
  pendingBills: number;
  openConcerns: number;
}

function StatCard({
  label, value, sub, color,
}: { label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue:   "bg-blue-50 border-blue-100 text-blue-600",
    green:  "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber:  "bg-amber-50 border-amber-100 text-amber-600",
    purple: "bg-violet-50 border-violet-100 text-violet-600",
    red:    "bg-red-50 border-red-100 text-red-600",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="stat-label" style={{ color: "inherit", opacity: 0.7 }}>{label}</p>
      <p className="stat-number" style={{ color: "inherit" }}>{value}</p>
      {sub && <p className="text-xs mt-1.5 opacity-70 font-medium">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const supabase = createSupabaseClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real counts from Supabase
        const [rooms, tenants, bills, payments, concerns] = await Promise.all([
          supabase.from("rooms").select("id, status", { count: "exact" }),
          supabase.from("users").select("id, registration_status", { count: "exact" }).eq("role", "tenant"),
          supabase.from("tenant_bills").select("id, status, total_amount", { count: "exact" }),
          supabase.from("payments").select("id, status", { count: "exact" }),
          supabase.from("concerns").select("id, status", { count: "exact" }),
        ]);

        const roomData     = rooms.data     ?? [];
        const tenantData   = tenants.data   ?? [];
        const billData     = bills.data     ?? [];
        const paymentData  = payments.data  ?? [];
        const concernData  = concerns.data  ?? [];

        const paidBills = billData.filter((b: any) => b.status === "paid");
        const collected = paidBills.reduce((sum: number, b: any) => sum + (b.total_amount ?? 0), 0);

        setStats({
          totalRooms:            roomData.length,
          occupiedRooms:         roomData.filter((r: any) => r.status === "occupied").length,
          totalTenants:          tenantData.filter((t: any) => t.registration_status === "approved").length,
          pendingRegistrations:  tenantData.filter((t: any) => t.registration_status === "pending").length,
          pendingVerifications:  paymentData.filter((p: any) => p.status === "pending_verification").length,
          monthlyCollected:      collected,
          pendingBills:          billData.filter((b: any) => b.status === "unpaid").length,
          openConcerns:          concernData.filter((c: any) => c.status === "open").length,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // Fallback zeros so UI still renders
        setStats({
          totalRooms: 0, occupiedRooms: 0, totalTenants: 0,
          pendingRegistrations: 0, pendingVerifications: 0,
          monthlyCollected: 0, pendingBills: 0, openConcerns: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading || !stats) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </div>
    </div>
  );

  const occupancyPct = stats.totalRooms
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Overview</p>
        <h1 className="text-display-md">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your boarding house at a glance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          sub={`${stats.occupiedRooms} of ${stats.totalRooms} rooms`}
          color="blue"
        />
        <StatCard
          label="Collected"
          value={`₱${stats.monthlyCollected.toLocaleString()}`}
          sub="Paid bills total"
          color="green"
        />
        <StatCard
          label="Unpaid Bills"
          value={stats.pendingBills}
          sub="Awaiting payment"
          color="amber"
        />
        <StatCard
          label="Tenants"
          value={stats.totalTenants}
          sub="Active"
          color="purple"
        />
      </div>

      {/* Action items */}
      {(stats.pendingRegistrations > 0 || stats.pendingVerifications > 0 || stats.openConcerns > 0) && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Action needed</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.pendingRegistrations > 0 && (
              <Link
                href="/admin/tenants"
                className="card p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Pending registrations</p>
                    <p className="text-xs text-slate-500">{stats.pendingRegistrations} awaiting approval</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </Link>
            )}
            {stats.pendingVerifications > 0 && (
              <Link
                href="/admin/payments"
                className="card p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Payment verifications</p>
                    <p className="text-xs text-slate-500">{stats.pendingVerifications} pending review</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </Link>
            )}
            {stats.openConcerns > 0 && (
              <Link
                href="/admin/concerns"
                className="card p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Open concerns</p>
                    <p className="text-xs text-slate-500">{stats.openConcerns} need a response</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick actions</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/admin/bills/new"
            className="card p-4 border-blue-200 bg-blue-50 hover:shadow-md transition-shadow flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Create new bill</p>
                <p className="text-xs text-slate-500">Generate a bill for a tenant</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-700 transition-colors" />
          </Link>

          <Link
            href="/admin/rooms"
            className="card p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <DoorOpen className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Manage rooms</p>
                <p className="text-xs text-slate-500">{stats.totalRooms - stats.occupiedRooms} vacant · {stats.occupiedRooms} occupied</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
