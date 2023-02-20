export const INVERTED_COLORS_SHADER = `
uniform shader image;

half4 main(vec2 pos) {
  vec4 color = image.eval(pos);
  return vec4(1.0 - color.rgb, 1.0);
}
`;

export const CHROMATIC_ABERRATION_SHADER = `
uniform shader image;

vec4 chromatic(vec2 pos, float offset) {
  float r = image.eval(pos).r;
  float g = image.eval(vec2(pos.x + offset, pos.y)).g;
  float b = image.eval(vec2(pos.x + offset * 2.0, pos.y)).b;
  return vec4(r, g, b, 1.0);
}

half4 main(vec2 pos) {
  float offset = 50.0;
  return chromatic(pos, offset);
}
`;

export const NO_SHADER = `
half4 main(vec2 pos) {
  return vec4(1.0);
}
`;

export const BLUR_SHADER = `
const int samples = 35,
          LOD = 2,         // gaussian done on MIPmap at scale LOD
          sLOD = 1 << LOD; // tile size = 2^LOD
const float sigma = float(samples) * .25;

float gaussian(vec2 i) {
    return exp( -.5* dot(i/=sigma,i) ) / ( 6.28 * sigma*sigma );
}

vec4 blur(sampler2D sp, vec2 U, vec2 scale) {
    vec4 O = vec4(0);
    int s = samples/sLOD;

    for ( int i = 0; i < s*s; i++ ) {
        vec2 d = vec2(i%s, i/s)*float(sLOD) - float(samples)/2.;
        O += gaussian(d) * textureLod( sp, U + scale * d , float(LOD) );
    }

    return O / O.a;
}

void mainImage(out vec4 O, vec2 U) {
    O = blur( iChannel0, U/iResolution.xy, 1./iChannelResolution[0].xy );
}
`;

export const FACE_SHADER = `
uniform shader image;
uniform float x;
uniform float y;
uniform float r;
uniform vec2 resolution;

const float samples = 3.0;
const float radius = 40.0;
const float weight = 1.0;

half4 main(vec2 pos) {
  float delta = pow((pow(pos.x - x, 2) + pow(pos.y - y, 2)), 0.5);
  if (delta < r) {
    vec3 sum = vec3(0.0);
    vec3 accumulation = vec3(0);
    vec3 weightedsum = vec3(0);
    for (float deltaX = -samples * radius; deltaX <= samples * radius; deltaX += radius / samples) {
      for (float deltaY = -samples * radius; deltaY <= samples * radius; deltaY += radius / samples) {
        accumulation += image.eval(vec2(pos.x + deltaX, pos.y + deltaY)).rgb;
        weightedsum += weight;
      }
    }
    sum = accumulation / weightedsum;
    return vec4(sum, 1.0);
  }
  else {
    return image.eval(pos);
  }
}
`;
