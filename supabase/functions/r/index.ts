// Supabase Edge Function: /functions/v1/r/{id}
//
// Responds with HTTP 302 → intent://card/{id}#Intent;scheme=recipecards;package=com.camelo.recipecards;end
// Android Chrome parses intent://, locates the RecipeCards APK by its
// package name, and hands it the URI recipecards://card/{id}. The app
// then opens CardView and fetches the recipe from Supabase exactly as
// a QR scan does.
//
// No HTML, no JS, no DB lookup. Must be deployed with --no-verify-jwt
// (or verify_jwt = false in config.toml) so unauthenticated browsers
// can call it.

const ID_PATTERN = /^[\w-]{1,64}$/;
const ANDROID_PACKAGE = 'com.camelo.recipecards';
const SCHEME = 'recipecards';

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  // Path is /functions/v1/r/{id}. Require the id segment explicitly;
  // do not fall back to the function name when the id is missing.
  const segments = url.pathname.split('/').filter(Boolean);
  const id = segments.length >= 4 ? segments[3] : '';

  if (!ID_PATTERN.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  const intentUrl =
    `intent://card/${id}` +
    `#Intent;scheme=${SCHEME};package=${ANDROID_PACKAGE};end`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: intentUrl,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});
