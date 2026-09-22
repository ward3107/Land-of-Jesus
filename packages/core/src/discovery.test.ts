import { describe, expect, it } from 'vitest';
import { searchOrganizations, type OrgSummary } from './discovery';

function org(p: Partial<OrgSummary> & { name: string; slug: string }): OrgSummary {
  return {
    id: p.slug,
    description: null,
    category: null,
    verificationStatus: 'UNVERIFIED',
    ...p,
  };
}

const orgs: OrgSummary[] = [
  org({ name: 'Father George Parish', slug: 'father-george', category: 'Church' }),
  org({ name: 'Nazareth Youth Club', slug: 'nazareth-youth', category: 'Community' }),
  org({ name: 'City of Nazareth', slug: 'nazareth-city', verificationStatus: 'VERIFIED' }),
  org({ name: 'St. Mary School', slug: 'st-mary', description: 'A school in Nazareth' }),
];

describe('searchOrganizations', () => {
  it('empty query returns all, verified first then alphabetical', () => {
    const result = searchOrganizations(orgs, '');
    expect(result[0]?.name).toBe('City of Nazareth'); // verified boosted to top
    expect(result).toHaveLength(4);
  });

  it('ranks name prefix above description match', () => {
    const result = searchOrganizations(orgs, 'nazareth');
    // "Nazareth Youth Club" (name prefix) and "City of Nazareth" (name incl + verified)
    // rank above "St. Mary School" (description-only match).
    expect(result[result.length - 1]?.name).toBe('St. Mary School');
    expect(result.map((o) => o.name)).toContain('Nazareth Youth Club');
  });

  it('matches by category', () => {
    const result = searchOrganizations(orgs, 'church');
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('father-george');
  });

  it('returns nothing for a non-match', () => {
    expect(searchOrganizations(orgs, 'zzzz')).toHaveLength(0);
  });

  it('is case-insensitive and trims', () => {
    expect(searchOrganizations(orgs, '  FATHER ')).toHaveLength(1);
  });
});
