const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Database = require('@replit/database');

const db = new Database();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const domain = process.env.REPLIT_DEV_DOMAIN;
const BASE_URL = domain ? `https://${domain}:3001` : 'http://localhost:3001';

app.post('/api/recipes', async (req, res) => {
  try {
    const recipe = req.body;
    if (!recipe || !recipe.id) {
      return res.status(400).json({ error: 'Recipe with id is required' });
    }
    await db.set(`recipe:${recipe.id}`, JSON.stringify(recipe));
    const shareUrl = `${BASE_URL}/api/recipes/${recipe.id}`;
    res.status(201).json({ shareUrl });
  } catch (err) {
    console.error('POST /api/recipes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const result = await db.get(`recipe:${req.params.id}`);
    const raw = result && typeof result === 'object' && 'value' in result ? result.value : result;
    if (!raw) return res.status(404).json({ error: 'Recipe not found' });
    const recipe = typeof raw === 'string' ? JSON.parse(raw) : raw;
    res.json(recipe);
  } catch (err) {
    console.error('GET /api/recipes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'DEEPGRAM_API_KEY is not configured' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': req.file.mimetype || 'audio/m4a',
      },
      body: req.file.buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Deepgram error:', response.status, text);
      return res.status(502).json({ error: `Deepgram returned ${response.status}` });
    }

    const data = await response.json();
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';

    res.json({ transcript });
  } catch (err) {
    console.error('POST /api/transcribe error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/api/parse-recipe', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    }

    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'transcript is required' });
    }

    const systemPrompt = `You are a recipe parser. Given a spoken recipe transcript, extract the following fields and return ONLY a valid JSON object with no extra text, markdown, or explanation.

Fields to extract:
- "title": string — the recipe name. If not explicitly stated, infer a short descriptive title from the content (e.g. "Chocolate Chip Cookies"). Never leave this empty.
- "servings": string — serving size (e.g. "4", "4 people"). Leave as "" if not mentioned.
- "prepTime": string — preparation time (e.g. "15 min"). Leave as "" if not mentioned.
- "cookTime": string — cooking time (e.g. "30 min"). Leave as "" if not mentioned.
- "ingredients": array of strings — each ingredient as a separate string. Empty array if none found.
- "directions": array of strings — each step as a separate string. Empty array if none found.

Return ONLY the JSON object, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Transcript:\n${transcript}` },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Anthropic error:', response.status, text);
      return res.status(502).json({ error: `Anthropic returned ${response.status}` });
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text ?? '{}';

    let recipe;
    try {
      recipe = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse Anthropic response as JSON:', rawText);
      return res.status(502).json({ error: 'Could not parse recipe from AI response' });
    }

    if (!recipe.title) {
      recipe.title = 'My Recipe';
    }
    if (!Array.isArray(recipe.ingredients)) recipe.ingredients = [];
    if (!Array.isArray(recipe.directions)) recipe.directions = [];
    if (typeof recipe.servings !== 'string') recipe.servings = '';
    if (typeof recipe.prepTime !== 'string') recipe.prepTime = '';
    if (typeof recipe.cookTime !== 'string') recipe.cookTime = '';

    res.json({ recipe });
  } catch (err) {
    console.error('POST /api/parse-recipe error:', err);
    res.status(500).json({ error: 'Recipe parsing failed' });
  }
});

app.listen(3001, () => {
  console.log(`RecipeCards API running at ${BASE_URL}`);
});
