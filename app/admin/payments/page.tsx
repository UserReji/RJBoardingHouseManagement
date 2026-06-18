"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface Payment {
  id: string;
  tenantName: string;
  billId: string;
  amount: number;
  method: "cash" | "gcash";
  status: "pending_verification" | "verified" | "rejected";
  screenshotUrl?: string;
  submittedAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending_verification" | "verified" | "rejected">(
    "pending_verification"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch payments
    // Mock data for now
    setPayments([
      {
        id: "pay-1",
        tenantName: "John Doe",
        billId: "bill-1",
        amount: 3800,
        method: "gcash",
        status: "pending_verification",
        submittedAt: "2025-07-18",
      },
      {
        id: "pay-2",
        tenantName: "Jane Smith",
        billId: "bill-2",
        amount: 1400,
        method: "gcash",
        status: "pending_verification",
        submittedAt: "2025-07-17",
      },
      {
        id: "pay-3",
        tenantName: "Mike Johnson",
        billId: "bill-3",
        amount: 1400,
        method: "gcash",
        status: "verified",
        submittedAt: "2025-07-15",
      },
      {
        id: "pay-4",
        tenantName: "Sarah Williams",
        billId: "bill-4",
        amount: 2850,
        method: "cash",
        status: "verified",
        submittedAt: "2025-07-12",
      },
    ]);
    setIsLoading(false);
  }, []);

  const filteredPayments = payments.filter(
    (p) => filterStatus === "all" || p.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "badge-success";
      case "pending_verification":
        return "badge-warning";
      case "rejected":
        return "badge-danger";
      default:
        return "badge-slate";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending_verification":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handleVerifyPayment = (paymentId: string) => {
    setPayments(
      payments.map((p) =>
        p.id === paymentId ? { ...p, status: "verified" as const } : p
      )
    );
    toast.success("Payment verified");
  };

  const handleRejectPayment = (paymentId: string) => {
    setPayments(
      payments.map((p) =>
        p.id === paymentId ? { ...p, status: "rejected" as const } : p
      )
    );
    toast.success("Payment rejected");
  };

  if (isLoading) {
    return (
      <div className="page md:p-6">
        <div className="page-content md:max-w-full md:p-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = payments.filter((p) => p.status === "pending_verification").length;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Payment Verification</h1>
          <p className="text-slate-600">
            {pendingCount} pending • Verify GCash payments
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "pending_verification", label: "Pending" },
            { value: "verified", label: "Verified" },
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

        {/* Payments List */}
        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600">No payments found.</p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{payment.tenantName}</h3>
                      <p className="text-sm text-slate-500">
                        Bill #{payment.billId} • {new Date(payment.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">₱{payment.amount.toLocaleString()}</p>
                    <span className="text-caption bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {payment.method === "gcash" ? "GCash" : "Cash"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons for Pending Payments */}
                {payment.status === "pending_verification" && payment.method === "gcash" && (
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleVerifyPayment(payment.id)}
                      className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Verify
                    </button>
                    <button
                      onClick={() => handleRejectPayment(payment.id)}
                      className="btn btn-danger btn-sm flex-1 flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
