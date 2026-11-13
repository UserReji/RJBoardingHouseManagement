"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, Upload, Zap, Droplets, Users, FileText, Check, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

type Line = { label: string; amount: number; type: "charge" | "credit"; manual?: boolean };
type Room = { id: string; room_number: number; monthly_rent: number; occupant_count: number; previous_kwh: number; tenant: { id: string; full_name: string; billing_credit: number } };
type RoomDraft = { previous: string; current: string; occupants: number; meterUrl: string; lines: Line[] };
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmt = (n: number) => `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toLocaleDateString("en-CA");
const monthStart = () => `${today().slice(0, 8)}01`;
const waterOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 20);

export default function CreateBillForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [periodStart, setPeriodStart] = useState(monthStart());
  const [periodEnd, setPeriodEnd] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [electricityTotal, setElectricityTotal] = useState("");
  const [electricityUrl, setElectricityUrl] = useState("");
  const [waterAmount, setWaterAmount] = useState("");
  const [waterPaid, setWaterPaid] = useState("");
  const [waterPaidAt, setWaterPaidAt] = useState("");
  const [waterRate, setWaterRate] = useState(20);
  const [waterInvoicePath, setWaterInvoicePath] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, RoomDraft>>(() => Object.fromEntries(rooms.map((room) => [room.id, {
    previous: String(room.previous_kwh), current: String(room.previous_kwh), occupants: Math.max(1, Number(room.occupant_count ?? 1)), meterUrl: "",
    lines: [
      { label: "Room rent", amount: Number(room.monthly_rent), type: "charge" },
      { label: "Electricity", amount: 0, type: "charge" },
      { label: "Water", amount: Math.max(1, Number(room.occupant_count ?? 1)) * 20, type: "charge" },
    ],
  }])));

  const consumption = (room: Room) => Math.max(0, Number(drafts[room.id]?.current || 0) - Number(drafts[room.id]?.previous || 0));
  const totalKwh = useMemo(() => rooms.reduce((sum, room) => sum + consumption(room), 0), [rooms, drafts]);
  const electricityMap = useMemo(() => {
    const total = Number(electricityTotal || 0);
    let used = 0;
    return new Map(rooms.map((room, index) => {
      const amount = totalKwh <= 0 ? 0 : index === rooms.length - 1
        ? money(total - used)
        : money(total * consumption(room) / totalKwh);
      used = money(used + amount);
      return [room.id, amount];
    }));
  }, [rooms, electricityTotal, totalKwh, drafts]);

  const updateRoom = (id: string, update: Partial<RoomDraft>) => setDrafts((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  const updateLine = (roomId: string, index: number, update: Partial<Line>) => setDrafts((current) => ({
    ...current, [roomId]: { ...current[roomId], lines: current[roomId].lines.map((line, i) => i === index ? { ...line, ...update } : line) },
  }));
  const upload = async (file: File | undefined, category: string, roomId = "") => {
    if (!file) return null;
    const key = roomId ? `${category}:${roomId}` : category;
    setUploads((state) => ({ ...state, [key]: true }));
    try {
      const form = new FormData(); form.set("file", file); form.set("category", category); if (roomId) form.set("roomId", roomId);
      const response = await fetch("/api/admin/billing-batches/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      toast.success("File uploaded");
      return result as { url?: string; path?: string; private?: boolean };
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); return null; }
    finally { setUploads((state) => ({ ...state, [key]: false })); }
  };
  const handleElectricityUpload = async (file?: File) => { const result = await upload(file, "electricity"); if (result?.url) setElectricityUrl(result.url); };
  const handleWaterUpload = async (file?: File) => { const result = await upload(file, "water"); if (result?.path) setWaterInvoicePath(result.path); };
  const handleMeterUpload = async (roomId: string, file?: File) => { const result = await upload(file, "meter", roomId); if (result?.url) updateRoom(roomId, { meterUrl: result.url }); };
  const lineAmount = (roomId: string, line: Line) => !line.manual && line.label.toLowerCase() === "electricity" ? (electricityMap.get(roomId) ?? 0) : !line.manual && line.label.toLowerCase() === "water" ? waterRate * (drafts[roomId]?.occupants ?? 1) : Number(line.amount || 0);
  const amountFor = (roomId: string, lines: Line[]) => money(lines.reduce((sum, line) => sum + (line.type === "charge" ? lineAmount(roomId, line) : -lineAmount(roomId, line)), 0));

  const submit = async () => {
    if (!rooms.length) { toast.error("There are no approved tenants assigned to rooms."); return; }
    if (!periodStart || !periodEnd || periodEnd < periodStart || !electricityTotal || !waterAmount) { toast.error("Complete the billing dates and both utility bill amounts."); return; }
    if (Number(electricityTotal) > 0 && totalKwh <= 0) { toast.error("Enter room electricity use before allocating the shared bill."); return; }
    if (!electricityUrl || !waterInvoicePath || rooms.some((room) => !drafts[room.id].meterUrl)) { toast.error("Attach the electricity bill, private water invoice, and each room submeter photo first."); return; }
    if (rooms.some((room) => drafts[room.id].previous === "" || drafts[room.id].current === "" || !Number.isFinite(Number(drafts[room.id].previous)) || !Number.isFinite(Number(drafts[room.id].current)) || Number(drafts[room.id].current) < Number(drafts[room.id].previous))) { toast.error("Enter valid previous and current readings. Current readings must be at least as high as previous readings."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/billing-batches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_period_start: periodStart, billing_period_end: periodEnd, due_date: dueDate || null,
          electricity_total: Number(electricityTotal), electricity_invoice_url: electricityUrl || null,
          water_utility_amount: Number(waterAmount), water_utility_paid_amount: Number(waterPaid || 0), water_paid_at: waterPaidAt || null,
          water_rate_per_person: waterRate, water_invoice_path: waterInvoicePath || null, notes: notes || null,
          rooms: rooms.map((room) => ({
            room_id: room.id, previous_kwh: Number(drafts[room.id].previous), current_kwh: Number(drafts[room.id].current),
            occupant_count: drafts[room.id].occupants, meter_photo_url: drafts[room.id].meterUrl || null,
            lines: drafts[room.id].lines.map((line) => ({ ...line, amount: lineAmount(room.id, line) })),
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not publish bills");
      toast.success(`${result.bills} room bills published`);
      router.push("/admin/billing-history"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not publish bills"); }
    finally { setBusy(false); }
  };

  if (!rooms.length) return <div className="card p-8 text-center"><p className="font-semibold">No billable rooms yet</p><p className="text-sm text-slate-500 mt-1">Approve a tenant and assign them to a room first.</p></div>;

  return <div className="space-y-5">
    <section className="card p-5 md:p-6 space-y-4">
      <div><h2 className="font-bold text-slate-900">Billing cycle</h2><p className="text-sm text-slate-500 mt-1">Enter shared utility totals once. Each occupied room receives one itemized bill.</p></div>
      <div className="grid md:grid-cols-3 gap-4">
        <label><span className="label">Period start</span><input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="input" /></label>
        <label><span className="label">Period end</span><input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="input" /></label>
        <label><span className="label">Due date (optional)</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" /></label>
      </div>
    </section>

    <section className="card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500"/><div><h2 className="font-bold text-slate-900">Electricity</h2><p className="text-sm text-slate-500">Enter the previous and current readings for each room. Usage is calculated automatically, then the building bill is divided by each room’s kWh share.</p></div></div>
      <div className="grid md:grid-cols-2 gap-4">
        <label><span className="label">Total electricity bill (₱)</span><input type="number" min="0" step="0.01" value={electricityTotal} onChange={(e) => setElectricityTotal(e.target.value)} className="input" placeholder="0.00" /></label>
        <label><span className="label">Electricity bill image (visible to tenants)</span><input type="file" accept="image/*,application/pdf" onChange={(e) => handleElectricityUpload(e.target.files?.[0])} className="input" />{electricityUrl && <span className="text-xs text-emerald-700">Bill attached</span>}{uploads.electricity && <span className="text-xs text-slate-500">Uploading…</span>}</label>
      </div>
      <div className="text-sm rounded-xl bg-amber-50 border border-amber-100 p-3">Measured across rooms: <strong className="tabular-nums">{totalKwh.toLocaleString()} kWh</strong>{totalKwh === 0 && <span className="text-amber-800"> · Enter readings before allocation can be calculated.</span>}</div>
    </section>

    <section className="card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-700"/><div><h2 className="font-bold text-slate-900">Water</h2><p className="text-sm text-slate-500">Tenant water charges use the per-person fixed rate. The invoice stays owner-only.</p></div></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <label><span className="label">Actual water bill (₱)</span><input type="number" min="0" step="0.01" value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} className="input" placeholder="0.00" /></label>
        <label><span className="label">Rate per occupant</span><select value={waterRate} onChange={(e) => setWaterRate(Number(e.target.value))} className="select">{waterOptions.map((rate) => <option key={rate} value={rate}>{fmt(rate)} / person</option>)}</select></label>
        <label><span className="label">Amount paid by owner (₱)</span><input type="number" min="0" step="0.01" value={waterPaid} onChange={(e) => setWaterPaid(e.target.value)} className="input" placeholder="0.00" /></label>
        <label><span className="label">Payment date</span><input type="date" value={waterPaidAt} onChange={(e) => setWaterPaidAt(e.target.value)} className="input" /></label>
      </div>
      <label className="block"><span className="label">Owner-only water invoice</span><input type="file" accept="image/*,application/pdf" onChange={(e) => handleWaterUpload(e.target.files?.[0])} className="input" />{waterInvoicePath && <span className="text-xs text-emerald-700">Private invoice attached</span>}{uploads.water && <span className="text-xs text-slate-500">Uploading…</span>}</label>
      <label className="block"><span className="label">Owner notes (optional)</span><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input resize-y" placeholder="Internal notes about this billing cycle" /></label>
    </section>

    <section className="space-y-3">
      <div><p className="text-xs uppercase tracking-widest text-blue-600 font-bold">Room readings & bill review</p><h2 className="text-title-md mt-1">{rooms.length} occupied room{rooms.length === 1 ? "" : "s"}</h2></div>
      {rooms.map((room) => {
        const draft = drafts[room.id]; const kwh = consumption(room); const water = waterRate * draft.occupants;
        const electrical = electricityMap.get(room.id) ?? 0; const net = amountFor(room.id, draft.lines); const carry = Number(room.tenant.billing_credit || 0);
        return <article key={room.id} className="card p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h3 className="font-bold text-slate-900">Room {room.room_number}</h3><p className="text-sm text-slate-500">{room.tenant.full_name}</p></div><div className="text-right"><p className="text-xs text-slate-500">Preview amount due</p><p className="font-extrabold text-xl tabular-nums">{fmt(Math.max(0, net - carry))}</p></div></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label><span className="label">Previous kWh</span><input type="number" min="0" step="0.01" value={draft.previous} onChange={(e) => updateRoom(room.id, { previous: e.target.value })} className="input" /></label>
            <label><span className="label">Current kWh</span><input type="number" min={draft.previous || 0} step="0.01" value={draft.current} onChange={(e) => updateRoom(room.id, { current: e.target.value })} className="input" /></label>
            <label><span className="label">Room kWh used</span><input readOnly value={kwh.toLocaleString()} className="input bg-slate-50" /></label>
            <label><span className="label flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Occupants</span><input type="number" min="1" step="1" value={draft.occupants} onChange={(e) => updateRoom(room.id, { occupants: Math.max(1, Number(e.target.value || 1)) })} className="input" /></label>
          </div>
          <label className="block mt-3"><span className="label">Submeter photo</span><input type="file" accept="image/*,application/pdf" onChange={(e) => handleMeterUpload(room.id, e.target.files?.[0])} className="input" />{draft.meterUrl && <span className="text-xs text-emerald-700">Reading image attached</span>}{uploads[`meter:${room.id}`] && <span className="text-xs text-slate-500">Uploading…</span>}</label>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-2 mb-2"><h4 className="text-sm font-bold text-slate-800">Bill lines <span className="font-normal text-slate-500">· edit rent and add charges or credits</span></h4><button type="button" onClick={() => updateRoom(room.id, { lines: [...draft.lines, { label: "", amount: 0, type: "charge" }] })} className="btn btn-secondary btn-sm"><Plus className="w-4 h-4"/> Add line</button></div>
            {draft.lines.map((line, i) => <div key={i} className="grid grid-cols-[minmax(0,1fr)_8rem_8rem_auto] gap-2 mb-2 items-center">
              <input aria-label="Bill line description" value={line.label} onChange={(e) => updateLine(room.id, i, { label: e.target.value })} className="input" placeholder="What is this for?" />
              <select aria-label="Charge or credit" value={line.type} onChange={(e) => updateLine(room.id, i, { type: e.target.value as Line["type"] })} className="select"><option value="charge">Charge +</option><option value="credit">Credit −</option></select>
              <input aria-label="Bill line amount" type="number" min="0" step="0.01" value={lineAmount(room.id, line)} onChange={(e) => updateLine(room.id, i, { amount: Number(e.target.value), manual: true })} className="input text-right tabular-nums" />
              <button type="button" aria-label="Remove bill line" onClick={() => updateRoom(room.id, { lines: draft.lines.filter((_, index) => index !== i) })} className="btn btn-ghost btn-icon text-slate-500"><Trash2 className="w-4 h-4"/></button>
            </div>)}
            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-3"><span>Electricity suggestion: {fmt(electrical)} ({kwh.toLocaleString()} kWh)</span><span>Water suggestion: {fmt(water)} ({draft.occupants} × {fmt(waterRate)})</span>{carry > 0 && <span>Previous account credit: {fmt(carry)}</span>}</div>
            {net - carry < 0 && <p className="mt-2 text-xs text-emerald-700">Remaining credit of {fmt(carry - net)} carries forward automatically.</p>}
          </div>
        </article>;
      })}
    </section>

    <div className="flex flex-wrap gap-3">
      {!reviewing ? <button type="button" onClick={() => setReviewing(true)} className="btn btn-primary btn-lg"><FileText className="w-4 h-4"/> Review all bills</button> : <>
        <button type="button" onClick={() => setReviewing(false)} className="btn btn-secondary btn-lg"><ChevronLeft className="w-4 h-4"/> Edit bills</button>
        <button type="button" onClick={submit} disabled={busy || Object.values(uploads).some(Boolean)} className="btn btn-primary btn-lg"><Check className="w-4 h-4"/>{busy ? "Publishing…" : `Confirm & publish ${rooms.length} bills`}</button>
      </>}
    </div>
    {reviewing && <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Confirming publishes these bills to tenant accounts. Each bill includes the itemized charges and credits shown above. The water invoice remains private to the owner.</div>}
  </div>;
}
