import Link from "next/link";
import { Home, Users, Zap, MessageCircle, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#1e3a5f] text-white px-5 pt-16 pb-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-[#1e3a5f]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">RJ BoardHouse</h1>
          <p className="text-blue-200 text-sm mb-8">
            Simple, transparent boarding house management
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full bg-amber-400 text-[#1e3a5f] font-semibold py-3.5 rounded-xl text-center"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full border border-white/30 text-white font-semibold py-3.5 rounded-xl text-center"
            >
              Register as Tenant
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-5 py-10 max-w-lg mx-auto w-full">
        <h2 className="text-lg font-semibold text-slate-700 mb-5">
          What you get
        </h2>
        <div className="space-y-4">
          {[
            {
              icon: <Zap className="w-5 h-5 text-amber-500" />,
              title: "Clear billing",
              desc: "See your room rent and electricity bill breakdown every month.",
            },
            {
              icon: <Users className="w-5 h-5 text-blue-500" />,
              title: "Room management",
              desc: "Track occupants, meter readings, and payment history.",
            },
            {
              icon: <MessageCircle className="w-5 h-5 text-emerald-500" />,
              title: "Concerns & support",
              desc: "Post concerns directly to the admin with photos attached.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{f.title}</p>
                <p className="text-slate-500 text-sm mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rooms overview */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Rooms</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 bg-[#1e3a5f] text-white p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-blue-200 text-xs">Room 1</p>
                <p className="font-bold text-lg">₱3,500</p>
                <p className="text-blue-300 text-xs">/ month</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Large room
                </span>
              </div>
            </div>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-slate-50 border border-slate-200 p-3 rounded-xl"
              >
                <p className="text-slate-500 text-xs">Room {n}</p>
                <p className="font-bold text-slate-800">₱2,500</p>
                <p className="text-slate-400 text-xs">/ month</p>
              </div>
            ))}
          </div>
        </div>

        {/* GCash */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <div className="text-2xl">💳</div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              GCash payments accepted
            </p>
            <p className="text-xs text-slate-500">
              Scan QR or pay cash — your choice
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0" />
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-6 pb-8">
        © 2025 RJ BoardHouse · All rights reserved
      </footer>
    </div>
  );
}
