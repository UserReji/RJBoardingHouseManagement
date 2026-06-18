"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { Users, DoorOpen, Banknote, AlertCircle } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalTenants: number;
  pendingRegistrations: number;
  pendingVerifications: number;
  totalBillsThisMonth: number;
  monthlyCollected: number;
  pendingBills: number;
}

export default function AdminDashboard() {
  const supabase = createSupabaseClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This is a placeholder - we'll implement actual data fetching
        // For now, set mock data
        setStats({
          totalRooms: 8,
          occupiedRooms: 5,
          totalTenants: 5,
          pendingRegistrations: 2,
          pendingVerifications: 1,
          totalBillsThisMonth: 5,
          monthlyCollected: 12500,
          pendingBills: 2,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading || !stats) {
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

  const stats_cards = [
    {
      title: "Occupancy Rate",
      value: `${Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}%`,
      subtitle: `${stats.occupiedRooms}/${stats.totalRooms} rooms occupied`,
      icon: DoorOpen,
      color: "blue",
    },
    {
      title: "This Month Collected",
      value: `₱${stats.monthlyCollected.toLocaleString()}`,
      subtitle: `From ${stats.totalBillsThisMonth} bills`,
      icon: Banknote,
      color: "green",
    },
    {
      title: "Pending Bills",
      value: stats.pendingBills,
      subtitle: "Awaiting payment",
      icon: AlertCircle,
      color: "amber",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      subtitle: "Awaiting approval",
      icon: Users,
      color: "purple",
    },
  ];

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-md mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {stats_cards.map((card) => {
            const Icon = card.icon;
            const colorMap = {
              blue: "bg-blue-50 border-blue-200",
              green: "bg-green-50 border-green-200",
              amber: "bg-amber-50 border-amber-200",
              purple: "bg-purple-50 border-purple-200",
            };
            const iconColorMap = {
              blue: "text-blue-600",
              green: "text-green-600",
              amber: "text-amber-600",
              purple: "text-purple-600",
            };

            return (
              <div
                key={card.title}
                className={`card border-2 p-4 ${colorMap[card.color as keyof typeof colorMap]}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-caption font-medium text-slate-600">{card.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
                    <p className="text-caption text-slate-500 mt-1">{card.subtitle}</p>
                  </div>
                  <Icon
                    className={`w-6 h-6 ${iconColorMap[card.color as keyof typeof iconColorMap]}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-title-md mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/admin/tenants?filter=pending"
              className="card p-4 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">Pending Registrations</p>
                <p className="text-sm text-slate-500">Review and approve new tenants</p>
              </div>
              <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-semibold">
                {stats.pendingRegistrations}
              </div>
            </Link>

            <Link
              href="/admin/payments?filter=pending"
              className="card p-4 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">Verify GCash Payments</p>
                <p className="text-sm text-slate-500">Pending verification queue</p>
              </div>
              <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full font-semibold">
                {stats.pendingVerifications}
              </div>
            </Link>

            <Link
              href="/admin/bills/new"
              className="card p-4 border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">Create New Bill</p>
                <p className="text-sm text-slate-500">Generate monthly bills for tenants</p>
              </div>
            </Link>

            <Link
              href="/admin/concerns"
              className="card p-4 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">Manage Concerns</p>
                <p className="text-sm text-slate-500">View and respond to tenant issues</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-caption font-medium text-slate-600">Total Tenants</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalTenants}</p>
          </div>
          <div className="card p-4">
            <p className="text-caption font-medium text-slate-600">Active Contracts</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalTenants}</p>
          </div>
          <div className="card p-4">
            <p className="text-caption font-medium text-slate-600">Total Rooms</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalRooms}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
