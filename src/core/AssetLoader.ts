import { Assets, Texture, Spritesheet } from 'pixi.js';

export interface AssetManifest {
  bundles: AssetBundle[];
}

export interface AssetBundle {
  name: string;
  assets: AssetDefinition[];
}

export interface AssetDefinition {
  alias: string;
  src: string;
}

export type LoadProgressCallback = (progress: number) => void;

export class AssetLoader {
  private loaded: boolean = false;
  private progressCallbacks: LoadProgressCallback[] = [];

  private manifest: AssetManifest = {
    bundles: [
      {
        name: 'game',
        assets: [],
      },
    ],
  };

  async loadAll(): Promise<void> {
    if (this.loaded) {
      console.warn('Assets already loaded');
      return;
    }

    await Assets.init({ manifest: this.manifest });

    const bundleNames = this.manifest.bundles.map((b) => b.name);

    if (bundleNames.length > 0 && this.manifest.bundles.some((b) => b.assets.length > 0)) {
      await Assets.loadBundle(bundleNames, (progress) => {
        this.notifyProgress(progress);
      });
    }

    this.loaded = true;
    console.log('All assets loaded');
  }

  async loadBundle(bundleName: string): Promise<void> {
    await Assets.loadBundle(bundleName, (progress) => {
      this.notifyProgress(progress);
    });
  }

  getTexture(alias: string): Texture {
    const texture = Assets.get<Texture>(alias);
    if (!texture) {
      throw new Error(`Texture "${alias}" not found`);
    }
    return texture;
  }

  getSpritesheet(alias: string): Spritesheet {
    const spritesheet = Assets.get<Spritesheet>(alias);
    if (!spritesheet) {
      throw new Error(`Spritesheet "${alias}" not found`);
    }
    return spritesheet;
  }

  get<T>(alias: string): T {
    const asset = Assets.get<T>(alias);
    if (!asset) {
      throw new Error(`Asset "${alias}" not found`);
    }
    return asset;
  }

  addBundle(bundle: AssetBundle): void {
    const existingIndex = this.manifest.bundles.findIndex((b) => b.name === bundle.name);
    if (existingIndex >= 0) {
      this.manifest.bundles[existingIndex] = bundle;
    } else {
      this.manifest.bundles.push(bundle);
    }
  }

  addAssetToBundle(bundleName: string, asset: AssetDefinition): void {
    const bundle = this.manifest.bundles.find((b) => b.name === bundleName);
    if (!bundle) {
      this.manifest.bundles.push({
        name: bundleName,
        assets: [asset],
      });
    } else {
      bundle.assets.push(asset);
    }
  }

  onProgress(callback: LoadProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(progress: number): void {
    for (const callback of this.progressCallbacks) {
      callback(progress);
    }
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}
