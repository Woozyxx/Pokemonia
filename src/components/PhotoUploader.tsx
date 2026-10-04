import React, { useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, FileText, RefreshCw } from 'lucide-react';

interface PhotoUploaderProps {
  drawingUrl: string;
  statsSheetUrl: string;
  onDrawingChange: (url: string) => void;
  onStatsSheetChange: (url: string) => void;
  onProcessGemini: () => void;
  isProcessing: boolean;
  processingMessage: string;
  hasApiKey: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  drawingUrl,
  statsSheetUrl,
  onDrawingChange,
  onStatsSheetChange,
  onProcessGemini,
  isProcessing,
  processingMessage,
  hasApiKey,
}) => {
  const drawingInputRef = useRef<HTMLInputElement>(null);
  const statsInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setter(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            1. Importer les 2 Photos
          </h2>
          <p className="text-sm text-slate-400">
            Télécharge le dessin et la feuille avec les attaques écrites par l'enfant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Photo 1 : Le Dessin du Pokémon
          </label>
          <div
            onClick={() => drawingInputRef.current?.click()}
            className={`relative h-56 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
              drawingUrl
                ? 'border-emerald-500/50 bg-slate-800/80'
                : 'border-slate-700 hover:border-emerald-500/80 bg-slate-950/50 hover:bg-slate-800/30'
            }`}
          >
            <input
              type="file"
              ref={drawingInputRef}
              onChange={(e) => handleFile(e, onDrawingChange)}
              accept="image/*"
              className="hidden"
            />

            {drawingUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={drawingUrl}
                  alt="Dessin du Pokémon"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                  <RefreshCw className="w-4 h-4" /> Changer l'image
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">
                  Cliquez ou glissez la photo du dessin
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP acceptés</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            Photo 2 : Feuille de Stats & Attaques
          </label>
          <div
            onClick={() => statsInputRef.current?.click()}
            className={`relative h-56 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
              statsSheetUrl
                ? 'border-amber-500/50 bg-slate-800/80'
                : 'border-slate-700 hover:border-amber-500/80 bg-slate-950/50 hover:bg-slate-800/30'
            }`}
          >
            <input
              type="file"
              ref={statsInputRef}
              onChange={(e) => handleFile(e, onStatsSheetChange)}
              accept="image/*"
              className="hidden"
            />

            {statsSheetUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={statsSheetUrl}
                  alt="Feuille d'attaques"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                  <RefreshCw className="w-4 h-4" /> Changer la feuille
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">
                  Cliquez ou glissez la feuille de texte
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Gemini lira le Nom, PV et les Attaques
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="text-xs text-slate-400">
          {!hasApiKey ? (
            <span className="text-rose-400 font-medium">
              ⚠️ Veuillez configurer votre clé API Gemini en haut de la page.
            </span>
          ) : (
            <span>
              💡 Gemini s'occupe de lire l'écriture manuscrite et d'améliorer l'illustration.
            </span>
          )}
        </div>

        <button
          onClick={onProcessGemini}
          disabled={isProcessing || !hasApiKey || (!drawingUrl && !statsSheetUrl)}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
            isProcessing || !hasApiKey || (!drawingUrl && !statsSheetUrl)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:from-amber-400 hover:to-red-400 shadow-amber-500/20 active:scale-[0.98]'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{processingMessage || 'Traitement en cours...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span>Magie Gemini : Générer la Carte</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
