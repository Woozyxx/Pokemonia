import React from 'react';
import type { PokemonCardData } from '../types';
import { PokemonCard } from './PokemonCard';
import { X, Trash2, FolderOpen, Calendar, Sparkles } from 'lucide-react';

interface SavedCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCards: PokemonCardData[];
  onSelectCard: (card: PokemonCardData) => void;
  onDeleteCard: (id: string) => void;
}

export const SavedCardsModal: React.FC<SavedCardsModalProps> = ({
  isOpen,
  onClose,
  savedCards,
  onSelectCard,
  onDeleteCard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Galerie des Cartes Enregistrées</h3>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">
              {savedCards.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {savedCards.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
              <p className="text-base font-semibold text-slate-300">Aucune carte enregistrée pour l'instant</p>
              <p className="text-xs text-slate-500 mt-1">
                Créez votre première carte et cliquez sur "Enregistrer dans la galerie".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-amber-500/50 transition-all duration-200 group"
                >
                  <div className="cursor-pointer transform hover:scale-105 transition-transform" onClick={() => { onSelectCard(card); onClose(); }}>
                    <PokemonCard data={card} scale={0.7} />
                  </div>

                  <div className="w-full flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(card.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { onSelectCard(card); onClose(); }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md font-semibold text-[11px]"
                      >
                        Ouvrir
                      </button>

                      <button
                        onClick={() => onDeleteCard(card.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
