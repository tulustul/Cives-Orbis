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

const vertex = `
in vec2 aPosition;

out vec2 vTextureCoord;
out vec2 vMaskCoord;


uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform mat3 uFilterMatrix;

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
    vTextureCoord = filterTextureCoord(aPosition);
    vMaskCoord = getFilterCoord(aPosition);
}`;

const fragment = `
precision mediump float;

in vec2 vTextureCoord;
in vec2 vMaskCoord;

uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;

vec3 blendNormal(vec3 base, vec3 blend) {
	return blend;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
	return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 makeSepia(vec3 color, float strength) {
  vec3 sepia;

  sepia.r = dot(color, vec3(0.393, 0.769, 0.189));
  sepia.g = dot(color, vec3(0.349, 0.686, 0.168));
  sepia.b = dot(color, vec3(0.272, 0.534, 0.131));

  vec3 diff = (color - sepia) * strength;

  return color - diff;
}

vec3 desaturate(vec3 color, float strength) {
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(color, vec3(gray), strength);
}

vec3 getFogColor(vec3 color, float fog) {
  vec3 outColor = makeSepia(color.rgb, 0.9 * fog);
  outColor = blendNormal(outColor, vec3(0.0, 0.0, 0.0), 0.5 * fog);
  // outColor = desaturate(outColor, 0.8 * fog);
  return outColor;
}

void main() {
  vec4 color = texture2D(uTexture, vTextureCoord);
  vec4 mask = texture2D(uMaskTexture, vMaskCoord);

  // gl_FragColor = mask;
  // return;

  float explored = mask.r;
  vec3 outColor = getFogColor(color.rgb, 1.0 - mask.a);

  gl_FragColor = vec4(outColor * explored, 1.0);
}`;

export class FogOfWarFilter extends Filter {
  private readonly _textureMatrix: TextureMatrix;
  sprite: Sprite;

  constructor({ sprite }: { sprite: Sprite }) {
    const textureMatrix = new TextureMatrix(sprite.texture);
    const filterUniforms = new UniformGroup({
      uFilterMatrix: { value: new Matrix(), type: "mat3x3<f32>" },
    });

    super({
      glProgram: GlProgram.from({
        fragment,
        vertex,
      }),
      resources: {
        filterUniforms,
        uMaskTexture: sprite.texture.source,
      },
    });

    this._textureMatrix = textureMatrix;
    this.sprite = sprite;
  }

  public override apply(
    filterManager: FilterSystem,
    input: Texture,
    output: Texture,
    clearMode: boolean,
  ): void {
    // will trigger an update if the texture changed..
    // this._textureMatrix.texture = this.sprite.texture;

    filterManager
      .calculateSpriteMatrix(
        (this.resources as any).filterUniforms.uniforms.uFilterMatrix as Matrix,
        this.sprite,
      )
      .prepend(this._textureMatrix.mapCoord);

    // (this.resources as any).uMaskTexture = this.sprite.texture.source;

    filterManager.applyFilter(this, input, output, clearMode);
  }
}
