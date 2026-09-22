'use client';

import { useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import {
  matchesSegment,
  SEGMENT_FIELDS,
  SEGMENT_OPERATORS,
  type SegmentDefinition,
  type SegmentField,
  type SegmentOperator,
  type SubscriberProjection,
} from '@communitydirect/core';
import { createSegment, type SegmentActionState } from '@/app/actions/segments';
import { SubmitButton } from './SubmitButton';

interface RuleRow {
  field: SegmentField;
  operator: SegmentOperator;
  values: string;
}

const initial: SegmentActionState = {};
const FIELD_LABELS: Record<SegmentField, string> = {
  language: 'Language',
  channel: 'Channel',
  location: 'Location',
  tag: 'Tag',
  signup_source: 'Signup source',
};
const OP_LABELS: Record<SegmentOperator, string> = {
  eq: 'is',
  in: 'is any of',
  contains: 'contains',
  exists: 'is set',
};

export function SegmentBuilder({ projections }: { projections: SubscriberProjection[] }) {
  const [state, formAction] = useFormState(createSegment, initial);
  const [match, setMatch] = useState<'all' | 'any'>('all');
  const [rows, setRows] = useState<RuleRow[]>([{ field: 'language', operator: 'eq', values: '' }]);

  const def = useMemo<SegmentDefinition>(
    () => ({
      match,
      rules: rows
        .filter((r) => r.operator === 'exists' || r.values.trim().length > 0)
        .map((r) => ({
          field: r.field,
          operator: r.operator,
          values: r.values
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        })),
    }),
    [match, rows],
  );

  const reach = useMemo(
    () => projections.filter((p) => matchesSegment(def, p)).length,
    [def, projections],
  );

  const update = (i: number, patch: Partial<RuleRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { field: 'language', operator: 'eq', values: '' }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="Segment name (e.g. Arabic speakers in Haifa)"
          className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-ink-500">
          Match
          <select
            name="match"
            value={match}
            onChange={(e) => setMatch(e.target.value as 'all' | 'any')}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="all">all rules (AND)</option>
            <option value="any">any rule (OR)</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              name="rule_field"
              value={row.field}
              onChange={(e) => update(i, { field: e.target.value as SegmentField })}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              {SEGMENT_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABELS[f]}
                </option>
              ))}
            </select>
            <select
              name="rule_operator"
              value={row.operator}
              onChange={(e) => update(i, { operator: e.target.value as SegmentOperator })}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              {SEGMENT_OPERATORS.map((o) => (
                <option key={o} value={o}>
                  {OP_LABELS[o]}
                </option>
              ))}
            </select>
            <input
              name="rule_values"
              value={row.values}
              onChange={(e) => update(i, { values: e.target.value })}
              disabled={row.operator === 'exists'}
              placeholder={row.operator === 'in' ? 'comma,separated,values' : 'value'}
              className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-lg border border-slate-300 px-2 py-2 text-xs text-ink-500 hover:bg-slate-100"
              aria-label="Remove rule"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-ink-700 hover:bg-slate-50"
        >
          + Add rule
        </button>
      </div>

      <p className="text-sm text-ink-700">
        Estimated reach: <span className="font-semibold text-brand-700">{reach.toLocaleString()}</span>{' '}
        <span className="text-ink-500">active subscriber{reach === 1 ? '' : 's'}</span>
      </p>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-600">Segment saved.</p> : null}

      <div className="w-44">
        <SubmitButton label="Save segment" pendingLabel="Saving…" />
      </div>
    </form>
  );
}
