import { BrandLockup } from "@/components/brand/Brand";
import { MappingForm } from "@/components/MappingForm";
import { FormHeader } from "@/components/form/FormHeader";
import { PillarDefinitions } from "@/components/form/PillarDefinitions";
import { prisma } from "@/lib/db";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.formInvite.findUnique({
    where: { token },
    include: { period: true, submission: true },
  });

  if (!invite) {
    return <FormMessage title="Link not found" body="This invite link is invalid." />;
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return (
      <FormMessage
        title="Link expired"
        body="Please contact ebenezer.kwofie@mcgill.ca for a new link."
      />
    );
  }

  if (invite.submittedAt || invite.submission) {
    return (
      <FormMessage
        title="Already submitted"
        body="This form has already been completed. Contact ebenezer.kwofie@mcgill.ca if you need to make changes."
      />
    );
  }

  if (invite.period.status === "closed") {
    return (
      <FormMessage
        title="Reporting period closed"
        body={`${invite.period.label} is no longer accepting submissions.`}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#edf1f7]">
      <FormHeader
        periodLabel={invite.period.label}
        reportKey={invite.period.reportKey}
      />
      <PillarDefinitions />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <MappingForm
          token={token}
          periodLabel={invite.period.label}
          prefill={{
            email: invite.email,
            fullName: invite.fullName,
            faculty: invite.faculty,
          }}
        />
      </main>
      <FormFooter />
    </div>
  );
}

function FormFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between">
        <BrandLockup variant="light" height={28} />
        <p className="text-center text-[13px] leading-relaxed text-slate-500 sm:text-right">
          Nkabom Collaborative · Academic Lead Office, McGill University
          <br />
          Questions? Contact{" "}
          <a
            className="font-semibold text-[#1e3a5f] underline-offset-2 hover:underline"
            href="mailto:ebenezer.kwofie@mcgill.ca"
          >
            ebenezer.kwofie@mcgill.ca
          </a>
        </p>
      </div>
    </footer>
  );
}

function FormMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf1f7] p-6">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-md ring-1 ring-slate-200">
        <div className="mx-auto mb-5">
          <BrandLockup variant="light" height={28} className="justify-center" />
        </div>
        <h1 className="text-xl font-bold text-[#1e3a5f]">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{body}</p>
      </div>
    </div>
  );
}
