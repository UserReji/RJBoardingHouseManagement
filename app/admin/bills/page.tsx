"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

interface Bill {
  id: string;
  tenantName: string;
  roomNumber: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalAmount: number;
  status: "paid" | "unpaid" | "partially_paid";
}

export default function AdminBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid" | "partially_paid">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch bills
    // Mock data for now
    setBills([
      {
        id: "bill-1",
        tenantName: "John Doe",
        roomNumber: 1,
        billingPeriodStart: "2025-07-01",
        billingPeriodEnd: "2025-07-31",
        totalAmount: 3800,
        status: "paid",
      },
      {
        id: "bill-2",
        tenantName: "Jane Smith",
        roomNumber: 3,
        billingPeriodStart: "2025-07-01",
        billingPeriodEnd: "2025-07-31",
        totalAmount: 2800,
        status: "unpaid",
      },
      {
        id: "bill-3",
        tenantName: "Mike Johnson",
        roomNumber: 5,
        billingPeriodStart: "2025-07-01",
        billingPeriodEnd: "2025-07-31",
        totalAmount: 2800,
        status: "partially_paid",
      },
      {
        id: "bill-4",
        tenantName: "Sarah Williams",
        roomNumber: 6,
        billingPeriodStart: "2025-07-01",
        billingPeriodEnd: "2025-07-31",
        totalAmount: 2850,
        status: "paid",
      },
      {
        id: "bill-5",
        tenantName: "Tom Brown",
        roomNumber: 8,
        billingPeriodStart: "2025-07-01",
        billingPeriodEnd: "2025-07-31",
        totalAmount: 2800,
        status: "unpaid",
      },
    ]);
    setIsLoading(false);
  }, []);

  const filteredBills = bills.filter(
    (b) => filterStatus === "all" || b.status === filterStatus
  );

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
      <div className="page md:p-6">
        <div className="page-content md:max-w-full md:p-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading bills...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalCollected = bills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-md mb-2">Bills</h1>
            <p className="text-slate-600">₱{totalCollected.toLocaleString()} collected</p>
          </div>
          <Link href="/admin/bills/new" className="btn btn-primary btn-sm hidden md:inline-flex">
            <Plus className="w-4 h-4 mr-1" />
            New Bill
          </Link>
        </div>

        {/* Mobile New Button */}
        <Link href="/admin/bills/new" className="btn btn-primary btn-lg w-full mb-6 md:hidden">
          <Plus className="w-4 h-4 mr-2" />
          Create New Bill
        </Link>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "all", label: "All" },
            { value: "paid", label: "Paid" },
            { value: "unpaid", label: "Unpaid" },
            { value: "partially_paid", label: "Partial" },
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

        {/* Bills List */}
        <div className="space-y-3">
          {filteredBills.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-600">No bills found.</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <Link
                key={bill.id}
                href={`/admin/bills/${bill.id}`}
                className="card p-4 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{bill.tenantName}</h3>
                      <span className="text-caption bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">
                        Room {bill.roomNumber}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">
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
