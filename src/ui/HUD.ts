import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameStateData } from '../core/state';

export interface HUDConfig {
  width: number;
  height: number;
}

export class HUD extends Container {
  private config: HUDConfig;
  private background: Graphics;
  private livesText: Text;
  private goldText: Text;
  private waveText: Text;
  private scoreText: Text;

  constructor(config: HUDConfig) {
    super();
    this.config = config;

    this.background = this.createBackground();
    this.addChild(this.background);

    this.livesText = this.createStatText('Lives: 20', 20);
    this.addChild(this.livesText);

    this.goldText = this.createStatText('Gold: 100', 150);
    this.addChild(this.goldText);

    this.waveText = this.createStatText('Wave: 0/10', 300);
    this.addChild(this.waveText);

    this.scoreText = this.createStatText('Score: 0', this.config.width - 150);
    this.scoreText.anchor.set(1, 0);
    this.addChild(this.scoreText);
  }

  private createBackground(): Graphics {
    const bg = new Graphics();
    const hudHeight = 50;

    bg.rect(0, 0, this.config.width, hudHeight);
    bg.fill({ color: 0x1e293b, alpha: 0.9 });

    bg.rect(0, hudHeight - 2, this.config.width, 2);
    bg.fill({ color: 0x3b82f6 });

    return bg;
  }

  private createStatText(initialText: string, xPos: number): Text {
    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    const text = new Text({ text: initialText, style });
    text.x = xPos;
    text.y = 14;

    return text;
  }

  update(data: GameStateData): void {
    this.livesText.text = `Lives: ${data.lives}`;
    this.goldText.text = `Gold: ${data.gold}`;
    this.waveText.text = `Wave: ${data.currentWave}/${data.totalWaves}`;
    this.scoreText.text = `Score: ${data.score}`;

    if (data.lives <= 5) {
      this.livesText.style.fill = 0xef4444;
    } else {
      this.livesText.style.fill = 0xffffff;
    }
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}
