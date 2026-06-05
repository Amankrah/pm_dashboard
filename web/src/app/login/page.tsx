import { Suspense } from "react";
import { BrandLockup } from "@/components/brand/Brand";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf1f7] p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLockup variant="light" height={36} />
        </div>
        <div className="rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-200">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Nkabom Collaborative
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#1e3a5f]">
              Dashboard sign in
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Access is limited to allowlisted McGill emails.
            </p>
          </div>
          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-500">
          Academic Lead Office · McGill University
        </p>
      </div>
    </div>
  );
}
