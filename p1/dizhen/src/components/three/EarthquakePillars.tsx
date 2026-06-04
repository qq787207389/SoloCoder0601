import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { depthToColor, magnitudeToPillarHeight, latLonToVector3 } from '../../data/earthquakeService';
import { pillarVertexShader, pillarFragmentShader } from '../../shaders/pillarShaders';
import { Earthquake } from '../../types/earthquake';

const MAX_INSTANCES = 5000;

function EarthquakePillars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { filteredEarthquakes, setHoveredEarthquake, setSelectedEarthquake } = useEarthquakeStore();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulseIntensity: { value: 0.5 },
  }), []);

  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.003, 0.003, 1, 6);
  }, []);

  const { positions, heights, colors, phases, isNewArr, earthquakes } = useMemo(() => {
    const count = Math.min(filteredEarthquakes.length, MAX_INSTANCES);
    const eqs = filteredEarthquakes.slice(0, count);
    const heights = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const isNewArr = new Float32Array(count);

    eqs.forEach((eq, i) => {
      const [x, y, z] = latLonToVector3(eq.latitude, eq.longitude, 1.0);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      heights[i] = magnitudeToPillarHeight(eq.magnitude);
      phases[i] = Math.random() * Math.PI * 2;

      const col = depthToColor(eq.depth);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      isNewArr[i] = eq.isNew ? 1 : 0;
    });

    return { positions, heights, colors, phases, isNewArr, earthquakes: eqs };
  }, [filteredEarthquakes]);

  useEffect(() => {
    if (!meshRef.current) return;

    const geo = meshRef.current.geometry;
    (geo as any).setAttribute('aPillarHeight', new THREE.InstancedBufferAttribute(heights, 1));
    (geo as any).setAttribute('aPulsePhase', new THREE.InstancedBufferAttribute(phases, 1));
    (geo as any).setAttribute('aInstanceColor', new THREE.InstancedBufferAttribute(colors, 3));
    (geo as any).setAttribute('aIsNew', new THREE.InstancedBufferAttribute(isNewArr, 1));

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    earthquakes.forEach((eq, i) => {
      const [x, y, z] = latLonToVector3(eq.latitude, eq.longitude, 1.0);
      dummy.position.set(x, y, z);

      const dir = new THREE.Vector3(x, y, z).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      dummy.quaternion.copy(quat);

      const height = heights[i];
      const scale = 1 + eq.magnitude * 0.1;
      dummy.scale.set(scale, height, scale);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.count = earthquakes.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [earthquakes, heights, phases, colors, isNewArr]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!meshRef.current || earthquakes.length === 0) return;

    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < earthquakes.length) {
      setHoveredId(instanceId);
      setHoveredEarthquake(earthquakes[instanceId]);
    } else {
      setHoveredId(null);
      setHoveredEarthquake(null);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!meshRef.current || earthquakes.length === 0) return;

    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < earthquakes.length) {
      setSelectedEarthquake(earthquakes[instanceId]);
    }
  };

  const handlePointerOut = () => {
    setHoveredId(null);
    setHoveredEarthquake(null);
  };

  return (
    <instancedMesh
      ref={meshRef}
      geometry={geometry}
      args={[undefined, undefined, MAX_INSTANCES]}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onPointerOut={handlePointerOut}
    >
      <shaderMaterial
        vertexShader={pillarVertexShader}
        fragmentShader={pillarFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export default EarthquakePillars;
