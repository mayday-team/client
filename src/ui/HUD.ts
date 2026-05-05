import { useGameStore } from "../store/gameStore";

const CROSSHAIR = `
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;pointer-events:none;">
    <div style="position:absolute;top:50%;left:0;width:100%;height:1px;background:rgba(255,255,255,0.8);transform:translateY(-50%);"></div>
    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.8);transform:translateX(-50%);"></div>
  </div>`;

export class HUD {
  private el: HTMLElement;

  constructor() {
    const el = document.getElementById("hud");
    if (!el) throw new Error("#hud element not found");
    this.el = el;
    this.render();
    useGameStore.subscribe(() => this.render());
  }

  private render(): void {
    const { player, elapsedTime, wsConnected, gameOver, phase } = useGameStore.getState();

    if (gameOver) {
      this.renderGameOver();
      return;
    }

    if (phase === "prologue" || phase === "ending") {
      this.renderPhaseScreen(phase);
      return;
    }

    this.renderGameplay(player, elapsedTime, wsConnected);
  }

  private renderGameplay(
    player: ReturnType<typeof useGameStore.getState>["player"],
    elapsedTime: number,
    wsConnected: boolean,
  ): void {
    const hp = player?.hp ?? 0;
    const ammo = player?.ammo ?? 0;
    const time = Math.floor(elapsedTime);
    const connBadge = wsConnected
      ? ""
      : '<span style="position:absolute;top:8px;right:8px;color:#f55;font-size:13px;">서버 미연결</span>';

    this.el.innerHTML = `
      ${CROSSHAIR}
      ${connBadge}
      <div style="position:absolute;bottom:24px;left:24px;font-size:16px;text-shadow:1px 1px 3px #000;line-height:1.8;">
        <div style="color:${hp < 30 ? "#f55" : "#fff"}">HP ${hp}</div>
        <div>탄약 ${ammo}</div>
        <div>생존 ${time}초</div>
      </div>`;
  }

  private renderGameOver(): void {
    const { gameOver } = useGameStore.getState();
    if (!gameOver) return;

    const reasonText = gameOver.reason === "player_dead" ? "전사" : "역사적 사건";
    this.el.innerHTML = `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;">
        <p style="font-size:28px;font-weight:bold;color:#f55;">${reasonText}</p>
        <p style="font-size:18px;">생존 시간 ${gameOver.survivalTime}초</p>
        <p style="font-size:18px;">보호한 시민 ${gameOver.protectedCivilians}명</p>
        <p style="margin-top:20px;max-width:480px;font-size:15px;line-height:1.7;color:#ddd;">${gameOver.endingText}</p>
        <p style="margin-top:24px;font-size:14px;color:#aaa;">클릭하여 다시 시작</p>
      </div>`;

    this.el.addEventListener("click", this.onRestartClick, { once: true });
  }

  private renderPhaseScreen(phase: "prologue" | "ending"): void {
    const label = phase === "prologue" ? "클릭하여 시작" : "엔딩 화면";
    this.el.innerHTML = `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;font-size:24px;letter-spacing:2px;">
        ${label}
      </div>`;
  }

  private onRestartClick = (): void => {
    useGameStore.getState().reset();
    window.dispatchEvent(new CustomEvent("game:restart"));
  };
}
