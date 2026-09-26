# Compliance Pages — Review Guide

> **Not legal advice.** These pages are informational templates built to a
> reasonable standard, not legal advice. Have a lawyer licensed in the relevant
> jurisdictions (Israel + EU) review them before the site relies on them.

## Scope

- **Markets:** Israel, EU/EEA, worldwide.
- **Languages:** all 32 site languages. English is the source; the others are
  translations, and the Disclaimer states the English version prevails.
- **Pages & routes:** `/privacy`, `/cookies`, `/terms`, `/disclaimer`,
  `/accessibility`. Linked from the footer on every page. Copy lives in
  `messages/*.json` (namespaces Privacy, Cookie, Terms, Disclaimer, Accessibility);
  pages render via `src/components/legal/LegalDocument.tsx`.

## Factual assertions the whole set depends on — please confirm

- **Controller / owner:** Waseem · **contact** wasya92@gmail.com · **site** landofjesus.net
- **Hosting:** Vercel (USA). **Database:** Supabase. **Maps:** OpenFreeMap
  (receives the visitor's IP when the interactive map loads).
- **No analytics, no advertising, no tracking cookies, no user accounts, no
  contact forms.** Only essential cookies (language preference + session).
  → If this ever changes (e.g. you add Google Analytics or ads), the Privacy and
  Cookie pages must be updated and a real opt-in consent banner added.
- **Retention:** server logs incl. IP ~90 days; emails kept as needed, deleted on request.
- **Governing law:** State of Israel (Terms), preserving mandatory local consumer protections.

## Page by page

### Privacy Policy — `/privacy`
Cites Israel's Protection of Privacy Law 5741-1981 + Amendment 13, and EU GDPR + ePrivacy.
Covers: controller identity; data collected (technical logs + any email you send only);
explicit "no tracking / advertising / profiling / selling"; cookies (essential only);
service providers (Vercel / Supabase / OpenFreeMap); international transfers (Standard
Contractual Clauses); retention; GDPR legal bases (legitimate interest + consent);
data-subject rights (access, rectification, erasure, restriction, objection, portability,
withdraw) by email with a 30-day response; complaints (Israeli PPA address + EU supervisory
authorities); children; security (HTTPS, breach notification); changes.
**Verify:** retention periods, the SCC transfer basis, the 30-day commitment, PPA address.

### Cookie Policy — `/cookies` (+ notice bar)
Covers: what cookies are; the essential cookies used (language + session); explicit
"no analytics / advertising / pixels / cross-site tracking"; OpenFreeMap third-party
requests; how to control cookies; changes. The site-wide notice bar is informational and
dismissible — no accept/reject, because there are no non-essential cookies to consent to.
**Verify:** that only essential cookies are actually set (no third-party embeds set cookies).

### Terms of Use — `/terms`
Covers: acceptable use; content / IP ownership and public-domain imagery; projects and
funding figures are informational only (not an offer, contract, or request for payment);
external links; accuracy caveat; "as is" / no warranty; limitation of liability; governing
law (Israel); changes.
**Verify:** the funding/donation language if you ever take payments; governing law + venue; IP claims.

### Disclaimer — `/disclaimer`
Covers: general information only (not professional / legal / religious / travel advice);
accuracy; heritage & religious content presented respectfully and not as an official church
statement; imagery (public-domain sacred art, not necessarily photos of the present-day
sites); translations (automated; English prevails); external links; confirm details before travel.
**Verify:** the automated-translation disclosure; imagery claims.

### Accessibility statement — `/accessibility`
Declares a WCAG 2.1 AA target; references IS 5568 and the EU EAA; coordinator Waseem /
wasya92@gmail.com; annual review.
**Verify:** that the conformance claim matches an actual audit; coordinator contact.

## Reviewer checklist

- [ ] Confirm the factual assertions above (controller, hosts, "no tracking", retention).
- [ ] Confirm governing law / venue.
- [ ] Confirm the Israeli PPA and EU supervisory-authority references.
- [ ] Decide whether a formal opt-in cookie-consent banner is ever needed (only if analytics/ads are added).
- [ ] Confirm the projects/donation language if payments are taken.
- [ ] Licensed lawyer (Israel + EU) sign-off before the site relies on these.
