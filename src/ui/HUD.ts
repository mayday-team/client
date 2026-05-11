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

  constructor() {
    const el = document.getElementById("hud");
    if (!el) throw new Error("#hud element not found");
    this.el = el;
    this.render();
    useGameStore.subscribe(() => this.render());
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
    const { player, scenarioPhase, pressureLevel, wsConnected } = useGameStore.getState();

    const hp = player?.hp ?? 0;
    const maxHp = player?.max_hp ?? 100;
    const ammo = player?.ammo ?? 0;
    const maxAmmo = player?.max_ammo ?? 24;
    const survivalSec = Math.floor((player?.survival_time_ms ?? 0) / 1000);
    const morale = Math.round((player?.morale ?? 1) * 100);

    const connBadge = wsConnected
      ? ""
      : '<span style="position:absolute;top:8px;right:8px;color:#f55;font-size:13px;">서버 미연결</span>';

    const phaseLabel = scenarioPhase ? PHASE_LABEL[scenarioPhase] ?? scenarioPhase : "";
    const pressureBar = `<div style="width:${Math.round(pressureLevel * 100)}%;height:3px;background:#f84;border-radius:2px;transition:width .3s;"></div>`;

    this.el.innerHTML = `
      ${CROSSHAIR}
      ${connBadge}
      <div style="position:absolute;bottom:24px;left:24px;font-size:15px;text-shadow:1px 1px 3px #000;line-height:2;">
        <div style="color:${hp / maxHp < 0.3 ? "#f55" : "#fff"}">HP ${hp} / ${maxHp}</div>
        <div>탄약 ${ammo} / ${maxAmmo}</div>
        <div>생존 ${survivalSec}초</div>
        <div style="color:#adf">사기 ${morale}%</div>
      </div>
      ${phaseLabel ? `<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);font-size:13px;color:#ffd;letter-spacing:2px;text-shadow:1px 1px 3px #000;">${phaseLabel}</div>` : ""}
      ${pressureLevel > 0 ? `<div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:#333;">${pressureBar}</div>` : ""}`;
  }

  private renderSessionEnded(ended: NonNullable<ReturnType<typeof useGameStore.getState>["sessionEnded"]>): void {
    const survivalSec = Math.floor(ended.survived_ms / 1000);
    const accuracy = ended.shots_fired > 0
      ? Math.round((ended.shots_hit / ended.shots_fired) * 100)
      : 0;

    this.el.innerHTML = `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;">
        <p style="font-size:28px;font-weight:bold;color:#f55;">세션 종료</p>
        <p style="font-size:15px;color:#ccc;">${ended.defeat_reason}</p>
        <p style="font-size:17px;">생존 시간 ${survivalSec}초</p>
        <p style="font-size:17px;">사격 명중률 ${accuracy}%</p>
        <p style="font-size:17px;">격퇴한 병력 ${ended.troops_neutralized}명</p>
        <p style="margin-top:24px;font-size:13px;color:#888;">클릭하여 다시 시작</p>
      </div>`;

    this.el.addEventListener("click", this.onRestartClick, { once: true });
  }

  private renderEndingScreen(): void {
    this.el.innerHTML = `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;font-family:'Noto Serif KR',serif;">
        <p style="font-size:22px;color:#e4d5b7;letter-spacing:4px;">1980년 5월 27일</p>
        <p style="font-size:15px;color:#a89880;letter-spacing:2px;line-height:2;">도청은 함락되었지만,<br>그들의 정신은 끝내 꺾이지 않았습니다.</p>
        <p style="margin-top:8px;font-size:13px;color:#5a5040;letter-spacing:2px;">대한민국 민주주의를 위해 희생된 모든 이를 기억합니다.</p>
      </div>`;
  }

  private onRestartClick = (): void => {
    useGameStore.getState().quickRestart();
    window.dispatchEvent(new CustomEvent("game:restart"));
  };
}
