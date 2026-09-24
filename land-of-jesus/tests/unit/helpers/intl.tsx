import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import he from '../../../messages/he.json';

const MESSAGES = { en, ar, he };

/** Render inside next-intl with the real message files. */
export function renderWithIntl(ui: ReactElement, locale: keyof typeof MESSAGES = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}
