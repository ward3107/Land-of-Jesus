'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { slugify, LOCALE_LABELS, SUPPORTED_LOCALES } from '@communitydirect/core';
import { createOrganization, type OnboardingState } from '@/app/actions/organizations';
import { SubmitButton } from './SubmitButton';

const initial: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction] = useFormState(createOrganization, initial);
  const [name, setName] = useState('');
  const preview = slugify(name);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-700">Organization name</span>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Father George Parish"
        />
        {preview ? (
          <span className="text-xs text-ink-500">
            Public handle: <span className="font-mono">communitydirect.app/o/{preview}</span>
          </span>
        ) : name ? (
          <span className="text-xs text-amber-600">
            Couldn’t derive a handle — set one below.
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-700">Handle (optional)</span>
        <input
          name="slug"
          className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
          placeholder={preview || 'my-org'}
          pattern="[a-z0-9][a-z0-9-]{1,60}"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-700">Category</span>
          <input name="category" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Community" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-700">Country</span>
          <input
            name="country"
            maxLength={2}
            className="rounded-lg border border-slate-300 px-3 py-2 uppercase"
            placeholder="IL"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-700">Default language</span>
        <select name="defaultLocale" defaultValue="en" className="rounded-lg border border-slate-300 px-3 py-2">
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l].native} ({LOCALE_LABELS[l].english})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink-700">Description (optional)</span>
        <textarea
          name="description"
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="What is this organization about?"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <SubmitButton label="Create organization" pendingLabel="Creating…" />
    </form>
  );
}
