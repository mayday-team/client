import nar1 from "../assets/img/nar1.png";
import nar2 from "../assets/img/nar2.png";
import nar3 from "../assets/img/nar3.png";
import nar4 from "../assets/img/nar4.png";
import nar5 from "../assets/img/nar5.png";
import nar6 from "../assets/img/nar6.png";

const SLIDES: { date: string; lines: string[]; emphasis?: boolean; bg?: string }[] = [
  {
    date: "1980년 5월 18일",
    lines: ["광주 시민들이 군부 독재에 맞서 일어섰다.", "공수부대가 시민에게 총을 겨눴다."],
    bg: nar1,
  },
  {
    date: "",
    lines: ["계엄군의 총구 앞에서도 시민들은 물러서지 않았다.", "열흘간의 항쟁 — 수백 명이 쓰러졌다."],
    bg: nar2,
  },
  {
    date: "1980년 5월 26일 밤",
    lines: [
      "\"우리는 광주 시민입니다.\"",
      "\"우리는 최후까지 싸울 것입니다.\"",
      "마지막 도청 방송이 울려 퍼졌다.",
    ],
    bg: nar3,
  },
  {
    date: "",
    lines: ["도청을 떠나라는 권고를 들으면서도", "200여 명의 시민군은 남기로 했다.", "그들은 알고 있었다 — 이길 수 없다는 것을."],
    bg: nar4,
  },
  {
    date: "1980년 5월 27일 새벽 4시",
    lines: ["계엄군 탱크가 전남도청을 향해 움직였다.", "헬기가 하늘을 뒤덮었다."],
    bg: nar5,
  },
  {
    date: "",
    lines: ["당신은", "그날, 그곳에 있습니다."],
    emphasis: true,
    bg: nar6,
  },
];

const FADE_MS   = 1100;
const HOLD_MS   = 3200;
const LINE_MS   = 700;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&display=swap');

#narration-root {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif KR', Georgia, serif;
  color: #e4d5b7;
  pointer-events: auto;
  cursor: default;
}

#narr-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity ${FADE_MS}ms ease;
}

#narr-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.65);
  pointer-events: none;
}

/* ── Loading phase ── */
#narr-loading {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  transition: opacity ${FADE_MS}ms ease;
}

.narr-load-location {
  font-size: 13px;
  letter-spacing: 10px;
  color: #5a4a38;
}

.narr-load-title {
  font-size: 24px;
  font-weight: 300;
  letter-spacing: 8px;
  color: #9a8870;
}

.narr-load-bar-wrap {
  width: 200px;
  height: 1px;
  background: #1a1410;
  overflow: hidden;
}

.narr-load-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(to right, #5a3a20, #c4a060);
  animation: load-fill 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes load-fill {
  0%   { width: 0%; }
  60%  { width: 70%; }
  85%  { width: 88%; }
  100% { width: 100%; }
}

.narr-load-status {
  font-size: 10px;
  letter-spacing: 4px;
  color: #3a3028;
  animation: dots 1.4s steps(3, end) infinite;
}

@keyframes dots {
  0%   { content: '이동 중'; }
  33%  { opacity: 0.5; }
  66%  { opacity: 0.8; }
  100% { opacity: 0.3; }
}

/* ── Slide phase ── */
#narr-slide {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  opacity: 0;
  transition: opacity ${FADE_MS}ms ease;
}

.narr-date {
  font-size: 11px;
  letter-spacing: 6px;
  color: #8b1a1a;
  margin-bottom: 28px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.narr-date.visible {
  opacity: 1;
  transform: translateY(0);
}

.narr-line {
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 3px;
  color: #d0c0a0;
  line-height: 2;
  text-align: center;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.narr-line.emphasis {
  font-size: 30px;
  font-weight: 400;
  color: #f0e6d0;
  letter-spacing: 4px;
  text-shadow: 0 0 40px rgba(200,140,60,0.25);
}

.narr-line.visible {
  opacity: 1;
  transform: translateY(0);
}

/* horizontal rule between loading and slide */
.narr-rule {
  width: 60px;
  height: 1px;
  background: linear-gradient(to right, transparent, #5a3a2a, transparent);
  margin-bottom: 28px;
  opacity: 0;
  transition: opacity 0.7s ease;
}
.narr-rule.visible { opacity: 1; }

/* skip hint */
#narr-skip {
  position: absolute;
  bottom: 32px;
  right: 36px;
  z-index: 3;
  font-size: 10px;
  letter-spacing: 3px;
  color: #3a3028;
  transition: color 0.3s;
  pointer-events: auto;
  cursor: pointer;
}
#narr-skip:hover { color: #7a6a58; }
`;

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

async function fadeIn(el: HTMLElement): Promise<void> {
  el.style.opacity = "1";
  await sleep(FADE_MS);
}

async function fadeOut(el: HTMLElement): Promise<void> {
  el.style.opacity = "0";
  await sleep(FADE_MS);
}

let styleInjected = false;

export async function playNarration(onComplete: () => void): Promise<void> {
  if (!styleInjected) {
    const tag = document.createElement("style");
    tag.textContent = CSS;
    document.head.appendChild(tag);
    styleInjected = true;
  }

  const root = document.createElement("div");
  root.id = "narration-root";
  root.innerHTML = `
    <div id="narr-bg"></div>
    <div id="narr-overlay"></div>
    <div id="narr-loading">
      <div class="narr-load-location">전 라 남 도 청</div>
      <div class="narr-load-title">1980 · 5 · 27</div>
      <div class="narr-load-bar-wrap"><div class="narr-load-bar"></div></div>
      <div class="narr-load-status">이동 중 · · ·</div>
    </div>
    <div id="narr-slide">
      <div class="narr-rule" id="narr-rule"></div>
      <div class="narr-date" id="narr-date"></div>
      <div id="narr-lines"></div>
    </div>
    <div id="narr-skip">건너뛰기 ▶</div>
  `;
  document.body.appendChild(root);

  const bgEl     = root.querySelector<HTMLElement>("#narr-bg")!;
  const loading  = root.querySelector<HTMLElement>("#narr-loading")!;
  const slide    = root.querySelector<HTMLElement>("#narr-slide")!;
  const ruleEl   = root.querySelector<HTMLElement>("#narr-rule")!;
  const dateEl   = root.querySelector<HTMLElement>("#narr-date")!;
  const linesEl  = root.querySelector<HTMLElement>("#narr-lines")!;
  const skipBtn  = root.querySelector<HTMLElement>("#narr-skip")!;

  let skipped = false;
  const skipPromise = new Promise<void>(res => {
    skipBtn.addEventListener("click", () => { skipped = true; res(); }, { once: true });
  });

  const race = <T>(p: Promise<T>) => Promise.race([p, skipPromise]);

  // ── Loading phase ──
  await race(sleep(3200));

  // Crossfade loading → slide
  await race(fadeOut(loading));
  loading.style.display = "none";
  await race(fadeIn(slide));

  // ── Narration slides ──
  if (!skipped) {
    for (const s of SLIDES) {
      // 배경 이미지 교체: fade out → 이미지 변경 → fade in
      if (s.bg) {
        bgEl.style.opacity = "0";
        await race(sleep(FADE_MS / 2));
        bgEl.style.backgroundImage = `url('${s.bg}')`;
        bgEl.style.opacity = "1";
      } else {
        bgEl.style.opacity = "0";
      }

      // Set content
      dateEl.textContent = s.date;
      dateEl.classList.remove("visible");
      linesEl.innerHTML = s.lines
        .map(l => `<div class="narr-line${s.emphasis ? " emphasis" : ""}">${l}</div>`)
        .join("");
      ruleEl.classList.remove("visible");

      const lineEls = Array.from(linesEl.querySelectorAll<HTMLElement>(".narr-line"));

      // Fade in elements sequentially
      await race(sleep(120));
      if (s.date) { dateEl.classList.add("visible"); await race(sleep(350)); }
      ruleEl.classList.add("visible");

      for (const line of lineEls) {
        await race(sleep(LINE_MS));
        line.classList.add("visible");
        if (skipped) break;
      }

      await race(sleep(HOLD_MS));
      if (skipped) break;

      // Fade out slide content
      dateEl.classList.remove("visible");
      ruleEl.classList.remove("visible");
      lineEls.forEach(l => l.classList.remove("visible"));
      await race(sleep(FADE_MS));
      if (skipped) break;
    }
  }

  // Fade out entire narration
  await fadeOut(root);
  root.remove();
  onComplete();
}
