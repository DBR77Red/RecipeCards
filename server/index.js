const express = require('express');
const cors = require('cors');
const Database = require('@replit/database');

const db = new Database();
const app = express();

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

app.listen(3001, () => {
  console.log(`RecipeCards API running at ${BASE_URL}`);
});
