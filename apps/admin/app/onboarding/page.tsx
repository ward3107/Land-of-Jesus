import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/OnboardingForm';
import { requireUser } from '@/lib/auth';
import { getCurrentOrganization } from '@/lib/org';

export default async function OnboardingPage() {
  await requireUser('/onboarding');
  const current = await getCurrentOrganization();
  if (current) redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Get started</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">Create your organization</h1>
        <p className="mt-1 text-sm text-ink-500">
          This becomes your workspace. We’ll create a default “Announcements” channel so you can
          send right away.
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
