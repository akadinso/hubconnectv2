import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding-form";
import Image from "next/image";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: campuses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarded, full_name, username, campus_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("campuses")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  // Done only once there's a campus too. Existing users come back through here once.
  if (profile?.onboarded && profile?.campus_id) redirect("/");

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md flex flex-col gap-20 items-center">
        <Image
          src={"/logo-dark.png"}
          alt="HubConnect Logo"
          width={400}
          height={300}
        />
        <OnboardingForm
          userId={user.id}
          defaultName={
            profile?.full_name ?? user.user_metadata?.full_name ?? ""
          }
          defaultUsername={profile?.username ?? ""}
          defaultCampusId={profile?.campus_id ?? ""}
          campuses={campuses ?? []}
        />
      </div>
    </div>
  );
}
