"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Bill {
  id: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalAmount: number;
  status: "paid" | "unpaid" | "partially_paid";
}

export default function TenantBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch tenant bills
    // Mock data for now
    setBills([
      {
        id: "bill-1",
        billingPeriodStart: "2025-06-01",
        billingPeriodEnd: "2025-06-30",
        totalAmount: 2800,
        status: "paid",
      },
      {
        id: "bill-2",
        billingPeriodStart: "2025-05-01",
        billingPeriodEnd: "2025-05-31",
        totalAmount: 2750,
        status: "paid",
      },
      {
        id: "bill-3",
        billingPeriodStart: "2025-07-01",
        billingPeriodEnd: "2025-07-31",
        totalAmount: 2900,
        status: "unpaid",
      },
    ]);
    setIsLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "badge-success";
      case "unpaid":
        return "badge-danger";
      case "partially_paid":
        return "badge-warning";
      default:
        return "badge-slate";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "unpaid":
        return "Unpaid";
      case "partially_paid":
        return "Partially Paid";
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
            <p className="text-slate-600">Loading bills...</p>
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
          <h1 className="text-display-md mb-2">Your Bills</h1>
          <p className="text-slate-600">View and manage your monthly bills.</p>
        </div>

        {/* Bills List */}
        <div className="space-y-3">
          {bills.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600">No bills yet.</p>
            </div>
          ) : (
            bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/tenant/bills/${bill.id}`}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">
                      {new Date(bill.billingPeriodStart).toLocaleDateString()} -{" "}
                      {new Date(bill.billingPeriodEnd).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">₱{bill.totalAmount.toLocaleString()}</p>
                      <span className={`badge ${getStatusColor(bill.status)}`}>
                        {getStatusLabel(bill.status)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
