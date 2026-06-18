"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { ChevronRight, AlertCircle, Plus } from "lucide-react";

interface Concern {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  reply_count: number;
}

const STATUS_BADGE: Record<string, string> = {
  open:        "badge-danger",
  in_progress: "badge-warning",
  resolved:    "badge-success",
};

const STATUS_LABEL: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
};

export default function TenantConcernsPage() {
  const supabase = createSupabaseClient();
  const [concerns,  setConcerns]  = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConcerns = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("concerns")
        .select("id, title, status, created_at, concern_replies(id)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setConcerns(
          data.map((c: any) => ({
            id:          c.id,
            title:       c.title,
            status:      c.status,
            created_at:  c.created_at,
            reply_count: c.concern_replies?.length ?? 0,
          }))
        );
      }
      setIsLoading(false);
    };
    fetchConcerns();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading concerns…</p>
      </div>
    </div>
  );

  const openCount = concerns.filter((c) => c.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Support</p>
          <h1 className="text-display-md">Concerns</h1>
          <p className="text-slate-500 text-sm mt-1">
            {openCount > 0 ? `${openCount} open` : "No open concerns"}
          </p>
        </div>
        <Link href="/tenant/concerns/new" className="btn btn-primary btn-sm flex-shrink-0">
          <Plus className="w-4 h-4" />
          New
        </Link>
      </div>

      {concerns.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No concerns yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Report maintenance issues or anything that needs attention.
          </p>
          <Link href="/tenant/concerns/new" className="btn btn-primary btn-sm inline-flex">
            <Plus className="w-4 h-4" />
            Post a Concern
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {concerns.map((concern) => (
            <Link
              key={concern.id}
              href={`/tenant/concerns/${concern.id}`}
              className="card p-4 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className={`w-5 h-5 ${
                  concern.status === "open"
                    ? "text-red-500"
                    : concern.status === "in_progress"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate">{concern.title}</p>
                  <span className={`badge ${STATUS_BADGE[concern.status]}`}>
                    {STATUS_LABEL[concern.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(concern.created_at).toLocaleDateString("en-PH", {
                    month: "short", day: "numeric", year: "numeric",
                  })} · {concern.reply_count} {concern.reply_count === 1 ? "reply" : "replies"}
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
