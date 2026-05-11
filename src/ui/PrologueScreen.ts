import logoUrl from "../assets/img/logo.png";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&display=swap');

#prologue-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif KR', 'Nanum Myeongjo', Georgia, serif;
  color: #e4d5b7;
  overflow: hidden;
  cursor: default;
  animation: prologue-fadein 2.5s ease both;
  pointer-events: auto;
}

@keyframes prologue-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}

#prologue-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(100,20,20,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.pro-top-rule {
  width: 1px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #8b1a1a);
  margin-bottom: 28px;
}

.pro-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  filter: grayscale(0.4) brightness(0.9);
  margin-bottom: 32px;
}

.pro-date {
  font-size: 13px;
  letter-spacing: 6px;
  color: #8b1a1a;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.pro-place {
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 8px;
  color: #c8b89a;
  margin-bottom: 40px;
}

.pro-divider {
  width: 200px;
  height: 1px;
  background: linear-gradient(to right, transparent, #5a3a2a, transparent);
  margin-bottom: 36px;
}

.pro-headline {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.7;
  text-align: center;
  color: #f0e6d0;
  letter-spacing: 2px;
  margin-bottom: 28px;
  text-shadow: 0 0 40px rgba(180,100,50,0.3);
}

.pro-body {
  font-size: 14px;
  font-weight: 300;
  line-height: 2.2;
  text-align: center;
  color: #a89880;
  max-width: 440px;
  margin-bottom: 36px;
  letter-spacing: 1px;
}

.pro-quote-wrap {
  border-left: 2px solid #8b1a1a;
  padding: 12px 20px;
  margin-bottom: 44px;
  max-width: 380px;
  text-align: left;
}

.pro-quote {
  font-size: 13.5px;
  font-style: italic;
  line-height: 2;
  color: #b8a48a;
  letter-spacing: 0.5px;
}

.pro-quote-attr {
  font-size: 11px;
  color: #7a6a58;
  margin-top: 8px;
  letter-spacing: 1px;
}

/* Candle */
.pro-candle-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36px;
}

.pro-candle {
  position: relative;
  width: 10px;
  height: 52px;
  background: linear-gradient(to bottom, #e8d5a3, #c4a96b);
  border-radius: 2px 2px 1px 1px;
}

.pro-candle::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 14px;
  background: linear-gradient(to top, #ff9944, #ffdd88, #fff8e0);
  border-radius: 50% 50% 30% 30%;
  animation: flicker 2.4s ease-in-out infinite;
  filter: blur(0.5px);
}

.pro-candle::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(255,170,60,0.55) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2.4s ease-in-out infinite;
}

@keyframes flicker {
  0%,100% { transform: translateX(-50%) scaleX(1) scaleY(1); opacity: 1; }
  25%      { transform: translateX(-52%) scaleX(0.85) scaleY(1.08); opacity: 0.92; }
  50%      { transform: translateX(-48%) scaleX(1.1) scaleY(0.96); opacity: 0.97; }
  75%      { transform: translateX(-50%) scaleX(0.92) scaleY(1.05); opacity: 0.95; }
}

@keyframes glow-pulse {
  0%,100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
  50%      { opacity: 1;   transform: translateX(-50%) scale(1.25); }
}

.pro-candle-base {
  width: 18px;
  height: 4px;
  background: #a88650;
  border-radius: 0 0 2px 2px;
}

/* Bottom */
.pro-memorial {
  font-size: 11px;
  color: #5a5040;
  letter-spacing: 2px;
  text-align: center;
  line-height: 2;
  margin-bottom: 24px;
}

/* ── Start Button ── */
.pro-start {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  letter-spacing: 4px;
  color: #6a5c4a;
  border: 1px solid #3a2e22;
  padding: 13px 34px;
  cursor: pointer;
  overflow: hidden;
  transition:
    color        0.45s ease,
    letter-spacing 0.45s ease,
    border-color 0.45s ease,
    box-shadow   0.45s ease,
    text-shadow  0.45s ease;
  animation: blink-soft 3s ease-in-out infinite;
}

/* shimmer sweep on hover */
.pro-start::before {
  content: '';
  position: absolute;
  top: 0; left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(200,140,80,0.18),
    transparent
  );
  transform: skewX(-20deg);
  transition: left 0.7s ease;
  pointer-events: none;
}

/* background fill */
.pro-start::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(139,26,26,0.12) 0%, transparent 80%);
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
}

.pro-start:hover {
  color: #f0e0c0;
  letter-spacing: 6px;
  border-color: #8b1a1a;
  box-shadow:
    0 0 18px rgba(139,26,26,0.4),
    0 0 40px rgba(139,26,26,0.15),
    inset 0 0 12px rgba(139,26,26,0.08);
  text-shadow: 0 0 16px rgba(220,140,80,0.6);
  animation-play-state: paused;
  opacity: 1;
}

.pro-start:hover::before { left: 125%; }
.pro-start:hover::after  { opacity: 1; }

/* corner brackets */
.pro-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  opacity: 0;
  transition: opacity 0.35s ease, transform 0.35s ease;
  pointer-events: none;
}
.pro-corner.tl { top: -1px;  left: -1px;  border-top: 1px solid #8b1a1a; border-left: 1px solid #8b1a1a;  transform: translate( 5px,  5px); }
.pro-corner.tr { top: -1px;  right: -1px; border-top: 1px solid #8b1a1a; border-right: 1px solid #8b1a1a; transform: translate(-5px,  5px); }
.pro-corner.bl { bottom: -1px; left: -1px;  border-bottom: 1px solid #8b1a1a; border-left: 1px solid #8b1a1a;  transform: translate( 5px, -5px); }
.pro-corner.br { bottom: -1px; right: -1px; border-bottom: 1px solid #8b1a1a; border-right: 1px solid #8b1a1a; transform: translate(-5px, -5px); }

.pro-start:hover .pro-corner {
  opacity: 1;
  transform: translate(0, 0);
}

/* candle reacts to button hover */
.pro-candle-wrap.hovered .pro-candle::before {
  animation: flicker-intense 1.2s ease-in-out infinite;
  filter: blur(0.3px);
}
.pro-candle-wrap.hovered .pro-candle::after {
  width: 32px;
  height: 32px;
  animation: glow-pulse-intense 1.2s ease-in-out infinite;
}

@keyframes flicker-intense {
  0%,100% { transform: translateX(-50%) scaleX(1)    scaleY(1.15); opacity: 1; }
  25%      { transform: translateX(-54%) scaleX(0.75) scaleY(1.3);  opacity: 0.88; }
  50%      { transform: translateX(-46%) scaleX(1.2)  scaleY(0.9);  opacity: 0.95; }
  75%      { transform: translateX(-50%) scaleX(0.88) scaleY(1.2);  opacity: 0.92; }
}

@keyframes glow-pulse-intense {
  0%,100% { opacity: 0.9; transform: translateX(-50%) scale(1.2); }
  50%      { opacity: 1;   transform: translateX(-50%) scale(1.8); }
}

@keyframes blink-soft {
  0%,100% { opacity: 0.6; }
  50%      { opacity: 1; }
}

.pro-bottom-rule {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, #8b1a1a, transparent);
  margin-top: 28px;
}
`;

const HTML = (logo: string) => `
<div id="prologue-root">
  <div class="pro-top-rule"></div>

  <img class="pro-logo" src="${logo}" alt="Mayday" />

  <div class="pro-date">1980 · 5 · 27 · 새벽 4시</div>
  <div class="pro-place">전 라 남 도 청</div>

  <div class="pro-divider"></div>

  <div class="pro-headline">
    마지막 밤,<br>그들은 떠나지 않았다
  </div>

  <div class="pro-body">
    계엄군의 총구 앞에서도 시민군은 도청을 지켰다.<br>
    열흘간의 항쟁, 그 마지막 새벽.<br>
    200여 명의 시민이 민주주의를 위해 총을 들었다.
  </div>

  <div class="pro-quote-wrap">
    <div class="pro-quote">
      "우리는 광주 시민입니다.<br>
      우리는 최후까지 싸울 것입니다.<br>
      우리 곁에 있어 주십시오."
    </div>
    <div class="pro-quote-attr">— 1980년 5월 26일 밤, 도청 최후 방송</div>
  </div>

  <div class="pro-candle-wrap">
    <div class="pro-candle"></div>
    <div class="pro-candle-base"></div>
  </div>

  <div class="pro-memorial">
    이 체험은 기록입니다. 재현이 아닌 추모입니다.<br>
    그날의 희생이 오늘의 민주주의를 만들었습니다.
  </div>

  <div class="pro-start" id="pro-start-btn">
    <span class="pro-corner tl"></span>
    <span class="pro-corner tr"></span>
    <span class="pro-corner bl"></span>
    <span class="pro-corner br"></span>
    클릭하여 그날의 기억 속으로
  </div>

  <div class="pro-bottom-rule"></div>
</div>
`;

let styleInjected = false;

function injectStyle(): void {
  if (styleInjected) return;
  const tag = document.createElement("style");
  tag.textContent = CSS;
  document.head.appendChild(tag);
  styleInjected = true;
}

export function renderPrologue(_container: HTMLElement, onStart: () => void): void {
  if (document.getElementById("prologue-root")) return;

  injectStyle();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = HTML(logoUrl);
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(root);

  const btn = root.querySelector<HTMLElement>("#pro-start-btn");
  const candleWrap = root.querySelector<HTMLElement>(".pro-candle-wrap");

  if (btn && candleWrap) {
    btn.addEventListener("mouseenter", () => candleWrap.classList.add("hovered"));
    btn.addEventListener("mouseleave", () => candleWrap.classList.remove("hovered"));
  }

  // window에서 잡아야 canvas / pointer-lock 관련 이벤트 소비에 무관하게 동작
  const handleClick = () => {
    root.style.transition = "opacity 1.2s ease";
    root.style.opacity = "0";
    // 페이드아웃 후 DOM 제거 (나레이션 클릭 차단 방지)
    setTimeout(() => { root.remove(); onStart(); }, 1200);
  };

  window.addEventListener("click", handleClick, { once: true });
}

export function removePrologue(_container: HTMLElement): void {
  const root = document.getElementById("prologue-root");
  if (!root) return;
  root.style.transition = "opacity 0.8s ease";
  root.style.opacity = "0";
  setTimeout(() => root.remove(), 800);
}
