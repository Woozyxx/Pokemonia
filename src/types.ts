export type PokemonType = 
  | 'fire'
  | 'water'
  | 'grass'
  | 'lightning'
  | 'psychic'
  | 'fighting'
  | 'darkness'
  | 'metal'
  | 'dragon'
  | 'colorless';

export type CardStage = 'Basic' | 'Stage 1' | 'Stage 2' | 'EX' | 'VMAX';

export type CardEra = 'scarletAndViolet' | 'swordAndShield' | 'sunAndMoon';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'ultra-rare' | 'secret-rare';

export interface CardAttack {
  name: string;
  energy: PokemonType[];
  damage: string;
  description: string;
}

export interface PokemonCardData {
  id: string;
  name: string;
  hp: string;
  type: PokemonType;
  era: CardEra;
  stage: CardStage;
  evolvesFrom?: string;
  artworkUrl: string;
  originalDrawingUrl?: string;
  statsSheetUrl?: string;
  attack1: CardAttack;
  attack2: CardAttack;
  weakness: PokemonType | 'none';
  weaknessValue: string;
  resistance: PokemonType | 'none';
  resistanceValue: string;
  retreatCost: number; // 0 to 4
  illustrator: string;
  pokedexNumber: string;
  rarity: CardRarity;
  isHolo: boolean;
  imageZoom: number;
  imageOffsetX: number;
  imageOffsetY: number;
  createdAt: number;
}

export interface GeminiExtractionResult {
  name?: string;
  hp?: string;
  type?: PokemonType;
  stage?: CardStage;
  evolvesFrom?: string;
  attack1?: {
    name?: string;
    energyTypes?: PokemonType[];
    damage?: string;
    description?: string;
  };
  attack2?: {
    name?: string;
    energyTypes?: PokemonType[];
    damage?: string;
    description?: string;
  };
  weakness?: PokemonType;
  resistance?: PokemonType;
  retreatCost?: number;
  illustrator?: string;
}
