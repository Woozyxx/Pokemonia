import React from 'react';
import type { PokemonCardData, PokemonType } from '../types';
import { ExternalLink, Copy, Check, Image as ImageIcon, Sparkles, Printer } from 'lucide-react';

interface PokeCardMakerEmbedProps {
  cardData: PokemonCardData;
  onGoToPrintStudio?: () => void;
}

const GENERATOR_URL = 'https://www.pokecardgenerator.com/fr';

const typeLabelFr: Record<PokemonType | 'none', string> = {
  fire: 'Feu',
  water: 'Eau',
  grass: 'Plante',
  lightning: 'Électrique',
  psychic: 'Psy',
  fighting: 'Combat',
  darkness: 'Obscurité',
  metal: 'Métal',
  dragon: 'Dragon',
  colorless: 'Incolore',
  none: '',
};

const energyLabel = (energy: PokemonType[]) => energy.map((e) => typeLabelFr[e]).join(' + ');

interface Chip {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

function buildChips(card: PokemonCardData): Chip[] {
  const chips: Chip[] = [
    { id: 'name', label: 'Nom Pokémon', value: card.name },
    { id: 'hp', label: 'PV', value: card.hp },
    { id: 'type', label: 'Type', value: typeLabelFr[card.type] },
    { id: 'stage', label: 'Stade', value: card.stage },
    { id: 'atk1', label: 'Attaque 1', value: card.attack1.name },
    { id: 'en1', label: 'Énergies 1', value: energyLabel(card.attack1.energy) },
    { id: 'dmg1', label: 'Dégâts 1', value: card.attack1.damage },
    { id: 'desc1', label: 'Effet 1', value: card.attack1.description },
    { id: 'atk2', label: 'Attaque 2', value: card.attack2.name },
    { id: 'en2', label: 'Énergies 2', value: energyLabel(card.attack2.energy) },
    { id: 'dmg2', label: 'Dégâts 2', value: card.attack2.damage },
    { id: 'desc2', label: 'Effet 2', value: card.attack2.description },
    { id: 'weak', label: 'Faiblesse', value: card.weakness === 'none' ? '' : `${typeLabelFr[card.weakness]} ${card.weaknessValue}`.trim() },
    { id: 'res', label: 'Résistance', value: card.resistance === 'none' ? '' : `${typeLabelFr[card.resistance]} ${card.resistanceValue}`.trim() },
    { id: 'retreat', label: 'Retraite', value: String(card.retreatCost) },
    { id: 'illustrator', label: '👦 Prénom Enfant', value: card.illustrator, highlight: true },
  ];
  // On n'affiche que les champs réellement renseignés : pas de valeurs factices.
  return chips.filter((c) => c.value.trim() !== '');
}

export const PokeCardMakerEmbed: React.FC<PokeCardMakerEmbedProps> = ({
  cardData,
  onGoToPrintStudio,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [copyError, setCopyError] = React.useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [showFallback, setShowFallback] = React.useState(false);

  // Si le site refuse d'être affiché dans un cadre, onLoad peut ne jamais arriver :
  // on propose alors clairement l'ouverture dans un nouvel onglet.
  React.useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(null);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopyError("Copie impossible : autorise l'accès au presse-papiers dans le navigateur.");
    }
  };

  const handleDownloadArtwork = () => {
    if (!cardData.artworkUrl) return;
    const a = document.createElement('a');
    a.href = cardData.artworkUrl;
    a.download = `${cardData.name || 'pokemon'}-artwork.png`;
    a.click();
  };

  const chips = buildChips(cardData);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Helper Bar with Gemini OCR Extracted Stats */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Assistant Données Gemini IA → PokéCardGenerator.com
            </h3>
            <p className="text-xs text-slate-400">
              Copie les infos ci-dessous dans le site, télécharge la carte, puis importe-la dans le Studio d'Impression (63x88mm).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cardData.artworkUrl && (
            <button
              onClick={handleDownloadArtwork}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <ImageIcon className="w-4 h-4" /> Télécharger l'Image du Dessin
            </button>
          )}

          {onGoToPrintStudio && (
            <button
              onClick={onGoToPrintStudio}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" /> Studio Impression A4 (63x88mm)
            </button>
          )}

          <a
            href={GENERATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" /> Ouvrir dans un nouvel onglet
          </a>
        </div>
      </div>

      {/* Quick Copy Chips */}
      {chips.length === 0 ? (
        <p className="text-xs text-slate-400">
          Aucune donnée à copier pour l'instant : envoie la feuille de stats et lance la lecture, ou remplis l'éditeur local.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => copyToClipboard(chip.value, chip.id)}
              title={chip.value}
              className={`p-2 bg-slate-900 border rounded-xl text-left transition-all group ${
                chip.highlight ? 'border-emerald-500/40 hover:border-emerald-400' : 'border-slate-800 hover:border-amber-400'
              }`}
            >
              <span className={`text-[10px] block font-semibold ${chip.highlight ? 'text-emerald-400' : 'text-slate-400'}`}>
                {chip.label}
              </span>
              <span className={`text-xs font-bold flex items-center justify-between gap-1 ${chip.highlight ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span className="truncate">{chip.value}</span>
                {copiedField === chip.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      {copyError && <p className="text-xs text-rose-400">{copyError}</p>}

      {showFallback && !iframeLoaded && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <span>Le site ne semble pas s'afficher ici (il peut refuser l'intégration). Ouvre-le dans un nouvel onglet.</span>
          <a
            href={GENERATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" /> Ouvrir PokéCardGenerator
          </a>
        </div>
      )}

      {/* Embedded Generator iFrame targeting https://www.pokecardgenerator.com/fr */}
      <div className="w-full h-[70vh] min-h-[480px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <iframe
          src={GENERATOR_URL}
          title="PokéCardGenerator.com Français"
          className="w-full h-full border-0"
          allow="downloads; clipboard-write; clipboard-read"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
};
