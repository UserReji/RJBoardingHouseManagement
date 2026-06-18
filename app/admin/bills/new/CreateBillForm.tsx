"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Zap, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type Tenant = { id: string; full_name: string; email: string; room_id: string | null; monthly_rent: number | null; room_number: number | null };
type Room   = { id: string; room_number: number; monthly_rent: number };
type Reading = { id: string; reading_value: number; reading_date: string; room_id: string };

const fmtMoney = (n: any) => `₱${Number(n ?? 0).toLocaleString()}`;

export default function CreateBillForm({
  tenants, rooms, allReadings, defaultKwhRate,
}: {
  tenants: Tenant[];
  rooms: Room[];
  allReadings: Reading[];
  defaultKwhRate: number;
}) {
  const router = useRouter();

  // only approved tenants with an assigned room are eligible
  const eligible = tenants.filter((t) => t.room_id);

  const [tenantId, setTenantId]     = useState(eligible[0]?.id ?? "");
  const tenant = eligible.find((t) => t.id === tenantId);
  const room   = rooms.find((r) => r.id === tenant?.room_id);
  const roomReadings = allReadings
    .filter((r) => r.room_id === room?.id)
    .sort((a, b) => b.reading_date.localeCompare(a.reading_date));

  const [periodStart, setPeriodStart] = useState(firstOfThisMonth());
  const [periodEnd,   setPeriodEnd]   = useState(today());
  const [extraDays,   setExtraDays]   = useState(0);
  const [extraRate,   setExtraRate]   = useState(25);
  const [currReading, setCurrReading] = useState(roomReadings[0]?.id ?? "");
  const [kwhRate,     setKwhRate]     = useState(defaultKwhRate);
  const [notes,       setNotes]       = useState("");
  const [isSaving,    setIsSaving]    = useState(false);

  const prevReading = roomReadings.find((r) => r.id !== currReading);
  const prevVal     = prevReading ? Number(prevReading.reading_value) : 0;
  const currVal     = roomReadings.find((r) => r.id === currReading)?.reading_value ?? 0;
  const kwhConsumed = Math.max(0, currVal - prevVal);

  const roomRent      = Number(room?.monthly_rent ?? 0);
  const elecCharge    = kwhConsumed * Number(kwhRate);
  const extraCharge   = Number(extraDays) * Number(extraRate);
  const total         = roomRent + elecCharge + extraCharge;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !room) { toast.error("Pick a tenant first"); return; }
    if (!currReading)    { toast.error("Pick a current meter reading"); return; }
    if (kwhConsumed < 0) { toast.error("Current reading is lower than previous"); return; }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:               tenant.id,
          room_id:               room.id,
          billing_period_start:  periodStart,
          billing_period_end:    periodEnd,
          room_rent:             roomRent,
          extra_occupant_days:   extraDays,
          extra_occupant_rate:   extraRate,
          extra_occupant_charge: extraCharge,
          curr_reading_id:       currReading,
          prev_reading_id:       prevReading?.id ?? null,
          kwh_consumed:          kwhConsumed,
          kwh_rate:              kwhRate,
          electricity_charge:    elecCharge,
          total_amount:          total,
          notes:                 notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create bill");
      }
      const { id } = await res.json();
      toast.success("Bill created");
      router.push(`/admin/bills/${id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (eligible.length === 0) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-700">No billable tenants</p>
        <p className="text-sm text-slate-500 mt-1">
          Approve tenants and assign them a room before creating bills.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Tenant + period */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-4">Tenant &amp; Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => { setTenantId(e.target.value); setCurrReading(""); }}
              className="select"
            >
              {eligible.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}{t.room_number ? ` · Room ${t.room_number}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Period start</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Period end</label>
              <input type="date" value={periodEnd}   onChange={(e) => setPeriodEnd(e.target.value)}   className="input" />
            </div>
          </div>
        </div>
      </div>

      {/* Meter reading */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="font-bold text-slate-800">Electricity</h2>
        </div>
        {roomReadings.length === 0 ? (
          <p className="text-sm text-slate-500">No meter readings for this room yet. <Link href="/admin/rooms" className="text-blue-600 hover:underline">Add a reading →</Link></p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Current reading</label>
              <select value={currReading} onChange={(e) => setCurrReading(e.target.value)} className="select">
                <option value="">Select…</option>
                {roomReadings.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reading_value} · {r.reading_date}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Previous reading</label>
              <input
                type="text" readOnly
                value={prevReading ? `${prevReading.reading_value} · ${prevReading.reading_date}` : "—"}
                className="input bg-slate-50"
              />
            </div>
            <div>
              <label className="label">Rate (₱/kWh)</label>
              <input
                type="number" min="0" step="0.01"
                value={kwhRate} onChange={(e) => setKwhRate(parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div className="md:col-span-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <strong>{kwhConsumed} kWh</strong> × <strong>{fmtMoney(kwhRate)}</strong> = <strong className="text-blue-700">{fmtMoney(elecCharge)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Extra occupants */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-bold text-slate-800">Extra Occupants</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Days</label>
            <input
              type="number" min="0"
              value={extraDays} onChange={(e) => setExtraDays(parseInt(e.target.value) || 0)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Rate (₱/day)</label>
            <input
              type="number" min="0"
              value={extraRate} onChange={(e) => setExtraRate(parseInt(e.target.value) || 0)}
              className="input"
            />
          </div>
          <div className="md:col-span-2 text-sm text-slate-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <strong>{extraDays} days</strong> × <strong>{fmtMoney(extraRate)}</strong> = <strong className="text-emerald-700">{fmtMoney(extraCharge)}</strong>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <label className="label">Notes (optional)</label>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="e.g., includes water charge, etc." className="input resize-none"
        />
      </div>

      {/* Summary */}
      <div className="card p-6 border-l-4 border-l-blue-600 bg-blue-50">
        <h3 className="font-bold text-slate-800 mb-3">Summary</h3>
        <ul className="text-sm space-y-1 text-slate-700">
          <li className="flex justify-between"><span>Room rent</span><span>{fmtMoney(roomRent)}</span></li>
          <li className="flex justify-between"><span>Electricity</span><span>{fmtMoney(elecCharge)}</span></li>
          <li className="flex justify-between"><span>Extra occupants</span><span>{fmtMoney(extraCharge)}</span></li>
          <li className="flex justify-between text-lg font-bold text-blue-700 pt-2 border-t border-blue-200 mt-2">
            <span>Total</span><span>{fmtMoney(total)}</span>
          </li>
        </ul>
      </div>

      <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg">
        {isSaving ? "Creating…" : (<><Save className="w-4 h-4" /> Create Bill</>)}
      </button>
    </form>
  );
}

function firstOfThisMonth() {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today() {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
