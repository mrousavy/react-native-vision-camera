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

/*
  This contains a very optimised single pass gaussian blur shader with sparse sampling.
  A few bits of info about why its implemented this way:
  - With the current setup we cannot do multiple passes as there is no way to render to an additional skImage
    as a result we need to do the entire blur in a single pass and cannot use the perf. advantages of separable blurs.
  - We need to use sparse sampling as the blur is very expensive and we need to keep the number of samples down,
    additionally, if our loops are too big the shader will not compile, see https://groups.google.com/g/skia-discuss/c/RiMdRhnFL0Y
  - As we don't sample ALL pixels within the radisu we use to compute the gaussian distribution we need to normalise
    by a factor of the total weight of the gaussian distribution, this is why we have the gaussTotalWeight variable.
*/
export const FACE_SHADER = `
uniform shader image;
uniform float x;
uniform float y;
uniform float r;
uniform vec2 resolution;

const float samples = 4.0;
const float radius = 20.0;

float gauss (float x) {
  float sigma = 0.5 * radius;
  float g = (1.0/sqrt(2.0*3.142*sigma*sigma))*exp(-0.5*(x*x)/(sigma*sigma));
  return g;
}

half4 main(vec2 pos) {
  // Caclulate distance from center of circle (pythag)
  float delta = pow((pow(pos.x - x, 2) + pow(pos.y - y, 2)), 0.5);

  // If the distance is less than the radius, blur
  if (delta < r) {
    float gaussTotalWeight = 0.0;
    vec3 color = image.eval(pos).rgb * gauss(0.0);
    for (float deltaX = -radius; deltaX <= radius; deltaX += radius / samples) {
      for (float deltaY = -radius; deltaY <= radius; deltaY += radius / samples) {
        float g = gauss(pow((pow(deltaX, 2) + pow(deltaY, 2)), 0.5));
        color += image.eval(vec2(pos.x + deltaX, pos.y + deltaY)).rgb * g;
        gaussTotalWeight += g;
      }
    }
    return vec4(color / vec3(gaussTotalWeight), 1.0);
  }
  else {
    // Otherwise, return the original pixel
    return image.eval(pos);
  }
}
`;

export const FACE_PIXELATED_SHADER = `
uniform shader image;
uniform float x;
uniform float y;
uniform float r;
uniform vec2 resolution;

const float size = 100.0;

half4 main(vec2 pos) {
  // Caclulate distance from center of circle (pythag)
  float delta = pow((pow(pos.x - x, 2) + pow(pos.y - y, 2)), 0.5);

  // If the distance is less than the radius, blur
  if (delta < r) {
    vec2 samplingPos = floor(pos / size) * size;
    return image.eval(samplingPos);
  }
  else {
    // Otherwise, return the original pixel
    return image.eval(pos);
  }
}`;
