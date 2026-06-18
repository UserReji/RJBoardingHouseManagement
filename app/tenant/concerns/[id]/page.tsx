import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase.server";
import ReplyForm from "./ReplyForm";

const STATUS_BADGE: Record<string, string> = {
  open: "badge-danger", in_progress: "badge-warning", resolved: "badge-success",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved",
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function ConcernDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: concern, error } = await supabase
    .from("concerns")
    .select(`
      id, title, body, status, created_at, updated_at, user_id,
      concern_photos ( id, photo_url ),
      concern_replies ( id, sender_role, body, created_at )
    `)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !concern) notFound();

  const photos = ((concern as any).concern_photos ?? []) as Array<{ id: string; photo_url: string }>;
  const replies = (((concern as any).concern_replies ?? []) as Array<any>)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tenant/concerns" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Concern Details</h1>
        </div>

        {/* Hero */}
        <div className="card p-6 mb-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-slate-900">{concern.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{fmt(concern.created_at as any)}</p>
            </div>
            <span className={`badge ${STATUS_BADGE[concern.status as string]}`}>
              {STATUS_LABEL[concern.status as string]}
            </span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{concern.body}</p>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4 pt-4 border-t border-slate-100">
              {photos.map((p) => (
                <a key={p.id} href={p.photo_url} target="_blank" rel="noopener noreferrer"
                   className="aspect-square rounded-lg overflow-hidden bg-slate-100 block">
                  <img src={p.photo_url} alt="concern photo" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="mb-5">
          <h2 className="text-title-md mb-3">Conversation ({replies.length})</h2>
          {replies.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500">
              No replies yet. Add a reply below if you have updates.
            </div>
          ) : (
            <ul className="space-y-3">
              {replies.map((r) => (
                <li key={r.id} className={`card p-4 ${
                  r.sender_role === "admin" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-slate-300"
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge ${r.sender_role === "admin" ? "badge-info" : "badge-slate"}`}>
                      {r.sender_role === "admin" ? "Admin" : "You"}
                    </span>
                    <span className="text-xs text-slate-400">{fmt(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reply box */}
        <ReplyForm concernId={concern.id} />
      </div>
    </div>
  );
}
