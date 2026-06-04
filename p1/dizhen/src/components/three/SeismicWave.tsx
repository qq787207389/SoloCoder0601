import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { latLonToVector3 } from '../../data/earthquakeService';
import { waveVertexShader, waveFragmentShader } from '../../shaders/waveShaders';

const P_WAVE_VELOCITY = 6.0;
const S_WAVE_VELOCITY = 3.5;

function SeismicWave() {
  const { selectedEarthquake, showSeismicWave } = useEarthquakeStore();
  const meshRef = useRef<THREE.Group>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const uniformsP = useMemo(() => ({
    uWaveColor: { value: new THREE.Color(0x4488ff) },
    uWaveRadius: { value: 0 },
    uWaveWidth: { value: 0.05 },
    uOpacity: { value: 0.8 },
  }), []);

  const uniformsS = useMemo(() => ({
    uWaveColor: { value: new THREE.Color(0xff6644) },
    uWaveRadius: { value: 0 },
    uWaveWidth: { value: 0.08 },
    uOpacity: { value: 0.6 },
  }), []);

  const position = useMemo(() => {
    if (!selectedEarthquake) return [0, 0, 0];
    return latLonToVector3(selectedEarthquake.latitude, selectedEarthquake.longitude, 1.001);
  }, [selectedEarthquake]);

  useEffect(() => {
    if (showSeismicWave && selectedEarthquake) {
      setStartTime(null);
      requestAnimationFrame(() => {
        setStartTime(performance.now());
      });
    }
  }, [showSeismicWave, selectedEarthquake?.id]);

  useFrame(() => {
    if (!showSeismicWave || !selectedEarthquake || startTime === null) return;

    const elapsed = (performance.now() - startTime) / 1000;
    const maxRadius = 1.8;

    const pRadius = Math.min((elapsed * P_WAVE_VELOCITY) / 4000, maxRadius);
    const sRadius = Math.min((elapsed * S_WAVE_VELOCITY) / 4000, maxRadius);

    const pFade = Math.max(0, 1 - pRadius / maxRadius);
    const sFade = Math.max(0, 1 - sRadius / maxRadius);

    uniformsP.uWaveRadius.value = pRadius;
    uniformsP.uOpacity.value = 0.8 * pFade;

    uniformsS.uWaveRadius.value = sRadius;
    uniformsS.uOpacity.value = 0.6 * sFade;
  });

  if (!selectedEarthquake || !showSeismicWave) return null;

  const ringGeometry = new THREE.RingGeometry(0.01, 2.5, 128);

  return (
    <group ref={meshRef} position={position as [number, number, number]}>
      <mesh>
        <ringGeometry {...ringGeometry} />
        <shaderMaterial
          vertexShader={waveVertexShader}
          fragmentShader={waveFragmentShader}
          uniforms={uniformsP}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <ringGeometry {...ringGeometry} />
        <shaderMaterial
          vertexShader={waveVertexShader}
          fragmentShader={waveFragmentShader}
          uniforms={uniformsS}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default SeismicWave;
