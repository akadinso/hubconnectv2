"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function OnboardingForm({
  userId,
  defaultName,
  defaultUsername,
  defaultCampusId,
  campuses,
}: {
  userId: string;
  defaultName: string;
  defaultUsername: string;
  defaultCampusId: string;
  campuses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(defaultName);
  const [username, setUsername] = useState(defaultUsername);
  const [campusId, setCampusId] = useState(defaultCampusId);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    let avatarUrl: string | null = null;

    if (avatarFile) {
      const path = `${userId}/avatar`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        });

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        campus_id: campusId,
        ...(avatarUrl && { avatar_url: avatarUrl }),
        onboarded: true,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      setError(
        profileError.code === "23505"
          ? "That username is already taken."
          : profileError.message,
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const canContinue =
    fullName.trim().length > 1 && username.trim().length > 2 && !!campusId;

  return (
    <Card className="p-10">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome To HubConnect</CardTitle>
        <CardDescription>Step {step} of 2</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is public. Pick a nickname, not your student number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campus">Your campus</Label>
              <select
                id="campus"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className={selectClass}
              >
                <option value="">Choose your campus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                We use this to show you items near you and to record where
                orders happen.
              </p>
            </div>

            <Button
              className="w-full"
              disabled={!canContinue}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                {avatarPreview && (
                  <AvatarImage src={avatarPreview} alt="Preview" />
                )}
                <AvatarFallback className="text-xl">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 text-center">
                <Label htmlFor="avatar" className="text-sm font-medium">
                  Profile photo (optional)
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : avatarFile
                    ? "Finish"
                    : "Skip & finish"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
