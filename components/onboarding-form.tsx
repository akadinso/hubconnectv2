"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Camera, MapPin, Truck, Hand } from "lucide-react";
import Image from "next/image";

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

  const isUsernameValid = /^[a-z0-9_]{3,20}$/.test(username);
  const canContinue = fullName.trim().length >= 2 && isUsernameValid;

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

  async function handleStartSelling() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName.trim() || defaultName,
        role: "buyer",
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      console.error("Profile update error:", profileError.message);
    }

    router.push("/seller/onboarding");
    router.refresh();
  }

  async function handleSaveDetails() {
    if (!canContinue) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        username: username.trim(),
        role: "buyer",
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    setLoading(false);

    if (profileError) {
      setError(
        profileError.code === "23505"
          ? "That username is already taken."
          : profileError.message,
      );
      return;
    }

    setStep(3);
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
        username: username.trim(),
        ...(avatarUrl && { avatar_url: avatarUrl }),
        role: "buyer",
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
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

  const sellerTips = [
    {
      icon: Clock,
      title: "Reply quickly",
      description:
        "Buyers are far more likely to follow through when a seller responds fast",
    },
    {
      icon: Truck,
      title: "Plan how you'll deliver",
      description:
        "You're responsible for getting the item to the buyer – on campus or via courier. Decide this before you list",
    },
    {
      icon: Camera,
      title: "Be clear and honest",
      description:
        "Good photos and an accurate description build your rating from day one",
    },
    {
      icon: MapPin,
      title: "Meet somewhere safe",
      description:
        "Public, on-campus spots are best for any in-person exchange or via campus courier lockers",
    },
  ];

  const paymentSteps = [
    {
      step: "1",
      title: "The buyer pays HubConnect",
      description:
        "They pay the listed price (They meet) or the offer you accepted.",
    },
    {
      step: "2",
      title: "We hold the payment",
      description:
        'You\'ll see "Paid / Held" on the order – safe to arrange the handover.',
    },
    {
      step: "3",
      title: "Hand over the item",
      description: "Meet on campus or send it by courier.",
    },
    {
      step: "4",
      title: "Get the code, get paid",
      description:
        "Enter the buyer's 4-digit handover code and your payment is released.",
    },
  ];

  return (
    <Card className="mx-auto max-w-full border-none bg-slate-50/50 p-4 shadow-none sm:p-6">
      {step === 1 && (
        <CardContent className="space-y-6 p-0">
          <div className="text-center space-y-1.5">
            <div className="flex justify-center text-amber-500 pb-1">
              <Hand className="size-8 rotate-[15deg] fill-amber-400 text-amber-500" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome to selling on HubConnect
            </CardTitle>
            <p className="text-md text-slate-500 max-w-md mx-auto">
              Before your first listing goes live, here&apos;s what helps buyers
              trust you from the start
            </p>
          </div>

          <div className="space-y-3">
            {sellerTips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 rounded-2xl bg-white p-3.5 shadow-xs border border-slate-100"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-md font-bold text-slate-900">
                      {tip.title}
                    </h4>
                    <p className="text-[11px] leading-normal text-slate-500">
                      {tip.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <h3 className="text-md font-bold text-slate-900">
              What you get as a seller
            </h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-xs space-y-1">
                <h4 className="text-md font-bold text-slate-900">
                  Free while we launch
                </h4>
                <p className="text-xs leading-normal text-slate-500">
                  No listing fees during the trial. Any future fees will be
                  announced well in advance.
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-xs space-y-1">
                <h4 className="text-md font-bold text-slate-900">
                  Clear posting rules
                </h4>
                <p className="text-xs leading-normal text-slate-500">
                  Post and edit listings any time. Listing limit: [to confirm
                  with the team].
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-xs space-y-1">
                <h4 className="text-md font-bold text-slate-900">
                  Seen across campus
                </h4>
                <p className="text-xs leading-normal text-slate-500">
                  Featured in our launch campaign, on posters and at on-campus
                  pop-ups – we bring the buyers.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 space-y-3">
            <h4 className="text-md font-bold text-slate-900">
              How you get paid
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {paymentSteps.map((item) => (
                <div key={item.step} className="space-y-1">
                  <div className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-md font-bold text-white">
                    {item.step}
                  </div>
                  <h5 className="text-md font-bold text-slate-900 leading-tight">
                    {item.title}
                  </h5>
                  <p className="text-xs leading-tight text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              className="w-full rounded-xl bg-[#11223f] py-6 text-xs font-medium text-white hover:bg-[#11223f]/90"
              onClick={handleStartSelling}
              disabled={loading}
            >
              {loading ? "Redirecting..." : "Got It - create my first listing"}
            </Button>
            <button
              type="button"
              className="w-full py-1 text-center text-xs font-medium text-slate-400 hover:text-slate-600"
              onClick={() => setStep(2)}
            >
              Skip for now
            </button>
          </div>
        </CardContent>
      )}

      {step === 2 && (
        <CardContent className="space-y-5 rounded-2xl bg-white p-6 border border-slate-100 shadow-xs max-w-xl mx-auto">
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-2 text-center pb-2">
            <Image
              src="/logo-dark.png"
              alt="HubConnect Logo"
              width={140}
              height={45}
              priority
            />
            <CardTitle className="text-lg font-bold text-slate-900 mt-2">
              Set up your profile
            </CardTitle>
            <p className="text-xs text-slate-500">
              This is how other students will see you
            </p>
          </div>

          {/* Avatar Upload Placeholder */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="size-20 border-2 border-slate-100">
                {avatarPreview && (
                  <AvatarImage src={avatarPreview} alt="Preview" />
                )}
                <AvatarFallback className="text-lg font-bold bg-amber-100 text-amber-800">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex size-6 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-xs hover:bg-slate-800"
              >
                <Camera className="size-3.5" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Upload a profile photo
            </span>
          </div>

          {/* Inputs */}
          <div className="space-y-1.5">
            <Label
              htmlFor="full-name"
              className="text-xs font-semibold text-slate-900"
            >
              Full Name
            </Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Thabo Mokoena"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="text-xs font-semibold text-slate-900"
            >
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                const sanitized = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "");
                setUsername(sanitized);
              }}
              placeholder="thabo_m"
              maxLength={20}
              className="h-10 text-xs"
            />
            <p className="text-[10px] text-slate-400">
              3–20 characters. Lowercase letters, numbers, and underscores only.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="bio"
              className="text-xs font-semibold text-slate-900"
            >
              Short Bio{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="bio"
              placeholder="Tell buyers a bit about yourself..."
              className="h-10 text-xs"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          {/* Action Button */}
          <Button
            className="w-full rounded-xl bg-[#11223f] h-10 text-xs font-medium text-white hover:bg-[#11223f]/90 mt-2"
            disabled={!canContinue || loading}
            onClick={handleSaveDetails}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </CardContent>
      )}

      {step === 3 && (
        <CardContent className="space-y-6 rounded-2xl bg-white p-6 border border-slate-100 shadow-xs">
          <CardHeader className="p-0 space-y-1 text-center">
            <CardTitle className="text-lg font-bold">
              Add Profile Photo
            </CardTitle>
            <p className="text-xs text-slate-500">
              Listings with real profile pictures build higher trust with
              buyers.
            </p>
          </CardHeader>

          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-24 border">
              {avatarPreview && (
                <AvatarImage src={avatarPreview} alt="Preview" />
              )}
              <AvatarFallback className="text-xl font-bold bg-slate-100">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="w-full space-y-2 text-center">
              <Label htmlFor="avatar" className="text-xs font-medium">
                Upload image (optional)
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-xs"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setStep(2)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              className="flex-1 text-xs bg-[#11223f] text-white hover:bg-[#11223f]/90"
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? "Saving..." : avatarFile ? "Finish" : "Skip & finish"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
