export const waveVertexShader = `
uniform float uWaveRadius;
uniform float uWaveWidth;
uniform float uOpacity;

varying float vDistFromCenter;
varying float vOpacity;

void main() {
  vOpacity = uOpacity;
  vDistFromCenter = length(position.xz) / (uWaveRadius + uWaveWidth);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const waveFragmentShader = `
uniform vec3 uWaveColor;
uniform float uWaveRadius;
uniform float uWaveWidth;

varying float vDistFromCenter;
varying float vOpacity;

void main() {
  float dist = vDistFromCenter;

  float waveCenter = uWaveRadius / (uWaveRadius + uWaveWidth);
  float waveFront = smoothstep(waveCenter - 0.02, waveCenter, dist);
  float waveBack = smoothstep(waveCenter + 0.08, waveCenter, dist);
  float wave = waveFront * waveBack;

  float fade = 1.0 - smoothstep(0.0, 1.0, dist);

  float alpha = wave * fade * vOpacity;

  vec3 color = uWaveColor * (1.0 + wave * 0.5);

  gl_FragColor = vec4(color, alpha);
}
`
