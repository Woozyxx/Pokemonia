import { GoogleGenAI } from '@google/genai';
import type { GeminiExtractionResult, PokemonType } from '../types';

// La clé n'est plus lue depuis une variable d'environnement : Vite l'aurait incluse en clair
// dans le JavaScript publié. Elle est saisie dans l'application et gardée dans le navigateur.
export function getApiKey(customKey?: string): string {
  return (customKey || '').trim();
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '') };
}

const VALID_TYPES: PokemonType[] = [
  'fire', 'water', 'grass', 'lightning', 'psychic', 'fighting', 'darkness', 'metal', 'dragon', 'colorless',
];

const TYPE_ALIASES: Record<string, PokemonType> = {
  feu: 'fire', eau: 'water', plante: 'grass', herbe: 'grass', electrique: 'lightning', 'électrique': 'lightning',
  foudre: 'lightning', psy: 'psychic', psychique: 'psychic', combat: 'fighting', obscurite: 'darkness',
  'obscurité': 'darkness', tenebres: 'darkness', 'ténèbres': 'darkness', metal: 'metal', 'métal': 'metal',
  acier: 'metal', dragon: 'dragon', incolore: 'colorless', normal: 'colorless',
};

/** Convertit un type lu par l'IA (anglais ou français) vers un PokemonType valide, sinon undefined. */
function normalizeType(value: unknown): PokemonType | undefined {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().toLowerCase();
  if ((VALID_TYPES as string[]).includes(key)) return key as PokemonType;
  return TYPE_ALIASES[key];
}

function normalizeAttack(raw: GeminiExtractionResult['attack1']): GeminiExtractionResult['attack1'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const energyTypes = Array.isArray(raw.energyTypes)
    ? raw.energyTypes.map(normalizeType).filter((t): t is PokemonType => !!t)
    : undefined;
  return {
    name: typeof raw.name === 'string' ? raw.name : undefined,
    energyTypes,
    damage: raw.damage != null ? String(raw.damage) : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
  };
}

function normalizeExtraction(raw: GeminiExtractionResult): GeminiExtractionResult {
  const stage = ['Basic', 'Stage 1', 'Stage 2', 'EX', 'VMAX'].includes(String(raw.stage)) ? raw.stage : undefined;
  const retreat = Number(raw.retreatCost);
  return {
    name: typeof raw.name === 'string' ? raw.name : undefined,
    hp: raw.hp != null ? String(raw.hp) : undefined,
    type: normalizeType(raw.type),
    stage,
    evolvesFrom: typeof raw.evolvesFrom === 'string' ? raw.evolvesFrom : undefined,
    attack1: normalizeAttack(raw.attack1),
    attack2: normalizeAttack(raw.attack2),
    weakness: normalizeType(raw.weakness),
    resistance: normalizeType(raw.resistance),
    retreatCost: Number.isFinite(retreat) ? Math.min(4, Math.max(0, Math.round(retreat))) : undefined,
    illustrator: typeof raw.illustrator === 'string' ? raw.illustrator : undefined,
  };
}

/**
 * Extract stats from handwritten sheet using gemini-3.6-flash
 */
export async function extractStatsFromSheet(
  sheetBase64Url: string,
  customApiKey?: string
): Promise<GeminiExtractionResult> {
  const apiKey = getApiKey(customApiKey);
  if (!apiKey) {
    throw new Error("Clé API Gemini manquante. Veuillez configurer votre clé dans l'application.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const imageInfo = parseDataUrl(sheetBase64Url);

  const prompt = `
Tu es un expert en cartes Pokémon. Analyse cette photo d'une feuille manuscrite où un enfant a écrit les caractéristiques d'un Pokémon qu'il a inventé.
Extrais les informations sous la forme d'un objet JSON strict avec les champs suivants (sans balises markdown supplémentaires):

{
  "name": "Nom du Pokémon",
  "hp": "nombre de PV (ex: 120)",
  "type": "type parmi: fire, water, grass, lightning, psychic, fighting, darkness, metal, dragon, colorless",
  "stage": "Basic, Stage 1, ou Stage 2",
  "evolvesFrom": "Nom du pokémon d'origine si spécifié ou vide",
  "attack1": {
    "name": "Nom de la 1ère attaque",
    "energyTypes": ["array de types parmi: fire, water, grass, lightning, psychic, fighting, darkness, metal, dragon, colorless"],
    "damage": "Dégâts (ex: 50)",
    "description": "Effet de l'attaque s'il y en a un"
  },
  "attack2": {
    "name": "Nom de la 2ème attaque",
    "energyTypes": ["array de types"],
    "damage": "Dégâts",
    "description": "Description"
  },
  "weakness": "type de faiblesse",
  "resistance": "type de résistance",
  "retreatCost": 1,
  "illustrator": "Prénom de l'enfant"
}

Réponds UNIQUEMENT avec le JSON valide, sans commentaire.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: imageInfo.mimeType,
            data: imageInfo.data,
          },
        },
        prompt,
      ],
      config: { responseMimeType: 'application/json' },
    });

    const responseText = response.text || '';
    const cleanedJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed: GeminiExtractionResult = JSON.parse(cleanedJson);
    return normalizeExtraction(parsed);
  } catch (error) {
    console.error('Erreur lors de la lecture de la feuille via Gemini:', error);
    const detail = error instanceof Error ? error.message.slice(0, 300) : String(error);
    throw new Error(
      `Impossible d'analyser la feuille d'attaques. Vérifiez la photo ou votre clé API. Détail : ${detail}`
    );
  }
}

/**
 * Returns the exact original drawing image cleanly without adding artificial background shapes or artifacts
 */
export async function stylizeDrawingImage(
  drawingBase64Url: string,
  _pokemonName: string = 'Mon Pokémon',
  _pokemonType: PokemonType = 'fire',
  _customApiKey?: string
): Promise<string> {
  // Pure drawing image without any synthetic canvas background effects
  return drawingBase64Url;
}
