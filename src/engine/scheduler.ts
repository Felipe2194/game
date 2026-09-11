// El juego no corre a fps fijos: se redibuja cuando pasa algo (una tecla)
// y además cada ~250 ms para las animaciones de 2 frames.
export class Scheduler {
  private animTimer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly render: () => void,
    private readonly onAnimTick: () => void,
    private readonly animIntervalMs = 250,
  ) {}

  start(): void {
    this.render();
    this.animTimer = setInterval(() => {
      this.onAnimTick();
      this.render();
    }, this.animIntervalMs);
  }

  stop(): void {
    if (this.animTimer) clearInterval(this.animTimer);
  }

  // Render disparado por un evento (tecla) en vez del tick de animación.
  notify(): void {
    this.render();
  }
}
