"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Eduvos Email Validation
    if (!email.toLowerCase().endsWith("@vossie.net")) {
      setError(
        "Only verified @vossie.net Eduvos student emails can access HubConnect.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const next = new URLSearchParams(window.location.search).get("next");
      router.push(safeNextPath(next, "/"));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during sign in.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("grid min-h-screen grid-cols-1 lg:grid-cols-12", className)}
      {...props}
    >
      {/* Left Branding Hero Column */}
      <div className="relative hidden flex-col justify-between bg-[#11223f] p-12 text-white lg:flex lg:col-span-5">
        <div className="space-y-6">
          <div className="relative size-20 overflow-hidden rounded-full border-2 border-white/20">
            <Image
              src="/avatar-testimonial.png"
              alt="Student Seller"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Build. Sell. <br />
              <span className="italic font-serif text-amber-300">
                Grow on campus.
              </span>
            </h1>
            <p className="text-sm text-slate-300 italic pt-2">
              &quot;I sold my first bracelets to classmates within a week.&quot;
            </p>
            <p className="text-xs text-slate-400 font-medium">
              — Thando, 2nd-year student seller
            </p>
          </div>
        </div>

        {/* Decorative Graphic Lines */}
        <div className="space-y-2 opacity-30">
          <div className="h-1 w-16 bg-amber-300 rounded-full" />
          <div className="h-1 w-24 bg-amber-300 rounded-full" />
          <div className="h-1 w-12 bg-amber-300 rounded-full" />
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="flex flex-col items-center justify-center p-6 lg:col-span-7 bg-slate-50/50">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Image
              src="/logo.png"
              alt="HubConnect Logo"
              width={160}
              height={50}
              priority
            />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-4">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500">
              Login with your Eduvos student account
            </p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleLogin}
            className="rounded-2xl bg-white p-6 shadow-xs border border-slate-100 space-y-4"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold text-slate-900"
              >
                Eduvos Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="studentnumber@vossie.net"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-900"
                >
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-medium text-slate-500 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
              <ShieldCheck className="size-3.5 shrink-0 text-slate-400" />
              <span>
                Only verified @vossie.net emails can access HubConnect
              </span>
            </div>

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl bg-[#11223f] h-10 text-xs font-medium text-white hover:bg-[#11223f]/90"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center text-xs text-slate-500 pt-2">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-slate-900 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
