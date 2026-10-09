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

export function OnboardingForm({
  userId,
  defaultName,
}: {
  userId: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(defaultName);
  const [username, setUsername] = useState("");
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
      // Cache-bust so a replaced avatar shows up immediately
      avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      ...(avatarUrl && { avatar_url: avatarUrl }),
      onboarded: true,
      updated_at: new Date().toISOString(),
    });

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

  const canContinue = fullName.trim().length > 1 && username.trim().length > 2;

  return (
    <Card>
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
