"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Finish() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashError = hash.get("error_description");
    return hashError ? hashError.replace(/\+/g, " ") : null;
  });

  useEffect(() => {
    const raw = params.get("next") ?? "/";
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const hashError = hash.get("error_description");
    if (hashError) {
      return;
    }

    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            setMessage(error.message);
            return;
          }
          router.replace(next);
          router.refresh();
        });
      return;
    }

    // No tokens anywhere. They may already be signed in (link opened twice).
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(next);
        router.refresh();
      } else {
        setMessage(
          "This confirmation link is missing its token or has expired.",
        );
      }
    });
  }, [params, router]);

  if (!message) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Confirming your email...
      </p>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Couldn't confirm your email</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Your email may already be confirmed (some mail apps open links
          automatically). Try signing in first.
        </p>
        <Link href="/auth/login">
          <Button className="w-full">Go to sign in</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function FinishPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Suspense fallback={null}>
        <Finish />
      </Suspense>
    </div>
  );
}
