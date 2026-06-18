"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { FileText, CreditCard, AlertCircle, ChevronRight, DoorOpen } from "lucide-react";

interface TenantDashboardData {
  full_name: string;
  room_number: number | null;
  monthly_rent: number | null;
  latest_bill: {
    id: string;
    total_amount: number;
    status: string;
    billing_period_end: string;
  } | null;
  unpaid_count: number;
  pending_payment_count: number;
  open_concern_count: number;
}

export default function TenantDashboard() {
  const supabase = createSupabaseClient();
  const [data,      setData]      = useState<TenantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      const [userRes, billsRes, paymentsRes, concernsRes] = await Promise.all([
        supabase
          .from("users")
          .select("full_name, rooms(room_number, monthly_rent)")
          .eq("id", userId)
          .single(),
        supabase
          .from("tenant_bills")
          .select("id, total_amount, status, billing_period_end")
          .eq("user_id", userId)
          .order("billing_period_end", { ascending: false }),
        supabase
          .from("payments")
          .select("id, status")
          .eq("user_id", userId)
          .eq("status", "pending_verification"),
        supabase
          .from("concerns")
          .select("id, status")
          .eq("user_id", userId)
          .eq("status", "open"),
      ]);

      const bills    = billsRes.data   ?? [];
      const payments = paymentsRes.data ?? [];
      const concerns = concernsRes.data ?? [];
      const user     = userRes.data;

      setData({
        full_name:             user?.full_name ?? "",
        room_number:           (user?.rooms as any)?.room_number ?? null,
        monthly_rent:          (user?.rooms as any)?.monthly_rent ?? null,
        latest_bill:           bills[0] ?? null,
        unpaid_count:          bills.filter((b: any) => b.status === "unpaid").length,
        pending_payment_count: payments.length,
        open_concern_count:    concerns.length,
      });
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading || !data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading your dashboard…</p>
      </div>
    </div>
  );

  const STATUS_BADGE: Record<string, string> = {
    paid:           "badge-success",
    unpaid:         "badge-danger",
    partially_paid: "badge-warning",
  };
  const STATUS_LABEL: Record<string, string> = {
    paid:           "Paid",
    unpaid:         "Unpaid",
    partially_paid: "Partial",
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Welcome back</p>
        <h1 className="text-display-md">
          {data.full_name ? `Hi, ${data.full_name.split(" ")[0]} 👋` : "Your Dashboard"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's your boarding house summary.</p>
      </div>

      {/* Room card */}
      {data.room_number && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1a3353] to-[#1e3f6a] text-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-widest mb-1">Your Room</p>
              <p className="text-4xl font-extrabold tracking-tight">{data.room_number}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <DoorOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          {data.monthly_rent && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-blue-200">Monthly rent</p>
              <p className="font-extrabold text-lg text-amber-400">₱{data.monthly_rent.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Latest bill */}
      {data.latest_bill && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Latest bill</p>
          <Link
            href={`/tenant/bills/${data.latest_bill.id}`}
            className="card p-5 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-extrabold text-xl text-slate-900">
                  ₱{data.latest_bill.total_amount.toLocaleString()}
                </p>
                <span className={`badge ${STATUS_BADGE[data.latest_bill.status] ?? "badge-slate"}`}>
                  {STATUS_LABEL[data.latest_bill.status] ?? data.latest_bill.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Due: {new Date(data.latest_bill.billing_period_end).toLocaleDateString("en-PH", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick access</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/tenant/bills"
            className="card p-4 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Bills</p>
              <p className="text-xs text-slate-400">
                {data.unpaid_count > 0 ? `${data.unpaid_count} unpaid` : "All paid"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </Link>

          <Link
            href="/tenant/payments"
            className="card p-4 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Payments</p>
              <p className="text-xs text-slate-400">
                {data.pending_payment_count > 0 ? `${data.pending_payment_count} pending` : "All verified"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </Link>

          <Link
            href="/tenant/concerns"
            className="card p-4 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">Concerns</p>
              <p className="text-xs text-slate-400">
                {data.open_concern_count > 0 ? `${data.open_concern_count} open` : "None open"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </Link>
        </div>
      </div>
    </div>
  );
}
