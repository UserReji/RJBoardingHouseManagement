import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

type StatusFilter = "all" | "open" | "in_progress" | "resolved";

const STATUS_BADGE: Record<string, string> = {
  open: "badge-danger", in_progress: "badge-warning", resolved: "badge-success",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved",
};
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
  { value: "all",         label: "All" },
];

export default async function AdminConcernsPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await searchParams;
  const filter = (sp.filter as StatusFilter) ?? "open";

  const supabase = await createAdminSupabaseClient();
  const { data } = await supabase
    .from("concerns")
    .select(`
      id, title, status, created_at,
      users ( full_name ),
      concern_replies ( id )
    `)
    .order("created_at", { ascending: false });

  const concerns = (data ?? []).map((c: any) => ({
    id: c.id,
    tenant_name: c.users?.full_name ?? "—",
    title: c.title,
    status: c.status,
    created_at: c.created_at,
    reply_count: c.concern_replies?.length ?? 0,
  }));

  const filtered    = filter === "all" ? concerns : concerns.filter((c) => c.status === filter);
  const openCount   = concerns.filter((c) => c.status === "open").length;
  const inProgCount = concerns.filter((c) => c.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Support</p>
        <h1 className="text-display-md">Concerns</h1>
        <p className="text-slate-500 text-sm mt-1">{openCount} open · {inProgCount} in progress</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/concerns" : `/admin/concerns?filter=${f.value}`}
            className={`btn btn-sm whitespace-nowrap ${filter === f.value ? "btn-primary" : "btn-secondary"}`}
          >
            {f.label}
            {f.value === "open" && openCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {openCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No concerns found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === "open" ? "No open concerns right now." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/concerns/${c.id}`}
              className="card p-4 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className={`w-5 h-5 ${
                  c.status === "open" ? "text-red-500" :
                  c.status === "in_progress" ? "text-amber-500" : "text-emerald-500"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                  <span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {c.tenant_name} · {new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · {c.reply_count} {c.reply_count === 1 ? "reply" : "replies"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
