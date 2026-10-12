import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { StoreProvider } from "@/components/StoreProvider";
import { Toaster } from "@/components/ui/sonner";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HubConnect - Eduvos Incubator App",
  description:
    "HubConnect is a platform that connects students in the Eduvos Incubator ecosystem. Allowing for the buying and selling of products and services, as well as the sharing of ideas and collaboration on projects.",
};

function NavbarFallback() {
  return (
    <header className="w-full bg-navy text-white">
      <MaxWidthWrapper className="flex h-16 items-center px-4">
        <span className="text-lg font-semibold tracking-tight">HubConnect</span>
      </MaxWidthWrapper>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>
          {children}
        </StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
