import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Model3DType } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Layers, Eye, RefreshCw } from 'lucide-react';

interface Machine3DViewerProps {
  modelType: Model3DType;
  machineName: string;
  autoRotate?: boolean;
  height?: string;
  interactive?: boolean;
}

export const Machine3DViewer: React.FC<Machine3DViewerProps> = ({
  modelType,
  machineName,
  autoRotate = true,
  height = '400px',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [wireframe, setWireframe] = useState(false);
  const [exploded, setExploded] = useState(false);
  const controlsRef = useRef<OrbitControls | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const h = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181d24);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2;
    controls.maxDistance = 14;
    controls.autoRotate = isRotating;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5ea, 1.8);
    dirLight1.position.set(5, 8, 4);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xaad4ff, 0.9);
    dirLight2.position.set(-5, 4, -4);
    scene.add(dirLight2);

    const orangeAccentLight = new THREE.PointLight(0xf26522, 2.5, 10);
    orangeAccentLight.position.set(0, 1.5, 0);
    scene.add(orangeAccentLight);

    // 6. Ground grid & reflective floor
    const gridHelper = new THREE.GridHelper(10, 20, 0xf26522, 0x343c48);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x12161b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    // 7. Materials Cache
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd2d7dc,
      metalness: 0.85,
      roughness: 0.2,
      name: 'steel'
    });
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf26522,
      metalness: 0.35,
      roughness: 0.35,
      name: 'orange'
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x22272e,
      metalness: 0.7,
      roughness: 0.5,
      name: 'darkMetal'
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf0f3f6,
      metalness: 0.95,
      roughness: 0.08,
      name: 'chrome'
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff3b00,
      emissiveIntensity: 1.8,
      name: 'glow'
    });
    const doughMat = new THREE.MeshStandardMaterial({
      color: 0xf7ecd9,
      roughness: 0.85,
      metalness: 0.05,
      name: 'dough'
    });

    materialsRef.current = [steelMat, orangeMat, darkMetalMat, chromeMat, glowMat, doughMat];

    // 8. Build Machine Model based on type
    const rootGroup = new THREE.Group();
    partsGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // Procedural machine builder
    buildProceduralMachine(rootGroup, modelType, {
      steelMat,
      orangeMat,
      darkMetalMat,
      chromeMat,
      glowMat,
      doughMat
    });

    // Animate
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      // Custom animation loops based on machine model
      if (modelType === 'rotary') {
        const disc = rootGroup.getObjectByName('rotaryDisc');
        if (disc) disc.rotation.y += delta * 0.8;
      } else if (modelType === 'press' || modelType === 'line') {
        const pressHead = rootGroup.getObjectByName('pressHead');
        if (pressHead) {
          // Pneumatic up and down motion
          const pressCycle = Math.sin(elapsedTime * 2.8);
          pressHead.position.y = (pressHead.userData.baseY || 1.4) + Math.max(0, pressCycle * 0.35);
        }
        const beltRollers = rootGroup.getObjectByName('beltRollers');
        if (beltRollers) {
          beltRollers.rotation.z += delta * 3;
        }
      } else if (modelType === 'mixer') {
        const bowl = rootGroup.getObjectByName('mixerBowl');
        const hook = rootGroup.getObjectByName('mixerHook');
        if (bowl) bowl.rotation.y += delta * 0.5;
        if (hook) hook.rotation.y += delta * 2.2;
      } else if (modelType === 'cooler') {
        const fans = rootGroup.getObjectByName('coolerFans');
        if (fans) fans.rotation.y += delta * 8.0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [modelType]);

  // Handle controls updates
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isRotating;
    }
  }, [isRotating]);

  useEffect(() => {
    materialsRef.current.forEach(mat => {
      mat.wireframe = wireframe;
    });
  }, [wireframe]);

  useEffect(() => {
    if (!partsGroupRef.current) return;
    const group = partsGroupRef.current;
    
    group.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.explodeVector) {
        const target = exploded 
          ? child.userData.explodeVector 
          : child.userData.originalPos || new THREE.Vector3(0, 0, 0);
        
        child.position.copy(target);
      }
    });
  }, [exploded]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-industrial-700 bg-industrial-950 shadow-2xl group">
      <div 
        ref={containerRef} 
        style={{ height }} 
        className="w-full cursor-grab active:cursor-grabbing" 
      />

      {/* 3D Model Badge */}
      <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2">
        <span className="px-2.5 py-1 rounded bg-brand-orange/90 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md">
          MOTOR 3D ACTIVO
        </span>
        <span className="px-2.5 py-1 rounded bg-industrial-900/80 backdrop-blur-md text-gray-300 font-mono text-xs border border-industrial-700">
          WebGL 60 FPS
        </span>
      </div>

      {/* Floating 3D Controls */}
      {interactive && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-lg bg-industrial-900/90 backdrop-blur-md border border-industrial-700 shadow-xl">
          <button
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? "Pausar rotación" : "Girar 360°"}
            className={`p-2 rounded transition ${isRotating ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-industrial-800'}`}
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            title="Modo Alambre (Estructura)"
            className={`p-2 rounded transition ${wireframe ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-industrial-800'}`}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setExploded(!exploded)}
            title="Vista de Despiece / Explosión"
            className={`p-2 rounded transition ${exploded ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-industrial-800'}`}
          >
            <Layers size={16} />
          </button>
          <button
            onClick={resetCamera}
            title="Centrar Vista"
            className="p-2 rounded text-gray-400 hover:text-white hover:bg-industrial-800 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] text-gray-400 bg-black/50 px-2.5 py-1 rounded backdrop-blur-sm">
        💡 Arrastra para girar • Rueda para zoom • Clic derecho para mover
      </div>
    </div>
  );
};

// Helper: Procedural Industrial Machine Modeler
function buildProceduralMachine(
  root: THREE.Group, 
  type: Model3DType, 
  mats: Record<string, THREE.MeshStandardMaterial>
) {
  // Common Chassis Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 16);
  const legPositions = [
    [-1.2, 0.45, -0.6],
    [-1.2, 0.45, 0.6],
    [1.2, 0.45, -0.6],
    [1.2, 0.45, 0.6],
  ];

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, mats.chromeMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    root.add(leg);

    // Chrome feet
    const footGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const foot = new THREE.Mesh(footGeo, mats.darkMetalMat);
    foot.position.set(x, 0.025, z);
    root.add(foot);
  });

  // Base platform
  const baseGeo = new THREE.BoxGeometry(2.6, 0.12, 1.4);
  const base = new THREE.Mesh(baseGeo, mats.steelMat);
  base.position.set(0, 0.9, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  if (type === 'press' || type === 'line') {
    // 1. Heavy Vertical Columns
    const colGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16);
    [[-0.6, 1.65, -0.4], [-0.6, 1.65, 0.4], [0.6, 1.65, -0.4], [0.6, 1.65, 0.4]].forEach(([x, y, z]) => {
      const col = new THREE.Mesh(colGeo, mats.chromeMat);
      col.position.set(x, y, z);
      col.castShadow = true;
      root.add(col);
    });

    // 2. Upper Hydraulic Crosshead
    const topCapGeo = new THREE.BoxGeometry(1.5, 0.25, 1.0);
    const topCap = new THREE.Mesh(topCapGeo, mats.orangeMat);
    topCap.position.set(0, 2.35, 0);
    topCap.castShadow = true;
    root.add(topCap);

    // 3. Central Hydraulic Piston
    const pistonGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.6, 20);
    const piston = new THREE.Mesh(pistonGeo, mats.chromeMat);
    piston.position.set(0, 1.95, 0);
    root.add(piston);

    // 4. Moving Heated Press Head Plate
    const pressHeadGeo = new THREE.BoxGeometry(1.2, 0.15, 0.85);
    const pressHead = new THREE.Mesh(pressHeadGeo, mats.steelMat);
    pressHead.position.set(0, 1.45, 0);
    pressHead.name = 'pressHead';
    pressHead.userData = {
      baseY: 1.45,
      originalPos: new THREE.Vector3(0, 1.45, 0),
      explodeVector: new THREE.Vector3(0, 2.8, 0),
    };
    pressHead.castShadow = true;

    // Teflon bottom heater
    const teflonGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 32);
    const teflon = new THREE.Mesh(teflonGeo, mats.darkMetalMat);
    teflon.position.set(0, -0.09, 0);
    pressHead.add(teflon);
    root.add(pressHead);

    // 5. Lower Anvil Plate (Bed)
    const bedGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.08, 32);
    const bed = new THREE.Mesh(bedGeo, mats.darkMetalMat);
    bed.position.set(0, 0.98, 0);
    root.add(bed);

    // 6. Tortilla on Bed
    const tortillaGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.015, 32);
    const tortilla = new THREE.Mesh(tortillaGeo, mats.doughMat);
    tortilla.position.set(0, 1.03, 0);
    root.add(tortilla);

    // 7. Conveyor Belt Extension
    const beltFrameGeo = new THREE.BoxGeometry(1.8, 0.1, 0.6);
    const beltFrame = new THREE.Mesh(beltFrameGeo, mats.steelMat);
    beltFrame.position.set(1.4, 0.9, 0);
    root.add(beltFrame);

    const beltMeshGeo = new THREE.BoxGeometry(1.7, 0.04, 0.52);
    const beltMesh = new THREE.Mesh(beltMeshGeo, mats.darkMetalMat);
    beltMesh.position.set(1.4, 0.96, 0);
    root.add(beltMesh);

    // Tortillas on conveyor
    for (let i = 0; i < 3; i++) {
      const tort = new THREE.Mesh(tortillaGeo, mats.doughMat);
      tort.position.set(0.8 + i * 0.5, 0.99, 0);
      root.add(tort);
    }

    // 8. Control Panel Cabinet
    const panelGeo = new THREE.BoxGeometry(0.35, 0.7, 0.35);
    const panel = new THREE.Mesh(panelGeo, mats.steelMat);
    panel.position.set(-1.0, 1.4, 0.65);
    panel.userData = {
      originalPos: new THREE.Vector3(-1.0, 1.4, 0.65),
      explodeVector: new THREE.Vector3(-1.8, 1.4, 1.2),
    };

    // Screen
    const screenGeo = new THREE.PlaneGeometry(0.22, 0.22);
    const screen = new THREE.Mesh(screenGeo, mats.glowMat);
    screen.position.set(0.01, 0.15, 0.18);
    panel.add(screen);

    // Emergency stop button
    const eStopGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 16);
    const eStop = new THREE.Mesh(eStopGeo, mats.orangeMat);
    eStop.rotation.x = Math.PI / 2;
    eStop.position.set(0, -0.15, 0.18);
    panel.add(eStop);
    root.add(panel);

  } else if (type === 'rotary') {
    // Rotating Circular Comal Disc
    const cylinderBaseGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.65, 32);
    const cylinderBase = new THREE.Mesh(cylinderBaseGeo, mats.steelMat);
    cylinderBase.position.set(0, 0.9, 0);
    cylinderBase.castShadow = true;
    root.add(cylinderBase);

    // Rotating cooking disc
    const discGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.08, 48);
    const disc = new THREE.Mesh(discGeo, mats.darkMetalMat);
    disc.position.set(0, 1.28, 0);
    disc.name = 'rotaryDisc';
    disc.castShadow = true;
    disc.userData = {
      originalPos: new THREE.Vector3(0, 1.28, 0),
      explodeVector: new THREE.Vector3(0, 2.2, 0),
    };

    // Add 8 circular tortillas around the disc
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.85;
      const tortGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.015, 24);
      const tort = new THREE.Mesh(tortGeo, mats.doughMat);
      tort.position.set(Math.cos(angle) * radius, 0.045, Math.sin(angle) * radius);
      disc.add(tort);
    }
    root.add(disc);

    // Exhaust Hood / Safety Ring
    const ringGeo = new THREE.TorusGeometry(1.35, 0.04, 16, 48);
    const ring = new THREE.Mesh(ringGeo, mats.orangeMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 1.25, 0);
    root.add(ring);

  } else if (type === 'mixer') {
    // Heavy dough mixer bowl & spiral hook
    const bowlGeo = new THREE.CylinderGeometry(0.7, 0.5, 0.7, 32, 1, true);
    const bowl = new THREE.Mesh(bowlGeo, mats.steelMat);
    bowl.position.set(0, 1.1, 0);
    bowl.name = 'mixerBowl';
    bowl.castShadow = true;
    root.add(bowl);

    const bowlBottomGeo = new THREE.CircleGeometry(0.5, 32);
    const bowlBottom = new THREE.Mesh(bowlBottomGeo, mats.steelMat);
    bowlBottom.rotation.x = -Math.PI / 2;
    bowlBottom.position.set(0, 0.75, 0);
    root.add(bowlBottom);

    // Dough ball inside bowl
    const doughGeo = new THREE.SphereGeometry(0.4, 24, 16);
    doughGeo.scale(1, 0.6, 1);
    const dough = new THREE.Mesh(doughGeo, mats.doughMat);
    dough.position.set(0, 0.9, 0);
    root.add(dough);

    // Top Motor Housing
    const motorGeo = new THREE.BoxGeometry(1.1, 0.5, 1.6);
    const motorHousing = new THREE.Mesh(motorGeo, mats.orangeMat);
    motorHousing.position.set(0, 1.8, -0.3);
    motorHousing.castShadow = true;
    motorHousing.userData = {
      originalPos: new THREE.Vector3(0, 1.8, -0.3),
      explodeVector: new THREE.Vector3(0, 2.6, -0.3),
    };
    root.add(motorHousing);

    // Spiral Hook
    const hookGeo = new THREE.TorusGeometry(0.2, 0.04, 16, 32, Math.PI * 1.5);
    const hook = new THREE.Mesh(hookGeo, mats.chromeMat);
    hook.rotation.x = Math.PI / 2;
    hook.position.set(0, 1.2, 0);
    hook.name = 'mixerHook';
    root.add(hook);

  } else if (type === 'oven') {
    // 3-pass tunnel oven
    const ovenBodyGeo = new THREE.BoxGeometry(2.4, 0.9, 1.1);
    const ovenBody = new THREE.Mesh(ovenBodyGeo, mats.steelMat);
    ovenBody.position.set(0, 1.35, 0);
    ovenBody.castShadow = true;
    ovenBody.userData = {
      originalPos: new THREE.Vector3(0, 1.35, 0),
      explodeVector: new THREE.Vector3(0, 2.3, 0),
    };
    root.add(ovenBody);

    // Tunnel Window showing interior fire/glow
    const windowGeo = new THREE.BoxGeometry(1.8, 0.4, 1.15);
    const windowMesh = new THREE.Mesh(windowGeo, mats.glowMat);
    windowMesh.position.set(0, 1.35, 0);
    root.add(windowMesh);

    // Exhaust Chimneys
    [-0.7, 0.7].forEach((x) => {
      const chimGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
      const chim = new THREE.Mesh(chimGeo, mats.steelMat);
      chim.position.set(x, 2.1, 0);
      root.add(chim);
    });

  } else if (type === 'cooler') {
    // 5-tier cooling conveyor
    for (let tier = 0; tier < 5; tier++) {
      const tierGeo = new THREE.BoxGeometry(2.2, 0.04, 0.7);
      const tierMesh = new THREE.Mesh(tierGeo, mats.darkMetalMat);
      tierMesh.position.set(0, 0.95 + tier * 0.22, 0);
      root.add(tierMesh);

      // Support Posts
      const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
      [[-1.0, -0.3], [-1.0, 0.3], [1.0, -0.3], [1.0, 0.3]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeo, mats.chromeMat);
        post.position.set(px, 1.4, pz);
        root.add(post);
      });
    }

    // Cooling Fan top housing
    const fanBoxGeo = new THREE.BoxGeometry(1.6, 0.25, 0.8);
    const fanBox = new THREE.Mesh(fanBoxGeo, mats.orangeMat);
    fanBox.position.set(0, 2.15, 0);
    root.add(fanBox);

    // Fan Blade
    const fanGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 6);
    const fan = new THREE.Mesh(fanGeo, mats.darkMetalMat);
    fan.position.set(0, 2.29, 0);
    fan.name = 'coolerFans';
    root.add(fan);
  }
}
