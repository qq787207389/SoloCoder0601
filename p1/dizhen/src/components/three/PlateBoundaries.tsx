import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { latLonToVector3 } from '../../data/earthquakeService';
import { plateBoundaries } from '../../data/plateBoundaries';

interface PlateBoundariesProps {
  visible: boolean;
}

function PlateBoundaries({ visible }: PlateBoundariesProps) {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    return plateBoundaries.map((boundary, idx) => {
      const points: THREE.Vector3[] = [];
      boundary.coordinates.forEach(([lon, lat]) => {
        const [x, y, z] = latLonToVector3(lat, lon, 1.01);
        points.push(new THREE.Vector3(x, y, z));
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      let color: number;
      switch (boundary.type) {
        case 'convergent': color = 0xff6644; break;
        case 'divergent': color = 0x44aa88; break;
        case 'transform': color = 0xcc8844; break;
        default: color = 0x888888;
      }

      return { geometry, color, name: boundary.name, type: boundary.type };
    });
  }, []);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {lines.map((line, idx) => (
        <lineSegments key={idx}>
          <bufferGeometry attach="geometry" {...line.geometry} />
          <lineBasicMaterial
            attach="material"
            color={line.color}
            transparent
            opacity={0.7}
            linewidth={2}
          />
        </lineSegments>
      ))}
    </group>
  );
}

export default PlateBoundaries;
