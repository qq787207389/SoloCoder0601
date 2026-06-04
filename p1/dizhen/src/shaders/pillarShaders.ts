export const pillarVertexShader = `
uniform float uTime;
uniform float uPulseIntensity;

attribute float aPillarHeight;
attribute float aPulsePhase;
attribute vec3 aInstanceColor;
attribute float aIsNew;

varying vec3 vColor;
varying float vHeight;
varying float vPulse;
varying float vIsNew;

void main() {
  vColor = aInstanceColor;
  vHeight = aPillarHeight;
  vIsNew = aIsNew;

  float pulse = sin(uTime * 3.0 + aPulsePhase) * 0.5 + 0.5;
  float newPulse = aIsNew > 0.5 ? sin(uTime * 8.0) * 0.5 + 0.5 : 0.0;
  vPulse = pulse * uPulseIntensity + newPulse * 0.8;

  vec3 pos = position;
  if (pos.y > 0.01) {
    pos.y *= aPillarHeight;
    pos.y += pulse * 0.005 + newPulse * 0.01;
  }

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
}
`

export const pillarFragmentShader = `
uniform float uTime;

varying vec3 vColor;
varying float vHeight;
varying float vPulse;
varying float vIsNew;

void main() {
  float heightNorm = vHeight / 0.5;

  vec3 baseColor = vColor;
  vec3 glowColor = baseColor * 1.8;
  vec3 pulseColor = baseColor * (1.0 + vPulse * 0.6);

  float fresnel = pow(1.0 - abs(dot(normalize(vColor), vec3(0.0, 1.0, 0.0))), 2.0);

  vec3 finalColor = mix(baseColor, pulseColor, vPulse);
  finalColor = mix(finalColor, glowColor, fresnel * 0.3);

  float alpha = 0.6 + vPulse * 0.3 + vIsNew * 0.1;

  if (vHeight < 0.01) {
    finalColor = baseColor * 2.0;
    alpha = 0.9;
  }

  gl_FragColor = vec4(finalColor, alpha);
}
`
