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

const TEXT_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash'];
const IMAGE_MODELS = ['gemini-2.5-flash-image'];
const RETRY_DELAYS_MS = [1500, 3500];

const isOverloaded = (error: unknown): boolean => {
  const text = error instanceof Error ? error.message : String(error);
  return /(429|500|503)|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(text);
};

/** Réessaie quand Gemini est surchargé (503/429), puis bascule sur un modèle de secours. */
async function generateWithRetry<T>(
  request: (model: string) => Promise<T>,
  models: string[] = TEXT_MODELS
): Promise<T> {
  let lastError: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await request(model);
      } catch (error) {
        lastError = error;
        if (!isOverloaded(error)) throw error;
        if (attempt < RETRY_DELAYS_MS.length) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        }
      }
    }
  }
  throw lastError;
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

  const request = (model: string) =>
    ai.models.generateContent({
      model,
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

  try {
    const response = await generateWithRetry(request);

    const responseText = response.text || '';
    const cleanedJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed: GeminiExtractionResult = JSON.parse(cleanedJson);
    return normalizeExtraction(parsed);
  } catch (error) {
    console.error('Erreur lors de la lecture de la feuille via Gemini:', error);
    if (isOverloaded(error)) {
      throw new Error(
        "Gemini est surchargé en ce moment (plusieurs essais effectués). Réessaie dans une minute en cliquant à nouveau sur « Générer »."
      );
    }
    const detail = error instanceof Error ? error.message.slice(0, 300) : String(error);
    throw new Error(
      `Impossible d'analyser la feuille d'attaques. Vérifiez la photo ou votre clé API. Détail : ${detail}`
    );
  }
}

export const DEFAULT_STYLIZE_PROMPT = `En te basant sur ce dessin d'enfant, reproduis fidèlement les traits, la forme générale, les proportions et les éléments distinctifs du Pokémon imaginé. Applique un style artistique Pokémon hautement détaillé et stylisé, rappelant les illustrations de cartes officielles, mais en conservant l'esprit et l'originalité du dessin initial. Apporte de légères améliorations visuelles en termes de netteté, de couleurs vives et contrastées, avec des effets de lumière et d'ombre dynamiques pour lui donner un aspect professionnel. Le Pokémon est représenté en pleine action ou dans une pose emblématique, occupant le centre de l'image. Le fond est un dégradé de couleurs harmonieux et stylisé, avec des formes abstraites ou des motifs discrets qui évoquent le type ou l'environnement du Pokémon (par exemple, des volutes de feu pour un Pokémon de feu, des bulles et vagues pour un Pokémon d'eau, des motifs de feuilles pour un Pokémon de plante). Ce fond doit être entièrement rempli de couleurs et de motifs stylisés, sans laisser de grandes zones blanches, et doit rester simple et non distrayant. L'image doit se concentrer uniquement sur le Pokémon et son fond stylisé, sans aucun texte, symbole ou cadre de carte. Le rendu final doit être une illustration complète, de haute résolution, avec un ratio d'aspect standard 16:9, et ne doit absolument pas être une image rognée, miniature ou intégrée dans un cadre de carte Pokémon. Elle doit être prête à être éditée et placée manuellement dans un cadre de carte Pokémon séparé.`;

/**
 * Redessine le dessin de l'enfant dans un style Pokémon officiel via un modèle d'image Gemini.
 * Lance une erreur si aucune image n'est renvoyée (l'appelant garde alors le dessin d'origine).
 */
export async function stylizeDrawingImage(
  drawingBase64Url: string,
  pokemonName: string = 'Mon Pokémon',
  pokemonType: PokemonType = 'fire',
  customApiKey?: string,
  customPrompt: string = DEFAULT_STYLIZE_PROMPT
): Promise<string> {
  const apiKey = getApiKey(customApiKey);
  if (!apiKey) {
    throw new Error("Clé API Gemini manquante. Veuillez configurer votre clé dans l'application.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const imageInfo = parseDataUrl(drawingBase64Url);
  const prompt = `${customPrompt}

Indications : ce Pokémon s'appelle « ${pokemonName} » et il est de type ${pokemonType}.`;

  try {
    const response = await generateWithRetry(
      (model) =>
        ai.models.generateContent({
          model,
          contents: [{ inlineData: { mimeType: imageInfo.mimeType, data: imageInfo.data } }, prompt],
          config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
        }),
      IMAGE_MODELS
    );

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("Gemini n'a renvoyé aucune image.");
    }
    const mime = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mime};base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("Erreur lors de la génération du visuel via Gemini:", error);
    if (isOverloaded(error)) {
      throw new Error("Gemini est surchargé en ce moment. Réessaie dans une minute.");
    }
    const detail = error instanceof Error ? error.message.slice(0, 300) : String(error);
    throw new Error(`Impossible de générer le visuel Pokémon. Détail : ${detail}`);
  }
}
