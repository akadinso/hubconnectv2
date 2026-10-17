"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REASONS } from "@/lib/report-reasons";
import { cleanPhotoPaths } from "@/lib/photos";

type Result = { error?: string };

async function adminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin" ? { supabase, user } : null;
}

export async function submitReport(input: {
  kind: "user" | "listing" | "problem";
  targetUserId?: string;
  targetListingId?: string;
  reason: string;
  details?: string;
  photos?: string[];
}): Promise<Result> {
  if (!REASONS[input.kind]?.includes(input.reason)) {
    return { error: "Please choose a reason." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const photos = cleanPhotoPaths(input.photos, user.id);
  if (!photos) {
    return { error: "One of the photos couldn't be used. Please try again." };
  }

  const details = (input.details ?? "").trim().slice(0, 1000);

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    kind: input.kind,
    target_user_id: input.kind === "user" ? input.targetUserId : null,
    target_listing_id: input.kind === "listing" ? input.targetListingId : null,
    reason: input.reason,
    details: details || null,
    photos,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already reported this." };
    if (error.code === "23514") return { error: "That report isn't valid." };
    return { error: error.message };
  }
  return {};
}

export async function openDispute(
  orderId: string,
  reason: string,
  details?: string,
  photoPaths?: string[],
): Promise<Result> {
  if (!REASONS.dispute.includes(reason)) {
    return { error: "Please choose a reason." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const photos = cleanPhotoPaths(photoPaths, user.id);
  if (!photos) {
    return { error: "One of the photos couldn't be used. Please try again." };
  }

  const { error } = await supabase.from("disputes").insert({
    order_id: orderId,
    opened_by: user.id,
    reason,
    details: (details ?? "").trim().slice(0, 1000) || null,
    photos,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have an open dispute for this order." };
    }
    if (error.code === "42501") {
      return { error: "You can only dispute orders that were paid for." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  return {};
}

export async function resolveReport(
  id: string,
  outcome: "resolved" | "dismissed",
  archiveListing: boolean,
  note: string,
): Promise<Result> {
  const ctx = await adminContext();
  if (!ctx) return { error: "Not allowed." };

  const clean = note.trim();
  if (clean.length < 3) return { error: "Add a short note for the record." };

  const { supabase, user } = ctx;

  const { data: report } = await supabase
    .from("reports")
    .select("id, status, target_listing_id")
    .eq("id", id)
    .maybeSingle();

  if (!report) return { error: "Report not found." };
  if (report.status !== "open") return { error: "This report is already closed." };

  if (archiveListing && report.target_listing_id) {
    const { error } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .eq("id", report.target_listing_id);
    if (error) return { error: error.message };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: outcome,
      admin_note: clean,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/reports/${id}`);
  return {};
}

export async function resolveDispute(
  id: string,
  status: "in_review" | "resolved" | "dismissed",
  note: string,
): Promise<Result> {
  const ctx = await adminContext();
  if (!ctx) return { error: "Not allowed." };

  const final = status !== "in_review";
  const clean = note.trim();
  if (final && clean.length < 3) {
    return { error: "Add a short note for the record." };
  }

  const { supabase, user } = ctx;

  const { error } = await supabase
    .from("disputes")
    .update({
      status,
      admin_note: clean || null,
      ...(final
        ? { resolved_by: user.id, resolved_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id)
    .in("status", ["open", "in_review"]);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/disputes/${id}`);
  return {};
}