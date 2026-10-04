import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import QRCode from 'qrcode';
import { Smartphone, Check } from 'lucide-react';

export type PhoneKind = 'drawing' | 'sheet';

interface PhoneMessage {
  kind: PhoneKind;
  dataUrl: string;
}

function isPhoneMessage(data: unknown): data is PhoneMessage {
  if (!data || typeof data !== 'object') return false;
  const m = data as Record<string, unknown>;
  return (
    (m.kind === 'drawing' || m.kind === 'sheet') &&
    typeof m.dataUrl === 'string' &&
    m.dataUrl.startsWith('data:image/')
  );
}

interface PhoneImporterProps {
  onPhoto: (kind: PhoneKind, dataUrl: string) => void;
}

/** Côté PC : affiche un QR code, reçoit directement les photos envoyées par le téléphone. */
export const PhoneImporter: React.FC<PhoneImporterProps> = ({ onPhoto }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [received, setReceived] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const onPhotoRef = useRef(onPhoto);

  useEffect(() => {
    onPhotoRef.current = onPhoto;
  }, [onPhoto]);

  useEffect(() => {
    const peer = new Peer();

    peer.on('open', (id) => {
      const url = `${window.location.origin}${window.location.pathname}?phone=${encodeURIComponent(id)}`;
      QRCode.toDataURL(url, { margin: 1, width: 220 })
        .then(setQrDataUrl)
        .catch(() => setError("Impossible de générer le QR code."));
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => setConnected(true));
      conn.on('close', () => setConnected(false));
      conn.on('data', (data) => {
        if (!isPhoneMessage(data)) return;
        onPhotoRef.current(data.kind, data.dataUrl);
        setReceived((n) => n + 1);
        conn.send({ ack: data.kind });
      });
    });

    peer.on('error', () =>
      setError("Connexion impossible avec le service de mise en relation. Vérifie ta connexion internet.")
    );

    return () => peer.destroy();
  }, []);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 no-print">
      <div className="w-[110px] h-[110px] bg-white rounded-lg flex items-center justify-center shrink-0">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR code à scanner avec le téléphone" className="w-full h-full rounded-lg" />
        ) : (
          <span className="text-[10px] text-slate-500">Chargement…</span>
        )}
      </div>
      <div className="flex-1 min-w-[220px] space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-400" /> Envoyer les photos depuis le téléphone
        </h3>
        <p className="text-xs text-slate-400">
          Scanne ce QR code avec ton téléphone, prends le dessin puis la feuille de stats : elles arrivent ici automatiquement.
          Garde cette page ouverte sur le PC.
        </p>
        <p className={`text-xs font-semibold flex items-center gap-1.5 ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
          {connected && <Check className="w-3.5 h-3.5" />}
          {connected ? 'Téléphone connecté' : 'En attente du téléphone…'}
          {received > 0 && ` · ${received} photo${received > 1 ? 's' : ''} reçue${received > 1 ? 's' : ''}`}
        </p>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
};

/** Réduit la photo (les photos de téléphone font plusieurs Mo) avant l'envoi. */
function resizeImage(file: File, maxSide = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

/** Côté téléphone : page minimale ouverte via le QR code. */
export const PhoneSender: React.FC<{ peerId: string }> = ({ peerId }) => {
  const connRef = useRef<ReturnType<Peer['connect']> | null>(null);
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(peerId, { reliable: true });
      connRef.current = conn;
      conn.on('open', () => setStatus('ready'));
      conn.on('close', () => setStatus('error'));
      conn.on('error', () => setStatus('error'));
      conn.on('data', (data) => {
        const ack = (data as { ack?: PhoneKind } | null)?.ack;
        if (ack) {
          setSending(false);
          setMessage(ack === 'drawing' ? '✅ Dessin envoyé au PC' : '✅ Feuille envoyée au PC');
        }
      });
    });
    peer.on('error', () => setStatus('error'));
    return () => peer.destroy();
  }, [peerId]);

  const send = async (kind: PhoneKind, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !connRef.current) return;
    setSending(true);
    setMessage(null);
    try {
      const dataUrl = await resizeImage(file);
      connRef.current.send({ kind, dataUrl } satisfies PhoneMessage);
    } catch {
      setSending(false);
      setMessage("Photo illisible, réessaie.");
    }
  };

  const bigButton =
    'block w-full text-center py-6 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-all';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-5 justify-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">📱 Envoi vers le PC</h1>
      {status === 'connecting' && <p className="text-center text-slate-400">Connexion au PC…</p>}
      {status === 'error' && (
        <p className="text-center text-rose-400">
          Connexion perdue. Vérifie que la page est toujours ouverte sur le PC, puis rescanne le QR code.
        </p>
      )}
      {status === 'ready' && (
        <>
          <label className={`${bigButton} bg-emerald-600 ${sending ? 'opacity-50 pointer-events-none' : ''}`}>
            🎨 Photo du dessin
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => send('drawing', e)} />
          </label>
          <label className={`${bigButton} bg-amber-500 text-slate-950 ${sending ? 'opacity-50 pointer-events-none' : ''}`}>
            📝 Photo de la feuille de stats
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => send('sheet', e)} />
          </label>
          {sending && <p className="text-center text-slate-400">Envoi en cours…</p>}
        </>
      )}
      {message && <p className="text-center font-semibold">{message}</p>}
    </div>
  );
};
