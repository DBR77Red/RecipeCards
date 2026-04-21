export const SHARE_LINK_BASE =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://hlvaztyvrpyfpgojitvu.supabase.co';

export function buildShareLink(cardId: string): string {
  if (!cardId) throw new Error('buildShareLink: cardId must not be empty');
  return `${SHARE_LINK_BASE}/functions/v1/r/${encodeURIComponent(cardId)}`;
}
