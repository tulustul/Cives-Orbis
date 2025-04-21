import { Application, Container, RenderTexture, Sprite } from "pixi.js";

export class Layer {
  texture: RenderTexture | null = null;

  sprite = new Sprite();

  stage = new Container();

  app: Application | null = null;

  constructor(label: string) {
    this.stage.label = label;
  }

  bindToApp(app: Application) {
    this.app = app;

    this.texture = RenderTexture.create({
      width: app.renderer.width,
      height: app.renderer.height,
    });
    this.sprite.texture = this.texture;
  }

  renderToTarget() {
    if (!this.app || !this.texture) {
      return;
    }
    this.app.renderer.render({ container: this.stage, target: this.texture });
    this.app.render();
  }

  resize(width: number, height: number) {
    const newTexture = RenderTexture.create({ width, height });

    this.sprite.texture = newTexture;
    this.sprite.width = width;
    this.sprite.height = height;

    this.texture?.destroy();
    this.texture = newTexture;
  }
}
