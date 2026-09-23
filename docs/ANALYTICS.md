# Analytics

CommunityDirect reports **measured signals only**. We never fabricate open or tap
rates the push transport cannot report (see [DECISIONS.md](./DECISIONS.md) §9 and
[PRIVACY.md](./PRIVACY.md)).

## What we measure

Everything is derived from things that actually happened:

- **Delivery** — from `delivery_attempts`: accepted by the provider
  (`SENT_TO_PROVIDER` / `DELIVERED`), failed sends (`FAILED`), and dead tokens we
  cleaned up (`TOKEN_INVALID`). The delivery rate is `accepted / attempted`.
- **Reach** — active followers, messages `SENT` / `SCHEDULED` / failed, and
  delivery-job completion.
- **Join funnel** — from `join_events`: QR/link scans and attributed follows, and
  the scan→follow conversion.

The pure derivations (`summarizeDelivery`, `formatRate`, `joinConversionRate`)
live in `@communitydirect/core` (`analytics.ts`) and are unit-tested.

## How it's computed

A single SECURITY DEFINER RPC, `organization_analytics(org)` (migration `0015`),
returns all counts in one round-trip. It is gated by an explicit
`app.is_org_member` check, so a member sees only their own organization's numbers
(verified in `supabase/tests/analytics.test.sql`). The admin **Analytics** page
and the **Overview** delivery-rate tile render these values; there is no separate
analytics pipeline to drift out of sync.

## Attribution

A follow made through a join link records a low-sensitivity `signup_source` tag
(`qr:<campaign>` or `join:<code>`, from `signupSourceFromJoin`). Segments can
target it via the `signup_source` field, and the join funnel counts follows
against scans. No individual behavior is profiled.

## Not measured (by design)

Opens, taps, dwell time, read receipts — the push transports don't reliably
report these, so we don't display invented numbers for them.
