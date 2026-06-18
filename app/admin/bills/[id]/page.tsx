import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Home, Zap, Users, FileText, CreditCard, Check } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import BillStatusButton from "./BillStatusButton";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtMoney = (n: any) => `₱${Number(n ?? 0).toLocaleString()}`;

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-success", unpaid: "badge-danger", partially_paid: "badge-warning",
};
const STATUS_LABEL: Record<string, string> = {
  paid: "Paid", unpaid: "Unpaid", partially_paid: "Partially Paid",
};

export default async function BillDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();

  const { data: bill, error } = await supabase
    .from("tenant_bills")
    .select(`
      id, billing_period_start, billing_period_end, status, notes,
      room_rent, extra_occupant_days, extra_occupant_rate, extra_occupant_charge,
      kwh_consumed, kwh_rate, electricity_charge, total_amount,
      users ( id, full_name, email ),
      rooms ( id, room_number, monthly_rent )
    `)
    .eq("id", id)
    .single();
  if (error || !bill) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, status, created_at, screenshot_url")
    .eq("bill_id", id)
    .order("created_at", { ascending: false });

  const tenant = Array.isArray((bill as any).users) ? (bill as any).users[0] : (bill as any).users;
  const room   = Array.isArray((bill as any).rooms) ? (bill as any).rooms[0] : (bill as any).rooms;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/bills" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Bill Details</h1>
        </div>

        {/* Hero card */}
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 mb-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-blue-100 text-sm">Total Amount</p>
              <h2 className="text-4xl font-bold mt-1">{fmtMoney(bill.total_amount)}</h2>
            </div>
            <span className={`badge ${STATUS_BADGE[bill.status]}`}>
              {STATUS_LABEL[bill.status]}
            </span>
          </div>
          <p className="text-blue-100 text-sm">
            {tenant?.full_name ?? "—"} · {fmt(bill.billing_period_start)} – {fmt(bill.billing_period_end)}
          </p>
          {room && <p className="text-blue-200 text-xs mt-1">Room {room.room_number}</p>}
        </div>

        {/* Actions */}
        {bill.status !== "paid" ? (
          <div className="flex gap-2 mb-5">
            <BillStatusButton
              billId={bill.id} action="mark-paid" label="Mark as paid"
              className="btn btn-primary flex-1"
            />
          </div>
        ) : (
          <div className="flex gap-2 mb-5">
            <BillStatusButton
              billId={bill.id} action="mark-unpaid" label="Reopen as unpaid"
              className="btn btn-secondary flex-1"
            />
          </div>
        )}

        {/* Breakdown */}
        <div className="mb-6">
          <h3 className="text-title-md mb-4">Breakdown</h3>
          <div className="space-y-3">
            <Row icon={Home}  title="Room Rent" sub={`Room ${room?.room_number ?? "—"}`} value={fmtMoney(bill.room_rent)} />
            <Row icon={Zap}   title="Electricity" sub={`${bill.kwh_consumed} kWh × ${fmtMoney(bill.kwh_rate)}/kWh`} value={fmtMoney(bill.electricity_charge)} />
            {Number(bill.extra_occupant_days) > 0 && (
              <Row icon={Users} title="Extra Occupant" sub={`${bill.extra_occupant_days} days × ${fmtMoney(bill.extra_occupant_rate)}/day`} value={fmtMoney(bill.extra_occupant_charge)} />
            )}
            {bill.notes && (
              <div className="card p-4">
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{bill.notes}</p>
              </div>
            )}
            <div className="card p-4 border-l-4 border-l-blue-600 bg-blue-50 flex items-start justify-between">
              <p className="font-bold text-slate-900">Total</p>
              <p className="text-xl font-bold text-blue-600">{fmtMoney(bill.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Payments against this bill */}
        <div>
          <h3 className="text-title-md mb-4">Payments</h3>
          {(!payments || payments.length === 0) ? (
            <div className="card p-8 text-center text-sm text-slate-500">
              No payments recorded yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {payments.map((p: any) => (
                <li key={p.id} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{fmtMoney(p.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {p.method === "gcash" ? "GCash" : "Cash"} · {fmt(p.created_at)}
                    </p>
                  </div>
                  <span className={`badge ${
                    p.status === "verified" ? "badge-success" :
                    p.status === "rejected" ? "badge-danger" : "badge-warning"
                  }`}>
                    {p.status}
                  </span>
                  {p.screenshot_url && (
                    <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      screenshot
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, sub, value }: { icon: any; title: string; sub: string; value: string }) {
  return (
    <div className="card p-4 flex items-start justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-500 truncate">{sub}</p>
        </div>
      </div>
      <p className="font-bold text-slate-900 flex-shrink-0">{value}</p>
    </div>
  );
}
