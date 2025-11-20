import { Skia, TileMode } from '@shopify/react-native-skia'
import { Dimensions } from 'react-native'

const grainyShader = Skia.RuntimeEffect.Make(`
  uniform shader image; // Input image
  uniform float noiseStrength; // Control for noise intensity
  uniform vec2 resolution; // Screen resolution
  uniform float time; // Time for animated noise
  uniform float saturation; // Saturation factor

  // Random function to generate pseudo-random values
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  /**
  * @author @arthurstammet
  * https://shadertoy.com/view/tdXXRM
  */
  float tvNoise(vec2 p, float ta, float tb) {
    return fract(sin(p.x * ta + p.y * tb) * 5678.0);
  }

  /**
  * Adjusts the saturation of a color.
  *
  * https://github.com/minus34/cesium1/blob/master/Cesium/Shaders/Builtin/Functions/saturation.glsl
  */
  vec3 adjustSaturation(vec3 color, float saturation) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(color, W));
    return mix(intensity, color, saturation);
  }

  half4 main(vec2 pos) {
    // Get the color of the image at the current position
    vec4 color = image.eval(pos);
    
    // Normalize position to resolution
    vec2 st = pos / resolution;

    // Time-based values for animated noise
    float t = time + 123.0;
    float ta = t * 0.654321;
    float tb = t * (ta * 0.123456);

    // Generate grain/noise value
    vec4 noise = vec4(1. - tvNoise(st, ta, tb));

    // Blend noise with the image color
    vec3 grainyColor = color.rgb + noiseStrength * noise.rgb;

    // Adjust the saturation of the image
    vec3 finalColor = adjustSaturation(grainyColor, saturation);

    // Return the final color (with alpha retained)
    return vec4(finalColor, color.a);
  }
`)

if (!grainyShader) {
  throw new Error("Couldn't compile the shader")
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const shaderBuilder = Skia.RuntimeShaderBuilder(grainyShader)
shaderBuilder.setUniform('resolution', [SCREEN_WIDTH, SCREEN_HEIGHT]) // Set the resolution to the screen size
shaderBuilder.setUniform('noiseStrength', [0.15]) // Set the noise strength
shaderBuilder.setUniform('time', [100 * Math.random()]) // Set the time for the animated noise
shaderBuilder.setUniform('saturation', [1.4]) // Set the saturation factor

const blurFilter = Skia.ImageFilter.MakeBlur(60, 60, TileMode.Repeat, null)
const grainyBlurFilter = Skia.ImageFilter.MakeRuntimeShader(shaderBuilder, null, blurFilter)

const paint = Skia.Paint()
paint.setImageFilter(grainyBlurFilter)

export { paint, shaderBuilder }
