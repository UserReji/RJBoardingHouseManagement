import Link from "next/link";
import { Home, Users, Zap, MessageCircle, ShieldCheck, Star, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Transparent billing",
    desc: "Itemized rent and electricity breakdown every month — no surprises.",
  },
  {
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-50",
    title: "Room management",
    desc: "Track occupants, meter readings, and full payment history at a glance.",
  },
  {
    icon: MessageCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    title: "Concerns & support",
    desc: "Report maintenance issues directly to the admin with photo attachments.",
  },
  {
    icon: ShieldCheck,
    color: "text-violet-500",
    bg: "bg-violet-50",
    title: "Secure & private",
    desc: "Your data is encrypted and only visible to you and management.",
  },
];

const ROOMS = [
  { number: 1, price: 3500, size: "Large" },
  { number: 2, price: 2500, size: "Standard" },
  { number: 3, price: 2500, size: "Standard" },
  { number: 4, price: 2500, size: "Standard" },
  { number: 5, price: 2500, size: "Standard" },
  { number: 6, price: 2500, size: "Standard" },
  { number: 7, price: 2500, size: "Standard" },
  { number: 8, price: 2500, size: "Standard" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">RJ BoardHouse</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="btn btn-ghost btn-sm text-slate-700"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#0f1f35] via-[#1a3353] to-[#1e3f6a] text-white px-5 pt-16 pb-20 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-500/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-400/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-lg mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs font-medium text-blue-200 mb-8">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            Trusted by tenants in Davao
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Your home,{" "}
            <span className="text-amber-400">managed simply.</span>
          </h1>
          <p className="text-blue-200/90 text-base md:text-lg max-w-sm mx-auto leading-relaxed mb-10">
            Rent tracking, billing, and tenant support — all in one place for RJ BoardHouse residents.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="btn btn-sm sm:btn-md bg-amber-400 text-[#0f1f35] font-bold hover:bg-amber-300 border-0 shadow-lg shadow-amber-400/30 w-full sm:w-auto px-8"
            >
              Sign In to Your Portal
            </Link>
            <Link
              href="/register"
              className="btn btn-sm sm:btn-md border border-white/25 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto px-8"
            >
              Register as Tenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-5 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { val: "8", label: "Rooms" },
            { val: "₱2.5k", label: "Starting rent" },
            { val: "GCash", label: "Accepted" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-amber-400">{s.val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="px-5 py-14 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Features</p>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Everything you need</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1">{f.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rooms ── */}
      <section className="bg-slate-50 px-5 py-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Availability</p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Our Rooms</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROOMS.map((room) => (
              <div
                key={room.number}
                className={`rounded-2xl p-4 border ${
                  room.number === 1
                    ? "bg-[#1a3353] text-white border-transparent col-span-2"
                    : "bg-white text-slate-800 border-slate-200"
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${room.number === 1 ? "text-blue-300" : "text-slate-400"}`}>
                  Room {room.number}
                </p>
                <p className={`text-xl font-extrabold ${room.number === 1 ? "text-amber-400" : "text-slate-900"}`}>
                  ₱{room.price.toLocaleString()}
                </p>
                <p className={`text-xs mt-0.5 ${room.number === 1 ? "text-blue-200" : "text-slate-400"}`}>
                  {room.size} · /month
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment CTA ── */}
      <section className="px-5 py-10 max-w-2xl mx-auto w-full">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center gap-4 text-white shadow-lg shadow-blue-500/20">
          <div className="text-3xl flex-shrink-0">💳</div>
          <div className="flex-1">
            <p className="font-bold text-base">GCash payments accepted</p>
            <p className="text-blue-200 text-sm">Scan QR or pay cash — your choice, every time.</p>
          </div>
          <Link href="/register" className="btn btn-sm bg-white text-blue-700 font-bold hover:bg-blue-50 flex-shrink-0 border-0">
            Get started
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 py-8 border-t border-slate-100">
        © 2025 RJ BoardHouse · Davao City · All rights reserved
      </footer>
    </div>
  );
}
