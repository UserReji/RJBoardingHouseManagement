import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Home, Zap, Users, Clock3 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase.server";
import PayButton from "./PayButton";
import CashPaymentButton from "./CashPaymentButton";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—";
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
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: bill, error } = await supabase
    .from("tenant_bills")
    .select(`
      id, billing_period_start, billing_period_end, status, notes, paid_at, amount_paid,
      room_rent, extra_occupant_days, extra_occupant_rate, extra_occupant_charge,
      kwh_consumed, kwh_rate, electricity_charge, total_amount, electricity_invoice_url, meter_photo_url, credit_balance,
      rooms ( id, room_number )
    `)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (error || !bill) notFound();

  const { data: billLines } = await supabase.from("bill_line_items").select("id, label, amount, item_type, adjustment_note, created_at").eq("bill_id", id).order("sort_order");

  // Settings (GCash QR) — settings is readable by any authenticated user
  const { data: settings } = await supabase
    .from("settings")
    .select("gcash_qr_url")
    .eq("id", 1)
    .single();
  const gcashQrUrl = settings?.gcash_qr_url ?? null;

  const room = Array.isArray((bill as any).rooms) ? (bill as any).rooms[0] : (bill as any).rooms;
  const { data: pendingPayments } = await supabase.from("payments")
    .select("id, amount, method, created_at")
    .eq("bill_id", id).eq("status", "pending_verification").order("created_at", { ascending: false }).limit(1);
  const pendingPayment = pendingPayments?.[0] ?? null;
  const remaining = Math.max(0, Number(bill.total_amount) - Number((bill as any).amount_paid ?? 0));

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tenant/bills" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Bill Details</h1>
        </div>

        {/* High contrast amount card */}
        <div className="card border border-blue-200 bg-blue-50/70 p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-slate-600 text-sm font-medium">Bill total</p>
              <h2 className="text-4xl font-bold tracking-tight tabular-nums text-slate-950 mt-1">{fmtMoney(bill.total_amount)}</h2>
              {Number((bill as any).amount_paid ?? 0) > 0 && bill.status !== "paid" && <p className="mt-2 text-sm text-slate-600">Balance due: <strong className="text-slate-900 tabular-nums">{fmtMoney(remaining)}</strong></p>}
            </div>
            <span className={`badge ${STATUS_BADGE[bill.status as string]}`}>
              {STATUS_LABEL[bill.status as string] ?? bill.status}
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            {fmt(bill.billing_period_start)} to {fmt(bill.billing_period_end)}{bill.status === "paid" && (bill as any).paid_at ? ` · Paid ${fmt((bill as any).paid_at)}` : ""}
          </p>
        </div>

        {/* Breakdown */}
        <div className="mb-6">
          <h3 className="text-title-md mb-4">Breakdown</h3>
          <div className="space-y-3">            {billLines?.length ? billLines.map((line: any) => (
              <div key={line.id} className="card p-4 flex items-start justify-between gap-4">
                <div><p className="font-medium text-slate-900">{line.label}</p><p className="text-xs text-slate-500">{line.item_type === "credit" ? "Credit" : "Charge"}{line.adjustment_note ? ` · ${line.adjustment_note}` : ""}</p></div>
                <p className={`font-bold tabular-nums ${line.item_type === "credit" ? "text-emerald-700" : "text-slate-900"}`}>{line.item_type === "credit" ? "− " : ""}{fmtMoney(line.amount)}</p>
              </div>
            )) : <>
              <Row icon={Home} title="Room Rent" sub={`Room ${room?.room_number ?? "—"}`} value={fmtMoney(bill.room_rent)} />
              <Row icon={Zap} title="Electricity" sub={`${Number(bill.kwh_consumed ?? 0)} kWh`} value={fmtMoney(bill.electricity_charge)} />
              {Number(bill.extra_occupant_days ?? 0) > 0 && <Row icon={Users} title="Extra Occupant" sub={`${bill.extra_occupant_days} days`} value={fmtMoney(bill.extra_occupant_charge)} />}
            </>}
            {Number((bill as any).credit_balance ?? 0) > 0 && <div className="card p-4 flex justify-between text-emerald-800"><span>Credit carried to next bill</span><strong>{fmtMoney((bill as any).credit_balance)}</strong></div>}
            {(bill as any).electricity_invoice_url && <a className="text-sm text-blue-700 underline" href={(bill as any).electricity_invoice_url} target="_blank" rel="noreferrer">View building electricity bill</a>}
            {(bill as any).meter_photo_url && <a className="text-sm text-blue-700 underline" href={(bill as any).meter_photo_url} target="_blank" rel="noreferrer">View this room’s submeter photo</a>}
            {bill.notes && (
              <div className="card p-4">
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{bill.notes}</p>
              </div>
            )}
            <div className="card p-4 border-l-4 border-l-blue-600 bg-blue-50 flex items-start justify-between">
              <p className="font-bold text-slate-900">Total</p>
              <p className="text-xl font-bold text-slate-950 tabular-nums">{fmtMoney(bill.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Payment options and admin confirmation state */}
        {bill.status === "paid" ? (
          <div className="card p-6 bg-emerald-50 border-emerald-200 text-center">
            <p className="font-bold text-emerald-800">This bill is fully paid.</p>
          </div>
        ) : pendingPayment ? (
          <div className="card p-5 border border-amber-200 bg-amber-50 flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
            <div><p className="font-semibold text-amber-950">Payment submitted — awaiting admin confirmation</p>
              <p className="text-sm text-amber-900 mt-1">{pendingPayment.method === "cash" ? "Cash" : "GCash"} · {fmtMoney(pendingPayment.amount)} · Submitted {fmt(pendingPayment.created_at)}</p>
              <p className="text-sm text-amber-900 mt-1">Your bill will be updated after the admin reviews your payment.</p>
            </div>
          </div>
        ) : bill.status !== "paid" ? (
          <div className="mb-6">
            <div className="flex items-end justify-between gap-3 mb-4"><h3 className="text-title-md">Payment Options</h3><p className="text-sm text-slate-600">Due <strong className="text-slate-950 tabular-nums">{fmtMoney(remaining)}</strong></p></div>
            <div className="space-y-3">
              <PayButton billId={bill.id} amountDue={remaining} gcashQrUrl={gcashQrUrl} />
              <CashPaymentButton billId={bill.id} amountDue={remaining} />
            </div>
          </div>
        ) : null}
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
