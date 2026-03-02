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

Fields to extract:
- "title": string — the recipe name. If not explicitly stated, infer a short descriptive title from the content (e.g. "Chocolate Chip Cookies"). Never leave this empty.
- "servings": string — serving size (e.g. "4", "4 people"). Leave as "" if not mentioned.
- "prepTime": string — preparation time (e.g. "15 min"). Leave as "" if not mentioned.
- "cookTime": string — cooking time (e.g. "30 min"). Leave as "" if not mentioned.
- "ingredients": array of strings — each ingredient as a separate string. Empty array if none found.
- "directions": array of strings — each step as a separate string. Empty array if none found.

Return ONLY the JSON object, no other text.`;

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

    // Step 2: parse transcript into recipe fields with Claude
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
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Transcript:\n${transcript}` }],
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

app.listen(3001, () => {
  console.log('RecipeCards API listening on http://localhost:3001');
});
