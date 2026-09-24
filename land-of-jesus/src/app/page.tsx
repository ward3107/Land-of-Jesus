import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n/config';

// `/` is normally handled by the next-intl middleware (redirects to the
// negotiated locale). This is a safety net so the root never 404s.
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
