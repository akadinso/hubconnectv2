import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { StoreProvider } from "@/components/StoreProvider";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";

function NavbarFallback() {
  return (
    <header className="w-full bg-navy text-white">
      <MaxWidthWrapper className="flex h-16 items-center px-4">
        <span className="text-lg font-semibold tracking-tight">HubConnect</span>
      </MaxWidthWrapper>
    </header>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      {children}
    </StoreProvider>
  );
}
