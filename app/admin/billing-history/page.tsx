import Link from "next/link";
import { FileText, Droplets, ExternalLink } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import WaterPaymentForm from "./WaterPaymentForm";

const money = (value: number) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "Not recorded";

export default async function BillingHistoryPage() {
  const supabase = await createAdminSupabaseClient();
  const [{ data: batches }, { data: bills }, { data: payments }] = await Promise.all([
    supabase.from("billing_batches").select("*").order("billing_period_start", { ascending: false }),
    supabase.from("tenant_bills").select("id, billing_batch_id, water_charge, total_amount, amount_paid, status"),
    supabase.from("payments").select("bill_id, amount").eq("status", "verified"),
  ]);
  const billsByBatch = new Map<string, any[]>();
  for (const bill of bills ?? []) if (bill.billing_batch_id) billsByBatch.set(bill.billing_batch_id, [...(billsByBatch.get(bill.billing_batch_id) ?? []), bill]);
  const paidByBill = new Map<string, number>();
  for (const payment of payments ?? []) paidByBill.set(payment.bill_id, (paidByBill.get(payment.bill_id) ?? 0) + Number(payment.amount));
  const rows = await Promise.all((batches ?? []).map(async (batch: any) => {
    const cycleBills = billsByBatch.get(batch.id) ?? [];
    const waterBilled = cycleBills.reduce((sum, bill) => sum + Number(bill.water_charge ?? 0), 0);
    const waterCollected = cycleBills.reduce((sum, bill) => {
      const total = Number(bill.total_amount ?? 0); const paid = Math.min(total, Math.max(Number(bill.amount_paid ?? 0), paidByBill.get(bill.id) ?? 0));
      return sum + (total > 0 ? Number(bill.water_charge ?? 0) * paid / total : 0);
    }, 0);
    const signed = batch.water_invoice_url ? await supabase.storage.from("owner-private").createSignedUrl(batch.water_invoice_url, 1800) : null;
    return { ...batch, waterBilled, waterCollected, waterGap: Number(batch.water_utility_amount ?? 0) - waterBilled,
      ownerExtraPaid: Number(batch.water_utility_paid_amount ?? 0) - waterCollected,
      invoiceUrl: signed?.data?.signedUrl ?? null, roomBills: cycleBills.length };
  }));
  const totalExtra = rows.reduce((sum, row) => sum + Math.max(0, row.ownerExtraPaid), 0);
  const totalGap = rows.reduce((sum, row) => sum + Math.max(0, row.waterGap), 0);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">Owner finance</p><h1 className="text-display-md">Billing history</h1><p className="text-sm text-slate-500 mt-1">Utility costs, tenant charges, and paid bill history by cycle.</p></div><Link href="/admin/bills/new" className="btn btn-primary btn-sm"><FileText className="w-4 h-4"/> Create monthly bills</Link></div>
    <div className="grid sm:grid-cols-2 gap-3"><div className="card p-5"><p className="text-sm text-slate-500">Water utility cost not covered by tenant charges</p><p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{money(totalGap)}</p></div><div className="card p-5"><p className="text-sm text-slate-500">Owner-paid water less estimated tenant water collections</p><p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{money(totalExtra)}</p><p className="text-xs text-slate-400 mt-1">Tenant receipts are proportionally allocated to each bill’s water share.</p></div></div>
    {rows.length === 0 ? <div className="card p-10 text-center text-sm text-slate-500">Monthly billing cycles will appear here after the first batch is published.</div> : <div className="space-y-3">{rows.map((row) => <article key={row.id} className="card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-blue-600 font-bold">Billing cycle</p><h2 className="text-lg font-bold">{date(row.billing_period_start)} – {date(row.billing_period_end)}</h2><p className="text-sm text-slate-500">{row.roomBills} room bills · {row.status === "published" ? "Published" : "Draft"}</p></div><span className="badge badge-slate">{row.roomBills} tenant accounts</span></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm"><div><p className="text-slate-500">Actual water bill</p><strong>{money(row.water_utility_amount)}</strong></div><div><p className="text-slate-500">Owner paid</p><strong>{money(row.water_utility_paid_amount)} · {date(row.water_paid_at)}</strong></div><div><p className="text-slate-500">Water billed to tenants</p><strong>{money(row.waterBilled)}</strong></div><div><p className="text-slate-500">Tenant water collected (estimate)</p><strong>{money(row.waterCollected)}</strong></div></div>
      <div className={`rounded-lg p-3 text-sm ${row.waterGap > 0 ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}><strong>Utility cost gap:</strong> {money(row.waterGap)}. <strong className="ml-1">Owner paid less tenant collections:</strong> {money(row.ownerExtraPaid)}.</div>
      <WaterPaymentForm batchId={row.id} initialAmount={Number(row.water_utility_paid_amount ?? 0)} initialDate={row.water_paid_at ?? null} />
      <div className="flex flex-wrap gap-4 text-sm">{row.invoiceUrl && <a className="text-blue-700 underline inline-flex items-center gap-1" href={row.invoiceUrl} target="_blank" rel="noreferrer"><Droplets className="w-4 h-4"/> Private water invoice <ExternalLink className="w-3 h-3"/></a>}<Link className="text-blue-700 underline" href="/admin/bills?filter=paid">View paid tenant bills</Link></div>
    </article>)}</div>}
  </div>;
}



