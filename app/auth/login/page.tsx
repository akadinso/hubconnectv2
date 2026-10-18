import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center">
      <div className="w-full max-w-full">
        <LoginForm />
      </div>
    </div>
  );
}
