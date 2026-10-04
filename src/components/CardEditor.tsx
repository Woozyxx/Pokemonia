import React from 'react';
import type { PokemonCardData, PokemonType, CardStage, CardRarity, CardEra } from '../types';
import { typeThemeMap } from './PokemonCard';
import { Sliders, Sparkles, User, Zap, Layers, RefreshCw, Layout } from 'lucide-react';

interface CardEditorProps {
  data: PokemonCardData;
  onChange: (newData: PokemonCardData) => void;
  onResetImageAdjustments: () => void;
}

const allTypes: PokemonType[] = [
  'fire',
  'water',
  'grass',
  'lightning',
  'psychic',
  'fighting',
  'darkness',
  'metal',
  'dragon',
  'colorless',
];

export const CardEditor: React.FC<CardEditorProps> = ({
  data,
  onChange,
  onResetImageAdjustments,
}) => {
  const updateField = <K extends keyof PokemonCardData>(field: K, value: PokemonCardData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateAttack = (
    attackKey: 'attack1' | 'attack2',
    field: string,
    value: any
  ) => {
    onChange({
      ...data,
      [attackKey]: {
        ...data[attackKey],
        [field]: value,
      },
    });
  };

  const toggleEnergyType = (
    attackKey: 'attack1' | 'attack2',
    typeToToggle: PokemonType
  ) => {
    const currentEnergies = data[attackKey].energy;
    let newEnergies: PokemonType[];

    if (currentEnergies.includes(typeToToggle)) {
      const index = currentEnergies.indexOf(typeToToggle);
      newEnergies = [...currentEnergies];
      newEnergies.splice(index, 1);
    } else {
      if (currentEnergies.length < 4) {
        newEnergies = [...currentEnergies, typeToToggle];
      } else {
        newEnergies = currentEnergies;
      }
    }

    updateAttack(attackKey, 'energy', newEnergies);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md text-slate-100 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            2. Éditeur de Carte Pokémon
          </h2>
          <p className="text-xs text-slate-400">
            Cartes officielles certifiées PokéCardMaker (Cadres PNG HD & Icônes TCG).
          </p>
        </div>
      </div>

      {/* Style & Era Selection */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Layout className="w-4 h-4 text-amber-400" /> Style de Modèle Officiel (Génération TCG)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'scarletAndViolet', label: 'Écarlate & Violet' },
            { id: 'swordAndShield', label: 'Épée & Bouclier' },
            { id: 'sunAndMoon', label: 'Soleil & Lune' },
          ].map((era) => (
            <button
              key={era.id}
              type="button"
              onClick={() => updateField('era', era.id as CardEra)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                (data.era || 'scarletAndViolet') === era.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {era.label}
            </button>
          ))}
        </div>
      </div>

      {/* Element Type Selector */}
      <div>
        <label className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
          Élément & Type de Carte
        </label>
        <div className="grid grid-cols-5 gap-2">
          {allTypes.map((t) => {
            const isSelected = data.type === t;
            const theme = typeThemeMap[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => updateField('type', t)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 border flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? `${theme.badgeBg} ring-2 ring-amber-400 shadow-md border-amber-300 scale-105`
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">Nom du Pokémon</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            placeholder="ex: Pyrodraco"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">Points de Vie (PV)</label>
          <input
            type="text"
            value={data.hp}
            onChange={(e) => updateField('hp', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
            placeholder="ex: 120"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">Niveau / Stage</label>
          <select
            value={data.stage}
            onChange={(e) => updateField('stage', e.target.value as CardStage)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          >
            <option value="Basic">De Base</option>
            <option value="Stage 1">Niveau 1</option>
            <option value="Stage 2">Niveau 2</option>
            <option value="EX">EX</option>
            <option value="VMAX">VMAX</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Créateur / Enfant
          </label>
          <input
            type="text"
            value={data.illustrator}
            onChange={(e) => updateField('illustrator', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            placeholder="ex: Dessiné par Thomas"
          />
        </div>
      </div>

      {/* Attacks Section */}
      <div className="space-y-4 border-t border-slate-800 pt-4">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Attaques Customisées
        </h3>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Attaque #1</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 mr-1">Énergies:</span>
              {allTypes.slice(0, 6).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleEnergyType('attack1', t)}
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    data.attack1.energy.includes(t)
                      ? 'bg-amber-400 text-slate-950 scale-110 ring-2 ring-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Ajouter/Retirer énergie ${t}`}
                >
                  {typeThemeMap[t].label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                value={data.attack1.name}
                onChange={(e) => updateAttack('attack1', 'name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="Nom de l'attaque 1"
              />
            </div>
            <div>
              <input
                type="text"
                value={data.attack1.damage}
                onChange={(e) => updateAttack('attack1', 'damage', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                placeholder="Dégâts (ex: 60)"
              />
            </div>
          </div>

          <textarea
            value={data.attack1.description}
            onChange={(e) => updateAttack('attack1', 'description', e.target.value)}
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
            placeholder="Effet ou description de l'attaque..."
          />
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Attaque #2 (Optionnelle)</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 mr-1">Énergies:</span>
              {allTypes.slice(0, 6).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleEnergyType('attack2', t)}
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    data.attack2.energy.includes(t)
                      ? 'bg-amber-400 text-slate-950 scale-110 ring-2 ring-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Ajouter/Retirer énergie ${t}`}
                >
                  {typeThemeMap[t].label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                value={data.attack2.name}
                onChange={(e) => updateAttack('attack2', 'name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="Nom de l'attaque 2"
              />
            </div>
            <div>
              <input
                type="text"
                value={data.attack2.damage}
                onChange={(e) => updateAttack('attack2', 'damage', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                placeholder="Dégâts (ex: 120)"
              />
            </div>
          </div>

          <textarea
            value={data.attack2.description}
            onChange={(e) => updateAttack('attack2', 'description', e.target.value)}
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
            placeholder="Effet ou description..."
          />
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Positionnement & Zoom de l'Illustration
          </span>
          <button
            type="button"
            onClick={onResetImageAdjustments}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline"
          >
            <RefreshCw className="w-3 h-3" /> Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Zoom</span>
              <span>{Math.round(data.imageZoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={data.imageZoom}
              onChange={(e) => updateField('imageZoom', parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Position Horizontale</span>
              <span>{data.imageOffsetX}px</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="1"
              value={data.imageOffsetX}
              onChange={(e) => updateField('imageOffsetX', parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Position Verticale</span>
              <span>{data.imageOffsetY}px</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="1"
              value={data.imageOffsetY}
              onChange={(e) => updateField('imageOffsetY', parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.isHolo}
            onChange={(e) => updateField('isHolo', e.target.checked)}
            className="w-4 h-4 rounded accent-amber-400"
          />
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Effet Holographique (Brillance Foil)
          </span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Rareté:</span>
          <select
            value={data.rarity}
            onChange={(e) => updateField('rarity', e.target.value as CardRarity)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="common">Commune (⚫)</option>
            <option value="uncommon">Peu Commune (🔷)</option>
            <option value="rare">Rare (⭐)</option>
            <option value="ultra-rare">Ultra Rare (✦)</option>
            <option value="secret-rare">Secrète (👑)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
