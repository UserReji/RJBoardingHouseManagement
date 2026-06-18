import { Check, X, CreditCard, ImageIcon } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import VerifyRejectButtons from "./VerifyRejectButtons";

type StatusFilter = "all" | "pending_verification" | "verified" | "rejected";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  verified: "badge-success", pending_verification: "badge-warning", rejected: "badge-danger",
};
const STATUS_LABEL: Record<string, string> = {
  verified: "Verified", pending_verification: "Pending", rejected: "Rejected",
};
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending_verification", label: "Pending" },
  { value: "verified",             label: "Verified" },
  { value: "rejected",             label: "Rejected" },
  { value: "all",                  label: "All" },
];

export default async function AdminPaymentsPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await searchParams;
  const filter = (sp.filter as StatusFilter) ?? "pending_verification";

  const supabase = await createAdminSupabaseClient();
  const { data } = await supabase
    .from("payments")
    .select(`
      id, amount, method, status, screenshot_url, created_at, bill_id,
      users ( full_name )
    `)
    .order("created_at", { ascending: false });

  const payments = (data ?? []).map((p: any) => ({
    id: p.id,
    tenant_name: p.users?.full_name ?? "—",
    bill_id: p.bill_id,
    amount: p.amount,
    method: p.method,
    status: p.status,
    screenshot_url: p.screenshot_url ?? undefined,
    created_at: p.created_at,
  }));

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);
  const pending  = payments.filter((p) => p.status === "pending_verification").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Finance</p>
        <h1 className="text-display-md">Payment Verification</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending > 0 ? `${pending} pending verification` : "All caught up!"}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/payments" : `/admin/payments?filter=${f.value}`}
            className={`btn btn-sm whitespace-nowrap ${filter === f.value ? "btn-primary" : "btn-secondary"}`}
          >
            {f.label}
            {f.value === "pending_verification" && pending > 0 && (
              <span className="ml-1.5 bg-amber-400 text-amber-900 text-xs rounded-full px-1.5 py-0.5 font-bold">
                {pending}
              </span>
            )}
          </Link>
        ))}
      </div>

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
          {filtered.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 truncate">{p.tenant_name}</p>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-slate-900 text-lg">₱{Number(p.amount).toLocaleString()}</p>
                  <span className={`badge mt-1 ${p.method === "gcash" ? "badge-info" : "badge-slate"}`}>
                    {p.method === "gcash" ? "GCash" : "Cash"}
                  </span>
                </div>
              </div>

              {p.screenshot_url && (
                <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4">
                  <ImageIcon className="w-4 h-4" /> View GCash screenshot
                </a>
              )}

              {p.status === "pending_verification" && (
                <VerifyRejectButtons paymentId={p.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
