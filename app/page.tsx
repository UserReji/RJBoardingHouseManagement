import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Home, Users, Zap, MessageCircle, ShieldCheck, ChevronRight, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Zap, title: "Bills with a clear breakdown", desc: "See rent, electricity, and other charges together, with the meter readings behind each bill." },
  { icon: Users, title: "Room and tenant records", desc: "Management can follow room availability, tenant approvals, and contract details from one place." },
  { icon: MessageCircle, title: "A direct line for concerns", desc: "Send maintenance requests with photos and keep the conversation attached to the issue." },
  { icon: ShieldCheck, title: "Private tenant accounts", desc: "Your portal keeps personal records and payment history available to you and management." },
];

const FALLBACK_ROOMS = [
  { number: 1, price: 3500, size: "Large room" },
  { number: 2, price: 2500, size: "Standard room" },
  { number: 3, price: 2500, size: "Standard room" },
  { number: 4, price: 2500, size: "Standard room" },
  { number: 5, price: 2500, size: "Standard room" },
  { number: 6, price: 2500, size: "Standard room" },
  { number: 7, price: 2500, size: "Standard room" },
  { number: 8, price: 2500, size: "Standard room" },
];

const fallbackRoomListings = () => FALLBACK_ROOMS.map((room) => ({ ...room, status: "unknown" }));

async function getRoomListings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallbackRoomListings();

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("rooms")
      .select("room_number, monthly_rent, status")
      .order("room_number");
    if (error || !data?.length) return fallbackRoomListings();
    return data.map((room) => ({
      number: room.room_number,
      price: Number(room.monthly_rent),
      size: room.room_number === 1 ? "Large room" : "Standard room",
      status: room.status,
    }));
  } catch {
    return fallbackRoomListings();
  }
}

export default async function LandingPage() {
  const rooms = await getRoomListings();
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="RJ BoardHouse home">
          <span className="brand-mark"><Home size={19} strokeWidth={1.8} /></span>
          <span className="brand-copy"><strong>RJ BoardHouse</strong><span>DAVAO CITY · TENANT PORTAL</span></span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Apply for a room <ArrowUpRight size={15} /></Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="hero-kicker">A place to settle in</p>
          <h1 id="hero-title" className="hero-title">Room to live. <em>Care made simple.</em></h1>
          <p className="hero-description">A welcoming home in Davao, with rent, bills, and support organized in one simple tenant portal.</p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary">Find your room <ChevronRight size={17} /></Link>
            <Link href="/login" className="btn btn-secondary">Open tenant portal</Link>
          </div>
          <p className="hero-note">{rooms.length} rooms · Monthly rent from ₱{Math.min(...rooms.map((room) => room.price)).toLocaleString("en-PH")} · GCash and cash accepted</p>
        </div>
        <div className="house-art" role="img" aria-label="Illustration of a welcoming boarding house surrounded by greenery">
          <div className="house-building">
            <div className="house-sky"><div className="house-sun" /></div>
            <div className="house-ground"><i className="house-plant one" /><i className="house-plant two" /></div>
            <div className="house-roof" />
            <div className="house-facade"><i className="house-window left" /><i className="house-window right" /><i className="house-door" /></div>
          </div>
          <div className="house-label"><strong>Settle in, feel at home</strong><span>A little more room for your next chapter.</span></div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="section-inner">
          <p className="section-kicker">The everyday details</p>
          <h2 id="features-title" className="section-title">A smoother stay, from move-in to monthly bills.</h2>
          <p className="section-intro">The essentials for residents and management, thoughtfully brought together.</p>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <article className="feature-item" key={title}>
                <span className="feature-icon"><Icon size={19} strokeWidth={1.8} /></span>
                <div><h3>{title}</h3><p>{desc}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section rooms-section" aria-labelledby="rooms-title">
        <div className="section-inner">
          <div className="rooms-head">
            <div><p className="section-kicker">Find your fit</p><h2 id="rooms-title" className="section-title">Eight rooms, one place to call home.</h2></div>
            <p className="section-intro">Monthly rates and availability follow the management records.</p>
          </div>
          <div className="rooms-grid">
            {rooms.map((room) => (
              <article className={`room-item ${room.number === 1 ? "featured" : ""}`} key={room.number}>
                <span className="room-number">Room {String(room.number).padStart(2, "0")}</span>
                <span className="room-price">₱{room.price.toLocaleString("en-PH")} <small>/ month</small></span>
                <span className="room-type">{room.size} · {room.status === "occupied" ? "Occupied" : room.status === "vacant" ? "Available" : "Ask about availability"}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" aria-label="Payment options">
        <div className="section-inner payments-band">
          <div><h2>Simple ways to pay.</h2><p>Choose cash or GCash. Your tenant portal keeps each bill and payment record in one place.</p></div>
          <Link href="/register" className="btn btn-secondary">Register as a tenant <ChevronRight size={16} /></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} RJ BoardHouse · Davao City</span>
        <span>Questions? <Link href="/login" className="underline underline-offset-4">Contact management through your portal</Link></span>
      </footer>
    </main>
  );
}
