import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase.server";
import { User, Phone, ShieldCheck, FileText } from "lucide-react";

function fmt(date?: string | null) {
  return date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : null;
}
function money(value?: number | null) {
  return value == null ? null : `₱${Number(value).toLocaleString()}`;
}
function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return <div className="py-3 border-b border-slate-100 last:border-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p><p className="font-medium text-slate-800">{value || <span className="text-slate-300 font-normal">—</span>}</p></div>;
}
function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return <section><div className="flex items-center gap-2.5 mb-3"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Icon className="w-4 h-4 text-blue-600" /></div><h2 className="font-bold text-slate-800">{title}</h2></div><div className="card px-4 divide-y divide-slate-100">{children}</div></section>;
}

export default async function TenantProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase.from("users").select(`
    full_name, email, birthday, sex, permanent_address, contact_number,
    emergency_contact_name, emergency_contact_number, valid_id_type, valid_id_number,
    room_id, rooms ( room_number, monthly_rent )
  `).eq("id", user.id).eq("role", "tenant").single();

  if (error || !profile) return <div className="card p-6"><h1 className="font-bold text-slate-900">Profile unavailable</h1><p className="text-sm text-slate-500 mt-2">We couldn’t load your profile. Refresh the page or contact the administration.</p></div>;

  const { data: contract } = await supabase.from("tenant_contracts").select("start_date, end_date")
    .eq("tenant_id", user.id).eq("contract_status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const room = Array.isArray((profile as any).rooms) ? (profile as any).rooms[0] : (profile as any).rooms;

  return <div className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Account</p><h1 className="text-display-md">My Profile</h1><p className="text-slate-500 text-sm mt-1">Your personal and tenancy information.</p></div>
    <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-extrabold uppercase flex-shrink-0">{profile.full_name?.charAt(0) ?? "?"}</div><div><p className="font-bold text-lg text-slate-900">{profile.full_name}</p><p className="text-sm text-slate-500">{profile.email}</p></div></div>
    <Section icon={User} title="Personal Information"><ProfileField label="Full name" value={profile.full_name} /><ProfileField label="Birthday" value={fmt(profile.birthday)} /><ProfileField label="Sex" value={profile.sex} /></Section>
    <Section icon={Phone} title="Contact Information"><ProfileField label="Contact number" value={profile.contact_number} /><ProfileField label="Permanent address" value={profile.permanent_address} /><ProfileField label="Emergency contact" value={profile.emergency_contact_name} /><ProfileField label="Emergency contact number" value={profile.emergency_contact_number} /></Section>
    <Section icon={ShieldCheck} title="Valid ID"><ProfileField label="ID type" value={profile.valid_id_type} /><ProfileField label="ID number" value={profile.valid_id_number} /></Section>
    {room && <Section icon={FileText} title="Tenancy Details"><ProfileField label="Room" value={`Room ${room.room_number}`} /><ProfileField label="Monthly rent" value={money(room.monthly_rent)} /><ProfileField label="Contract start" value={fmt(contract?.start_date)} /><ProfileField label="Contract end" value={fmt(contract?.end_date)} /></Section>}
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4"><p className="text-sm text-slate-600"><span className="font-semibold">Need to update your info?</span> Contact the administration and they can update your profile.</p></div>
  </div>;
}
