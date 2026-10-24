"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MessagesShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inThread = pathname !== "/messages" && pathname !== "/messages/";

  return (
    // Full screen height minus the 4rem navbar, so the message box is always on screen
    <div className="flex h-[calc(98dvh-4rem)] w-full max-w-full overflow-hidden border-x bg-background">
      <aside
        className={cn(
          "min-h-0 w-full shrink-0 flex-col border-r md:flex md:w-80 lg:w-96",
          inThread ? "hidden" : "flex",
        )}
      >
        {sidebar}
      </aside>
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col md:flex",
          inThread ? "flex" : "hidden",
        )}
      >
        {children}
      </section>
    </div>
  );
}
