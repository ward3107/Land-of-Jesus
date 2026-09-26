import { getTranslations } from 'next-intl/server';
import { Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/card';

interface LegalDocumentProps {
  locale: string;
  /** Message namespace holding title/intro/contact* plus the section keys. */
  namespace: string;
  /** Ordered [titleKey, bodyKey] pairs rendered between the intro and contact. */
  sections: readonly (readonly [string, string])[];
  /** ISO date shown under the title and passed through formatDate. */
  lastUpdated: string;
  /** Contact address for the mailto card and the {email} placeholder. */
  email: string;
  /** Extra placeholder values used by some bodies (e.g. {site}, {name}). */
  values?: Record<string, string>;
}

/**
 * Shared renderer for the site's legal/compliance pages (Privacy, Cookies,
 * Terms, Disclaimer). Every such namespace shares the same shape — title,
 * lastUpdatedLabel, intro, a list of title/body sections, and contactTitle/
 * contactBody — so one component keeps them consistent and translatable.
 */
export async function LegalDocument({ locale, namespace, sections, lastUpdated, email, values = {} }: LegalDocumentProps) {
  const t = await getTranslations({ locale, namespace });
  const v = { email, ...values };

  return (
    <Section tone="stone" containerSize="base">
      <h1 className="font-serif text-[34px] font-semibold leading-[1.1] tracking-tight text-night md:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {t('lastUpdatedLabel')}: {formatDate(lastUpdated, locale)}
      </p>
      <p className="mt-4 text-lg leading-relaxed text-muted">{t('intro')}</p>

      <div className="mt-10 space-y-8">
        {sections.map(([titleKey, bodyKey]) => (
          <section key={titleKey}>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-night">{t(titleKey)}</h2>
            <p className="leading-relaxed text-night/80">{t(bodyKey, v)}</p>
          </section>
        ))}

        <Card className="p-6 md:p-8">
          <h2 className="mb-3 font-serif text-2xl font-semibold text-night">{t('contactTitle')}</h2>
          <p className="leading-relaxed text-night/80">{t('contactBody', v)}</p>
          <a
            href={`mailto:${email}`}
            className="mt-4 inline-flex items-center gap-2 font-medium text-primary-700 hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            {email}
          </a>
        </Card>
      </div>
    </Section>
  );
}
