import { useState, useEffect } from 'react';
import type { PokemonCardData, GeminiExtractionResult } from './types';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { CardEditor } from './components/CardEditor';
import { PokemonCard } from './components/PokemonCard';
import { PrintStudio } from './components/PrintStudio';
import { SavedCardsModal } from './components/SavedCardsModal';
import { PokeCardMakerEmbed } from './components/PokeCardMakerEmbed';
import { PhoneImporter, PhoneSender } from './components/PhoneImporter';
import type { PhoneKind } from './components/PhoneImporter';
import { extractStatsFromSheet, getApiKey } from './services/geminiService';
import confetti from 'canvas-confetti';
import { Eye, Edit3, Printer, Globe } from 'lucide-react';

const initialDefaultCard: PokemonCardData = {
  id: 'default-1',
  name: 'Pyrodraco',
  hp: '120',
  type: 'fire',
  era: 'scarletAndViolet',
  stage: 'Basic',
  artworkUrl: '',
  attack1: {
    name: 'Flamme Fulgurante',
    energy: ['fire', 'colorless'],
    damage: '60',
    description: 'Lancez une pièce. Si c\'est face, le Pokémon adverse est maintenant Brûlé.',
  },
  attack2: {
    name: 'Éruption Solaire',
    energy: ['fire', 'fire', 'colorless'],
    damage: '120',
    description: 'Défaussez 1 énergie Feu rattachée à ce Pokémon.',
  },
  weakness: 'water',
  weaknessValue: 'x2',
  resistance: 'grass',
  resistanceValue: '-30',
  retreatCost: 2,
  illustrator: 'Dessiné par un enfant super fort',
  pokedexNumber: '025',
  rarity: 'rare',
  isHolo: true,
  imageZoom: 1,
  imageOffsetX: 0,
  imageOffsetY: 0,
  createdAt: Date.now(),
};

function PcApp() {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('pokecard_gemini_key') || getApiKey();
  });

  const [drawingUrl, setDrawingUrl] = useState<string>('');
  const [statsSheetUrl, setStatsSheetUrl] = useState<string>('');
  const [cardData, setCardData] = useState<PokemonCardData>(initialDefaultCard);

  const [savedCards, setSavedCards] = useState<PokemonCardData[]>(() => {
    try {
      const stored = localStorage.getItem('pokecard_saved_cards');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [printQueue, setPrintQueue] = useState<PokemonCardData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'pokecardmaker' | 'print'>('pokecardmaker');

  useEffect(() => {
    localStorage.setItem('pokecard_saved_cards', JSON.stringify(savedCards));
  }, [savedCards]);

  const handlePhonePhoto = (kind: PhoneKind, url: string) => {
    if (kind === 'drawing') {
      setDrawingUrl(url);
      setCardData((prev) => (prev.artworkUrl ? prev : { ...prev, artworkUrl: url }));
    } else {
      setStatsSheetUrl(url);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('pokecard_gemini_key', key);
  };

  const handleSaveCurrentCard = () => {
    const existingIndex = savedCards.findIndex((c) => c.id === cardData.id);
    let updated: PokemonCardData[];
    if (existingIndex >= 0) {
      updated = [...savedCards];
      updated[existingIndex] = { ...cardData, createdAt: Date.now() };
    } else {
      updated = [{ ...cardData, id: 'card-' + Date.now(), createdAt: Date.now() }, ...savedCards];
    }
    setSavedCards(updated);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
  };

  const handleDeleteCard = (id: string) => {
    setSavedCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleProcessGemini = async () => {
    if (!drawingUrl && !statsSheetUrl) return;

    setIsProcessing(true);
    setErrorMessage(null);
    let ext: GeminiExtractionResult = {};

    try {
      if (statsSheetUrl) {
        setProcessingMessage('Lecture des attaques & PV sur la photo via Gemini...');
        try {
          ext = await extractStatsFromSheet(statsSheetUrl, apiKey);
        } catch (ocrErr) {
          console.warn("L'OCR a échoué, poursuite avec les valeurs actuelles.", ocrErr);
          setErrorMessage(
            ocrErr instanceof Error
              ? ocrErr.message
              : "La lecture de la feuille a échoué : les valeurs actuelles de la carte ont été conservées."
          );
        }
      }

      const updatedCard: PokemonCardData = {
        ...cardData,
        // Relancer sur une carte déjà créée la met à jour au lieu d'en créer une nouvelle.
        id: cardData.id === initialDefaultCard.id ? 'card-' + Date.now() : cardData.id,
        name: ext.name || cardData.name,
        hp: ext.hp || cardData.hp,
        type: ext.type || cardData.type,
        stage: ext.stage || cardData.stage,
        artworkUrl: drawingUrl || cardData.artworkUrl,
        originalDrawingUrl: drawingUrl || cardData.originalDrawingUrl,
        statsSheetUrl: statsSheetUrl || cardData.statsSheetUrl,
        attack1: ext.attack1
          ? {
              name: ext.attack1.name || cardData.attack1.name,
              energy: ext.attack1.energyTypes?.length ? ext.attack1.energyTypes : cardData.attack1.energy,
              damage: ext.attack1.damage || cardData.attack1.damage,
              description: ext.attack1.description || cardData.attack1.description,
            }
          : cardData.attack1,
        attack2: ext.attack2
          ? {
              name: ext.attack2.name || cardData.attack2.name,
              energy: ext.attack2.energyTypes?.length ? ext.attack2.energyTypes : cardData.attack2.energy,
              damage: ext.attack2.damage || cardData.attack2.damage,
              description: ext.attack2.description || cardData.attack2.description,
            }
          : cardData.attack2,
        weakness: ext.weakness || cardData.weakness,
        resistance: ext.resistance || cardData.resistance,
        retreatCost: typeof ext.retreatCost === 'number' ? ext.retreatCost : cardData.retreatCost,
        illustrator: ext.illustrator || cardData.illustrator,
        createdAt: Date.now(),
      };

      setCardData(updatedCard);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Erreur durant la création:', err);
      setErrorMessage("Une erreur s'est produite lors du traitement. Vérifiez votre clé API.");
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const isCardSaved = savedCards.some((c) => c.id === cardData.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <Header
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        savedCardsCount={savedCards.length}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onSaveCurrentCard={handleSaveCurrentCard}
        isCardSaved={isCardSaved}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PhoneImporter onPhoto={handlePhonePhoto} />

        <PhotoUploader
          drawingUrl={drawingUrl}
          statsSheetUrl={statsSheetUrl}
          onDrawingChange={(url) => {
            setDrawingUrl(url);
            if (!cardData.artworkUrl) {
              setCardData((prev) => ({ ...prev, artworkUrl: url }));
            }
          }}
          onStatsSheetChange={(url) => setStatsSheetUrl(url)}
          onProcessGemini={handleProcessGemini}
          isProcessing={isProcessing}
          processingMessage={processingMessage}
          hasApiKey={!!apiKey}
        />

        {errorMessage && (
          <div role="alert" className="flex items-start justify-between gap-3 bg-rose-950/60 border border-rose-700/60 text-rose-200 rounded-xl px-4 py-3 text-sm no-print">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white font-bold" aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('pokecardmaker')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'pokecardmaker'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" /> PokéCardGenerator.com (FR Direct)
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'editor'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Edit3 className="w-4 h-4" /> Éditeur Local
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'print'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" /> Studio Impression A4 (63x88mm)
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'pokecardmaker' ? (
          <PokeCardMakerEmbed
            cardData={cardData}
            onGoToPrintStudio={() => setActiveTab('print')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              {activeTab === 'editor' ? (
                <CardEditor
                  data={cardData}
                  onChange={(newData) => setCardData(newData)}
                  onResetImageAdjustments={() =>
                    setCardData((prev) => ({
                      ...prev,
                      imageZoom: 1,
                      imageOffsetX: 0,
                      imageOffsetY: 0,
                    }))
                  }
                />
              ) : (
                <PrintStudio
                  currentCard={cardData}
                  printQueue={printQueue}
                  onAddToQueue={(card) => setPrintQueue((prev) => [...prev, card])}
                  onRemoveFromQueue={(idx) =>
                    setPrintQueue((prev) => prev.filter((_, i) => i !== idx))
                  }
                  onClearQueue={() => setPrintQueue([])}
                />
              )}
            </div>

            <div className="lg:col-span-5 sticky top-24 no-print flex flex-col items-center justify-center">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md w-full flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-400" /> Aperçu Réel
                  </span>
                  <span className="text-[10px] bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                    Taille officielle 63 × 88 mm
                  </span>
                </div>

                <div className="my-2 transform hover:scale-[1.02] transition-transform duration-200">
                  <PokemonCard data={cardData} scale={1.25} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SavedCardsModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        savedCards={savedCards}
        onSelectCard={(selected) => setCardData(selected)}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  );
}

export default function App() {
  // Page ouverte depuis le QR code : mode « envoi de photos » minimal pour le téléphone.
  const phonePeerId = new URLSearchParams(window.location.search).get('phone');
  if (phonePeerId) return <PhoneSender peerId={phonePeerId} />;
  return <PcApp />;
}
