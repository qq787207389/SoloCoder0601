import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { latLonToVector3 } from '../../data/earthquakeService';

function CameraControls() {
  const { camera } = useThree();
  const { selectedEarthquake } = useEarthquakeStore();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const startPos = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    if (selectedEarthquake) {
      const [x, y, z] = latLonToVector3(
        selectedEarthquake.latitude,
        selectedEarthquake.longitude,
        2.0
      );
      targetPos.current = new THREE.Vector3(x, y, z);
      startPos.current.copy(camera.position);
      isAnimating.current = true;
      animationProgress.current = 0;
    }
  }, [selectedEarthquake?.id, camera]);

  useFrame((_, delta) => {
    if (isAnimating.current && targetPos.current) {
      animationProgress.current += delta * 2;
      const t = Math.min(animationProgress.current, 1);
      const easeT = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos.current, targetPos.current, easeT);
      camera.lookAt(0, 0, 0);

      if (t >= 1) {
        isAnimating.current = false;
      }
    }
  });

  return null;
}

export default CameraControls;
