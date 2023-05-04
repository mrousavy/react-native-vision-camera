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

const float samples = 4.0;
const float radius = 25.0;

float gauss (float radius, float x) {
  float sigma = 0.5 * radius;
  float g = (1.0/sqrt(2.0*3.142*sigma*sigma))*exp(-0.5*(x*x)/(sigma*sigma));
  return g;
}

half4 main(vec2 pos) {
  // Caclulate distance from center of circle (pythag)
  float delta = pow((pow(pos.x - x, 2) + pow(pos.y - y, 2)), 0.5);

  // If the distance is less than the radius, blur
  if (delta < r) {

    // vec3 color = image.eval(pos).rgb * gauss(radius, delta);

    // Accumulate the color of the pixels around the current pixel

    vec3 accumulation = vec3(0);
    float pixelSampleCount = 0;
    for (float deltaX = -radius; deltaX <= radius; deltaX += radius / samples) {
      for (float deltaY = -radius; deltaY <= radius; deltaY += radius / samples) {
        accumulation += image.eval(vec2(pos.x + deltaX, pos.y + deltaY)).rgb;
        pixelSampleCount += 1.0;
      }
    }
    return vec4(accumulation / vec3(pixelSampleCount), 1.0);
  }
  else {
    // Otherwise, return the original pixel
    return image.eval(pos);
  }
}
`;
