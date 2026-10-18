"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Eduvos Domain Check
    if (!email.toLowerCase().endsWith("@vossie.net")) {
      setError("Must be a valid Eduvos student email ending in @vossie.net");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during registration.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50/50",
        className,
      )}
      {...props}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Logo Banner */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/logo.png"
            alt="HubConnect Logo"
            width={160}
            height={50}
            priority
          />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-4">
            Create your account
          </h2>
          <p className="text-xs text-slate-500">
            Login with your Eduvos student account
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSignUp}
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
            <p className="text-[10px] text-slate-400">
              Must be a valid Eduvos student email
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-slate-900"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="repeat-password"
              className="text-xs font-semibold text-slate-900"
            >
              Confirm Password
            </Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl bg-[#11223f] h-10 text-xs font-medium text-white hover:bg-[#11223f]/90"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-[10px] text-center text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>

          <div className="text-center text-xs text-slate-500 pt-1">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
