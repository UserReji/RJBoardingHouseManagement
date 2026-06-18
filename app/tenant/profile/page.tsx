"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { User, Phone, MapPin, ShieldCheck, FileText, DoorOpen } from "lucide-react";

interface TenantProfile {
  full_name: string;
  email: string;
  birthday: string | null;
  sex: string | null;
  permanent_address: string | null;
  contact_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  valid_id_type: string | null;
  valid_id_number: string | null;
  room_number: number | null;
  monthly_rent: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="font-medium text-slate-800">{value || <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  );
}

function Section({
  icon: Icon, title, children,
}: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <div className="card px-4 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

export default function TenantProfilePage() {
  const supabase = createSupabaseClient();
  const [profile,   setProfile]   = useState<TenantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("users")
        .select(`
          full_name, email, birthday, sex,
          permanent_address, contact_number,
          emergency_contact_name, emergency_contact_number,
          valid_id_type, valid_id_number,
          rooms ( room_number, monthly_rent, contract_start_date, contract_end_date )
        `)
        .eq("id", session.user.id)
        .single();

      if (!error && data) {
        const room = (data as any).rooms;
        setProfile({
          full_name:                data.full_name,
          email:                    data.email,
          birthday:                 data.birthday,
          sex:                      data.sex,
          permanent_address:        data.permanent_address,
          contact_number:           data.contact_number,
          emergency_contact_name:   data.emergency_contact_name,
          emergency_contact_number: data.emergency_contact_number,
          valid_id_type:            data.valid_id_type,
          valid_id_number:          data.valid_id_number,
          room_number:              room?.room_number ?? null,
          monthly_rent:             room?.monthly_rent ?? null,
          contract_start_date:      room?.contract_start_date ?? null,
          contract_end_date:        room?.contract_end_date ?? null,
        });
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  if (isLoading || !profile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading profile…</p>
      </div>
    </div>
  );

  const fmt = (dateStr: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Account</p>
        <h1 className="text-display-md">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Your personal and tenancy information.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-extrabold uppercase flex-shrink-0">
          {profile.full_name?.charAt(0) ?? "?"}
        </div>
        <div>
          <p className="font-bold text-lg text-slate-900">{profile.full_name}</p>
          <p className="text-sm text-slate-500">{profile.email}</p>
        </div>
      </div>

      {/* Personal */}
      <Section icon={User} title="Personal Information">
        <ProfileField label="Full Name"  value={profile.full_name} />
        <ProfileField label="Birthday"   value={fmt(profile.birthday)} />
        <ProfileField label="Sex"        value={profile.sex} />
      </Section>

      {/* Contact */}
      <Section icon={Phone} title="Contact Information">
        <ProfileField label="Contact Number"           value={profile.contact_number} />
        <ProfileField label="Permanent Address"        value={profile.permanent_address} />
        <ProfileField label="Emergency Contact"        value={profile.emergency_contact_name} />
        <ProfileField label="Emergency Contact Number" value={profile.emergency_contact_number} />
      </Section>

      {/* ID */}
      <Section icon={ShieldCheck} title="Valid ID">
        <ProfileField label="ID Type"   value={profile.valid_id_type} />
        <ProfileField label="ID Number" value={profile.valid_id_number} />
      </Section>

      {/* Contract */}
      {profile.room_number && (
        <Section icon={FileText} title="Tenancy Details">
          <ProfileField label="Room"          value={profile.room_number ? `Room ${profile.room_number}` : null} />
          <ProfileField label="Monthly Rent"  value={profile.monthly_rent ? `₱${profile.monthly_rent.toLocaleString()}` : null} />
          <ProfileField label="Contract Start" value={fmt(profile.contract_start_date)} />
          <ProfileField label="Contract End"   value={fmt(profile.contract_end_date)} />
        </Section>
      )}

      {/* Note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Need to update your info?</span> Please contact the administration
          directly and they will update your profile.
        </p>
      </div>
    </div>
  );
}
