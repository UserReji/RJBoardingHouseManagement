"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Edit2 } from "lucide-react";

interface Room {
  id: string;
  roomNumber: number;
  price: number;
  status: "occupied" | "vacant";
  currentTenant?: string;
  photoCount: number;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch rooms
    // Mock data for now
    setRooms([
      {
        id: "room-1",
        roomNumber: 1,
        price: 3500,
        status: "occupied",
        currentTenant: "John Doe",
        photoCount: 3,
      },
      {
        id: "room-2",
        roomNumber: 2,
        price: 2500,
        status: "vacant",
        photoCount: 2,
      },
      {
        id: "room-3",
        roomNumber: 3,
        price: 2500,
        status: "occupied",
        currentTenant: "Jane Smith",
        photoCount: 2,
      },
      {
        id: "room-4",
        roomNumber: 4,
        price: 2500,
        status: "vacant",
        photoCount: 1,
      },
      {
        id: "room-5",
        roomNumber: 5,
        price: 2500,
        status: "occupied",
        currentTenant: "Mike Johnson",
        photoCount: 2,
      },
      {
        id: "room-6",
        roomNumber: 6,
        price: 2500,
        status: "occupied",
        currentTenant: "Sarah Williams",
        photoCount: 3,
      },
      {
        id: "room-7",
        roomNumber: 7,
        price: 2500,
        status: "vacant",
        photoCount: 1,
      },
      {
        id: "room-8",
        roomNumber: 8,
        price: 2500,
        status: "occupied",
        currentTenant: "Tom Brown",
        photoCount: 2,
      },
    ]);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="page md:p-6">
        <div className="page-content md:max-w-full md:p-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-md mb-2">Rooms</h1>
            <p className="text-slate-600">
              {occupiedCount} occupied • {rooms.length - occupiedCount} vacant
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm text-slate-600">Total: {rooms.length} rooms</p>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/admin/rooms/${room.id}`}
              className={`card p-4 border-2 hover:shadow-md transition-shadow ${
                room.status === "occupied"
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption text-slate-600">Room Number</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{room.roomNumber}</h3>
                </div>
                <span
                  className={`badge ${room.status === "occupied" ? "badge-success" : "badge-slate"}`}
                >
                  {room.status === "occupied" ? "Occupied" : "Vacant"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-caption text-slate-600">Monthly Rate</p>
                  <p className="font-bold text-slate-900">₱{room.price.toLocaleString()}</p>
                </div>

                {room.currentTenant && (
                  <div>
                    <p className="text-caption text-slate-600">Current Tenant</p>
                    <p className="font-medium text-slate-900 truncate">{room.currentTenant}</p>
                  </div>
                )}

                <p className="text-caption text-slate-500">{room.photoCount} photos</p>

                <div className="flex gap-2 pt-2">
                  <button className="btn btn-sm btn-secondary flex-1 flex items-center justify-center gap-1">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="btn btn-sm btn-ghost flex-1">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
