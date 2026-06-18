"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/rooms" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Room Details</h1>
        </div>

        <div className="card p-6">
          <p className="text-slate-600">Room {id} detail page coming soon.</p>
        </div>
      </div>
    </div>
  );
}
