import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Nkabom Collaborative
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1e3a5f]">Dashboard sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access is limited to allowlisted McGill emails.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
