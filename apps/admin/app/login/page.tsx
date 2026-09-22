import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <Link href="/" className="text-lg font-bold text-brand-600">
          CommunityDirect
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Sign in to your admin workspace.</p>
      </div>
      <AuthForm mode="signin" />
    </main>
  );
}
