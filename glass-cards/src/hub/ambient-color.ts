// Ambient colour extraction for the Media page: pull one representative colour
// from album art and turn it into a soft background "bleed" gradient.

type RGB = [number, number, number];

/**
 * Average colour of album art, downsampled to an 8×8 canvas.
 *
 * entity_picture URLs are Home-Assistant-proxied and same-origin
 * (/api/media_player_proxy/…), so a canvas readback is not tainted — no
 * crossOrigin dance is needed and none would help for third-party art anyway.
 * Returns null on any failure (missing art, load error, decode/readback error)
 * so the caller can simply render without a bleed.
 */
export async function dominantColor(imgUrl: string): Promise<RGB | null> {
  if (!imgUrl) return null;
  try {
    const img = await loadImage(imgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 8, 8);
    const { data } = ctx.getImageData(0, 0, 8, 8);

    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue; // skip fully transparent pixels
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
    if (n === 0) return null;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/**
 * CSS background for the ambient bleed behind the Media page. A large, soft
 * radial glow anchored towards the top-left, tinted by the art colour. Night
 * carries it stronger (.22) than day (.12); no colour → 'none'.
 */
export function bleedGradient(rgb: RGB | null, theme: 'natt' | 'dag'): string {
  if (!rgb) return 'none';
  const [r, g, b] = rgb;
  const opacity = theme === 'natt' ? '0.22' : '0.12';
  return `radial-gradient(80% 60% at 30% 20%, rgba(${r}, ${g}, ${b}, ${opacity}), transparent 70%)`;
}
