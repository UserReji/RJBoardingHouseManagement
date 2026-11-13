import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
import ContractManager from "./ContractManager";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const [{ data: tenant }, { data: contracts }] = await Promise.all([
    supabase.from("users").select("id, full_name, room_id, account_status, email_confirmed_at, rooms(room_number, monthly_rent)").eq("id", id).not("email_confirmed_at", "is", null).single(),
    supabase.from("tenant_contracts").select("id, term_months, start_date, end_date, monthly_rent, security_deposit_months, advance_payment_months, contract_status, created_at").eq("tenant_id", id).order("created_at", { ascending: false }),
  ]);
  if (!tenant) notFound();
  const room = Array.isArray((tenant as any).rooms) ? (tenant as any).rooms[0] : (tenant as any).rooms;
  return <div className="page md:p-6"><div className="page-content md:max-w-full md:p-0"><div className="flex items-center gap-3 mb-6"><Link href={`/admin/tenants/${id}`} className="btn btn-ghost btn-sm"><ChevronLeft className="w-5 h-5" /></Link><div><h1 className="text-title-md">Contracts</h1><p className="text-sm text-slate-500">{tenant.full_name}</p></div></div><ContractManager tenantId={id} roomId={tenant.room_id} roomNumber={room?.room_number ?? null} roomRent={Number(room?.monthly_rent ?? 0)} contracts={(contracts ?? []) as any} /></div></div>;
}
