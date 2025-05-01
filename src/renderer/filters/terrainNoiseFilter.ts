import { getAsset } from "node:sea";
import {
  Filter,
  FilterSystem,
  GlProgram,
  Matrix,
  Sprite,
  Texture,
  TextureMatrix,
  UniformGroup,
} from "pixi.js";
import { getAssets } from "../assets";
import { camera } from "../camera";

const vertex = `
in vec2 aPosition;

out vec2 uv;
out vec2 vMaskCoord;
out vec2 point;
out vec2 noiseUv;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform mat3 uFilterMatrix;
uniform vec3 camera;

vec4 filterVertexPosition(  vec2 aPosition )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(  vec2 aPosition )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

vec2 getFilterCoord( vec2 aPosition )
{
    return  ( uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}

void main(void)
{
  gl_Position = filterVertexPosition(aPosition);
  uv = filterTextureCoord(aPosition);
  vMaskCoord = getFilterCoord(aPosition);
  vec2 point = aPosition;
  noiseUv = (point + camera.xy / 256.0 * camera.z) / camera.z * 100.0;
}`;

const fragment = `#version 300 es
precision mediump float;

in vec2 uv;
in vec2 vMaskCoord;
in vec2 point;
in vec2 noiseUv;

out vec4 fragColor;

uniform sampler2D uTexture;
uniform sampler2D noise;
uniform float strength;
uniform vec3 camera;
uniform float time;

float sampleNoise(float scale) {
  return texture( noise, noiseUv * scale).x;
}

vec4 applyNoise(vec4 color) {
  float noise1 = sampleNoise(1.0) - 0.6;
  // float noise2 = sampleNoise(0.5) - 0.6;
  // float noise1 = sampleNoise(1.0) - 0.5;
  color += noise1 * 0.6;
  // color += noise2 * 0.3;

  // vec2 wave = vec2(
  //     cos(time * .007 + noiseUv.y * 4.0) * .01 + sin(time * .0015 + noiseUv.y * 5.0) * .017,
  //     cos(time * .005 + noiseUv.x * 5.0) * .013 + sin(time * .002 + noiseUv.x * 5.0) * .021
  //   );
  // vec2 timeNoiseUv = noiseUv + time / 20000.0;
  // float noise3 = texture( noise, noiseUv * vec2(0.3, 1.0) * 4.5 + time / 30000.0).x - 0.5;
  // float noise4 = texture( noise, noiseUv * 2.7 + vec2(time / 50000.0, -time / 20000.0)).x - 0.5;
  // color += noise3 * 0.15;
  // color += noise4 * 0.1;

  return color;
}

void main() {
  fragColor = texture(uTexture, uv);
  fragColor = applyNoise(fragColor);
  // fragColor = vec4(point + camera.xy, 0.0, 1.0);
}`;

export class TerrainNoiseFilter extends Filter {
  private readonly _textureMatrix: TextureMatrix;
  sprite: Sprite;
  private _strength = 1;
  uniformsGroup: UniformGroup<{
    uFilterMatrix: {
      value: Matrix;
      type: "mat3x3<f32>";
    };
    time: {
      value: number;
      type: "f32";
    };
    camera: {
      value: number[];
      type: "vec3<f32>";
    };
  }>;

  time = 0;

  constructor({ sprite }: { sprite: Sprite }) {
    const textureMatrix = new TextureMatrix(sprite.texture);
    const uniformsGroup = new UniformGroup({
      uFilterMatrix: { value: new Matrix(), type: "mat3x3<f32>" },
      camera: {
        value: getCameraTransform(),
        type: "vec3<f32>",
      },
      time: {
        value: 0,
        type: "f32",
      },
    });

    super({
      glProgram: GlProgram.from({
        fragment,
        vertex,
      }),
      resources: {
        filterUniforms: uniformsGroup,
        noise: getAssets().textures.noise.source,
      },
    });

    this.uniformsGroup = uniformsGroup;

    this._textureMatrix = textureMatrix;
    this.sprite = sprite;
  }

  public override apply(
    filterManager: FilterSystem,
    input: Texture,
    output: Texture,
    clearMode: boolean,
  ): void {
    filterManager
      .calculateSpriteMatrix(
        (this.resources as any).filterUniforms.uniforms.uFilterMatrix as Matrix,
        this.sprite,
      )
      .prepend(this._textureMatrix.mapCoord);

    this.resources.filterUniforms.uniforms.camera = getCameraTransform();
    this.resources.filterUniforms.uniforms.time = this.time;

    filterManager.applyFilter(this, input, output, clearMode);
  }
}

function getCameraTransform() {
  return [camera.transform.x, camera.transform.y, camera.transform.scale];
}
