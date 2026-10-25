"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/format";
import { updateProfile } from "@/app/(main)/settings/profile/actions";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ProfileForm({
  userId,
  email,
  campuses,
  initial,
}: {
  userId: string;
  email: string;
  campuses: { id: string; name: string }[];
  initial: {
    fullName: string;
    username: string;
    bio: string;
    avatarUrl: string | null;
    campusId: string;
  };
}) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = React.useState(initial.fullName);
  const [username, setUsername] = React.useState(initial.username);
  const [bio, setBio] = React.useState(initial.bio);
  const [campusId, setCampusId] = React.useState(initial.campusId);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const shownAvatar = removeAvatar ? null : (preview ?? initial.avatarUrl);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
    setRemoveAvatar(false);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const handle = username.trim().toLowerCase();
    if (fullName.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!USERNAME_RE.test(handle)) {
      setError(
        "Username must be 3 to 20 characters: letters, numbers or underscores.",
      );
      return;
    }
    if (!campusId) {
      setError("Choose your campus.");
      return;
    }

    setPending(true);

    let avatar: "keep" | "remove" | "uploaded" = removeAvatar
      ? "remove"
      : "keep";

    if (avatarFile) {
      const { error: uploadError } = await createClient()
        .storage.from("avatars")
        .upload(`${userId}/avatar`, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        });

      if (uploadError) {
        setError(uploadError.message);
        setPending(false);
        return;
      }
      avatar = "uploaded";
    }

    const result = await updateProfile({
      fullName,
      username: handle,
      bio,
      campusId,
      avatar,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success("Profile updated");
    router.push(`/profile/${result.username}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Photo */}
        <section className="flex flex-col items-center justify-center gap-4 rounded-xl border p-6 text-center">
          <Avatar className="size-32">
            {shownAvatar && <AvatarImage src={shownAvatar} alt="Your photo" />}
            <AvatarFallback className="text-3xl">
              {initialsOf(fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 max-w-full space-y-0.5">
            <p className="truncate font-semibold">
              {fullName.trim() || "Your name"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              @{username.trim().toLowerCase() || "username"}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              Change photo
            </Button>
            {shownAvatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setRemoveAvatar(true);
                  setAvatarFile(null);
                  setPreview(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP, up to 2MB.
          </p>
        </section>

        {/* Details */}
        <section className="space-y-5 rounded-xl border p-6">
          <div className="space-y-1">
            <h2 className="font-semibold">Personal details</h2>
            <p className="text-sm text-muted-foreground">
              This is what other students see.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full-name">
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={60}
                required
              />
            </Field>

            <Field
              label="Username"
              htmlFor="username"
              hint="Public. Pick a nickname, not your student number."
            >
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                required
              />
            </Field>

            <Field
              label="Email"
              htmlFor="email"
              hint="Your email can't be changed here."
            >
              <Input id="email" value={email} disabled />
            </Field>

            <Field
              label="Campus"
              htmlFor="campus"
              hint="Past orders keep the campus they were made at."
            >
              <select
                id="campus"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Choose your campus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Bio" htmlFor="bio" className="sm:col-span-2">
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Tell people what you sell or what you're building"
              />
              <p className="text-right text-xs text-muted-foreground">
                {bio.length}/300
              </p>
            </Field>
          </div>
        </section>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
