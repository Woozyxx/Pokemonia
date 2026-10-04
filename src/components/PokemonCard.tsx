import React from 'react';
import type { PokemonCardData, PokemonType } from '../types';

interface PokemonCardProps {
  data: PokemonCardData;
  scale?: number;
  className?: string;
  isPrintVersion?: boolean;
}

export function getOfficialEnergyIconUrl(type: PokemonType): string {
  const iconName = type === 'darkness' ? 'dark' : type;
  return `https://cdn.customcardmaker.net/web/pokecardmaker/assets/icons/types/scarletAndViolet/${iconName}.png`;
}

export const typeThemeMap: Record<
  PokemonType,
  {
    headerBg: string;
    bodyBg: string;
    footerBg: string;
    badgeBg: string;
    label: string;
  }
> = {
  fire: {
    headerBg: 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white',
    bodyBg: 'bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500',
    footerBg: 'bg-amber-400',
    badgeBg: 'bg-red-600 text-white',
    label: 'Feu 🔥',
  },
  water: {
    headerBg: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white',
    bodyBg: 'bg-gradient-to-b from-sky-300 via-blue-400 to-sky-400',
    footerBg: 'bg-sky-400',
    badgeBg: 'bg-blue-600 text-white',
    label: 'Eau 💧',
  },
  grass: {
    headerBg: 'bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-600 text-white',
    bodyBg: 'bg-gradient-to-b from-emerald-300 via-green-400 to-lime-400',
    footerBg: 'bg-emerald-400',
    badgeBg: 'bg-emerald-600 text-white',
    label: 'Plante 🌿',
  },
  lightning: {
    headerBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950',
    bodyBg: 'bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-400',
    footerBg: 'bg-amber-400',
    badgeBg: 'bg-yellow-500 text-slate-950',
    label: 'Électrik ⚡',
  },
  psychic: {
    headerBg: 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white',
    bodyBg: 'bg-gradient-to-b from-purple-300 via-fuchsia-400 to-pink-400',
    footerBg: 'bg-purple-400',
    badgeBg: 'bg-purple-600 text-white',
    label: 'Psy 👁️',
  },
  fighting: {
    headerBg: 'bg-gradient-to-r from-amber-800 via-stone-600 to-amber-800 text-white',
    bodyBg: 'bg-gradient-to-b from-amber-500 via-stone-600 to-orange-600',
    footerBg: 'bg-amber-600',
    badgeBg: 'bg-amber-800 text-white',
    label: 'Combat 🥊',
  },
  darkness: {
    headerBg: 'bg-gradient-to-r from-slate-900 via-zinc-800 to-slate-900 text-white',
    bodyBg: 'bg-gradient-to-b from-slate-600 via-zinc-700 to-slate-800',
    footerBg: 'bg-slate-700',
    badgeBg: 'bg-slate-900 text-white',
    label: 'Obscurité 🌙',
  },
  metal: {
    headerBg: 'bg-gradient-to-r from-slate-500 via-gray-400 to-slate-500 text-white',
    bodyBg: 'bg-gradient-to-b from-slate-200 via-gray-300 to-zinc-300',
    footerBg: 'bg-slate-300',
    badgeBg: 'bg-slate-600 text-white',
    label: 'Métal ⚙️',
  },
  dragon: {
    headerBg: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950',
    bodyBg: 'bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-400',
    footerBg: 'bg-amber-400',
    badgeBg: 'bg-gradient-to-r from-amber-600 to-purple-600 text-white',
    label: 'Dragon 🐉',
  },
  colorless: {
    headerBg: 'bg-gradient-to-r from-slate-300 via-stone-200 to-slate-300 text-slate-950',
    bodyBg: 'bg-gradient-to-b from-slate-200 via-zinc-200 to-stone-200',
    footerBg: 'bg-slate-300',
    badgeBg: 'bg-slate-400 text-slate-900',
    label: 'Incolore ⭐',
  },
};

export const EnergyIcon: React.FC<{ type: PokemonType; size?: 'sm' | 'md' | 'lg' }> = ({
  type,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7',
  };

  const iconUrl = getOfficialEnergyIconUrl(type);

  return (
    <img
      src={iconUrl}
      alt={type}
      className={`inline-block object-contain drop-shadow-sm select-none shrink-0 ${sizeClasses[size]}`}
      onError={(e) => {
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
};

export const PokemonCard: React.FC<PokemonCardProps> = ({
  data,
  scale = 1,
  className = '',
  isPrintVersion = false,
}) => {
  const theme = typeThemeMap[data.type] || typeThemeMap.dragon;

  return (
    <div
      className={`relative select-none overflow-hidden rounded-[16px] shadow-2xl transition-all duration-200 bg-slate-950 font-pokecard-body border-2 border-slate-400 ${
        isPrintVersion ? 'pokemon-card-printable' : ''
      } ${className}`}
      style={{
        width: isPrintVersion ? '63mm' : `${252 * scale}px`,
        height: isPrintVersion ? '88mm' : `${352 * scale}px`,
        fontSize: isPrintVersion ? '9px' : `${11 * scale}px`,
      }}
    >
      {/* Outer Metallic Silver Border (Scarlet & Violet Style) */}
      <div className="w-full h-full p-[3.5%] bg-gradient-to-b from-gray-200 via-slate-300 to-gray-400 rounded-[16px] shadow-2xl flex flex-col justify-between relative border border-slate-400 overflow-hidden">
        {/* Holographic foil overlay if enabled */}
        {data.isHolo && (
          <div className="absolute inset-0 holo-foil pointer-events-none z-30 rounded-[14px]" />
        )}

        {/* Inner Card Frame Container */}
        <div className="w-full h-full rounded-[10px] bg-slate-950 p-[1.5px] flex flex-col justify-between shadow-inner relative overflow-hidden">
          <div className={`w-full h-full rounded-[8px] ${theme.bodyBg} flex flex-col justify-between relative overflow-hidden shadow-inner`}>
            
            {/* 1. Header Bar (BASIC badge, Name, PV, HP, Energy Icon) */}
            <div className={`relative h-[11%] ${theme.headerBg} border-b border-slate-900/30 flex items-center justify-between px-[3%] shadow-xs z-10`}>
              <div className="flex items-center gap-2 min-w-0">
                {/* Slanted BASIC Badge */}
                <div className="bg-gradient-to-r from-slate-300 via-gray-100 to-slate-300 text-slate-800 font-black italic text-[58%] px-2.5 py-0.5 rounded-r-md border-r-2 border-slate-400 shadow-xs uppercase tracking-wider transform -skew-x-12 shrink-0">
                  <span className="inline-block transform skew-x-12">{data.stage === 'Basic' ? 'BASIC' : data.stage}</span>
                </div>

                {/* Pokémon Name */}
                <h2 className="font-pokecard-title text-slate-950 drop-shadow-xs text-[128%] tracking-tight truncate leading-none">
                  {data.name || 'Crystal'}
                </h2>
              </div>

              {/* HP & Energy Icon (PV + 190 + Energy Icon) */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[64%] font-black text-slate-950 mr-0.5">PV</span>
                <span className="font-pokecard-title font-black text-slate-950 text-[130%] tracking-tighter mr-1">
                  {data.hp || '190'}
                </span>
                <EnergyIcon type={data.type} size="md" />
              </div>
            </div>

            {/* 2. Picture Window */}
            <div className="relative w-full h-[41%] bg-slate-900 border-y-2 border-slate-400/80 overflow-hidden flex items-center justify-center shrink-0">
              {data.artworkUrl ? (
                <img
                  src={data.artworkUrl}
                  alt={data.name}
                  className="w-full h-full object-cover transition-transform duration-100"
                  style={{
                    transform: `scale(${data.imageZoom || 1}) translate(${data.imageOffsetX || 0}px, ${data.imageOffsetY || 0}px)`,
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <span className="text-3xl mb-1">🖼️</span>
                  <span className="text-[85%] font-semibold">Dessin du Pokémon</span>
                </div>
              )}

              {/* Metallic Silver Horizontal Bar under picture */}
              <div className="absolute bottom-0 inset-x-0 h-[4px] bg-gradient-to-r from-gray-300 via-white to-gray-400 rounded-r-full shadow-xs border-t border-slate-400/60" />
            </div>

            {/* 3. Attacks Box */}
            <div className="flex-1 flex flex-col justify-evenly py-[2%] px-[5%] z-10">
              {/* Attack 1 */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between font-pokecard-title text-slate-950">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 items-center shrink-0 min-w-[32px]">
                      {data.attack1.energy.map((eType, idx) => (
                        <EnergyIcon key={idx} type={eType} size="md" />
                      ))}
                    </div>
                    <span className="font-pokecard-title font-black text-[110%] tracking-tight">
                      {data.attack1.name || 'Rayon Crystallin'}
                    </span>
                  </div>
                  <span className="font-pokecard-title font-black text-[130%] text-slate-950 shrink-0">
                    {data.attack1.damage || '70'}
                  </span>
                </div>
                {data.attack1.description && (
                  <p className="text-[72%] text-slate-900 leading-tight mt-0.5 font-medium line-clamp-2 pl-[36px]">
                    {data.attack1.description}
                  </p>
                )}
              </div>

              {/* Attack 2 */}
              {data.attack2 && (data.attack2.name || data.attack2.damage) && (
                <div className="flex flex-col justify-center">
                  <div className="flex items-center justify-between font-pokecard-title text-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 items-center shrink-0 min-w-[32px]">
                        {data.attack2.energy.map((eType, idx) => (
                          <EnergyIcon key={idx} type={eType} size="md" />
                        ))}
                      </div>
                      <span className="font-pokecard-title font-black text-[110%] tracking-tight">
                        {data.attack2.name || 'Rayon Signal'}
                      </span>
                    </div>
                    <span className="font-pokecard-title font-black text-[130%] text-slate-950 shrink-0">
                      {data.attack2.damage || '180'}
                    </span>
                  </div>
                  {data.attack2.description && (
                    <p className="text-[72%] text-slate-900 leading-tight mt-0.5 font-medium line-clamp-2 pl-[36px]">
                      {data.attack2.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 4. Bottom Footer Bar (Faiblesse | Resistance // Retraite + Metadata) */}
            <div className={`mt-auto border-t-2 border-slate-400/80 ${theme.footerBg} pt-[1%] pb-[2%] px-[3%] z-10 flex flex-col gap-1`}>
              
              {/* Weakness | Resistance // Retreat Row */}
              <div className="flex items-center justify-between text-[60%] font-pokecard-title text-slate-950 border-b border-slate-900/30 pb-1">
                {/* Faiblesse */}
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-900">Faiblesse</span>
                  {data.weakness !== 'none' ? (
                    <>
                      <EnergyIcon type={data.weakness} size="sm" />
                      <span className="font-black text-[105%]">{data.weaknessValue || 'x2'}</span>
                    </>
                  ) : (
                    <span className="font-bold">—</span>
                  )}
                </div>

                {/* Vertical Divider */}
                <span className="text-slate-700 font-semibold">|</span>

                {/* Resistance */}
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-900">Resistance</span>
                  {data.resistance !== 'none' ? (
                    <>
                      <EnergyIcon type={data.resistance} size="sm" />
                      <span className="font-black text-[105%]">{data.resistanceValue || '-30'}</span>
                    </>
                  ) : (
                    <span className="font-bold"></span>
                  )}
                </div>

                {/* Slanted Metallic Ribbon Divider */}
                <div className="h-3 w-4 bg-gradient-to-r from-gray-300 via-white to-gray-300 border-x border-slate-500 transform -skew-x-12 shadow-xs" />

                {/* Retraite */}
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-900">Retraite</span>
                  <div className="flex gap-0.5 items-center">
                    {Array.from({ length: data.retreatCost || 0 }).map((_, i) => (
                      <EnergyIcon key={i} type="colorless" size="sm" />
                    ))}
                    {(data.retreatCost || 0) === 0 && <span className="font-bold">—</span>}
                  </div>
                </div>
              </div>

              {/* Bottom Metadata Line: Illust. Victoria & Badge [MRC] 002 / 320 ⭐ */}
              <div className="flex flex-col gap-0.5 text-slate-950 pt-[1px]">
                <span className="italic font-bold text-[54%] leading-none">
                  Illust. {data.illustrator || 'Victoria'}
                </span>
                <div className="flex items-center gap-1.5 text-[54%] font-black leading-none">
                  <span className="bg-slate-900 text-white font-black text-[80%] px-1 py-0.5 rounded-xs tracking-tighter">
                    MRC
                  </span>
                  <span className="font-black tracking-tight">
                    {data.pokedexNumber || '002'} / 320 ⭐
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
