import type { Tables } from '@communitydirect/core';
import { getCurrentOrganization } from '@/lib/org';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { qrSvg } from '@/lib/qr';
import { VerificationRequest } from '@/components/VerificationRequest';

const VERIFICATION_STYLES: Record<string, string> = {
  UNVERIFIED: 'bg-slate-100 text-ink-600',
  PENDING: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://communitydirect.app';

export default async function SettingsPage() {
  const current = await getCurrentOrganization();
  if (!current) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('join_links')
    .select('*')
    .eq('organization_id', current.organization.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const link = (data?.[0] ?? null) as Tables<'join_links'> | null;
  const joinUrl = link ? `${APP_URL}/join/${link.code}` : null;
  const qr = joinUrl ? await qrSvg(joinUrl) : null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">Organization settings</h1>
      <p className="mb-6 text-sm text-ink-500">
        Share your join link so people can follow you directly — “continue receiving my messages
        without WhatsApp interruptions.”
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-ink-900">{current.organization.name}</p>
        <p className="text-xs text-ink-500">@{current.organization.slug}</p>

        <div className="mt-5">
          {joinUrl ? (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {qr ? (
                <div
                  aria-label="Join QR code"
                  className="rounded-lg border border-slate-200 p-2"
                  // qrSvg produces a trusted, server-generated SVG string.
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
              ) : null}
              <div>
                <p className="text-sm font-medium text-ink-700">Join link</p>
                <p className="break-all font-mono text-sm text-brand-700">{joinUrl}</p>
                {link?.campaign ? (
                  <p className="mt-1 text-xs text-ink-500">Campaign: {link.campaign}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">No active join link yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">Verification</p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              VERIFICATION_STYLES[current.organization.verification_status] ?? 'bg-slate-100'
            }`}
          >
            {current.organization.verification_status}
          </span>
        </div>
        {current.organization.verification_status === 'UNVERIFIED' ||
        current.organization.verification_status === 'REJECTED' ? (
          <VerificationRequest />
        ) : (
          <p className="mt-3 text-sm text-ink-500">
            {current.organization.verification_status === 'PENDING'
              ? 'Your verification request is pending review.'
              : 'Your organization is verified.'}
          </p>
        )}
      </div>
    </div>
  );
}
