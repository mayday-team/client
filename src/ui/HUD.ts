import { useGameStore } from "../store/gameStore";
import { renderPrologue, removePrologue } from "./PrologueScreen";
import { playNarration } from "./NarrationScreen";
import type { ScenarioPhase } from "../types/game";

const CROSSHAIR = `
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;pointer-events:none;">
    <div style="position:absolute;top:50%;left:0;width:100%;height:1px;background:rgba(255,255,255,0.8);transform:translateY(-50%);"></div>
    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.8);transform:translateX(-50%);"></div>
  </div>`;

const PHASE_LABEL: Record<ScenarioPhase, string> = {
  INITIAL_CONTACT: "초기 접촉",
  ESCALATION: "확전",
  REINFORCEMENT: "증원",
  ENCIRCLEMENT: "포위",
  FINAL_STAND: "최후 항전",
  DEFEAT: "함락",
};

export class HUD {
  private el: HTMLElement;
  private prologueShown = false;
  private hitOverlay: HTMLElement;
  private hitFadeTimer = 0;
  private prevHp = -1;

  constructor() {
    const el = document.getElementById("hud");
    if (!el) throw new Error("#hud element not found");
    this.el = el;

    // 피격 빨간 화면 오버레이 — innerHTML 재렌더에 영향 없도록 별도 요소
    this.hitOverlay = document.createElement("div");
    Object.assign(this.hitOverlay.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      background: "radial-gradient(ellipse at center, transparent 30%, rgba(200,0,0,0.85) 100%)",
      opacity: "0",
      transition: "opacity 0.08s ease-in",
      zIndex: "9999",
    });
    document.body.appendChild(this.hitOverlay);

    window.addEventListener("player:hit", this.onHit);

    this.render();
    useGameStore.subscribe(() => this.render());
  }

  private onHit = (): void => {
    // 엄폐 중이면 피격 이펙트 억제
    if (useGameStore.getState().inCover) return;
    this.hitOverlay.style.transition = "opacity 0.05s ease-in";
    this.hitOverlay.style.opacity = "1";
    clearTimeout(this.hitFadeTimer);
    this.hitFadeTimer = window.setTimeout(() => {
      this.hitOverlay.style.transition = "opacity 0.55s ease-out";
      this.hitOverlay.style.opacity = "0";
    }, 80);
  };

  // Game.ts에서 적탄이 벽에 막힌 걸 확인하면 호출 — 같은 task 내에 호출되어 프레임 출력 전 취소됨
  cancelHitFlash(): void {
    clearTimeout(this.hitFadeTimer);
    this.hitOverlay.style.transition = "none";
    this.hitOverlay.style.opacity = "0";
  }

  private render(): void {
    const { uiPhase, sessionEnded } = useGameStore.getState();

    if (sessionEnded) {
      this.prologueShown = false;
      this.el.style.pointerEvents = "auto";
      this.renderSessionEnded(sessionEnded);
      return;
    }

    if (uiPhase === "prologue") {
      this.el.style.pointerEvents = "none";
      if (!this.prologueShown) {
        this.prologueShown = true;
        renderPrologue(this.el, this.onPrologueStart);
      }
      return;
    }

    if (uiPhase === "ending") {
      this.prologueShown = false;
      this.el.style.pointerEvents = "auto";
      this.renderEndingScreen();
      return;
    }

    this.prologueShown = false;
    this.el.style.pointerEvents = "none";
    removePrologue(this.el);
    this.renderGameplay();
  }

  private onPrologueStart = (): void => {
    playNarration(() => {
      window.dispatchEvent(new CustomEvent("game:restart"));
    });
  };

  private renderGameplay(): void {
    const { player, scenarioPhase, pressureLevel, wsConnected, inCover, coverHp, clientHp } = useGameStore.getState();

    // HP 결정: 서버 연결 → 서버HP(엄폐시 동결), 오프라인 → clientHp
    let hp: number;
    let maxHp: number;
    if (wsConnected) {
      const serverHp = player?.hp ?? 0;
      hp = inCover ? coverHp : serverHp;
      maxHp = player?.max_hp ?? 100;
      if (!inCover && this.prevHp > 0 && serverHp < this.prevHp) this.onHit();
      this.prevHp = serverHp;
    } else {
      hp = clientHp;
      maxHp = 100;
      if (this.prevHp > 0 && clientHp < this.prevHp) this.onHit();
      this.prevHp = clientHp;
    }

    const ammo   = player?.ammo ?? 0;
    const maxAmmo = player?.max_ammo ?? 24;
    const survivalSec = Math.floor((player?.survival_time_ms ?? 0) / 1000);
    const hpPct  = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const hpColor = hpPct > 50 ? "#4caf50" : hpPct > 25 ? "#ff9800" : "#f44336";

    const phaseLabel = scenarioPhase ? PHASE_LABEL[scenarioPhase] ?? scenarioPhase : "";
    const phaseCritical = scenarioPhase === "FINAL_STAND" || scenarioPhase === "DEFEAT";
    const pressurePct = Math.round(pressureLevel * 100);

    const mins = Math.floor(survivalSec / 60);
    const secs = String(survivalSec % 60).padStart(2, "0");
    const timeStr = `${mins}:${secs}`;

    this.el.innerHTML = `
      ${CROSSHAIR}

      ${!wsConnected ? `
        <div style="position:absolute;top:16px;right:16px;background:rgba(180,30,30,0.85);color:#fff;font-size:11px;letter-spacing:2px;padding:4px 10px;border:1px solid #f55;">
          서버 미연결
        </div>` : ""}

      <!-- 엄폐 인디케이터 -->
      <div style="
        position:absolute;top:16px;left:50%;transform:translateX(-50%);
        font-size:10px;letter-spacing:3px;padding:3px 12px;
        color:${inCover ? "#6aaa6a" : "#cc8830"};
        text-shadow:0 0 8px ${inCover ? "rgba(80,180,80,0.6)" : "rgba(220,140,40,0.6)"};
        border:1px solid ${inCover ? "rgba(80,180,80,0.3)" : "rgba(220,140,40,0.3)"};
        background:rgba(0,0,0,0.5);
        pointer-events:none;
      ">${inCover ? "엄 폐" : "노 출"}</div>

      <!-- 상단 중앙: 전황 단계 -->
      ${phaseLabel ? `
        <div style="
          position:absolute;top:0;left:50%;transform:translateX(-50%);
          background:${phaseCritical ? "rgba(180,20,20,0.92)" : "rgba(10,8,6,0.82)"};
          border-bottom:2px solid ${phaseCritical ? "#f44" : "#6a4a2a"};
          padding:6px 28px;
          font-size:13px;letter-spacing:4px;
          color:${phaseCritical ? "#ffaaaa" : "#c8b080"};
          text-shadow:0 0 12px ${phaseCritical ? "rgba(255,60,60,0.8)" : "rgba(200,150,60,0.5)"};
          white-space:nowrap;
        ">
          ${phaseLabel}
        </div>` : ""}

      <!-- 좌하단: 체력 -->
      <div style="
        position:absolute;bottom:28px;left:24px;
        display:flex;flex-direction:column;gap:6px;
      ">
        <!-- HP 라벨 + 수치 -->
        <div style="display:flex;align-items:baseline;gap:8px;">
          <span style="font-size:10px;letter-spacing:3px;color:#888;text-shadow:0 0 6px #000;">체력</span>
          <span style="font-size:22px;font-weight:700;color:${hpColor};text-shadow:0 0 10px ${hpColor}88;line-height:1;">
            ${hp}
          </span>
          <span style="font-size:12px;color:#555;">/ ${maxHp}</span>
        </div>
        <!-- HP 바 -->
        <div style="
          width:180px;height:6px;
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:1px;overflow:hidden;
        ">
          <div style="
            width:${hpPct}%;height:100%;
            background:${hpColor};
            box-shadow:0 0 8px ${hpColor};
            transition:width 0.2s,background 0.4s;
            border-radius:1px;
          "></div>
        </div>
      </div>

      <!-- 우하단: 탄약 + 생존시간 -->
      <div style="
        position:absolute;bottom:28px;right:24px;
        text-align:right;display:flex;flex-direction:column;gap:8px;align-items:flex-end;
      ">
        <!-- 탄약 -->
        <div style="display:flex;align-items:baseline;gap:6px;">
          <span style="font-size:10px;letter-spacing:3px;color:#888;">탄약</span>
          <span style="font-size:28px;font-weight:700;color:${ammo === 0 ? "#f44" : "#e8d5a0"};
            text-shadow:0 0 8px ${ammo === 0 ? "#f44" : "#c8a84080"};line-height:1;">
            ${ammo}
          </span>
          <span style="font-size:13px;color:#555;">/ ${maxAmmo}</span>
        </div>
        <!-- 생존 시간 -->
        <div style="font-size:11px;color:#554;letter-spacing:2px;">${timeStr}</div>
      </div>

      <!-- 하단: 포위 압박 바 -->
      ${pressurePct > 0 ? `
        <div style="position:absolute;bottom:0;left:0;right:0;">
          <div style="
            display:flex;align-items:center;gap:8px;
            padding:3px 16px;background:rgba(0,0,0,0.6);
          ">
            <span style="font-size:9px;letter-spacing:3px;color:#884;white-space:nowrap;">포위</span>
            <div style="flex:1;height:3px;background:rgba(255,255,255,0.06);border-radius:1px;overflow:hidden;">
              <div style="
                width:${pressurePct}%;height:100%;
                background:${pressurePct > 70 ? "#f44" : "#f84"};
                box-shadow:0 0 6px ${pressurePct > 70 ? "#f44" : "#f84"};
                transition:width 0.3s;
              "></div>
            </div>
            <span style="font-size:9px;color:#664;min-width:28px;text-align:right;">${pressurePct}%</span>
          </div>
        </div>` : ""}
    `;
  }

  private renderSessionEnded(ended: NonNullable<ReturnType<typeof useGameStore.getState>["sessionEnded"]>): void {
    const survivalSec = Math.floor(ended.survived_ms / 1000);
    const mins = Math.floor(survivalSec / 60);
    const secs = survivalSec % 60;
    const timeStr = mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;

    this.el.innerHTML = `
      <div style="
        position:absolute;inset:0;
        background:#000;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        text-align:center;gap:0;
        font-family:'Noto Serif KR','Nanum Myeongjo',Georgia,serif;
      ">
        <div style="width:1px;height:50px;background:linear-gradient(to bottom,transparent,#6a1a1a);margin-bottom:32px;"></div>

        <p style="font-size:12px;letter-spacing:6px;color:#6a1a1a;margin-bottom:28px;">1980 · 5 · 27 · 새벽</p>

        <p style="font-size:22px;font-weight:300;letter-spacing:3px;color:#c8b89a;line-height:2;margin-bottom:24px;">
          도청은 함락되었습니다.<br>
          <span style="font-size:14px;color:#7a6858;letter-spacing:2px;">${timeStr}간 저항했습니다.</span>
        </p>

        <div style="width:160px;height:1px;background:linear-gradient(to right,transparent,#4a3020,transparent);margin-bottom:28px;"></div>

        <p style="font-size:14px;font-weight:300;color:#8a7860;line-height:2.4;letter-spacing:1px;max-width:380px;margin-bottom:36px;">
          그들은 알고 있었습니다.<br>
          이길 수 없다는 것을.<br>
          <span style="color:#5a4a38;">그럼에도 떠나지 않았습니다.</span>
        </p>

        <p style="font-size:11px;color:#3a3028;letter-spacing:3px;margin-bottom:40px;">
          대한민국 민주주의를 위해 희생된 모든 이를 기억합니다.
        </p>

        <div style="width:1px;height:30px;background:linear-gradient(to bottom,#6a1a1a,transparent);margin-bottom:28px;"></div>

        <p style="font-size:10px;color:#2a2420;letter-spacing:4px;cursor:pointer;" id="restart-hint">
          클릭하여 다시 돌아가기
        </p>
      </div>`;

    this.el.addEventListener("click", this.onRestartClick, { once: true });
  }

  private renderEndingScreen(): void {
    this.el.innerHTML = `
      <div style="
        position:absolute;inset:0;
        background:#000;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        text-align:center;gap:0;
        font-family:'Noto Serif KR','Nanum Myeongjo',Georgia,serif;
      ">
        <div style="width:1px;height:50px;background:linear-gradient(to bottom,transparent,#6a1a1a);margin-bottom:32px;"></div>

        <p style="font-size:12px;letter-spacing:6px;color:#6a1a1a;margin-bottom:28px;">1980 · 5 · 27</p>

        <p style="font-size:26px;font-weight:300;letter-spacing:4px;color:#e4d5b7;margin-bottom:24px;">도청은 함락되었습니다</p>

        <div style="width:160px;height:1px;background:linear-gradient(to right,transparent,#5a3a2a,transparent);margin-bottom:28px;"></div>

        <p style="font-size:15px;font-weight:300;color:#a89880;letter-spacing:2px;line-height:2.6;max-width:420px;margin-bottom:32px;">
          새벽 5시 10분, 계엄군이 전남도청을 완전히 점령했습니다.<br>
          <span style="font-size:13px;color:#7a6858;">마지막까지 남은 시민군 다수가 희생되었습니다.</span>
        </p>

        <p style="font-size:13px;color:#6a5848;letter-spacing:2px;line-height:2.4;margin-bottom:36px;">
          5.18 광주민주화운동 희생자 — 공식 사망·행방불명 607명<br>
          <span style="font-size:11px;color:#4a3a30;">그들의 희생이 오늘의 민주주의를 만들었습니다.</span>
        </p>

        <div style="width:1px;height:30px;background:linear-gradient(to bottom,#6a1a1a,transparent);"></div>
      </div>`;
  }

  private onRestartClick = (): void => {
    useGameStore.getState().quickRestart();
    window.dispatchEvent(new CustomEvent("game:restart"));
  };
}
