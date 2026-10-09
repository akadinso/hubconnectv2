import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Protected Page</h1>

      <p className="mt-4">Welcome, {user.email}</p>
    </main>
  );
}
