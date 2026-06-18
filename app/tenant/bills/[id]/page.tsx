import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Home, Zap, Users, Check } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase.server";
import PayButton from "./PayButton";

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
      id, billing_period_start, billing_period_end, status, notes,
      room_rent, extra_occupant_days, extra_occupant_rate, extra_occupant_charge,
      kwh_consumed, kwh_rate, electricity_charge, total_amount,
      rooms ( id, room_number )
    `)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (error || !bill) notFound();

  // Settings (GCash QR) — settings is readable by any authenticated user
  const { data: settings } = await supabase
    .from("settings")
    .select("gcash_qr_url")
    .eq("id", 1)
    .single();
  const gcashQrUrl = settings?.gcash_qr_url ?? null;

  const room = Array.isArray((bill as any).rooms) ? (bill as any).rooms[0] : (bill as any).rooms;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tenant/bills" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Bill Details</h1>
        </div>

        {/* Hero */}
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 mb-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-blue-100 text-sm">Total Amount</p>
              <h2 className="text-4xl font-bold mt-1">{fmtMoney(bill.total_amount)}</h2>
            </div>
            <span className={`badge ${STATUS_BADGE[bill.status as string]}`}>
              {STATUS_LABEL[bill.status as string] ?? bill.status}
            </span>
          </div>
          <p className="text-blue-100 text-sm">
            {fmt(bill.billing_period_start)} to {fmt(bill.billing_period_end)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="mb-6">
          <h3 className="text-title-md mb-4">Breakdown</h3>
          <div className="space-y-3">
            <Row icon={Home} title="Room Rent" sub={`Room ${room?.room_number ?? "—"}`} value={fmtMoney(bill.room_rent)} />
            <Row icon={Zap}  title="Electricity" sub={`${Number(bill.kwh_consumed ?? 0)} kWh × ${fmtMoney(bill.kwh_rate)}/kWh`} value={fmtMoney(bill.electricity_charge)} />
            {Number(bill.extra_occupant_days ?? 0) > 0 && (
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

        {/* Payment options */}
        {bill.status !== "paid" ? (
          <div className="mb-6">
            <h3 className="text-title-md mb-4">Payment Options</h3>
            <div className="space-y-3">
              <PayButton billId={bill.id} gcashQrUrl={gcashQrUrl} />
              <div className="card p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Cash Payment</p>
                  <p className="text-sm text-slate-500">Pay directly at the office</p>
                </div>
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 bg-emerald-50 border-emerald-200 text-center">
            <p className="font-bold text-emerald-700">This bill is fully paid.</p>
          </div>
        )}
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
