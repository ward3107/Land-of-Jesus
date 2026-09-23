'use client';

import { useFormState } from 'react-dom';
import { requestVerification, type VerificationState } from '@/app/actions/organizations';
import { SubmitButton } from './SubmitButton';

const initial: VerificationState = {};

export function VerificationRequest() {
  const [state, formAction] = useFormState(requestVerification, initial);
  return (
    <form action={formAction} className="mt-3">
      <p className="mb-2 text-sm text-ink-500">
        Verification adds a trust badge to your public profile. A platform reviewer will follow up.
      </p>
      {state.error ? <p className="mb-2 text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? (
        <p className="mb-2 text-sm text-green-600">Verification requested — status is now pending.</p>
      ) : null}
      <div className="w-52">
        <SubmitButton label="Request verification" pendingLabel="Requesting…" />
      </div>
    </form>
  );
}
