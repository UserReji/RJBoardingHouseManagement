import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import CreateBillForm from "./CreateBillForm";

export default async function CreateBillPage() {
  const supabase = await createAdminSupabaseClient();

  const [tenantsRes, roomsRes, readingsRes, settingsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, room_id, rooms(monthly_rent, room_number)")
      .eq("role", "tenant")
      .eq("registration_status", "approved")
      .order("full_name"),
    supabase.from("rooms").select("id, room_number, monthly_rent").order("room_number"),
    supabase.from("meter_readings").select("id, room_id, reading_value, reading_date").order("reading_date", { ascending: false }),
    supabase.from("settings").select("kwh_rate").eq("id", 1).single(),
  ]);

  const tenants = (tenantsRes.data ?? []).map((t: any) => ({
    id: t.id,
    full_name: t.full_name,
    email: t.email,
    room_id: t.room_id,
    monthly_rent: Array.isArray(t.rooms) ? t.rooms[0]?.monthly_rent : t.rooms?.monthly_rent,
    room_number: Array.isArray(t.rooms) ? t.rooms[0]?.room_number : t.rooms?.room_number,
  }));

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/bills" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Create New Bill</h1>
        </div>

        <CreateBillForm
          tenants={tenants}
          rooms={roomsRes.data ?? []}
          allReadings={readingsRes.data ?? []}
          defaultKwhRate={Number(settingsRes.data?.kwh_rate ?? 2)}
        />
      </div>
    </div>
  );
}
