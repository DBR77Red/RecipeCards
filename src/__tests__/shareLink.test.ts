/**
 * Tests for src/utils/shareLink.ts
 *
 * `buildShareLink` must produce an HTTPS URL that points at the Supabase
 * Edge Function responsible for redirecting to the `intent://` URL.
 */
import { buildShareLink, SHARE_LINK_BASE } from '../utils/shareLink';

describe('buildShareLink', () => {
  it('returns the Supabase Edge Function URL with the given card id appended', () => {
    expect(buildShareLink('abc123')).toBe(
      `${SHARE_LINK_BASE}/functions/v1/r/abc123`
    );
  });

  it('URL-encodes unusual characters in the card id', () => {
    expect(buildShareLink('id with space')).toBe(
      `${SHARE_LINK_BASE}/functions/v1/r/id%20with%20space`
    );
  });

  it('always starts with https://', () => {
    expect(buildShareLink('x').startsWith('https://')).toBe(true);
  });

  it('throws on an empty id', () => {
    expect(() => buildShareLink('')).toThrow(/empty/i);
  });
});
