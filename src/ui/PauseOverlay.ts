import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/** Configuration for the pause overlay */
export interface PauseOverlayConfig {
  width: number;
  height: number;
  onResume?: () => void;
  onMainMenu?: () => void;
  onRestart?: () => void;
}

/** Duration for fade animations in milliseconds */
const FADE_DURATION = 200;

/**
 * Pause overlay UI component.
 * Shows when game is paused with resume/menu/restart options.
 */
export class PauseOverlay extends Container {
  private config: PauseOverlayConfig;
  private background: Graphics;
  private titleText: Text;
  private resumeButton: Container;
  private menuButton: Container | null = null;
  private restartButton: Container | null = null;
  private animationFrameId: number | null = null;

  constructor(config: PauseOverlayConfig) {
    super();
    this.config = config;
    this.visible = false;

    // Create semi-transparent background
    this.background = this.createBackground();
    this.addChild(this.background);

    // Create title
    this.titleText = this.createTitle();
    this.addChild(this.titleText);

    // Create buttons
    let buttonY = this.config.height * 0.45;

    this.resumeButton = this.createButton('Resume', buttonY, () => {
      this.hide();
      config.onResume?.();
    });
    this.addChild(this.resumeButton);
    buttonY += 70;

    if (config.onRestart) {
      this.restartButton = this.createButton('Restart', buttonY, config.onRestart);
      this.addChild(this.restartButton);
      buttonY += 70;
    }

    if (config.onMainMenu) {
      this.menuButton = this.createButton('Main Menu', buttonY, config.onMainMenu);
      this.addChild(this.menuButton);
    }
  }

  private createBackground(): Graphics {
    const bg = new Graphics();

    // Semi-transparent dark overlay
    bg.rect(0, 0, this.config.width, this.config.height);
    bg.fill({ color: 0x000000, alpha: 0.7 });

    // Decorative border box in center
    const boxWidth = 300;
    const boxHeight = 280;
    const boxX = (this.config.width - boxWidth) / 2;
    const boxY = (this.config.height - boxHeight) / 2;

    bg.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    bg.fill({ color: 0x1e293b, alpha: 0.95 });
    bg.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    bg.stroke({ color: 0x3b82f6, width: 3 });

    return bg;
  }

  private createTitle(): Text {
    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffffff,
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 2,
        angle: Math.PI / 4,
      },
    });

    const text = new Text({ text: 'PAUSED', style });
    text.anchor.set(0.5);
    text.x = this.config.width / 2;
    text.y = this.config.height * 0.35;

    return text;
  }

  private createButton(label: string, yPos: number, onClick: () => void): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const buttonWidth = 180;
    const buttonHeight = 50;

    const bg = new Graphics();
    bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    bg.fill({ color: 0x3b82f6 });
    button.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    const text = new Text({ text: label, style });
    text.anchor.set(0.5);
    button.addChild(text);

    button.x = this.config.width / 2;
    button.y = yPos;

    // Hover effects
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

  /**
   * Show the pause overlay with fade in animation.
   */
  show(): void {
    this.cancelAnimation();
    this.visible = true;
    this.alpha = 0;
    this.fadeIn();
  }

  /**
   * Hide the pause overlay with optional fade out animation.
   * @param immediate - Skip animation and hide immediately
   */
  hide(immediate: boolean = false): void {
    this.cancelAnimation();
    if (immediate) {
      this.visible = false;
      this.alpha = 0;
    } else {
      this.fadeOut();
    }
  }

  /**
   * Toggle visibility with animation.
   */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
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
