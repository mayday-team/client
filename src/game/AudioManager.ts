import bgmUrl from "../assets/audio/[5.18 민주화운동 기념] 임을 위한 행진곡 march for our beloved - 언티빈 unitat.mp3";

export class AudioManager {
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio(bgmUrl);
    this.audio.loop = true;
    this.audio.volume = 0.5;
  }

  play(): void {
    this.audio.play().catch(() => {
      // Autoplay blocked — retry on first user interaction
      const resume = () => {
        this.audio.play();
        window.removeEventListener("click", resume);
        window.removeEventListener("keydown", resume);
      };
      window.addEventListener("click", resume);
      window.addEventListener("keydown", resume);
    });
  }

  dispose(): void {
    this.audio.pause();
    this.audio.src = "";
  }
}
