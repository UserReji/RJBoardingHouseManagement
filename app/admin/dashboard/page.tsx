import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import { Users, FileText, AlertCircle, ChevronRight } from "lucide-react";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    purple: "bg-violet-50 border-violet-100 text-violet-600",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="stat-label" style={{ color: "inherit", opacity: 0.7 }}>{label}</p>
      <p className="stat-number" style={{ color: "inherit" }}>{value}</p>
      {sub && <p className="text-xs mt-1.5 opacity-70 font-medium">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createAdminSupabaseClient();

  const [rooms, tenants, bills, payments, concerns] = await Promise.all([
    supabase.from("rooms").select("id, status", { count: "exact" }),
    supabase.from("users").select("id, registration_status", { count: "exact" }).eq("role", "tenant"),
    supabase.from("tenant_bills").select("id, status, total_amount", { count: "exact" }),
    supabase.from("payments").select("id, status", { count: "exact" }),
    supabase.from("concerns").select("id, status", { count: "exact" }),
  ]);

  const roomData    = rooms.data    ?? [];
  const tenantData  = tenants.data  ?? [];
  const billData    = bills.data    ?? [];
  const paymentData = payments.data ?? [];
  const concernData = concerns.data ?? [];

  const paidBills  = billData.filter((b: any) => b.status === "paid");
  const collected  = paidBills.reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
  const totalRooms            = roomData.length;
  const occupiedRooms         = roomData.filter((r: any) => r.status === "occupied").length;
  const totalTenants          = tenantData.filter((t: any) => t.registration_status === "approved").length;
  const pendingRegistrations  = tenantData.filter((t: any) => t.registration_status === "pending").length;
  const pendingVerifications  = paymentData.filter((p: any) => p.status === "pending_verification").length;
  const pendingBills          = billData.filter((b: any) => b.status === "unpaid").length;
  const openConcerns          = concernData.filter((c: any) => c.status === "open").length;
  const occupancyPct = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Overview</p>
        <h1 className="text-display-md">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your boarding house at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Occupancy" value={`${occupancyPct}%`} sub={`${occupiedRooms} of ${totalRooms} rooms`} color="blue" />
        <StatCard label="Collected" value={`₱${collected.toLocaleString()}`} sub="Paid bills total" color="green" />
        <StatCard label="Unpaid Bills" value={pendingBills} sub="Awaiting payment" color="amber" />
        <StatCard label="Tenants" value={totalTenants} sub="Active" color="purple" />
      </div>

      {(pendingRegistrations > 0 || pendingVerifications > 0 || openConcerns > 0) && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Action needed</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRegistrations > 0 && (
              <ActionCard href="/admin/tenants" icon={Users} color="bg-amber-50 text-amber-600"
                          title="Pending registrations" sub={`${pendingRegistrations} awaiting approval`} />
            )}
            {pendingVerifications > 0 && (
              <ActionCard href="/admin/payments" icon={FileText} color="bg-blue-50 text-blue-600"
                          title="Payments to verify" sub={`${pendingVerifications} pending`} />
            )}
            {openConcerns > 0 && (
              <ActionCard href="/admin/concerns" icon={AlertCircle} color="bg-red-50 text-red-500"
                          title="Open concerns" sub={`${openConcerns} need attention`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ href, icon: Icon, color, title, sub }: any) {
  return (
    <Link href={href} className="card p-4 hover:shadow-md transition-all flex items-center gap-3 group">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
    </Link>
  );
}
