import type { PokemonType } from '../types';

export async function processChildDrawing(
  drawingDataUrl: string,
  pokemonType: PokemonType = 'fire'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(drawingDataUrl);

      const width = 800;
      const height = 600;
      canvas.width = width;
      canvas.height = height;

      drawElementBackground(ctx, pokemonType, width, height);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return resolve(drawingDataUrl);

      const scale = Math.min((width * 0.8) / img.width, (height * 0.8) / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;

      tempCtx.drawImage(img, x, y, img.width * scale, img.height * scale);

      const imgData = tempCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        const brightness = (r + g + b) / 3;

        if (brightness > 220) {
          data[i + 3] = Math.max(0, 255 - (brightness - 220) * 8);
        } else {
          const contrast = 1.35;
          data[i] = Math.min(255, Math.max(0, (r - 128) * contrast + 128 * 1.15));
          data[i + 1] = Math.min(255, Math.max(0, (g - 128) * contrast + 128 * 1.15));
          data[i + 2] = Math.min(255, Math.max(0, (b - 128) * contrast + 128 * 1.15));
        }
      }

      tempCtx.putImageData(imgData, 0, 0);

      ctx.save();
      ctx.shadowColor = getElementGlowColor(pokemonType);
      ctx.shadowBlur = 25;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();

      ctx.drawImage(tempCanvas, 0, 0);

      resolve(canvas.toDataURL('image/png', 0.95));
    };

    img.onerror = () => resolve(drawingDataUrl);
    img.src = drawingDataUrl;
  });
}

function getElementGlowColor(type: PokemonType): string {
  switch (type) {
    case 'fire': return '#f97316';
    case 'water': return '#38bdf8';
    case 'grass': return '#4ade80';
    case 'lightning': return '#facc15';
    case 'psychic': return '#c084fc';
    case 'fighting': return '#ea580c';
    case 'darkness': return '#a855f7';
    case 'metal': return '#94a3b8';
    case 'dragon': return '#eab308';
    default: return '#f1f5f9';
  }
}

function drawElementBackground(
  ctx: CanvasRenderingContext2D,
  type: PokemonType,
  w: number,
  h: number
) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));

  switch (type) {
    case 'fire':
      gradient.addColorStop(0, '#fef08a');
      gradient.addColorStop(0.4, '#f97316');
      gradient.addColorStop(1, '#991b1b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      drawSparks(ctx, w, h, '#fde047', '#ef4444');
      break;

    case 'water':
      gradient.addColorStop(0, '#e0f2fe');
      gradient.addColorStop(0.5, '#0284c7');
      gradient.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      drawBubbles(ctx, w, h);
      break;

    case 'grass':
      gradient.addColorStop(0, '#f0fdf4');
      gradient.addColorStop(0.5, '#16a34a');
      gradient.addColorStop(1, '#14532d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      drawLeaves(ctx, w, h);
      break;

    case 'lightning':
      gradient.addColorStop(0, '#fefce8');
      gradient.addColorStop(0.4, '#eab308');
      gradient.addColorStop(1, '#713f12');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      drawLightning(ctx, w, h);
      break;

    case 'psychic':
      gradient.addColorStop(0, '#faf5ff');
      gradient.addColorStop(0.5, '#9333ea');
      gradient.addColorStop(1, '#581c87');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      drawSparks(ctx, w, h, '#f0abfc', '#a855f7');
      break;

    case 'fighting':
      gradient.addColorStop(0, '#fff7ed');
      gradient.addColorStop(0.5, '#c2410c');
      gradient.addColorStop(1, '#7c2d12');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      break;

    case 'darkness':
      gradient.addColorStop(0, '#334155');
      gradient.addColorStop(0.5, '#0f172a');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      drawSparks(ctx, w, h, '#a855f7', '#38bdf8');
      break;

    default:
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(0.5, '#94a3b8');
      gradient.addColorStop(1, '#334155');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      break;
  }
}

function drawSparks(ctx: CanvasRenderingContext2D, w: number, h: number, color1: string, color2: string) {
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
    ctx.beginPath();
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const size = Math.random() * 8 + 2;
    ctx.arc(rx, ry, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBubbles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const r = Math.random() * 15 + 5;
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLeaves(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < 20; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 12, 6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLightning(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 10;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let cx = Math.random() * w;
    let cy = 0;
    ctx.moveTo(cx, cy);
    while (cy < h) {
      cx += (Math.random() - 0.5) * 60;
      cy += Math.random() * 80 + 30;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
}
