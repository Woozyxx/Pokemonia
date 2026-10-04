import React, { useRef, useState } from 'react';
import type { PokemonCardData } from '../types';
import { PokemonCard } from './PokemonCard';
import { Printer, Download, Plus, Trash2, Scissors, Grid, Upload } from 'lucide-react';
import { toPng } from 'html-to-image';

interface CustomPrintedImage {
  id: string;
  imageUrl: string;
  name: string;
}

type ImageFit = 'cover' | 'contain';

interface PrintStudioProps {
  currentCard: PokemonCardData;
  printQueue: PokemonCardData[];
  onAddToQueue: (card: PokemonCardData) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

type PrintItem =
  | { kind: 'card'; key: string; card: PokemonCardData }
  | { kind: 'image'; key: string; image: CustomPrintedImage };

// Géométrie de la feuille A4 : 3 colonnes x 3 rangées de cartes 63 x 88 mm.
// Largeur utile : 3*63 + 2*3 = 195 mm (marge 7,5 mm). Hauteur : 3*88 + 2*3 = 270 mm (marge 13,5 mm).
const CARDS_PER_PAGE = 9;
const COLUMNS = 3;
const CARD_W_MM = 63;
const CARD_H_MM = 88;
const GAP_MM = 3;
const MARK_MM = 1.5;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

// Quatre repères de coupe par carte, placés dans la gouttière, jamais sur la carte.
const CropMarks: React.FC = () => {
  const line = { position: 'absolute', background: '#000' } as const;
  return (
    <>
      {[0, 1].flatMap((right) =>
        [0, 1].map((bottom) => {
          const x = right ? { right: `-${MARK_MM}mm` } : { left: `-${MARK_MM}mm` };
          const y = bottom ? { bottom: `-${MARK_MM}mm` } : { top: `-${MARK_MM}mm` };
          return (
            <React.Fragment key={`${right}${bottom}`}>
              <div style={{ ...line, ...x, ...(bottom ? { bottom: 0 } : { top: 0 }), width: `${MARK_MM}mm`, height: '0.15mm' }} />
              <div style={{ ...line, ...y, ...(right ? { right: 0 } : { left: 0 }), width: '0.15mm', height: `${MARK_MM}mm` }} />
            </React.Fragment>
          );
        })
      )}
    </>
  );
};

const A4Sheet: React.FC<{ items: PrintItem[]; fit: ImageFit }> = ({ items, fit }) => (
  <div
    className="a4-page bg-white"
    style={{
      width: '210mm',
      height: '297mm',
      position: 'relative',
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: `repeat(${COLUMNS}, ${CARD_W_MM}mm)`,
      gridAutoRows: `${CARD_H_MM}mm`,
      gap: `${GAP_MM}mm`,
      justifyContent: 'center',
      alignContent: 'center',
    }}
  >
    {items.map((item) => (
      <div key={item.key} style={{ position: 'relative', width: `${CARD_W_MM}mm`, height: `${CARD_H_MM}mm` }}>
        <CropMarks />
        {item.kind === 'card' ? (
          <PokemonCard data={item.card} isPrintVersion={true} />
        ) : (
          <div
            className="overflow-hidden select-none bg-white"
            style={{ width: `${CARD_W_MM}mm`, height: `${CARD_H_MM}mm`, borderRadius: '3.5mm' }}
          >
            <img
              src={item.image.imageUrl}
              alt={item.image.name}
              style={{ width: '100%', height: '100%', objectFit: fit }}
            />
          </div>
        )}
      </div>
    ))}
  </div>
);

export const PrintStudio: React.FC<PrintStudioProps> = ({
  currentCard,
  printQueue,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customImages, setCustomImages] = useState<CustomPrintedImage[]>([]);
  const [fit, setFit] = useState<ImageFit>('cover');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadError(`« ${file.name} » n'est pas une image.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const newImg: CustomPrintedImage = {
            id: 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            imageUrl: result,
            name: file.name.replace(/\.[^/.]+$/, ''),
          };
          setCustomImages((prev) => [...prev, newImg]);
        }
      };
      reader.onerror = () => setUploadError(`Impossible de lire « ${file.name} ».`);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveCustomImage = (id: string) => {
    setCustomImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `${currentCard.name || 'carte-pokemon'}-63x88mm.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur lors de l'exportation HD:", err);
    }
  };

  // Planche vide : on imprime la carte en cours d'édition.
  const queueIsEmpty = printQueue.length === 0 && customImages.length === 0;
  const items: PrintItem[] = queueIsEmpty
    ? [{ kind: 'card', key: 'current', card: currentCard }]
    : [
        ...printQueue.map((card, idx): PrintItem => ({ kind: 'card', key: `${card.id}-${idx}`, card })),
        ...customImages.map((image): PrintItem => ({ kind: 'image', key: image.id, image })),
      ];
  const pages = chunk(items, CARDS_PER_PAGE);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md text-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            3. Studio d'Impression A4 Millimétré
          </h2>
          <p className="text-xs text-slate-400">
            Format officiel : <span className="text-amber-300 font-bold">63 mm × 88 mm</span>. Importe directement les cartes téléchargées depuis PokéCardGenerator !
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadPng}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export HD (PNG)
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            Lancer l'Impression A4
          </button>
        </div>
      </div>

      {/* Control & Upload Bar */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2 text-xs">
          <Grid className="w-4 h-4 text-amber-400" />
          <span>
            <strong className="text-white">{items.length}</strong> carte{items.length > 1 ? 's' : ''} sur{' '}
            <strong className="text-white">{pages.length}</strong> feuille{pages.length > 1 ? 's' : ''} A4 ({CARDS_PER_PAGE} par feuille).
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Importer Carte Téléchargée (PNG / JPG)
          </button>

          <button
            onClick={() => onAddToQueue(currentCard)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Ajouter cette carte
          </button>

          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            Cartes importées :
            <select
              value={fit}
              onChange={(e) => setFit(e.target.value as ImageFit)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
            >
              <option value="cover">Remplir (peut rogner)</option>
              <option value="contain">Entière (marges possibles)</option>
            </select>
          </label>

          {!queueIsEmpty && (
            <button
              onClick={() => {
                onClearQueue();
                setCustomImages([]);
              }}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-800/50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Vider la planche
            </button>
          )}
        </div>
        {uploadError && <p className="w-full text-xs text-rose-400">{uploadError}</p>}
      </div>

      {/* Liste des cartes de la planche (boutons toujours visibles, utilisables au toucher) */}
      {!queueIsEmpty && (
        <ul className="flex flex-wrap gap-2 no-print">
          {printQueue.map((card, idx) => (
            <li key={`${card.id}-${idx}`} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
              <span className="font-semibold">{card.name || 'Sans nom'}</span>
              <button onClick={() => onRemoveFromQueue(idx)} title="Retirer cette carte" className="text-rose-400 hover:text-rose-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
          {customImages.map((img) => (
            <li key={img.id} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
              <img src={img.imageUrl} alt="" className="w-5 h-7 object-cover rounded-sm" />
              <span className="font-semibold">{img.name}</span>
              <button onClick={() => handleRemoveCustomImage(img.id)} title="Retirer cette carte" className="text-rose-400 hover:text-rose-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Aperçu à l'écran : mêmes feuilles que l'impression, réduites */}
      <div className="flex flex-col items-center p-6 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto no-print">
        <div className="text-xs text-slate-400 mb-4 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-amber-400" />
          Aperçu fidèle des feuilles A4 (repères de coupe dans les marges, 63 mm × 88 mm par carte)
        </div>
        <div className="flex flex-col gap-6">
          {pages.map((pageItems, pageIdx) => (
            <div key={pageIdx} style={{ width: '105mm', height: '148.5mm' }} className="shadow-2xl border border-slate-300 overflow-hidden">
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                <A4Sheet items={pageItems} fit={fit} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden">
        <div ref={cardRef}>
          <PokemonCard data={currentCard} scale={1.2} />
        </div>
      </div>

      {/* Zone imprimée : une feuille A4 par groupe de 9 cartes */}
      <div className="print-only hidden">
        {pages.map((pageItems, pageIdx) => (
          <A4Sheet key={pageIdx} items={pageItems} fit={fit} />
        ))}
      </div>
    </div>
  );
};
