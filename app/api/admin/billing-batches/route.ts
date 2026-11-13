import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

type Line = { label: string; amount: number; type: "charge" | "credit" };
type RoomInput = { room_id: string; current_kwh: number; previous_kwh: number; occupant_count: number; meter_photo_url?: string | null; lines: Line[] };
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.rooms) || body.rooms.length === 0) {
    return NextResponse.json({ error: "Add at least one occupied room." }, { status: 400 });
  }
  const periodStart = String(body.billing_period_start ?? "");
  const periodEnd = String(body.billing_period_end ?? "");
  const electricityTotal = Number(body.electricity_total);
  const waterAmount = Number(body.water_utility_amount);
  const waterPaid = Number(body.water_utility_paid_amount ?? 0);
  const waterRate = Number(body.water_rate_per_person);
  if (!periodStart || !periodEnd || periodEnd < periodStart ||
      !Number.isFinite(electricityTotal) || electricityTotal < 0 ||
      !Number.isFinite(waterAmount) || waterAmount < 0 ||
      !Number.isFinite(waterPaid) || waterPaid < 0 ||
      ![20, 40, 60, 80, 100, 120, 140, 160, 180, 200].includes(waterRate)) {
    return NextResponse.json({ error: "Check the billing dates and utility amounts." }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();
  const { data: priorBatch } = await supabase.from("billing_batches").select("id").eq("billing_period_start", periodStart).eq("billing_period_end", periodEnd).eq("status", "published").limit(1).maybeSingle();
  if (priorBatch) return NextResponse.json({ error: "A published billing batch already exists for this period." }, { status: 409 });
  const roomIds = body.rooms.map((r: RoomInput) => String(r.room_id));
  if (new Set(roomIds).size !== roomIds.length) return NextResponse.json({ error: "A room appears more than once." }, { status: 400 });
  const [{ data: rooms, error: roomError }, { data: tenants, error: tenantError }] = await Promise.all([
    supabase.from("rooms").select("id, room_number, monthly_rent, occupant_count").in("id", roomIds),
    supabase.from("users").select("id, room_id, billing_credit").eq("role", "tenant").eq("registration_status", "approved").eq("account_status", "active").not("email_confirmed_at", "is", null).in("room_id", roomIds),
  ]);
  if (roomError || tenantError) return NextResponse.json({ error: roomError?.message ?? tenantError?.message }, { status: 500 });
  const roomMap = new Map((rooms ?? []).map((r: any) => [r.id, r]));
  const tenantMap = new Map((tenants ?? []).map((t: any) => [t.room_id, t]));
  const active = (body.rooms as RoomInput[]).filter((r) => tenantMap.has(r.room_id));
  if (active.length === 0) return NextResponse.json({ error: "No approved tenant is assigned to the selected rooms." }, { status: 400 });
  if (active.some((r) => !roomMap.has(r.room_id) || !Number.isFinite(Number(r.current_kwh)) || !Number.isFinite(Number(r.previous_kwh)) || Number(r.current_kwh) < Number(r.previous_kwh) || !Number.isInteger(Number(r.occupant_count)) || Number(r.occupant_count) < 1)) {
    return NextResponse.json({ error: "Check room readings and occupant counts. Current readings cannot be lower than previous readings." }, { status: 400 });
  }
  const totalKwh = active.reduce((sum, r) => sum + Number(r.current_kwh) - Number(r.previous_kwh), 0);
  if (electricityTotal > 0 && totalKwh <= 0) return NextResponse.json({ error: "Enter room electricity use before allocating the shared bill." }, { status: 400 });
  const electricityByRoom = new Map<string, number>();
  active.forEach((r) => {
    const usedKwh = Number(r.current_kwh) - Number(r.previous_kwh);
    electricityByRoom.set(r.room_id, totalKwh > 0 ? money(electricityTotal * usedKwh / totalKwh) : 0);
  });
  if (totalKwh > 0 && active.length > 0) {
    const correction = money(electricityTotal - [...electricityByRoom.values()].reduce((sum, value) => sum + value, 0));
    const correctionRoom = active.reduce((best, room) => (Number(room.current_kwh) - Number(room.previous_kwh)) > (Number(best.current_kwh) - Number(best.previous_kwh)) ? room : best);
    electricityByRoom.set(correctionRoom.room_id, money((electricityByRoom.get(correctionRoom.room_id) ?? 0) + correction));
  }

  const { data: batch, error: batchError } = await supabase.from("billing_batches").insert({
    billing_period_start: periodStart, billing_period_end: periodEnd, due_date: body.due_date || null,
    electricity_total: money(electricityTotal), electricity_invoice_url: body.electricity_invoice_url || null,
    total_kwh: money(totalKwh), water_utility_amount: money(waterAmount), water_utility_paid_amount: money(waterPaid),
    water_paid_at: body.water_paid_at || null, water_rate_per_person: waterRate,
    water_invoice_url: body.water_invoice_path || null, notes: body.notes || null, status: "published", published_at: new Date().toISOString(),
  }).select("id").single();
  if (batchError || !batch) return NextResponse.json({ error: batchError?.message ?? "Could not create billing batch." }, { status: 500 });

  const createdBillIds: string[] = [];
  const staged: { tenantId: string; roomId: string; nextCredit: number; oldCredit: number; nextOccupants: number; oldOccupants: number }[] = [];
  const readingIds: string[] = [];
  try {
    const roomSnapshots = [];
    for (const input of active) {
      const room: any = roomMap.get(input.room_id);
      const tenant: any = tenantMap.get(input.room_id);
      const consumed = money(Number(input.current_kwh) - Number(input.previous_kwh));
      const electricityCharge = electricityByRoom.get(input.room_id) ?? 0;
      const waterCharge = money(waterRate * Number(input.occupant_count));
      const lines: Line[] = Array.isArray(input.lines) ? input.lines.map((line) => ({ label: String(line.label ?? "").trim(), amount: Number(line.amount), type: line.type })) : [];
      if (lines.some((line) => !line.label || line.label.length > 100 || !Number.isFinite(line.amount) || line.amount < 0 || !["charge", "credit"].includes(line.type))) {
        throw new Error(`Check charge and credit rows for Room ${room.room_number}.`);
      }
      const normalized = lines.filter((line) => line.amount > 0);
      const rentLine = normalized.find((line) => line.type === "charge" && line.label.toLowerCase() === "room rent");
      const rentSnapshot = rentLine?.amount ?? Number(room.monthly_rent);
      const electricityLine = normalized.find((line) => line.type === "charge" && line.label.toLowerCase() === "electricity");
      const waterLine = normalized.find((line) => line.type === "charge" && line.label.toLowerCase() === "water");
      const billedElectricity = electricityLine?.amount ?? electricityCharge;
      const billedWater = waterLine?.amount ?? waterCharge;
      const tenantCredit = Number(tenant.billing_credit ?? 0);
      if (tenantCredit > 0) normalized.push({ label: "Previous account credit", amount: tenantCredit, type: "credit" });
      const gross = normalized.reduce((sum, line) => sum + (line.type === "charge" ? line.amount : -line.amount), 0);
      const creditBalance = money(Math.max(0, -gross));
      const totalAmount = money(Math.max(0, gross));
      const { data: bill, error: billError } = await supabase.from("tenant_bills").insert({
        user_id: tenant.id, room_id: input.room_id, billing_batch_id: batch.id,
        billing_period_start: periodStart, billing_period_end: periodEnd, room_rent: rentSnapshot,
        occupant_count: input.occupant_count, water_rate_per_person: waterRate, water_charge: billedWater,
        kwh_consumed: consumed, kwh_rate: totalKwh > 0 ? money(electricityTotal / totalKwh) : 0,
        electricity_charge: billedElectricity, electricity_invoice_url: body.electricity_invoice_url || null,
        meter_photo_url: input.meter_photo_url || null, total_amount: totalAmount, amount_paid: 0,
        credit_balance: creditBalance, status: totalAmount === 0 ? "paid" : "unpaid", notes: body.notes || null, published_at: new Date().toISOString(),
      }).select("id").single();
      if (billError || !bill) throw new Error(billError?.message ?? `Could not create Room ${room.room_number} bill.`);
      createdBillIds.push(bill.id);
      const { error: lineError } = await supabase.from("bill_line_items").insert(normalized.map((line, order) => ({ bill_id: bill.id, label: line.label, amount: money(line.amount), item_type: line.type, sort_order: order })));
      if (lineError) throw new Error(lineError.message);
      staged.push({ tenantId: tenant.id, roomId: input.room_id, nextCredit: creditBalance, oldCredit: Number(tenant.billing_credit ?? 0), nextOccupants: Number(input.occupant_count), oldOccupants: Number(room.occupant_count ?? 1) });
      roomSnapshots.push({ batch_id: batch.id, room_id: input.room_id, occupant_count: input.occupant_count, previous_kwh: input.previous_kwh, current_kwh: input.current_kwh, consumed_kwh: consumed, meter_photo_url: input.meter_photo_url || null, electricity_charge: billedElectricity, water_charge: billedWater });

    }
    const { error: snapshotError } = await supabase.from("billing_batch_rooms").insert(roomSnapshots);
    if (snapshotError) throw new Error(snapshotError.message);
    for (const update of staged) {
      const { error: creditError } = await supabase.from("users").update({ billing_credit: update.nextCredit }).eq("id", update.tenantId);
      if (creditError) throw new Error(creditError.message);
      const { error: roomUpdateError } = await supabase.from("rooms").update({ occupant_count: update.nextOccupants }).eq("id", update.roomId);
      if (roomUpdateError) throw new Error(roomUpdateError.message);
    }
    for (const input of active) {
      const tenant: any = tenantMap.get(input.room_id);
      const { data: reading, error: readingError } = await supabase.from("meter_readings").insert({ room_id: input.room_id, tenant_id: tenant.id, reading_value: input.current_kwh, reading_date: periodEnd, photo_url: input.meter_photo_url || null }).select("id").single();
      if (readingError || !reading) throw new Error(readingError?.message ?? "Could not save a submeter reading.");
      readingIds.push(reading.id);
    }
    return NextResponse.json({ id: batch.id, bills: createdBillIds.length });
  } catch (error) {
    if (readingIds.length) await supabase.from("meter_readings").delete().in("id", readingIds);
    for (const update of staged) {
      await supabase.from("users").update({ billing_credit: update.oldCredit }).eq("id", update.tenantId);
      await supabase.from("rooms").update({ occupant_count: update.oldOccupants }).eq("id", update.roomId);
    }
    if (createdBillIds.length) await supabase.from("tenant_bills").delete().in("id", createdBillIds);
    await supabase.from("billing_batches").delete().eq("id", batch.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish the bills." }, { status: 500 });
  }
}








