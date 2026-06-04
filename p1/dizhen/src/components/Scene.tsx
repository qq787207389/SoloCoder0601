import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useEarthquakeStore } from '../store/useEarthquakeStore';
import Globe from './three/Globe';
import EarthquakePillars from './three/EarthquakePillars';
import PlateBoundaries from './three/PlateBoundaries';
import SeismicWave from './three/SeismicWave';
import Stars from './three/Stars';
import CameraControls from './three/CameraControls';
import { Suspense } from 'react';

function Scene() {
  const { showPlateBoundaries } = useEarthquakeStore();

  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: '#050a14' }}
    >
      <ambientLight intensity={0.15} color="#88aacc" />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#fff5e6" />
      <directionalLight position={[-5, -3, -5]} intensity={0.1} color="#6688cc" />

      <Stars />

      <Suspense fallback={null}>
        <Globe />
      </Suspense>

      <EarthquakePillars />

      <PlateBoundaries visible={showPlateBoundaries} />

      <SeismicWave />

      <CameraControls />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.8}
        maxDistance={8}
        enablePan={false}
      />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}

export default Scene;
