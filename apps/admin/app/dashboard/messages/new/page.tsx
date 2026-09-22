import type { Locale } from '@communitydirect/core';
import { createTranslator } from '@communitydirect/i18n';
import { MessageComposer } from '@/components/MessageComposer';
import { getActiveLocale } from '@/lib/i18n';
import { getCurrentOrganization } from '@/lib/org';
import { fetchAudienceProjections, listChannels, listSegments } from '@/lib/messages';

export default async function NewMessagePage() {
  const locale = await getActiveLocale();
  const t = createTranslator(locale);
  const current = await getCurrentOrganization();

  if (!current) {
    return <p className="text-sm text-ink-500">No organization found for your account.</p>;
  }

  const [channels, segments, projections] = await Promise.all([
    listChannels(current.organization.id),
    listSegments(current.organization.id),
    fetchAudienceProjections(current.organization.id),
  ]);

  const canSend = current.role === 'ORGANIZATION_OWNER' || current.role === 'ORGANIZATION_ADMIN';

  return (
    <div className="max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-900">{t('admin.createMessage')}</h1>
      <p className="mb-6 text-sm text-ink-500">
        Write once in Arabic, Hebrew or English, target channels and a segment, preview it, then send
        now, schedule, or make it recurring.
      </p>
      <MessageComposer
        appName={t('common.appName')}
        defaultLocale={current.organization.default_locale as Locale}
        channels={channels}
        segments={segments}
        projections={projections}
        canSend={canSend}
      />
    </div>
  );
}
