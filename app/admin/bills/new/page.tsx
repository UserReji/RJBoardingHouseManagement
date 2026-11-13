import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import CreateBillForm from "./CreateBillForm";

export default async function CreateBillPage() {
  const supabase = await createAdminSupabaseClient();
  const [{ data: rooms }, { data: tenants }, { data: readings }] = await Promise.all([
    supabase.from("rooms").select("id, room_number, monthly_rent, occupant_count").order("room_number"),
    supabase.from("users").select("id, full_name, room_id, billing_credit").eq("role", "tenant").eq("registration_status", "approved").eq("account_status", "active").not("email_confirmed_at", "is", null).not("room_id", "is", null),
    supabase.from("meter_readings").select("room_id, reading_value, reading_date").order("reading_date", { ascending: false }),
  ]);
  const tenantByRoom = new Map((tenants ?? []).map((tenant: any) => [tenant.room_id, tenant]));
  const latestReading = new Map<string, any>();
  for (const reading of readings ?? []) if (!latestReading.has(reading.room_id)) latestReading.set(reading.room_id, reading);
  const billableRooms = (rooms ?? []).filter((room: any) => tenantByRoom.has(room.id)).map((room: any) => ({
    ...room,
    tenant: tenantByRoom.get(room.id),
    previous_kwh: Number(latestReading.get(room.id)?.reading_value ?? 0),
  }));
  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/bills" className="btn btn-ghost btn-sm"><ChevronLeft className="w-5 h-5" /></Link>
          <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Monthly billing</p><h1 className="text-title-md">Create room bills</h1></div>
        </div>
        <CreateBillForm rooms={billableRooms} />
      </div>
    </div>
  );
}
