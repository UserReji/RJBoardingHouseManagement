"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, SquarePen, CircleStop } from "lucide-react";
import toast from "react-hot-toast";

type Contract = { id: string; term_months: number; start_date: string; end_date: string; monthly_rent: number; security_deposit_months: number; advance_payment_months: number; contract_status: "active" | "ended"; created_at: string };
function money(value: number) { return `₱${Number(value).toLocaleString()}`; }

export default function ContractManager({ tenantId, roomId, roomNumber, roomRent, contracts }: { tenantId: string; roomId: string | null; roomNumber: number | null; roomRent: number; contracts: Contract[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [term, setTerm] = useState("6");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [rent, setRent] = useState(String(roomRent || ""));
  const [deposit, setDeposit] = useState("0");
  const [advance, setAdvance] = useState("0");
  const [editing, setEditing] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/contracts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ term_months: term, start_date: start, monthly_rent: rent, security_deposit_months: deposit, advance_payment_months: advance }) });
      const result = await res.json().catch(() => ({})); if (!res.ok) throw new Error(result.error ?? "Could not create contract");
      toast.success("Contract created"); setCreating(false); startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); } finally { setSaving(false); }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return; setSaving(true);
    try {
      const res = await fetch(`/api/admin/contracts/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      const result = await res.json().catch(() => ({})); if (!res.ok) throw new Error(result.error ?? "Could not update contract");
      toast.success("Contract updated"); setEditing(null); startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); } finally { setSaving(false); }
  };

  const end = async (contract: Contract) => {
    if (!confirm("End this contract now? The contract record will remain in history.")) return;
    const res = await fetch(`/api/admin/contracts/${contract.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contract_status: "ended" }) });
    const result = await res.json().catch(() => ({})); if (!res.ok) { toast.error(result.error ?? "Could not end contract"); return; }
    toast.success("Contract ended"); startTransition(() => router.refresh());
  };

  const formFields = (value: Contract, setValue: (next: Contract) => void) => <div className="grid sm:grid-cols-2 gap-3">
    <label><span className="label">Term (months)</span><input className="input" type="number" min="1" value={value.term_months} onChange={(e) => setValue({ ...value, term_months: Number(e.target.value) })} /></label>
    <label><span className="label">Monthly rent (₱)</span><input className="input" type="number" min="0.01" step="0.01" value={value.monthly_rent} onChange={(e) => setValue({ ...value, monthly_rent: Number(e.target.value) })} /></label>
    <label><span className="label">Start date</span><input className="input" type="date" value={value.start_date} onChange={(e) => setValue({ ...value, start_date: e.target.value })} /></label>
    <label><span className="label">End date</span><input className="input" type="date" value={value.end_date} onChange={(e) => setValue({ ...value, end_date: e.target.value })} /></label>
    <label><span className="label">Security deposit (months)</span><input className="input" type="number" min="0" step="0.5" value={value.security_deposit_months} onChange={(e) => setValue({ ...value, security_deposit_months: Number(e.target.value) })} /></label>
    <label><span className="label">Advance payment (months)</span><input className="input" type="number" min="0" step="0.5" value={value.advance_payment_months} onChange={(e) => setValue({ ...value, advance_payment_months: Number(e.target.value) })} /></label>
  </div>;

  return <div className="space-y-5">
    {roomId && <form onSubmit={create} className="card p-5 space-y-4"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-800">New contract</h2><p className="text-sm text-slate-500">Room {roomNumber} · {money(roomRent)} current rent</p></div><button type="button" onClick={() => setCreating(!creating)} className="btn btn-secondary btn-sm">{creating ? "Close" : <><Plus className="w-4 h-4" /> Create</>}</button></div>{creating && <><div className="grid sm:grid-cols-2 gap-3"><label><span className="label">Term (months)</span><input className="input" type="number" min="1" max="120" value={term} onChange={(e) => setTerm(e.target.value)} /></label><label><span className="label">Start date</span><input className="input" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></label><label><span className="label">Monthly rent (₱)</span><input className="input" type="number" min="0.01" step="0.01" required value={rent} onChange={(e) => setRent(e.target.value)} /></label><label><span className="label">Security deposit (months)</span><input className="input" type="number" min="0" step="0.5" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></label><label><span className="label">Advance payment (months)</span><input className="input" type="number" min="0" step="0.5" value={advance} onChange={(e) => setAdvance(e.target.value)} /></label></div><button disabled={saving || isPending} className="btn btn-primary"><Save className="w-4 h-4" />{saving ? "Saving…" : "Create contract"}</button></>}</form>}
    {contracts.length ? contracts.map((contract) => <article key={contract.id} className="card p-5 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{contract.term_months} month contract · {money(contract.monthly_rent)}/month</p><p className="text-sm text-slate-500">{contract.start_date} to {contract.end_date}</p></div><span className={`badge ${contract.contract_status === "active" ? "badge-success" : "badge-slate"}`}>{contract.contract_status}</span></div>{editing?.id === contract.id ? <form onSubmit={save} className="space-y-3">{formFields(editing, setEditing)}<div className="flex gap-2"><button disabled={saving || isPending} className="btn btn-primary btn-sm"><Save className="w-4 h-4" />Save</button><button type="button" onClick={() => setEditing(null)} className="btn btn-secondary btn-sm">Cancel</button></div></form> : <div className="flex flex-wrap gap-2"><p className="text-xs text-slate-500 flex-1">Deposit {contract.security_deposit_months} mo · Advance {contract.advance_payment_months} mo</p>{contract.contract_status === "active" && <><button onClick={() => setEditing(contract)} className="btn btn-secondary btn-sm"><SquarePen className="w-4 h-4" />Edit</button><button onClick={() => end(contract)} disabled={isPending} className="btn btn-ghost btn-sm text-red-600"><CircleStop className="w-4 h-4" />End</button></>}</div>}</article>) : <div className="card p-8 text-center text-sm text-slate-500">No contract history yet.</div>}
  </div>;
}
