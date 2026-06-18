"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Concern {
  id: string;
  tenantName: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  replyCount: number;
}

export default function AdminConcernsPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch concerns
    // Mock data for now
    setConcerns([
      {
        id: "concern-1",
        tenantName: "Jane Smith",
        title: "Leaky faucet in bathroom",
        status: "in_progress",
        createdAt: "2025-07-10",
        replyCount: 2,
      },
      {
        id: "concern-2",
        tenantName: "Mike Johnson",
        title: "Air conditioning not working",
        status: "resolved",
        createdAt: "2025-07-05",
        replyCount: 3,
      },
      {
        id: "concern-3",
        tenantName: "John Doe",
        title: "Noisy neighbors",
        status: "open",
        createdAt: "2025-07-15",
        replyCount: 0,
      },
      {
        id: "concern-4",
        tenantName: "Sarah Williams",
        title: "Light bulb replacement needed",
        status: "resolved",
        createdAt: "2025-07-08",
        replyCount: 1,
      },
      {
        id: "concern-5",
        tenantName: "Tom Brown",
        title: "Water pressure issue in Room 8",
        status: "open",
        createdAt: "2025-07-16",
        replyCount: 0,
      },
    ]);
    setIsLoading(false);
  }, []);

  const filteredConcerns = concerns.filter(
    (c) => filterStatus === "all" || c.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "badge-info";
      case "in_progress":
        return "badge-warning";
      case "resolved":
        return "badge-success";
      default:
        return "badge-slate";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="page md:p-6">
        <div className="page-content md:max-w-full md:p-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading concerns...</p>
          </div>
        </div>
      </div>
    );
  }

  const openCount = concerns.filter((c) => c.status === "open").length;
  const inProgressCount = concerns.filter((c) => c.status === "in_progress").length;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Concerns</h1>
          <p className="text-slate-600">
            {openCount} open • {inProgressCount} in progress
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" },
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

        {/* Concerns List */}
        <div className="space-y-3">
          {filteredConcerns.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600">No concerns found.</p>
            </div>
          ) : (
            filteredConcerns.map((concern) => (
              <Link
                key={concern.id}
                href={`/admin/concerns/${concern.id}`}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-caption text-slate-600 font-medium">{concern.tenantName}</p>
                      <span className={`badge ${getStatusColor(concern.status)}`}>
                        {getStatusLabel(concern.status)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate mb-1">{concern.title}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(concern.createdAt).toLocaleDateString()} • {concern.replyCount} reply
                      {concern.replyCount !== 1 ? "ies" : ""}
                    </p>
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
