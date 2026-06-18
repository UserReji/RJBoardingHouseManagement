"use client";

import { useEffect, useState } from "react";
import { User, FileText } from "lucide-react";

interface TenantProfile {
  fullName: string;
  email: string;
  birthday: string;
  sex: string;
  permanentAddress: string;
  contactNumber: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  validIdType: string;
  validIdNumber: string;
  roomNumber: number;
  contractStartDate: string;
  contractEndDate: string;
  monthlyRent: number;
}

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch tenant profile
    // Mock data for now
    setProfile({
      fullName: "John Doe",
      email: "john@example.com",
      birthday: "1998-05-15",
      sex: "Male",
      permanentAddress: "123 Main Street, Some City, ZIP",
      contactNumber: "09123456789",
      emergencyContactName: "Jane Doe",
      emergencyContactNumber: "09187654321",
      validIdType: "National ID",
      validIdNumber: "12-3456789-0",
      roomNumber: 3,
      contractStartDate: "2025-02-01",
      contractEndDate: "2025-08-01",
      monthlyRent: 2500,
    });
    setIsLoading(false);
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="page">
        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Personal Information",
      icon: User,
      fields: [
        { label: "Full Name", value: profile.fullName },
        { label: "Email", value: profile.email },
        { label: "Birthday", value: new Date(profile.birthday).toLocaleDateString() },
        { label: "Sex", value: profile.sex },
      ],
    },
    {
      title: "Contact Information",
      icon: User,
      fields: [
        { label: "Permanent Address", value: profile.permanentAddress },
        { label: "Contact Number", value: profile.contactNumber },
        { label: "Emergency Contact Name", value: profile.emergencyContactName },
        { label: "Emergency Contact Number", value: profile.emergencyContactNumber },
      ],
    },
    {
      title: "Valid ID",
      icon: User,
      fields: [
        { label: "ID Type", value: profile.validIdType },
        { label: "ID Number", value: profile.validIdNumber },
      ],
    },
    {
      title: "Contract Information",
      icon: FileText,
      fields: [
        { label: "Room Number", value: `Room ${profile.roomNumber}` },
        { label: "Monthly Rent", value: `₱${profile.monthlyRent.toLocaleString()}` },
        { label: "Start Date", value: new Date(profile.contractStartDate).toLocaleDateString() },
        { label: "End Date", value: new Date(profile.contractEndDate).toLocaleDateString() },
      ],
    },
  ];

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Your Profile</h1>
          <p className="text-slate-600">View your personal and contract information.</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-title-md">{section.title}</h2>
                </div>

                <div className="card p-4 space-y-4">
                  {section.fields.map((field, index) => (
                    <div
                      key={index}
                      className={`pb-4 ${index < section.fields.length - 1 ? "border-b border-slate-200" : ""}`}
                    >
                      <p className="text-caption text-slate-600 mb-1">{field.label}</p>
                      <p className="font-medium text-slate-900">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="card p-4 bg-blue-50 border-blue-200 mt-8 mb-8">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span> To update your profile information, please contact the
            administration office.
          </p>
        </div>
      </div>
    </div>
  );
}
