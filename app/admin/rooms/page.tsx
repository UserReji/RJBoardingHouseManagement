import Link from "next/link";
import { ChevronRight, DoorOpen } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export default async function AdminRoomsPage() {
  const supabase = await createAdminSupabaseClient();
  const { data } = await supabase
    .from("rooms")
    .select(`
      id, room_number, monthly_rent, status,
      users ( full_name )
    `)
    .order("room_number");

  const rooms = (data ?? []).map((r: any) => ({
    ...r,
    current_tenant: r.users?.full_name ?? undefined,
  }));
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const vacant   = rooms.length - occupied;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Properties</p>
        <h1 className="text-display-md">Rooms</h1>
        <p className="text-slate-500 text-sm mt-1">{occupied} occupied · {vacant} vacant · {rooms.length} total</p>
      </div>

      {rooms.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <DoorOpen className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No rooms found</p>
          <p className="text-sm text-slate-400 mt-1">Rooms will appear here once added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/admin/rooms/${room.id}`}
              className={`card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 ${
                room.status === "occupied" ? "border-blue-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Room</p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{room.room_number}</p>
                </div>
                <span className={`badge ${room.status === "occupied" ? "badge-info" : "badge-slate"}`}>
                  {room.status === "occupied" ? "Occupied" : "Vacant"}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Monthly rate</p>
                  <p className="font-bold text-slate-900">₱{Number(room.monthly_rent ?? 0).toLocaleString()}</p>
                </div>
                {room.current_tenant && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Current tenant</p>
                    <p className="font-semibold text-slate-700 text-sm truncate">{room.current_tenant}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">View details</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
