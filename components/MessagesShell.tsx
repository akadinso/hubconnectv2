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
    <div className="flex h-screen max-w-full overflow-hidden border-x bg-background">
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-r md:flex md:w-80 lg:w-96",
          inThread ? "hidden" : "flex",
        )}
      >
        {sidebar}
      </aside>
      <section
        className={cn(
          "min-w-0 flex-1 flex-col md:flex",
          inThread ? "flex" : "hidden",
        )}
      >
        {children}
      </section>
    </div>
  );
}
