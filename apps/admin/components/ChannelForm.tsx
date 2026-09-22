'use client';

import { useFormState } from 'react-dom';
import { createChannel, type ChannelActionState } from '@/app/actions/channels';
import { SubmitButton } from './SubmitButton';

const initial: ChannelActionState = {};

export function ChannelForm() {
  const [state, formAction] = useFormState(createChannel, initial);
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-ink-900">New channel</p>
      <input
        name="name"
        required
        maxLength={80}
        placeholder="e.g. Youth, Events, Emergency"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="description"
        maxLength={500}
        placeholder="Optional description"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-600">Channel created.</p> : null}
      <div className="w-40">
        <SubmitButton label="Create channel" pendingLabel="Creating…" />
      </div>
    </form>
  );
}
