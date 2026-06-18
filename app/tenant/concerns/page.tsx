"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";

interface Concern {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  replyCount: number;
}

export default function TenantConcernsPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch tenant concerns
    // Mock data for now
    setConcerns([
      {
        id: "concern-1",
        title: "Leaky faucet in bathroom",
        status: "in_progress",
        createdAt: "2025-07-10",
        replyCount: 2,
      },
      {
        id: "concern-2",
        title: "Air conditioning not working",
        status: "resolved",
        createdAt: "2025-07-05",
        replyCount: 3,
      },
      {
        id: "concern-3",
        title: "Noisy neighbors",
        status: "open",
        createdAt: "2025-07-15",
        replyCount: 0,
      },
    ]);
    setIsLoading(false);
  }, []);

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
      <div className="page">
        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading concerns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-md mb-2">Concerns</h1>
            <p className="text-slate-600">Report and track your concerns.</p>
          </div>
          <Link href="/tenant/concerns/new" className="btn btn-primary btn-sm hidden md:inline-flex">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Link>
        </div>

        {/* Mobile New Button */}
        <Link href="/tenant/concerns/new" className="btn btn-primary btn-lg w-full mb-6 md:hidden">
          <Plus className="w-4 h-4 mr-2" />
          Post a Concern
        </Link>

        {/* Concerns List */}
        <div className="space-y-3">
          {concerns.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600 mb-4">No concerns yet.</p>
              <Link href="/tenant/concerns/new" className="btn btn-primary btn-md">
                Post Your First Concern
              </Link>
            </div>
          ) : (
            concerns.map((concern) => (
              <Link
                key={concern.id}
                href={`/tenant/concerns/${concern.id}`}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-900 truncate">{concern.title}</h3>
                      <span className={`badge ${getStatusColor(concern.status)} flex-shrink-0`}>
                        {getStatusLabel(concern.status)}
                      </span>
                    </div>
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
