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

// 불꽃 텍스처 — 알파 그라데이션으로 불꽃 모양, 위로 갈수록 가늘어지고 색은 노란→빨강
// HDR 색상으로 출력해 블룸이 발광 풍부하게 살림
export function makeFireTexture(size = 256, hueShift = 0): THREE.CanvasTexture {
  const key = `fire_${size}_${hueShift.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  const cx = size / 2;
  // 불꽃은 아래가 넓고 위가 좁은 물방울 역방향
  for (let y = 0; y < size; y++) {
    // y=0 위쪽(가장 뜨거운 첨단), y=size-1 아래쪽(가장 넓은 베이스)
    const t = y / (size - 1);          // 0~1 (위→아래)
    const profileWidth = (0.18 + t * 0.60) * size; // 위 좁고 아래 넓음
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const d = Math.abs(dx) / (profileWidth / 2);
      // 0 = 중심, 1 = 가장자리
      const insideRatio = 1 - d;
      let alpha = 0;
      if (insideRatio > 0) {
        // 가장자리 부드러운 페이드 + 위쪽으로 갈수록 흐려짐
        const yFade = 1 - Math.pow(Math.abs(t - 0.55) * 2, 2.2);
        // 위쪽 추가 페이드 (불 끝)
        const topFade = Math.min(1, t * 5.0);
        alpha = Math.max(0, insideRatio * yFade * topFade);
        // 노이즈로 가장자리 불규칙
        alpha *= 0.8 + Math.random() * 0.4;
        alpha = Math.min(1, alpha);
      }

      // 색상: 중심은 노란, 가장자리는 빨강 — HDR
      // 중심 부분(작은 insideRatio가 1에 가까울 때) → 밝은 노랑
      const heat = Math.pow(insideRatio, 1.4);
      const r = 255;
      const g = Math.round(60 + 180 * heat);
      const b = Math.round(20 + 60 * heat * heat);

      const i = (y * size + x) * 4;
      img.data[i]     = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  cache.set(key, tex);
  return tex;
}

// 나뭇잎 텍스처 — 잎사귀 모양 점들이 모인 불투명 텍스처
export function makeFoliageTexture(size = 256): THREE.CanvasTexture {
  const key = `foliage_${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // 베이스: 짙은 녹색
  ctx.fillStyle = "rgb(30, 50, 24)";
  ctx.fillRect(0, 0, size, size);

  // 잎사귀 모양 (작은 타원 수백 개)
  const leafColors = [
    "rgba(45, 80, 28, 0.7)",
    "rgba(60, 100, 36, 0.6)",
    "rgba(35, 65, 22, 0.8)",
    "rgba(75, 110, 40, 0.5)",
  ];
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    ctx.fillStyle = leafColors[i % leafColors.length];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // 어두운 그림자 점
  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = `rgba(15, 25, 10, ${0.3 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 2 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

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
