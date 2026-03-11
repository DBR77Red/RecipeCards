require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, { retries = 3, baseDelayMs = 1000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 529 && res.status !== 503 || attempt === retries) return res;
    const delay = baseDelayMs * 2 ** attempt;
    console.log(`[retry] attempt ${attempt + 1} — overloaded, waiting ${delay}ms`);
    await sleep(delay);
  }
}

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a recipe parser. Given a spoken recipe transcript, extract the following fields and return ONLY a valid JSON object with no extra text, markdown, or explanation.

IMPORTANT: All field values must be written in the same language as the transcript. Do not translate anything.

Fields to extract:
- "title": string — the recipe name. If not explicitly stated, infer a short descriptive title from the content (e.g. "Chocolate Chip Cookies"). Never leave this empty.
- "servings": string — serving size (e.g. "4", "4 people"). Leave as "" if not mentioned.
- "prepTime": string — preparation time (e.g. "15 min"). Leave as "" if not mentioned.
- "cookTime": string — cooking time (e.g. "30 min"). Leave as "" if not mentioned.
- "ingredients": array of strings — each ingredient as a separate string. Empty array if none found.
- "directions": array of strings — each step as a separate string. Empty array if none found.

Return ONLY the JSON object, no other text.`;

const MERGE_SYSTEM_PROMPT = `You are a recipe assistant. You will receive the current state of a recipe and a new spoken transcript with additional or corrected information.

Your job is to return an updated recipe by intelligently merging both:
- If the transcript mentions a field already filled, update it only if the new version is more complete or specific (e.g. "200 grams of rice" improves "rice" — replace it).
- If the transcript adds new ingredients or steps not already present, append them.
- If the transcript does not mention a field at all, keep the current value unchanged.
- If a field is currently empty and the transcript provides it, fill it in.
- Never duplicate an ingredient or step that is already present with the same meaning.
- Keep all values in the same language as the transcript. Do not translate anything.

Fields to return:
- "title": string — never empty.
- "servings": string — e.g. "4". Empty string if unknown.
- "prepTime": string — e.g. "15 min". Empty string if unknown.
- "cookTime": string — e.g. "30 min". Empty string if unknown.
- "ingredients": array of strings — complete merged list.
- "directions": array of strings — complete merged list.

Return ONLY the JSON object, no extra text, markdown, or explanation.`;

app.post('/api/voice-to-recipe', upload.single('audio'), async (req, res) => {
  try {
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!deepgramKey) return res.status(500).json({ error: 'DEEPGRAM_API_KEY is not configured' });
    if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    if (!req.file)     return res.status(400).json({ error: 'No audio file provided' });

    console.log(`[voice] audio received: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`);

    // Step 1: transcribe audio with Deepgram
    const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramKey}`,
        'Content-Type': req.file.mimetype || 'audio/m4a',
      },
      body: req.file.buffer,
    });
    if (!dgRes.ok) {
      const text = await dgRes.text();
      return res.status(502).json({ error: `Deepgram returned ${dgRes.status}: ${text}` });
    }
    const dgData = await dgRes.json();
    const transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
    console.log(`[voice] transcript (${transcript.length} chars): "${transcript.slice(0, 80)}${transcript.length > 80 ? '…' : ''}"`);
    if (!transcript.trim()) {
      return res.status(422).json({ error: 'no_speech' });
    }

    // Step 2: parse/merge transcript into recipe fields with Claude
    let currentRecipe = null;
    if (req.body.currentRecipe) {
      try { currentRecipe = JSON.parse(req.body.currentRecipe); } catch { /* ignore */ }
    }

    const systemPrompt  = currentRecipe ? MERGE_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const userMessage   = currentRecipe
      ? `Current recipe:\n${JSON.stringify(currentRecipe, null, 2)}\n\nNew transcript:\n${transcript}`
      : `Transcript:\n${transcript}`;

    const claudeRes = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!claudeRes.ok) {
      const text = await claudeRes.text();
      return res.status(502).json({ error: `Anthropic returned ${claudeRes.status}: ${text}` });
    }
    const claudeData = await claudeRes.json();
    const rawText = claudeData?.content?.[0]?.text ?? '{}';

    // Claude sometimes wraps JSON in markdown code fences — strip them before parsing.
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let recipe;
    try {
      recipe = JSON.parse(jsonText);
    } catch {
      console.error('[voice] Claude raw response (unparseable):', rawText.slice(0, 200));
      return res.status(502).json({ error: 'Could not parse recipe from AI response' });
    }

    if (!recipe.title)                      recipe.title       = 'My Recipe';
    if (!Array.isArray(recipe.ingredients)) recipe.ingredients = [];
    if (!Array.isArray(recipe.directions))  recipe.directions  = [];
    if (typeof recipe.servings !== 'string') recipe.servings   = '';
    if (typeof recipe.prepTime !== 'string') recipe.prepTime   = '';
    if (typeof recipe.cookTime !== 'string') recipe.cookTime   = '';

    console.log('[voice] done — recipe title:', recipe.title);
    res.json({ recipe, transcript });
  } catch (err) {
    console.error('POST /api/voice-to-recipe error:', err);
    res.status(500).json({ error: 'Voice-to-recipe failed' });
  }
});

// ─── Recipe web page ──────────────────────────────────────────────────────────

app.get('/card/:id', async (req, res) => {
  const { id } = req.params;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server configuration error.');
  }

  let recipe = null;
  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/recipes?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const rows = await r.json();
    recipe = rows?.[0] ?? null;
  } catch {
    return res.status(500).send('Could not load recipe.');
  }

  if (!recipe) {
    return res.status(404).send(cardPage({ notFound: true }));
  }

  // Increment receive count (best-effort, non-blocking)
  const newCount = ((recipe.receive_count) ?? 0) + 1;
  fetch(
    `${supabaseUrl}/rest/v1/recipes?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ receive_count: newCount }),
    }
  ).catch(() => {});

  res.send(cardPage({ recipe }));
});

function cardPage({ recipe, notFound } = {}) {
  const deepLink = recipe ? `recipecards://card/${recipe.id}` : '';
  const title    = recipe?.title        ?? 'Recipe not found';
  const creator  = recipe?.creator_name ?? '';
  const photo    = recipe?.photo_url    ?? '';
  const serves   = recipe?.servings     ?? '';
  const prep     = recipe?.prep_time    ?? '';
  const cook     = recipe?.cook_time    ?? '';
  const ings     = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const steps    = Array.isArray(recipe?.directions)  ? recipe.directions  : [];

  const metaItems = [
    serves && `<span>${serves} servings</span>`,
    prep   && `<span>${prep} prep</span>`,
    cook   && `<span>${cook} cook</span>`,
  ].filter(Boolean).join('<span class="dot">·</span>');

  const ingredientList = ings.slice(0, 6).map(i =>
    `<li>${i}</li>`
  ).join('') + (ings.length > 6 ? `<li class="more">+ ${ings.length - 6} more…</li>` : '');

  const stepList = steps.slice(0, 4).map((s, i) =>
    `<li><span class="num">${i + 1}</span>${s}</li>`
  ).join('') + (steps.length > 4 ? `<li class="more step-more">+ ${steps.length - 4} more steps…</li>` : '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${notFound ? 'Recipe not found' : `${title} — RecipeCards`}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F7F5F2; font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 32px 20px 60px; }
    .card { background: #fff; border-radius: 24px; max-width: 480px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.10); overflow: hidden; }
    .photo { width: 100%; height: 260px; object-fit: cover; display: block; background: #E8E4DE; }
    .photo-placeholder { width: 100%; height: 180px; background: #E8E4DE; display: flex; align-items: center; justify-content: center; }
    .photo-placeholder svg { opacity: 0.25; }
    .body { padding: 28px 28px 0; }
    .by { font-size: 12px; color: #A8A29E; letter-spacing: 0.3px; margin-bottom: 6px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 28px; color: #1C1917; line-height: 1.2; margin-bottom: 12px; }
    .meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 24px; font-size: 13px; color: #78716C; }
    .dot { color: #D4C5B8; }
    .divider { height: 1px; background: #E7E5E4; margin: 0 -28px 24px; }
    h2 { font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 10px; letter-spacing: 2px; color: #d4820a; text-transform: uppercase; margin-bottom: 12px; }
    ul, ol { padding-left: 0; list-style: none; }
    ul li { font-size: 14px; color: #44403C; padding: 6px 0; border-bottom: 1px solid #F5F5F4; display: flex; align-items: flex-start; gap: 8px; }
    ul li::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #d4820a; flex-shrink: 0; margin-top: 7px; }
    ol li { font-size: 14px; color: #44403C; padding: 8px 0; border-bottom: 1px solid #F5F5F4; display: flex; gap: 10px; }
    .num { font-weight: 600; font-size: 12px; color: #d4820a; min-width: 18px; padding-top: 1px; }
    .more, .step-more { color: #A8A29E; font-size: 13px; border-bottom: none !important; }
    .step-more::before { display: none; }
    .actions { padding: 24px 28px 28px; display: flex; flex-direction: column; gap: 12px; }
    .btn-open { display: block; background: #1C1917; color: #F7F5F2; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 15px; text-align: center; text-decoration: none; border-radius: 100px; padding: 18px 24px; cursor: pointer; border: none; width: 100%; }
    .btn-open:hover { background: #2c2927; }
    .hint { font-size: 12px; color: #A8A29E; text-align: center; line-height: 1.6; }
    .hint a { color: #78716C; }
    .badge { display: inline-block; background: #F7F5F2; border-radius: 8px; padding: 2px 10px; font-size: 11px; font-weight: 600; color: #A8A29E; letter-spacing: 0.5px; margin-bottom: 20px; }
    .not-found { max-width: 480px; width: 100%; text-align: center; padding-top: 80px; }
    .not-found h1 { font-family: 'Playfair Display', serif; font-size: 28px; color: #1C1917; margin-bottom: 12px; }
    .not-found p { color: #78716C; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
${notFound ? `
  <div class="not-found">
    <h1>Recipe not found</h1>
    <p>This recipe may have been removed or the link is invalid.</p>
  </div>
` : `
  <div class="card">
    ${photo
      ? `<img class="photo" src="${photo}" alt="${title}" />`
      : `<div class="photo-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#1C1917" stroke-width="1.5"/><circle cx="12" cy="13" r="4" stroke="#1C1917" stroke-width="1.5"/></svg></div>`
    }
    <div class="body">
      <span class="badge">RECIPECARDS</span>
      ${creator ? `<p class="by">By ${creator}</p>` : ''}
      <h1>${title}</h1>
      ${metaItems ? `<div class="meta">${metaItems}</div>` : ''}
      ${ings.length > 0 ? `
        <div class="divider"></div>
        <h2>Ingredients</h2>
        <ul>${ingredientList}</ul>
      ` : ''}
      ${steps.length > 0 ? `
        <div class="divider" style="margin-top:20px"></div>
        <h2>Instructions</h2>
        <ol>${stepList}</ol>
      ` : ''}
    </div>
    <div class="actions">
      <a class="btn-open" href="${deepLink}" id="openBtn">Open in RecipeCards</a>
      <p class="hint" id="hint">Don't have the app? <a href="https://recipecards-api.fly.dev">Get RecipeCards</a></p>
    </div>
  </div>
  <script>
    document.getElementById('openBtn').addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '${deepLink}';
      setTimeout(function() {
        document.getElementById('hint').innerHTML =
          "Looks like the app isn\\'t installed yet. Download it to open this recipe.";
      }, 1500);
    });
  </script>
`}
</body>
</html>`;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RecipeCards API listening on port ${PORT}`);
});
