"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Check, X } from "lucide-react";

interface Tenant {
  id: string;
  fullName: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  roomNumber?: number;
  registeredDate: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch tenants
    // Mock data for now
    setTenants([
      {
        id: "tenant-1",
        fullName: "John Doe",
        email: "john@example.com",
        status: "approved",
        roomNumber: 1,
        registeredDate: "2025-02-01",
      },
      {
        id: "tenant-2",
        fullName: "Jane Smith",
        email: "jane@example.com",
        status: "approved",
        roomNumber: 3,
        registeredDate: "2025-03-15",
      },
      {
        id: "tenant-3",
        fullName: "Mike Johnson",
        email: "mike@example.com",
        status: "pending",
        registeredDate: "2025-07-14",
      },
      {
        id: "tenant-4",
        fullName: "Sarah Williams",
        email: "sarah@example.com",
        status: "approved",
        roomNumber: 6,
        registeredDate: "2025-04-10",
      },
      {
        id: "tenant-5",
        fullName: "Tom Brown",
        email: "tom@example.com",
        status: "pending",
        registeredDate: "2025-07-16",
      },
    ]);
    setIsLoading(false);
  }, []);

  const filteredTenants = tenants.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "badge-success";
      case "pending":
        return "badge-warning";
      case "rejected":
        return "badge-danger";
      default:
        return "badge-slate";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="page md:p-6">
        <div className="page-content md:max-w-full md:p-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading tenants...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = tenants.filter((t) => t.status === "pending").length;
  const approvedCount = tenants.filter((t) => t.status === "approved").length;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Tenants</h1>
          <p className="text-slate-600">
            {approvedCount} approved • {pendingCount} pending
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "all", label: "All" },
            { value: "approved", label: "Approved" },
            { value: "pending", label: "Pending" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              className={`btn btn-sm px-4 whitespace-nowrap ${
                filterStatus === filter.value ? "btn-primary" : "btn-secondary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Tenants List */}
        <div className="space-y-3">
          {filteredTenants.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600">No tenants found.</p>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/tenants/${tenant.id}`}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{tenant.fullName}</h3>
                    <p className="text-sm text-slate-500 truncate">{tenant.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge ${getStatusColor(tenant.status)}`}>
                        {getStatusLabel(tenant.status)}
                      </span>
                      {tenant.roomNumber && (
                        <span className="text-caption bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Room {tenant.roomNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
