import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Mail, Phone, MapPin, ShieldCheck,
  Calendar, User, FileText, DoorOpen,
} from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import TenantActions from "./TenantActions";

function fmt(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default async function TenantDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();

  const { data: tenant, error } = await supabase
    .from("users")
    .select(`
      id, email, full_name, role, registration_status,
      birthday, sex, permanent_address, contact_number,
      emergency_contact_name, emergency_contact_number,
      valid_id_type, valid_id_number, created_at, room_id,
      rooms ( room_number, monthly_rent, status )
    `)
    .eq("id", id)
    .single();

  if (error || !tenant) notFound();

  // Fetch recent bills + room options
  const [billsRes, roomsRes] = await Promise.all([
    supabase
      .from("tenant_bills")
      .select("id, billing_period_start, billing_period_end, total_amount, status")
      .eq("user_id", id)
      .order("billing_period_start", { ascending: false })
      .limit(5),
    supabase
      .from("rooms")
      .select("id, room_number, status")
      .order("room_number"),
  ]);

  const bills = billsRes.data ?? [];
  const availableRooms = (roomsRes.data ?? [])
    .filter((r) => r.status === "vacant" || r.id === tenant.room_id)
    .map((r) => ({ id: r.id, room_number: r.room_number }));

  const room = Array.isArray((tenant as any).rooms) ? (tenant as any).rooms[0] : (tenant as any).rooms;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/tenants" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Tenant Details</h1>
        </div>

        {/* Hero card */}
        <div className="card p-6 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
              {tenant.full_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-slate-900 truncate">{tenant.full_name}</p>
              <p className="text-sm text-slate-500 truncate">{tenant.email}</p>
              <div className="mt-2">
                <TenantActions
                  tenantId={tenant.id}
                  currentStatus={tenant.registration_status as any}
                  currentRoomId={tenant.room_id}
                  availableRooms={availableRooms}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-800">Personal</h2>
            </div>
            <Field icon={User}   label="Full name" value={tenant.full_name} />
            <Field icon={Calendar} label="Birthday" value={fmt(tenant.birthday as any)} />
            <Field icon={User}   label="Sex"      value={tenant.sex as any} />
            <Field icon={Mail}   label="Email"    value={tenant.email} />
            <Field icon={Phone}  label="Contact"  value={tenant.contact_number as any} />
            <Field icon={MapPin} label="Address"  value={tenant.permanent_address as any} />
          </div>

          {/* Emergency + ID */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="font-bold text-slate-800">Emergency &amp; ID</h2>
            </div>
            <Field label="Emergency contact name"   value={tenant.emergency_contact_name as any} />
            <Field label="Emergency contact number" value={tenant.emergency_contact_number as any} />
            <Field label="ID type"   value={tenant.valid_id_type as any} />
            <Field label="ID number" value={tenant.valid_id_number as any} />
            <Field label="Registered on" value={fmt(tenant.created_at)} />
          </div>

          {/* Tenancy */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DoorOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-bold text-slate-800">Tenancy</h2>
            </div>
            {room ? (
              <>
                <Field label="Room"   value={`Room ${room.room_number}`} />
                <Field label="Rent"   value={room.monthly_rent ? `₱${Number(room.monthly_rent).toLocaleString()}` : "—"} />
                <Field label="Status" value={room.status} />
              </>
            ) : (
              <p className="text-sm text-slate-500">No room assigned yet.</p>
            )}
          </div>

          {/* Recent bills */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="font-bold text-slate-800">Recent bills</h2>
            </div>
            {bills.length === 0 ? (
              <p className="text-sm text-slate-500">No bills yet.</p>
            ) : (
              <ul className="space-y-2">
                {bills.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/admin/bills/${b.id}`}
                      className="font-medium text-slate-700 hover:text-blue-600 truncate"
                    >
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

function Field({
  icon: Icon, label, value,
}: { icon?: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
        <p className="text-sm text-slate-800 font-medium break-words">{value || <span className="text-slate-300">—</span>}</p>
      </div>
    </div>
  );
}
