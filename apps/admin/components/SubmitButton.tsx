'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? (pendingLabel ?? 'Working…') : label}
    </button>
  );
}
