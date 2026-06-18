import Link from "next/link";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import MarkPaidButton from "./MarkPaidButton";

type StatusFilter = "all" | "unpaid" | "paid" | "partially_paid";

const STATUS_BADGE: Record<string, string> = {
  paid:           "badge-success",
  unpaid:         "badge-danger",
  partially_paid: "badge-warning",
};
const STATUS_LABEL: Record<string, string> = {
  paid: "Paid", unpaid: "Unpaid", partially_paid: "Partial",
};
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",            label: "All" },
  { value: "unpaid",         label: "Unpaid" },
  { value: "partially_paid", label: "Partial" },
  { value: "paid",           label: "Paid" },
];

export default async function AdminBillsPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await searchParams;
  const filter = (sp.filter as StatusFilter) ?? "all";

  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("tenant_bills")
    .select(`
      id, billing_period_start, billing_period_end, total_amount, status,
      users ( full_name ),
      rooms ( room_number )
    `)
    .order("billing_period_start", { ascending: false });

  const bills = (data ?? []).map((b: any) => ({
    id: b.id,
    tenant_name: b.users?.full_name ?? "—",
    room_number: b.rooms?.room_number ?? "—",
    billing_period_start: b.billing_period_start,
    billing_period_end:   b.billing_period_end,
    total_amount:         b.total_amount,
    status:               b.status,
  }));

  const filtered = filter === "all" ? bills : bills.filter((b) => b.status === filter);
  const unpaid   = bills.filter((b) => b.status === "unpaid").length;
  const paid     = bills.filter((b) => b.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Billing</p>
          <h1 className="text-display-md">Bills</h1>
          <p className="text-slate-500 text-sm mt-1">{paid} paid · {unpaid} unpaid</p>
        </div>
        <Link href="/admin/bills/new" className="btn btn-primary btn-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> New Bill
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/bills" : `/admin/bills?filter=${f.value}`}
            className={`btn btn-sm whitespace-nowrap ${
              filter === f.value ? "btn-primary" : "btn-secondary"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No bills found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === "all" ? "Create a bill to get started." : "No bills match this filter."}
          </p>
          {filter === "all" && (
            <Link href="/admin/bills/new" className="btn btn-primary btn-sm mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create Bill
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bill) => (
            <div key={bill.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-all">
              <Link href={`/admin/bills/${bill.id}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900 truncate">{bill.tenant_name}</p>
                    <span className={`badge ${STATUS_BADGE[bill.status]}`}>
                      {STATUS_LABEL[bill.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Room {bill.room_number} ·{" "}
                    {new Date(bill.billing_period_start).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    {" – "}
                    {new Date(bill.billing_period_end).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900">₱{Number(bill.total_amount).toLocaleString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
              </Link>
              {bill.status !== "paid" && (
                <MarkPaidButton billId={bill.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
