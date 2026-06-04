import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const OCEAN_COLOR = '#0a1628';
const LAND_COLOR = '#1a3a2a';
const ICE_COLOR = '#ffffff';

interface ContinentRect {
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
}

const CONTINENTS: ContinentRect[] = [
  { lonMin: -130, lonMax: -60, latMin: 15, latMax: 70 },
  { lonMin: -80, lonMax: -35, latMin: -55, latMax: 10 },
  { lonMin: -10, lonMax: 40, latMin: 35, latMax: 70 },
  { lonMin: -20, lonMax: 50, latMin: -35, latMax: 35 },
  { lonMin: 40, lonMax: 150, latMin: 10, latMax: 70 },
  { lonMin: 115, lonMax: 155, latMin: -40, latMax: -10 },
  { lonMin: -60, lonMax: -20, latMin: 60, latMax: 80 },
];

function lonLatToCanvas(lon: number, lat: number, w: number, h: number): [number, number] {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y];
}

function createEarthTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = OCEAN_COLOR;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = LAND_COLOR;
  for (const c of CONTINENTS) {
    const [x1, y1] = lonLatToCanvas(c.lonMin, c.latMax, w, h);
    const [x2, y2] = lonLatToCanvas(c.lonMax, c.latMin, w, h);
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }

  ctx.fillStyle = ICE_COLOR;
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createBumpTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#444444';
  for (const c of CONTINENTS) {
    const [x1, y1] = lonLatToCanvas(c.lonMin, c.latMax, w, h);
    const [x2, y2] = lonLatToCanvas(c.lonMax, c.latMin, w, h);
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }

  ctx.fillStyle = '#666666';
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 3.0);
    vec3 glowColor = vec3(0.3, 0.6, 1.0);
    gl_FragColor = vec4(glowColor, fresnel * 0.6);
  }
`;

function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const earthTexture = useMemo(() => createEarthTexture(), []);
  const bumpTexture = useMemo(() => createBumpTexture(), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  useEffect(() => {
    return () => {
      earthTexture.dispose();
      bumpTexture.dispose();
    };
  }, [earthTexture, bumpTexture]);

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          ref={materialRef}
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.04}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <mesh scale={[1.04, 1.04, 1.04]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

const Globe = React.memo(GlobeMesh);

export default Globe;
