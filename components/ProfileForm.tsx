"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/format";
import { updateProfile } from "@/app/(main)/settings/profile/actions";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export function ProfileForm({
  userId,
  email,
  initial,
}: {
  userId: string;
  email: string;
  initial: {
    fullName: string;
    username: string;
    bio: string;
    avatarUrl: string | null;
  };
}) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = React.useState(initial.fullName);
  const [username, setUsername] = React.useState(initial.username);
  const [bio, setBio] = React.useState(initial.bio);
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

    setPending(true);

    let avatar: "keep" | "remove" | "uploaded" = removeAvatar
      ? "remove"
      : "keep";

    if (avatarFile) {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
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
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          {shownAvatar && <AvatarImage src={shownAvatar} alt="Your photo" />}
          <AvatarFallback className="text-lg">
            {initialsOf(fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-wrap gap-2">
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full-name">Full name</Label>
        <Input
          id="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          required
        />
        <p className="text-xs text-muted-foreground">
          This is public. Pick a nickname, not your student number.
        </p>
        <p className="text-xs text-muted-foreground">
          Letters, numbers and underscores. Changing it changes your profile
          link.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          Your email can&apos;t be changed here.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
