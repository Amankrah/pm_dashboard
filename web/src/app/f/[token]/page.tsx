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
    <div className="min-h-screen bg-[#edf1f7]">
      <FormHeader periodLabel={invite.period.label} />
      <PillarDefinitions />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <MappingForm
          token={token}
          periodLabel={invite.period.label}
          prefill={{
            email: invite.email,
            fullName: invite.fullName,
            faculty: invite.faculty,
          }}
        />
      </div>
    </div>
  );
}

function FormMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf1f7] p-6">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-xl font-bold text-[#1e3a5f]">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{body}</p>
      </div>
    </div>
  );
}
