"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetches the page for a short while so "pending" turns into "paid"
export function AutoRefresh({ intervalMs = 3000, maxTries = 10 }) {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= maxTries) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, maxTries]);

  return null;
}
