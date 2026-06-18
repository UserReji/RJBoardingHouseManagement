"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Payment {
  id: string;
  billId: string;
  amount: number;
  method: "cash" | "gcash";
  status: "pending_verification" | "verified" | "rejected";
  paidAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch payments
    // Mock data for now
    setPayments([
      {
        id: "pay-1",
        billId: "bill-1",
        amount: 2800,
        method: "gcash",
        status: "verified",
        paidAt: "2025-07-05",
      },
      {
        id: "pay-2",
        billId: "bill-2",
        amount: 2750,
        method: "cash",
        status: "verified",
        paidAt: "2025-06-10",
      },
      {
        id: "pay-3",
        billId: "bill-3",
        amount: 1500,
        method: "gcash",
        status: "pending_verification",
        paidAt: "2025-07-15",
      },
    ]);
    setIsLoading(false);
  }, []);

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

  const getMethodLabel = (method: string) => {
    return method === "gcash" ? "GCash" : "Cash";
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Payment History</h1>
          <p className="text-slate-600">Track all your payments and verification status.</p>
        </div>

        {/* Payments List */}
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600">No payments yet.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-slate-900">₱{payment.amount.toLocaleString()}</p>
                      <span className="text-caption bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {getMethodLabel(payment.method)}
                      </span>
                      <span className={`badge ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Bill #{payment.billId} • {new Date(payment.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Box */}
        <div className="card p-4 bg-blue-50 border-blue-200 mt-8">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">GCash Payments:</span> Once you submit a GCash payment with a screenshot,
            the admin will verify it. You'll receive an email notification when it's confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
