'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import {
  getDirection,
  LOCALE_LABELS,
  matchesSegment,
  notificationPreview,
  SUPPORTED_LOCALES,
  type Locale,
  type SegmentDefinition,
  type SegmentField,
  type SegmentOperator,
  type SubscriberProjection,
} from '@communitydirect/core';
import { composeMessage, type ComposerActionState } from '@/app/actions/messages';
import { MessagePreview } from './MessagePreview';

interface ChannelOption {
  id: string;
  name: string;
  is_default: boolean;
}
interface SegmentOption {
  id: string;
  name: string;
  match_mode: 'all' | 'any';
  rules: { field: string; operator: string; values: string[] }[];
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const initial: ComposerActionState = {};

export function MessageComposer({
  appName,
  defaultLocale,
  channels,
  segments,
  projections,
  canSend,
}: {
  appName: string;
  defaultLocale: Locale;
  channels: ChannelOption[];
  segments: SegmentOption[];
  projections: SubscriberProjection[];
  canSend: boolean;
}) {
  const [state, formAction] = useFormState(composeMessage, initial);

  const [titles, setTitles] = useState<Record<string, string>>({});
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [previewLocale, setPreviewLocale] = useState<Locale>(defaultLocale);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    channels.filter((c) => c.is_default).map((c) => c.id),
  );
  const [segmentId, setSegmentId] = useState('');
  const [scheduleKind, setScheduleKind] = useState<'now' | 'at' | 'recurring'>('now');
  const [recurringKind, setRecurringKind] = useState<'daily' | 'weekly'>('daily');
  const [timeZone, setTimeZone] = useState('UTC');

  useEffect(() => {
    try {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } catch {
      setTimeZone('UTC');
    }
  }, []);

  const segmentDef = useMemo<SegmentDefinition | null>(() => {
    const seg = segments.find((s) => s.id === segmentId);
    if (!seg) return null;
    return {
      match: seg.match_mode,
      rules: seg.rules.map((r) => ({
        field: r.field as SegmentField,
        operator: r.operator as SegmentOperator,
        values: r.values,
      })),
    };
  }, [segmentId, segments]);

  const reach = useMemo(() => {
    if (selectedChannels.length === 0) return 0;
    return projections.filter(
      (p) =>
        p.channelIds.some((c) => selectedChannels.includes(c)) &&
        (segmentDef == null || matchesSegment(segmentDef, p)),
    ).length;
  }, [projections, selectedChannels, segmentDef]);

  const toggleChannel = (id: string) =>
    setSelectedChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const previewBody = bodies[previewLocale]
    ? notificationPreview({ locale: previewLocale, title: titles[previewLocale] ?? '', body: bodies[previewLocale] ?? '' })
    : '';

  return (
    <form action={formAction} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="timeZone" value={timeZone} />
      <input type="hidden" name="scheduleKind" value={scheduleKind} />
      <input type="hidden" name="recurringKind" value={recurringKind} />

      <div className="flex flex-col gap-6">
        {/* Language variants */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Content</h2>
            <label className="flex items-center gap-2 text-xs text-ink-500">
              Default language
              <select
                name="defaultLocale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
              >
                {SUPPORTED_LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l].english}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-4">
            {SUPPORTED_LOCALES.map((l) => (
              <div key={l} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-medium text-ink-500">
                  {LOCALE_LABELS[l].native} · {LOCALE_LABELS[l].english}
                  {l === locale ? ' (default)' : ''}
                </p>
                <input
                  name={`title_${l}`}
                  dir={getDirection(l)}
                  maxLength={120}
                  placeholder="Title"
                  value={titles[l] ?? ''}
                  onChange={(e) => setTitles((prev) => ({ ...prev, [l]: e.target.value }))}
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  name={`body_${l}`}
                  dir={getDirection(l)}
                  maxLength={4000}
                  rows={3}
                  placeholder="Message"
                  value={bodies[l] ?? ''}
                  onChange={(e) => setBodies((prev) => ({ ...prev, [l]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
            <input
              name="linkUrl"
              type="url"
              placeholder="Optional link (https://…)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* Audience */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Audience</h2>
          <p className="mb-2 text-xs font-medium text-ink-500">Channels</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {channels.length === 0 ? (
              <p className="text-sm text-ink-500">Create a channel first.</p>
            ) : (
              channels.map((c) => (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                    selectedChannels.includes(c.id)
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-300 text-ink-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="channelIds"
                    value={c.id}
                    checked={selectedChannels.includes(c.id)}
                    onChange={() => toggleChannel(c.id)}
                    className="sr-only"
                  />
                  {c.name}
                </label>
              ))
            )}
          </div>
          <label className="block text-xs font-medium text-ink-500">
            Segment (optional)
            <select
              name="segmentId"
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All subscribers of the selected channels</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-sm text-ink-700">
            Estimated reach: <span className="font-semibold text-brand-700">{reach.toLocaleString()}</span>{' '}
            <span className="text-ink-500">subscriber{reach === 1 ? '' : 's'}</span>
          </p>
        </section>

        {/* Schedule */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Schedule</h2>
          <div className="flex flex-wrap gap-2">
            {(['now', 'at', 'recurring'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setScheduleKind(k)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  scheduleKind === k
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-300 text-ink-700'
                }`}
              >
                {k === 'now' ? 'Send now' : k === 'at' ? 'Schedule for later' : 'Recurring'}
              </button>
            ))}
          </div>

          {scheduleKind === 'at' ? (
            <div className="mt-3">
              <input
                name="scheduleAt"
                type="datetime-local"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-ink-500">Time zone: {timeZone} (stored in UTC).</p>
            </div>
          ) : null}

          {scheduleKind === 'recurring' ? (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-xs font-medium text-ink-500">
                Frequency
                <select
                  value={recurringKind}
                  onChange={(e) => setRecurringKind(e.target.value as 'daily' | 'weekly')}
                  className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              {recurringKind === 'weekly' ? (
                <label className="text-xs font-medium text-ink-500">
                  Day
                  <select
                    name="recurringWeekday"
                    defaultValue="1"
                    className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {WEEKDAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="text-xs font-medium text-ink-500">
                Time
                <input
                  name="recurringTime"
                  type="time"
                  defaultValue="09:00"
                  className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <p className="w-full text-xs text-ink-500">Time zone: {timeZone} (DST-correct).</p>
            </div>
          ) : null}
        </section>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.status ? <p className="text-sm text-green-600">{state.status}</p> : null}
        {state.testPayload ? (
          <p className="text-sm text-ink-700">
            Test payload verified — <span className="font-semibold">{state.testPayload.title}</span>:{' '}
            {state.testPayload.body}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="intent"
            value="draft"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-100"
          >
            Save draft
          </button>
          <button
            type="submit"
            name="intent"
            value="test"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-100"
          >
            Send test (dry run)
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {scheduleKind === 'now' ? 'Send now' : 'Schedule'}
          </button>
        </div>
        {!canSend ? (
          <p className="text-xs text-ink-500">
            Your role can draft messages; sending requires an owner or admin.
          </p>
        ) : null}
      </div>

      {/* Live preview */}
      <aside className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Preview</h2>
          <select
            value={previewLocale}
            onChange={(e) => setPreviewLocale(e.target.value as Locale)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
            aria-label="Preview language"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l].native}
              </option>
            ))}
          </select>
        </div>
        <MessagePreview
          appName={appName}
          title={titles[previewLocale] ?? ''}
          body={previewBody}
          locale={previewLocale}
        />
        <p className="text-xs text-ink-500">
          This is exactly what a subscriber whose language is {LOCALE_LABELS[previewLocale].english} will
          see on their lock screen.
        </p>
      </aside>
    </form>
  );
}
