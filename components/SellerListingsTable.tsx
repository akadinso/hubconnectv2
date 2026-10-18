"use client";

import Image from "next/image";
import type { Listing } from "@/components/SellerDashboard";

interface Props {
  data: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
}

export function SellerListingsTable({ data, onEdit, onDelete }: Props) {
  return (
    <table className="w-full border-collapse border">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">Image</th>
          <th className="border p-2">Title</th>
          <th className="border p-2">Price</th>
          <th className="border p-2">Status</th>
          <th className="border p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((listing) => (
          <tr key={listing.id} className="hover:bg-gray-50">
            <td className="border p-2">
              {listing.image_url ? (
                <Image
                  src={listing.image_url}
                  alt={listing.title}
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </td>
            <td className="border p-2">{listing.title}</td>
            <td className="border p-2">R{listing.price}</td>
            <td className="border p-2">{listing.status}</td>
            <td className="flex gap-2 border p-2">
              <button
                onClick={() => onEdit(listing)}
                className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(listing.id)}
                className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}