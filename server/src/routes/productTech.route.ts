import express from 'express';
import path from 'path';
import fs from 'fs';
import { extractProductTechSignals } from '../services/productTechExtractor.js';
import { polishProductTechWithGroq } from '../services/productTechGroqAnalyzer.js';
import { ProductTechSignals } from '../types';

const router = express.Router();
const DATA_DIR = path.resolve('./data');
const PRODUCT_TECH_FILE = path.join(DATA_DIR, 'productTech.json');

function loadProductTech(): Record<string, ProductTechSignals> {
  try {
    if (!fs.existsSync(PRODUCT_TECH_FILE)) return {};
    return JSON.parse(fs.readFileSync(PRODUCT_TECH_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveProductTech(startupId: string, signals: ProductTechSignals) {
  const all = loadProductTech();
  all[startupId] = signals;
  fs.writeFileSync(PRODUCT_TECH_FILE, JSON.stringify(all, null, 2));
}

// GET /api/startup/:startupId/product-tech
router.get('/api/startup/:startupId/product-tech', (req, res) => {
  const { startupId } = req.params;
  const all = loadProductTech();
  if (!all[startupId]) {
    res.status(404).json({ error: 'No product/tech signals found' });
    return;
  }
  res.json(all[startupId]);
  return;
});

// POST /api/startup/:startupId/product-tech (re-extract and polish)
router.post('/api/startup/:startupId/product-tech', async (req, res) => {
  const { startupId } = req.params;
  // Expect: req.body.deckText, req.body.sectionChunks
  const { deckText, sectionChunks } = req.body;
  if (!deckText || !Array.isArray(sectionChunks)) {
    res.status(400).json({ error: 'deckText and sectionChunks required' });
    return;
  }
  const extracted = extractProductTechSignals(deckText, sectionChunks);
  try {
    const groq = await polishProductTechWithGroq(extracted);
    const signals: ProductTechSignals = { ...extracted, ...groq };
    saveProductTech(startupId, signals);
    res.json(signals);
    return;
  } catch (err) {
    res.status(500).json({ error: 'Groq summarization failed', details: String(err) });
    return;
  }
});

export default router;
