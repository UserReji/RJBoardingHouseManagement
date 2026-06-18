import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, DoorOpen, User, Zap } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import EditRoomForm from "./EditRoomForm";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default async function RoomDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();

  const { data: room, error } = await supabase
    .from("rooms")
    .select(`
      id, room_number, price, monthly_rent, status, description, created_at,
      users ( id, full_name, email, contact_number, registration_status )
    `)
    .eq("id", id)
    .single();
  if (error || !room) notFound();

  const tenant = Array.isArray((room as any).users)
    ? (room as any).users[0]
    : (room as any).users;

  const { data: readings } = await supabase
    .from("meter_readings")
    .select("id, reading_value, reading_date, is_initial, created_at")
    .eq("room_id", id)
    .order("reading_date", { ascending: false })
    .limit(5);

  const { data: bills } = await supabase
    .from("tenant_bills")
    .select("id, billing_period_start, billing_period_end, total_amount, status")
    .eq("room_id", id)
    .order("billing_period_start", { ascending: false })
    .limit(5);

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/rooms" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Room {room.room_number}</h1>
        </div>

        {/* Hero */}
        <div className="card p-6 mb-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <DoorOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Room {room.room_number}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              ₱{Number(room.monthly_rent ?? room.price).toLocaleString()} / month
            </p>
          </div>
          <span className={`badge ${room.status === "occupied" ? "badge-info" : "badge-slate"}`}>
            {room.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Edit room */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4">Room details</h2>
            <EditRoomForm
              roomId={room.id}
              initialPrice={Number(room.monthly_rent ?? room.price)}
              initialDescription={room.description ?? ""}
            />
          </div>

          {/* Current tenant */}
          <div className="card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-bold text-slate-800">Current tenant</h2>
            </div>
            {tenant ? (
              <Link href={`/admin/tenants/${tenant.id}`} className="block hover:bg-slate-50 -m-2 p-2 rounded-lg">
                <p className="font-semibold text-slate-900">{tenant.full_name}</p>
                <p className="text-sm text-slate-500">{tenant.email}</p>
                {tenant.contact_number && <p className="text-xs text-slate-400 mt-1">📱 {tenant.contact_number}</p>}
              </Link>
            ) : (
              <p className="text-sm text-slate-500">No tenant assigned.</p>
            )}
          </div>

          {/* Meter readings */}
          <div className="card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="font-bold text-slate-800">Recent meter readings</h2>
            </div>
            {(!readings || readings.length === 0) ? (
              <p className="text-sm text-slate-500">No readings yet.</p>
            ) : (
              <ul className="space-y-2">
                {readings.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-slate-800">{r.reading_value}</span>
                    <span className="text-slate-500">{fmt(r.reading_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent bills */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4">Recent bills</h2>
            {(!bills || bills.length === 0) ? (
              <p className="text-sm text-slate-500">No bills yet.</p>
            ) : (
              <ul className="space-y-2">
                {bills.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <Link href={`/admin/bills/${b.id}`} className="font-medium text-slate-700 hover:text-blue-600">
                      {fmt(b.billing_period_start)} – {fmt(b.billing_period_end)}
                    </Link>
                    <span className="font-bold text-slate-900">₱{Number(b.total_amount).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
