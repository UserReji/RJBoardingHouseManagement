"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { ChevronRight, Users } from "lucide-react";

type RegistrationStatus = "all" | "pending" | "approved" | "rejected";

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  registration_status: "pending" | "approved" | "rejected";
  room_number?: number;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  approved: "badge-success",
  pending:  "badge-warning",
  rejected: "badge-danger",
};

const FILTERS: { value: RegistrationStatus; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending",  label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminTenantsPage() {
  const supabase = createSupabaseClient();
  const [tenants,    setTenants]    = useState<Tenant[]>([]);
  const [filter,     setFilter]     = useState<RegistrationStatus>("all");
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, registration_status, created_at, rooms(room_number)")
        .eq("role", "tenant")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTenants(
          data.map((t: any) => ({
            id: t.id,
            full_name: t.full_name,
            email: t.email,
            registration_status: t.registration_status,
            room_number: t.rooms?.room_number ?? undefined,
            created_at: t.created_at,
          }))
        );
      }
      setIsLoading(false);
    };
    fetchTenants();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading tenants…</p>
      </div>
    </div>
  );

  const filtered  = filter === "all" ? tenants : tenants.filter((t) => t.registration_status === filter);
  const approved  = tenants.filter((t) => t.registration_status === "approved").length;
  const pending   = tenants.filter((t) => t.registration_status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">People</p>
        <h1 className="text-display-md">Tenants</h1>
        <p className="text-slate-500 text-sm mt-1">{approved} approved · {pending} pending</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn-sm whitespace-nowrap ${filter === f.value ? "btn-primary" : "btn-secondary"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
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
            <Link
              key={t.id}
              href={`/admin/tenants/${t.id}`}
              className="card p-4 hover:shadow-md transition-all flex items-center gap-4 group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-700 text-sm uppercase">
                {t.full_name?.charAt(0) ?? "?"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-900 truncate">{t.full_name}</p>
                  <span className={`badge ${STATUS_BADGE[t.registration_status]}`}>
                    {t.registration_status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{t.email}</p>
              </div>

              <div className="text-right flex-shrink-0">
                {t.room_number && (
                  <span className="badge badge-info mb-1">Room {t.room_number}</span>
                )}
                <p className="text-xs text-slate-400">
                  {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
