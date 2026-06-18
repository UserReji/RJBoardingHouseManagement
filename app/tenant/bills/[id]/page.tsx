"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Home, Zap, Users, Upload } from "lucide-react";
import toast from "react-hot-toast";

interface BillDetail {
  id: string;
  roomNumber: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  roomRent: number;
  electricityCharge: number;
  extraOccupantCharge: number;
  totalAmount: number;
  status: "paid" | "unpaid" | "partially_paid";
  kwhConsumed: number;
  kwhRate: number;
  extraOccupantDays: number;
  extraOccupantRate: number;
}

export default function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [bill] = useState<BillDetail>({
    id,
    roomNumber: 3,
    billingPeriodStart: "2025-07-01",
    billingPeriodEnd: "2025-07-31",
    roomRent: 2500,
    electricityCharge: 300,
    extraOccupantCharge: 0,
    totalAmount: 2800,
    status: "unpaid",
    kwhConsumed: 150,
    kwhRate: 2,
    extraOccupantDays: 0,
    extraOccupantRate: 25,
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [gcashScreenshot, setGcashScreenshot] = useState<File | null>(null);
  const [gcashNote, setGcashNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGcashPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gcashScreenshot) {
      toast.error("Please upload a screenshot");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Upload to Supabase Storage and create payment record
      toast.success("Payment submitted for verification");
      setIsPaymentModalOpen(false);
      setGcashScreenshot(null);
      setGcashNote("");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to submit payment");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tenant/bills" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Bill Details</h1>
        </div>

        {/* Bill Summary */}
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Total Amount</p>
              <h2 className="text-4xl font-bold mt-1">₱{bill.totalAmount.toLocaleString()}</h2>
            </div>
            <span className={`badge ${getStatusColor(bill.status)}`}>
              {bill.status === "paid" ? "Paid" : bill.status === "unpaid" ? "Unpaid" : "Partially Paid"}
            </span>
          </div>
          <p className="text-blue-100 text-sm">
            {new Date(bill.billingPeriodStart).toLocaleDateString()} to{" "}
            {new Date(bill.billingPeriodEnd).toLocaleDateString()}
          </p>
        </div>

        {/* Bill Breakdown */}
        <div className="mb-6">
          <h3 className="text-title-md mb-4">Breakdown</h3>
          <div className="space-y-3">
            {/* Room Rent */}
            <div className="card p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">Room Rent</p>
                  <p className="text-sm text-slate-500">Room {bill.roomNumber}</p>
                </div>
              </div>
              <p className="font-bold text-slate-900">₱{bill.roomRent.toLocaleString()}</p>
            </div>

            {/* Electricity */}
            <div className="card p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">Electricity</p>
                  <p className="text-sm text-slate-500">
                    {bill.kwhConsumed} kWh × ₱{bill.kwhRate}/kWh
                  </p>
                </div>
              </div>
              <p className="font-bold text-slate-900">₱{bill.electricityCharge.toLocaleString()}</p>
            </div>

            {/* Extra Occupant (if any) */}
            {bill.extraOccupantDays > 0 && (
              <div className="card p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Extra Occupant</p>
                    <p className="text-sm text-slate-500">
                      {bill.extraOccupantDays} days × ₱{bill.extraOccupantRate}/day
                    </p>
                  </div>
                </div>
                <p className="font-bold text-slate-900">₱{bill.extraOccupantCharge.toLocaleString()}</p>
              </div>
            )}

            {/* Total */}
            <div className="card p-4 border-l-4 border-l-blue-600 bg-blue-50 flex items-start justify-between">
              <p className="font-bold text-slate-900">Total</p>
              <p className="text-xl font-bold text-blue-600">₱{bill.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        {bill.status !== "paid" && (
          <div className="mb-6">
            <h3 className="text-title-md mb-4">Payment Options</h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="card p-4 border-2 border-dashed border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-medium text-slate-900">Pay via GCash</p>
                  <p className="text-sm text-slate-500">Scan QR or upload screenshot</p>
                </div>
                <Upload className="w-5 h-5 text-blue-600" />
              </button>

              <div className="card p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Cash Payment</p>
                  <p className="text-sm text-slate-500">Pay directly at the office</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GCash Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center safe-bottom">
            <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-title-md mb-6">Submit GCash Payment</h2>

              <form onSubmit={handleGcashPayment} className="space-y-4">
                <div>
                  <label className="label">Upload Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGcashScreenshot(e.target.files?.[0] || null)}
                    className="input"
                  />
                  {gcashScreenshot && (
                    <p className="text-sm text-green-600 mt-2">✓ {gcashScreenshot.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="note" className="label">
                    Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="note"
                    placeholder="e.g., GC1234567890"
                    value={gcashNote}
                    onChange={(e) => setGcashNote(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="btn btn-secondary btn-lg flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !gcashScreenshot}
                    className="btn btn-primary btn-lg flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
