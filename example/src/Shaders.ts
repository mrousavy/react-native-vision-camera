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
