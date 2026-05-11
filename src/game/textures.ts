import * as THREE from "three";

// 절차적 노이즈 텍스처 — canvas 기반, 빌드 의존성 없이 즉시 생성
// 평면 단색을 깨서 카메라가 가까이 가도 디테일이 살아있게

type Kind = "ash" | "concrete" | "wood" | "plaster" | "asphalt" | "rust" | "fabric";

interface Cfg {
  base: [number, number, number];      // RGB 0–255
  variance: number;                     // 픽셀당 휘도 분산
  speckles?: { count: number; size: number; color: [number, number, number]; alpha: number };
  cracks?: number;                      // 0–1, 균열 개수 비율
  stripes?: { spacing: number; alpha: number; color: [number, number, number] };
}

const CONFIGS: Record<Kind, Cfg> = {
  ash:       { base: [42, 38, 32],  variance: 26, speckles: { count: 400, size: 1, color: [80, 60, 40], alpha: 0.5 } },
  concrete:  { base: [120, 116, 108], variance: 24, speckles: { count: 280, size: 1, color: [60, 56, 50], alpha: 0.6 }, cracks: 0.4 },
  wood:      { base: [60, 38, 18],  variance: 18, stripes: { spacing: 6, alpha: 0.25, color: [30, 18, 8] } },
  plaster:   { base: [180, 168, 140], variance: 16, speckles: { count: 220, size: 1, color: [100, 90, 70], alpha: 0.45 }, cracks: 0.25 },
  asphalt:   { base: [56, 52, 46],  variance: 32, speckles: { count: 600, size: 1, color: [90, 84, 76], alpha: 0.6 } },
  rust:      { base: [110, 64, 32], variance: 36, speckles: { count: 350, size: 1, color: [40, 18, 10], alpha: 0.65 } },
  fabric:    { base: [110, 90, 50], variance: 14, stripes: { spacing: 2, alpha: 0.30, color: [60, 48, 26] } },
};

const cache = new Map<string, THREE.CanvasTexture>();

export function makeNoiseTexture(size: number, kind: Kind): THREE.CanvasTexture {
  const key = `${kind}_${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const cfg = CONFIGS[kind];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // 베이스 + per-pixel 노이즈
  const img = ctx.createImageData(size, size);
  const [br, bg, bb] = cfg.base;
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * cfg.variance;
    img.data[i]     = Math.max(0, Math.min(255, br + n));
    img.data[i + 1] = Math.max(0, Math.min(255, bg + n));
    img.data[i + 2] = Math.max(0, Math.min(255, bb + n));
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // 스펙클 (얼룩·자갈·반점)
  if (cfg.speckles) {
    const { count, size: ss, color, alpha } = cfg.speckles;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = ss + Math.random() * 2;
      const a = alpha * (0.5 + Math.random() * 0.5);
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 줄무늬 (나무 결, 직물)
  if (cfg.stripes) {
    const { spacing, alpha, color } = cfg.stripes;
    ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += spacing) {
      const wobble = Math.sin(y * 0.3) * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y + wobble);
      ctx.lineTo(size, y - wobble);
      ctx.stroke();
    }
  }

  // 균열 — 콘크리트·회벽
  if (cfg.cracks) {
    const crackCount = Math.floor(cfg.cracks * 12);
    ctx.strokeStyle = "rgba(20, 16, 12, 0.55)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < crackCount; i++) {
      const x0 = Math.random() * size;
      const y0 = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      let x = x0, y = y0;
      const segs = 4 + Math.floor(Math.random() * 5);
      for (let s = 0; s < segs; s++) {
        x += (Math.random() - 0.5) * 40;
        y += (Math.random() - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

// 노멀맵 — 알베도 노이즈에서 높이 추정해 생성
export function makeNoiseNormalMap(size: number, kind: Kind, strength = 1.0): THREE.CanvasTexture {
  const key = `${kind}_n_${size}_${strength.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const albedo = makeNoiseTexture(size, kind);
  // CanvasTexture는 image가 HTMLCanvasElement
  const src = albedo.image as HTMLCanvasElement;
  const sctx = src.getContext("2d")!;
  const sd = sctx.getImageData(0, 0, size, size).data;

  // 높이 = 휘도
  const h = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const r = sd[i * 4], g = sd[i * 4 + 1], b = sd[i * 4 + 2];
    h[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  const out = document.createElement("canvas");
  out.width = out.height = size;
  const octx = out.getContext("2d")!;
  const od = octx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size;
      const xr = (x + 1) % size;
      const yu = (y - 1 + size) % size;
      const yd = (y + 1) % size;
      const dx = (h[y * size + xr] - h[y * size + xl]) * strength;
      const dy = (h[yd * size + x] - h[yu * size + x]) * strength;
      const nz = 1.0;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + nz * nz);
      const nx = -dx * inv, ny = -dy * inv, nzn = nz * inv;
      const i = (y * size + x) * 4;
      od.data[i]     = (nx * 0.5 + 0.5) * 255;
      od.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      od.data[i + 2] = (nzn * 0.5 + 0.5) * 255;
      od.data[i + 3] = 255;
    }
  }
  octx.putImageData(od, 0, 0);

  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}
