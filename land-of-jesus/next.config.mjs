import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images are served locally from public/images and rendered `unoptimized`,
  // so no remote image hosts or optimizer/sharp dependency are needed.
};

export default withNextIntl(nextConfig);
