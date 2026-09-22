'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { signIn, signUp, type AuthActionState } from '@/app/actions/auth';
import { SubmitButton } from './SubmitButton';

const initial: AuthActionState = {};

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction] = useFormState(action, initial);
  const isSignIn = mode === 'signin';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-700">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-700">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignIn ? 'current-password' : 'new-password'}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <SubmitButton label={isSignIn ? 'Sign in' : 'Create account'} />

      <p className="text-center text-sm text-ink-500">
        {isSignIn ? (
          <>
            No account?{' '}
            <Link href="/signup" className="text-brand-600 hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
