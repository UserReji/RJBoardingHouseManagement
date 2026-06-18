"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, Banknote, AlertCircle, Calendar, CreditCard } from "lucide-react";

interface TenantDashboardData {
  roomNumber: number;
  monthlyRent: number;
  totalBills: number;
  totalPaid: number;
  currentBalance: number;
  monthsOfStay: number;
  latestBill?: {
    id: string;
    amount: number;
    status: string;
    dueDate: string;
  };
}

export default function TenantDashboard() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch tenant dashboard data
    // For now, use mock data
    setData({
      roomNumber: 3,
      monthlyRent: 2500,
      totalBills: 5,
      totalPaid: 10000,
      currentBalance: 2500,
      monthsOfStay: 5,
      latestBill: {
        id: "bill-123",
        amount: 2800,
        status: "unpaid",
        dueDate: "2025-07-15",
      },
    });
    setIsLoading(false);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="page">
        <div className="page-content flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Welcome Back!</h1>
          <p className="text-slate-600">Here's your boarding house summary.</p>
        </div>

        {/* Room Info Card */}
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Your Room</p>
              <h2 className="text-3xl font-bold">Room {data.roomNumber}</h2>
            </div>
            <DoorOpen className="w-10 h-10 opacity-80" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-100 text-xs">Monthly Rent</p>
              <p className="text-lg font-bold mt-1">₱{data.monthlyRent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs">Months of Stay</p>
              <p className="text-lg font-bold mt-1">{data.monthsOfStay} months</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="card p-4">
            <p className="text-caption text-slate-600">Total Bills</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{data.totalBills}</p>
          </div>
          <div className="card p-4">
            <p className="text-caption text-slate-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₱{data.totalPaid.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-caption text-slate-600">Current Balance</p>
            <p className={`text-2xl font-bold mt-2 ${data.currentBalance > 0 ? "text-red-600" : "text-green-600"}`}>
              ₱{Math.abs(data.currentBalance).toLocaleString()}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-caption text-slate-600">Status</p>
            <p className="text-lg font-bold text-slate-900 mt-2">
              <span className={`badge ${data.currentBalance === 0 ? "badge-success" : "badge-warning"}`}>
                {data.currentBalance === 0 ? "Paid" : "Due"}
              </span>
            </p>
          </div>
        </div>

        {/* Latest Bill */}
        {data.latestBill && (
          <div className="mb-8">
            <h2 className="text-title-md mb-4">Latest Bill</h2>
            <div className="card p-4 border-l-4 border-l-blue-600">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption text-slate-600">Bill Amount</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₱{data.latestBill.amount.toLocaleString()}</p>
                </div>
                <span className={`badge ${getStatusColor(data.latestBill.status)}`}>
                  {data.latestBill.status === "paid"
                    ? "Paid"
                    : data.latestBill.status === "unpaid"
                      ? "Unpaid"
                      : "Partially Paid"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 text-sm mb-4">
                <Calendar className="w-4 h-4" />
                <span>Due: {new Date(data.latestBill.dueDate).toLocaleDateString()}</span>
              </div>

              <Link
                href={`/tenant/bills/${data.latestBill.id}`}
                className="btn btn-primary btn-md w-full"
              >
                View Bill Details
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-title-md mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/tenant/bills"
              className="card p-4 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">View All Bills</p>
                <p className="text-sm text-slate-500">Check your bill history</p>
              </div>
            </Link>

            <Link
              href="/tenant/bills"
              className="card p-4 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">Make Payment</p>
                <p className="text-sm text-slate-500">Pay via GCash or cash</p>
              </div>
            </Link>

            <Link
              href="/tenant/concerns/new"
              className="card p-4 border border-amber-200 bg-amber-50 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">Post a Concern</p>
                <p className="text-sm text-slate-500">Report maintenance or issues</p>
              </div>
            </Link>

            <Link
              href="/tenant/profile"
              className="card p-4 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">View Profile</p>
                <p className="text-sm text-slate-500">Manage your information</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
