"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { Check, X, CreditCard, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

type StatusFilter = "all" | "pending_verification" | "verified" | "rejected";

interface Payment {
  id: string;
  tenant_name: string;
  bill_id: string;
  amount: number;
  method: "cash" | "gcash";
  status: "pending_verification" | "verified" | "rejected";
  screenshot_url?: string;
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

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending_verification", label: "Pending" },
  { value: "verified",             label: "Verified" },
  { value: "rejected",             label: "Rejected" },
  { value: "all",                  label: "All" },
];

export default function AdminPaymentsPage() {
  const supabase = createSupabaseClient();
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [filter,    setFilter]    = useState<StatusFilter>("pending_verification");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id, amount, method, status, screenshot_url, created_at, bill_id,
          users ( full_name )
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPayments(
          data.map((p: any) => ({
            id:             p.id,
            tenant_name:    p.users?.full_name ?? "—",
            bill_id:        p.bill_id,
            amount:         p.amount,
            method:         p.method,
            status:         p.status,
            screenshot_url: p.screenshot_url ?? undefined,
            created_at:     p.created_at,
          }))
        );
      }
      setIsLoading(false);
    };
    fetchPayments();
  }, []);

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update payment");
      return;
    }
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    toast.success(status === "verified" ? "Payment verified" : "Payment rejected");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading payments…</p>
      </div>
    </div>
  );

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);
  const pending  = payments.filter((p) => p.status === "pending_verification").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Finance</p>
        <h1 className="text-display-md">Payment Verification</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending > 0 ? `${pending} pending verification` : "All caught up!"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn-sm whitespace-nowrap ${filter === f.value ? "btn-primary" : "btn-secondary"}`}
          >
            {f.label}
            {f.value === "pending_verification" && pending > 0 && (
              <span className="ml-1.5 bg-amber-400 text-amber-900 text-xs rounded-full px-1.5 py-0.5 font-bold">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No payments found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === "pending_verification" ? "No payments awaiting verification." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <div key={payment.id} className="card p-5">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 truncate">{payment.tenant_name}</p>
                    <span className={`badge ${STATUS_BADGE[payment.status]}`}>
                      {STATUS_LABEL[payment.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(payment.created_at).toLocaleDateString("en-PH", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-slate-900 text-lg">₱{payment.amount.toLocaleString()}</p>
                  <span className={`badge mt-1 ${payment.method === "gcash" ? "badge-info" : "badge-slate"}`}>
                    {payment.method === "gcash" ? "GCash" : "Cash"}
                  </span>
                </div>
              </div>

              {/* Screenshot preview */}
              {payment.screenshot_url && (
                <a
                  href={payment.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
                >
                  <ImageIcon className="w-4 h-4" />
                  View GCash screenshot
                </a>
              )}

              {/* Action buttons */}
              {payment.status === "pending_verification" && (
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => updateStatus(payment.id, "verified")}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <Check className="w-4 h-4" />
                    Verify
                  </button>
                  <button
                    onClick={() => updateStatus(payment.id, "rejected")}
                    className="btn btn-danger btn-sm flex-1"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
