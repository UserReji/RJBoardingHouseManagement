import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import InlineApprove from "./InlineApprove";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_BADGE: Record<string, string> = {
  approved: "badge-success",
  pending:  "badge-warning",
  rejected: "badge-danger",
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending",  label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminTenantsPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await searchParams;
  const filter = (sp.filter as StatusFilter) ?? "all";

  const supabase = await createAdminSupabaseClient();

  const [tenantsRes, roomsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, registration_status, created_at, rooms(room_number)")
      .eq("role", "tenant")
      .order("created_at", { ascending: false }),
    supabase
      .from("rooms")
      .select("id, room_number, status")
      .order("room_number"),
  ]);

  const tenants = (tenantsRes.data ?? []).map((t: any) => ({
    ...t,
    room_number: Array.isArray(t.rooms) ? t.rooms[0]?.room_number : t.rooms?.room_number,
  }));

  const availableRooms = (roomsRes.data ?? [])
    .filter((r) => r.status === "vacant")
    .map((r) => ({ id: r.id, room_number: r.room_number }));

  const filtered  = filter === "all" ? tenants : tenants.filter((t) => t.registration_status === filter);
  const approved  = tenants.filter((t) => t.registration_status === "approved").length;
  const pending   = tenants.filter((t) => t.registration_status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">People</p>
        <h1 className="text-display-md">Tenants</h1>
        <p className="text-slate-500 text-sm mt-1">{approved} approved · {pending} pending</p>
      </div>

      {/* Filter pills — plain links, server-rendered */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/tenants" : `/admin/tenants?filter=${f.value}`}
            className={`btn btn-sm whitespace-nowrap ${
              filter === f.value ? "btn-primary" : "btn-secondary"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No tenants found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different filter or wait for new registrations.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="card p-4">
              <Link
                href={`/admin/tenants/${t.id}`}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-700 text-sm uppercase">
                  {t.full_name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">{t.full_name}</p>
                    <span className={`badge ${STATUS_BADGE[t.registration_status]}`}>
                      {t.registration_status}
                    </span>
                    {t.room_number && <span className="badge badge-info">Room {t.room_number}</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{t.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
              </Link>
              {t.registration_status === "pending" && (
                <InlineApprove tenantId={t.id} availableRooms={availableRooms} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
