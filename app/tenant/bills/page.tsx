"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { ChevronRight, FileText } from "lucide-react";

interface Bill {
  id: string;
  billing_period_start: string;
  billing_period_end: string;
  total_amount: number;
  status: "paid" | "unpaid" | "partially_paid";
}

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

export default function TenantBillsPage() {
  const supabase = createSupabaseClient();
  const [bills,     setBills]     = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("tenant_bills")
        .select("id, billing_period_start, billing_period_end, total_amount, status")
        .eq("user_id", session.user.id)
        .order("billing_period_start", { ascending: false });

      if (!error && data) setBills(data as Bill[]);
      setIsLoading(false);
    };
    fetchBills();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading bills…</p>
      </div>
    </div>
  );

  const unpaid = bills.filter((b) => b.status === "unpaid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Finance</p>
        <h1 className="text-display-md">Your Bills</h1>
        <p className="text-slate-500 text-sm mt-1">
          {unpaid > 0 ? `${unpaid} unpaid bill${unpaid > 1 ? "s" : ""}` : "All bills settled ✓"}
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No bills yet</p>
          <p className="text-sm text-slate-400 mt-1">Your bills will appear here once issued by the admin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <Link
              key={bill.id}
              href={`/tenant/bills/${bill.id}`}
              className="card p-4 hover:shadow-md transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">
                  {new Date(bill.billing_period_start).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  {" – "}
                  {new Date(bill.billing_period_end).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">₱{bill.total_amount.toLocaleString()}</p>
                  <span className={`badge ${STATUS_BADGE[bill.status]}`}>
                    {STATUS_LABEL[bill.status]}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
