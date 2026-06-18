"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { CreditCard } from "lucide-react";

interface Payment {
  id: string;
  bill_id: string;
  amount: number;
  method: "cash" | "gcash";
  status: "pending_verification" | "verified" | "rejected";
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  verified:             "badge-success",
  pending_verification: "badge-warning",
  rejected:             "badge-danger",
};

const STATUS_LABEL: Record<string, string> = {
  verified:             "Verified",
  pending_verification: "Pending",
  rejected:             "Rejected",
};

export default function TenantPaymentsPage() {
  const supabase = createSupabaseClient();
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("payments")
        .select("id, bill_id, amount, method, status, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setPayments(data as Payment[]);
      setIsLoading(false);
    };
    fetchPayments();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading payments…</p>
      </div>
    </div>
  );

  const pending = payments.filter((p) => p.status === "pending_verification").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Finance</p>
        <h1 className="text-display-md">Payment History</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending > 0 ? `${pending} pending verification` : "All payments accounted for"}
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No payments yet</p>
          <p className="text-sm text-slate-400 mt-1">Your submitted payments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div key={payment.id} className="card p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  payment.method === "gcash" ? "bg-blue-50" : "bg-slate-100"
                }`}>
                  <CreditCard className={`w-5 h-5 ${payment.method === "gcash" ? "text-blue-600" : "text-slate-500"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-slate-900">₱{payment.amount.toLocaleString()}</p>
                    <span className={`badge ${STATUS_BADGE[payment.status]}`}>
                      {STATUS_LABEL[payment.status]}
                    </span>
                    <span className="badge badge-slate">
                      {payment.method === "gcash" ? "GCash" : "Cash"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(payment.created_at).toLocaleDateString("en-PH", {
                      month: "long", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GCash info note */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">GCash payments</span> — once submitted with a screenshot, the admin
          will verify within 24 hours. You'll see the status update here.
        </p>
      </div>
    </div>
  );
}
