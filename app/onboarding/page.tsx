import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // 2. Fetch profile onboarding and role status
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarded, role")
    .eq("id", user.id)
    .maybeSingle();

  // 3. If already onboarded, redirect user based on role or to home page
  if (profile?.onboarded) {
    if (profile.role === "seller" || profile.role === "admin") {
      redirect("/seller");
    }
    redirect("/");
  }

  // Fallback to email metadata or user email prefix if profile full_name is empty
  const defaultName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50/50 p-4 sm:p-6">
      <OnboardingForm userId={user.id} defaultName={defaultName} />
    </main>
  );
}
