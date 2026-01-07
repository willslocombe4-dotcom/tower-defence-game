import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/** Duration for fade animations in milliseconds */
const FADE_DURATION = 300;

export interface GameOverScreenConfig {
  width: number;
  height: number;
  isVictory: boolean;
  score: number;
  wave: number;
  onRestart: () => void;
  onMainMenu?: () => void;
}

export class GameOverScreen extends Container {
  private background: Graphics;
  private titleText: Text;
  private statsText: Text;
  private restartButton: Container;
  private menuButton: Container | null = null;
  private config: GameOverScreenConfig;
  private animationFrameId: number | null = null;

  constructor(config: GameOverScreenConfig) {
    super();
    this.config = config;

    this.background = this.createBackground();
    this.addChild(this.background);

    this.titleText = this.createTitle();
    this.addChild(this.titleText);

    this.statsText = this.createStats();
    this.addChild(this.statsText);

    this.restartButton = this.createButton(
      'Play Again',
      config.height * 0.55,
      config.onRestart
    );
    this.addChild(this.restartButton);

    if (config.onMainMenu) {
      this.menuButton = this.createButton(
        'Main Menu',
        config.height * 0.65,
        config.onMainMenu
      );
      this.addChild(this.menuButton);
    }
  }

  private createBackground(): Graphics {
    const bg = new Graphics();

    bg.rect(0, 0, this.config.width, this.config.height);
    bg.fill({ color: 0x000000, alpha: 0.85 });

    return bg;
  }

  private createTitle(): Text {
    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 64,
      fontWeight: 'bold',
      fill: this.config.isVictory ? 0x4ade80 : 0xef4444,
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 3,
        angle: Math.PI / 4,
      },
    });

    const text = new Text({
      text: this.config.isVictory ? 'VICTORY!' : 'GAME OVER',
      style,
    });

    text.anchor.set(0.5);
    text.x = this.config.width / 2;
    text.y = this.config.height * 0.25;

    return text;
  }

  private createStats(): Text {
    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fill: 0xffffff,
      align: 'center',
      lineHeight: 40,
    });

    const text = new Text({
      text: `Score: ${this.config.score}\nWave: ${this.config.wave}`,
      style,
    });

    text.anchor.set(0.5);
    text.x = this.config.width / 2;
    text.y = this.config.height * 0.42;

    return text;
  }

  private createButton(label: string, yPos: number, onClick: () => void): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const buttonWidth = 220;
    const buttonHeight = 55;

    const bg = new Graphics();
    bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    bg.fill({ color: 0x3b82f6 });
    button.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    const text = new Text({ text: label, style });
    text.anchor.set(0.5);
    button.addChild(text);

    button.x = this.config.width / 2;
    button.y = yPos;

    button.on('pointerover', () => {
      bg.tint = 0xaaaaff;
    });

    button.on('pointerout', () => {
      bg.tint = 0xffffff;
    });

    button.on('pointerdown', () => {
      onClick();
    });

    return button;
  }

  updateStats(score: number, wave: number): void {
    this.statsText.text = `Score: ${score}\nWave: ${wave}`;
  }

  setVictory(isVictory: boolean): void {
    this.config.isVictory = isVictory;
    this.titleText.text = isVictory ? 'VICTORY!' : 'GAME OVER';
    this.titleText.style.fill = isVictory ? 0x4ade80 : 0xef4444;
  }

  show(): void {
    this.cancelAnimation();
    this.visible = true;
    this.alpha = 0;
    this.fadeIn();
  }

  hide(immediate: boolean = false): void {
    this.cancelAnimation();
    if (immediate) {
      this.visible = false;
      this.alpha = 0;
    } else {
      this.fadeOut();
    }
  }

  private cancelAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private fadeIn(): void {
    const startTime = Date.now();

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / FADE_DURATION, 1);

      this.alpha = progress;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private fadeOut(): void {
    const startTime = Date.now();
    const startAlpha = this.alpha;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / FADE_DURATION, 1);

      this.alpha = startAlpha * (1 - progress);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.visible = false;
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  destroy(): void {
    this.cancelAnimation();
    this.removeAllListeners();
    super.destroy({ children: true });
  }
}
