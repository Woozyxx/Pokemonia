import React, { useState } from 'react';
import { Sparkles, Key, FolderOpen, Save, Check } from 'lucide-react';

interface HeaderProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  savedCardsCount: number;
  onOpenGallery: () => void;
  onSaveCurrentCard: () => void;
  isCardSaved: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  onSaveApiKey,
  savedCardsCount,
  onOpenGallery,
  onSaveCurrentCard,
  isCardSaved,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleKeySave = () => {
    onSaveApiKey(tempKey);
    setShowKeyModal(false);
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              PokéCard <span className="text-amber-400">Studio</span>
            </h1>
            <p className="text-[10px] text-slate-400">Numérisation & Impression A4 (63x88mm)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Save current card */}
          <button
            onClick={onSaveCurrentCard}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isCardSaved
                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
            }`}
          >
            {isCardSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isCardSaved ? 'Sauvegardée !' : 'Enregistrer'}</span>
          </button>

          {/* Gallery Button */}
          <button
            onClick={onOpenGallery}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Galerie</span>
            <span className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded-md text-[10px]">
              {savedCardsCount}
            </span>
          </button>

          {/* Key Settings Button */}
          <button
            onClick={() => {
              setTempKey(apiKey);
              setShowKeyModal(true);
            }}
            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
              apiKey
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-rose-950 border-rose-800 text-rose-300 animate-pulse'
            }`}
            title="Clé API Gemini"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" /> Clé API Google Gemini
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              La clé API permet d'utiliser l'IA Gemini pour lire l'écriture manuscrite des attaques et styliser l'illustration.
            </p>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AQ.Ab8RN..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleKeySave}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
              >
                Enregistrer la clé
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
