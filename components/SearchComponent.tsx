"use client";

import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function SearchComponent() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  return (
    <Form action="/marketplace" role="search" className="w-full">
      <Field orientation="horizontal">
        <Input
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search listings..."
          aria-label="Search listings"
        />
      </Field>
    </Form>
  );
}
