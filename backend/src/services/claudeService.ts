import Anthropic from '@anthropic-ai/sdk';
import {
  GARMENT_ANALYSIS_PROMPT,
  buildOutfitSuggestionsPrompt,
  buildOccasionOutfitPrompt,
  buildSwapPiecePrompt,
  buildRescorePrompt,
} from '../prompts';
import { GarmentAnalysis, OutfitSuggestion } from '../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeGarment(
  base64Image: string,
  mediaType: string
): Promise<GarmentAnalysis> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
              data: base64Image,
            },
          },
          { type: 'text', text: GARMENT_ANALYSIS_PROMPT },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as GarmentAnalysis;
}

export async function generateOutfitSuggestions(
  anchorItem: object,
  wardrobe: object[]
): Promise<OutfitSuggestion[]> {
  const prompt = buildOutfitSuggestionsPrompt(anchorItem, wardrobe);
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as OutfitSuggestion[];
}

export interface SwapPieceResult {
  item_id: string;
  cohesion_score: number;
  style_notes: string;
}

export async function swapOutfitPiece(
  category: string,
  occasion: string,
  season: string | undefined,
  keepItems: object[],
  candidates: object[]
): Promise<SwapPieceResult> {
  const prompt = buildSwapPiecePrompt(category, occasion, season, keepItems, candidates);
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as SwapPieceResult;
}

export interface RescoreResult {
  cohesion_score: number;
  style_notes: string;
}

export async function rescoreOutfit(
  items: object[],
  occasion: string,
  season: string | undefined
): Promise<RescoreResult> {
  const prompt = buildRescorePrompt(items, occasion, season);
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as RescoreResult;
}

export async function generateOutfitsForOccasion(
  occasion: string,
  season: string | undefined,
  wardrobe: object[],
  anchorItem?: object
): Promise<OutfitSuggestion[]> {
  const prompt = buildOccasionOutfitPrompt(occasion, season, wardrobe, anchorItem);
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as OutfitSuggestion[];
}
