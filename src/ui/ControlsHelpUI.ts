import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface ControlsHelpUIConfig {
  screenWidth: number;
  screenHeight: number;
}

interface ControlEntry {
  key: string;
  description: string;
}

export class ControlsHelpUI extends Container {
  private config: ControlsHelpUIConfig;
  private background: Graphics;
  private isVisible: boolean = true; // Visible by default since it's positioned outside game area

  private static readonly CONTROLS: ControlEntry[] = [
    { key: 'P', description: 'Pause / Resume' },
    { key: 'N', description: 'Call next wave early' },
    { key: '1', description: 'Select Bullet projectile' },
    { key: '2', description: 'Select Arrow projectile' },
    { key: '3', description: 'Select Magic projectile' },
    { key: 'L', description: 'Lose 1 life (debug)' },
    { key: 'G', description: 'Add 50 gold (debug)' },
    { key: 'W', description: 'Advance wave (debug)' },
    { key: 'S', description: 'Add 100 score (debug)' },
    { key: 'O', description: 'Trigger Game Over (debug)' },
    { key: 'V', description: 'Trigger Victory (debug)' },
    { key: 'H', description: 'Toggle this help panel' },
  ];

  private static readonly MOUSE_CONTROLS: ControlEntry[] = [
    { key: 'Click Tower', description: 'Select tower type' },
    { key: 'Click Map', description: 'Place tower / Fire projectile' },
    { key: 'Hover Tile', description: 'Preview tower placement' },
  ];

  constructor(config: ControlsHelpUIConfig) {
    super();
    this.config = config;

    this.background = new Graphics();
    this.addChild(this.background);

    this.createPanel();
  }

  private createPanel(): void {
    const panelWidth = 280;
    const lineHeight = 22;
    const padding = 15;
    const headerHeight = 35;
    const sectionGap = 15;

    const keyboardLines = ControlsHelpUI.CONTROLS.length;
    const mouseLines = ControlsHelpUI.MOUSE_CONTROLS.length;
    const panelHeight =
      padding * 2 +
      headerHeight +
      keyboardLines * lineHeight +
      sectionGap +
      25 + // Mouse Controls header
      mouseLines * lineHeight +
      10;

    // Position panel to the right of the game area (outside the 1280px canvas)
    const panelX = this.config.screenWidth + 10;
    const panelY = 60; // Below HUD

    this.position.set(panelX, panelY);

    // Draw background
    this.background.roundRect(0, 0, panelWidth, panelHeight, 8);
    this.background.fill({ color: 0x1a1a2e, alpha: 0.92 });
    this.background.stroke({ width: 2, color: 0x3b82f6 });

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x3b82f6,
    });
    const title = new Text({ text: 'Controls', style: titleStyle });
    title.position.set(padding, padding);
    this.addChild(title);

    // Keyboard Controls section
    let yOffset = padding + headerHeight;

    const keyStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0xfbbf24,
    });

    const descStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 13,
      fill: 0xd1d5db,
    });

    // Add keyboard controls
    for (const control of ControlsHelpUI.CONTROLS) {
      const keyText = new Text({ text: control.key, style: keyStyle });
      keyText.position.set(padding, yOffset);
      this.addChild(keyText);

      const descText = new Text({ text: control.description, style: descStyle });
      descText.position.set(padding + 50, yOffset);
      this.addChild(descText);

      yOffset += lineHeight;
    }

    yOffset += sectionGap;

    // Mouse Controls header
    const mouseHeaderStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0x9ca3af,
    });
    const mouseHeader = new Text({ text: 'Mouse', style: mouseHeaderStyle });
    mouseHeader.position.set(padding, yOffset);
    this.addChild(mouseHeader);

    yOffset += 25;

    // Add mouse controls
    for (const control of ControlsHelpUI.MOUSE_CONTROLS) {
      const keyText = new Text({ text: control.key, style: keyStyle });
      keyText.position.set(padding, yOffset);
      this.addChild(keyText);

      const descText = new Text({ text: control.description, style: descStyle });
      descText.position.set(padding + 90, yOffset);
      this.addChild(descText);

      yOffset += lineHeight;
    }
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.visible = this.isVisible;
  }

  show(): void {
    this.isVisible = true;
    this.visible = true;
  }

  hide(): void {
    this.isVisible = false;
    this.visible = false;
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }
}
