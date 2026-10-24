import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Creates a high-resolution 2D Canvas texture of the Indian National Flag (Tricolor)
 * with exact official specifications:
 * - 3:2 ratio
 * - Saffron (#FF9933), White (#FFFFFF), India Green (#138808)
 * - Navy Blue (#000080) Ashoka Chakra with 24 distinct spokes and rim notches.
 */
function createIndianFlagTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 682; // ~3:2 ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;
  const bandH = h / 3;

  // Saffron band
  ctx.fillStyle = '#FF9933';
  ctx.fillRect(0, 0, w, bandH);

  // White band
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, bandH, w, bandH);

  // Green band
  ctx.fillStyle = '#138808';
  ctx.fillRect(0, bandH * 2, w, bandH);

  // Ashoka Chakra (centered in the white band)
  const cx = w / 2;
  const cy = h / 2;
  const chakraRadius = bandH * 0.42;
  const navyColor = '#000080';

  ctx.strokeStyle = navyColor;
  ctx.fillStyle = navyColor;
  ctx.lineWidth = chakraRadius * 0.08;

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, chakraRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Central hub
  ctx.beginPath();
  ctx.arc(cx, cy, chakraRadius * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // 24 Spokes
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const ex = cx + Math.cos(angle) * chakraRadius;
    const ey = cy + Math.sin(angle) * chakraRadius;
    ctx.lineTo(ex, ey);
    ctx.lineWidth = chakraRadius * 0.045;
    ctx.stroke();

    // Small rounded arc between spokes on the outer rim
    const midAngle = angle + Math.PI / 24;
    const rimX = cx + Math.cos(midAngle) * (chakraRadius * 0.94);
    const rimY = cy + Math.sin(midAngle) * (chakraRadius * 0.94);
    ctx.beginPath();
    ctx.arc(rimX, rimY, chakraRadius * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export default function IndianFlagCanvas({
  className = '',
  windStrength = 1.0,
  showPole = true,
  isDark = false,
  useCustomTexture = true,
}) {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      if (!window.WebGLRenderingContext || (!testCanvas.getContext('webgl') && !testCanvas.getContext('experimental-webgl'))) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 160;

    // Realistic cloth dimensions (3:2 ratio)
    const flagWidth = 1.6;
    const flagHeight = 1.07;

    // Three.js Scene Setup
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Align camera so the left edge of the flag attaches directly to the pole at container x=0
    if (showPole) {
      camera.position.set(0.2, 0.1, 3.8);
    } else {
      camera.position.set(flagWidth * 0.48, 0, 2.75);
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Default procedural flag texture
    const defaultFlagTexture = createIndianFlagTexture();

    const flagGeometry = new THREE.PlaneGeometry(flagWidth, flagHeight, 48, 32);
    // Shift geometry so the left edge aligns with the pole at x = 0
    flagGeometry.translate(flagWidth / 2, 0, 0);

    const flagMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: defaultFlagTexture },
        uWindSpeed: { value: 3.2 * windStrength },
        uWaveScale: { value: 0.12 * windStrength },
        uLightDirection: {
          value: new THREE.Vector3(isDark ? -0.5 : 0.8, isDark ? 0.3 : 0.7, 1.0).normalize(),
        },
        uAmbient: { value: isDark ? 0.45 : 0.65 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWindSpeed;
        uniform float uWaveScale;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Anchor the left hem to the pole: waveFactor goes from 0 at pole to 1.0 at tip
          float waveFactor = pow(uv.x, 1.25);

          // Combined multi-frequency wind harmonics
          float wave1 = sin(uv.x * 6.28 * 1.5 - uTime * uWindSpeed) * uWaveScale;
          float wave2 = cos(uv.x * 12.0 + uv.y * 3.14 - uTime * uWindSpeed * 1.3) * (uWaveScale * 0.35);
          float wave3 = sin(uv.x * 22.0 - uTime * uWindSpeed * 2.1) * (uWaveScale * 0.12);

          // Subtle vertical ripple and edge flutter
          float waveY = sin(uv.x * 8.0 - uTime * uWindSpeed * 1.1) * (uWaveScale * 0.15) * pow(uv.x, 2.0);

          pos.z += (wave1 + wave2 + wave3) * waveFactor;
          pos.y += waveY;

          // Compute perturbed normal for realistic fabric folds lighting
          float dZdx = (cos(uv.x * 6.28 * 1.5 - uTime * uWindSpeed) * 6.28 * 1.5 * uWaveScale) * waveFactor;
          vec3 perturbedNormal = normalize(vec3(-dZdx, 0.0, 1.0));

          vNormal = normalMatrix * perturbedNormal;
          vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec3 uLightDirection;
        uniform float uAmbient;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec4 texColor = texture2D(uTexture, vUv);
          if (texColor.a < 0.05) discard;

          // Fabric lighting calculation (Diffuse + subtle Specular for cloth sheen)
          vec3 norm = normalize(vNormal);
          float diff = max(dot(norm, uLightDirection), 0.0);
          
          vec3 viewDir = normalize(-vPosition);
          vec3 halfDir = normalize(uLightDirection + viewDir);
          float spec = pow(max(dot(norm, halfDir), 0.0), 16.0) * 0.18;

          float lightFactor = uAmbient + diff * (1.0 - uAmbient) + spec;
          
          // Fabric depth / crease shadows
          gl_FragColor = vec4(texColor.rgb * lightFactor, texColor.a);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true,
    });

    // Load user-uploaded flag texture asynchronously if requested
    let loadedUserTexture = null;
    if (useCustomTexture) {
      const loader = new THREE.TextureLoader();
      loader.load('/user-indian-flag.png?t=' + Date.now(), (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        loadedUserTexture = tex;
        flagMaterial.uniforms.uTexture.value = tex;
        flagMaterial.needsUpdate = true;
      });
    }

    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    scene.add(flagMesh);

    // Stationary Flagpole & Finial
    let poleMesh = null;
    let finialMesh = null;
    let baseMesh = null;

    if (showPole) {
      // Silver Pole
      const poleHeight = 2.4;
      const poleGeo = new THREE.CylinderGeometry(0.018, 0.022, poleHeight, 16);
      const poleMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x94a3b8 : 0xd1d5db,
        metalness: 0.85,
        roughness: 0.25,
      });
      poleMesh = new THREE.Mesh(poleGeo, poleMat);
      // Position pole so the top lines up with flag top hem
      poleMesh.position.set(-0.015, -0.2, 0);
      scene.add(poleMesh);

      // Gold Finial ball atop pole
      const finialGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const finialMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.15,
      });
      finialMesh = new THREE.Mesh(finialGeo, finialMat);
      finialMesh.position.set(-0.015, poleHeight / 2 - 0.2 + 0.04, 0);
      scene.add(finialMesh);

      // Pole base mount ring
      const baseGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.08, 16);
      baseMesh = new THREE.Mesh(baseGeo, finialMat);
      baseMesh.position.set(-0.015, -poleHeight / 2 - 0.2, 0);
      scene.add(baseMesh);

      // Directional and ambient lights for the pole
      const poleDirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.0 : 1.8);
      poleDirLight.position.set(2, 3, 4);
      scene.add(poleDirLight);

      const poleAmbLight = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.9);
      scene.add(poleAmbLight);
    }

    // Check for reduced motion preference
    const checkReducedMotion = () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduced-motion');

    // Animation Loop
    let animationFrameId;
    const startTime = performance.now();

    const animate = (time) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (time - startTime) * 0.001;
      if (!checkReducedMotion()) {
        flagMaterial.uniforms.uTime.value = elapsedTime;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW && newH) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      flagGeometry.dispose();
      flagMaterial.dispose();
      if (defaultFlagTexture) defaultFlagTexture.dispose();
      if (loadedUserTexture) loadedUserTexture.dispose();
      renderer.dispose();
    };
  }, [windStrength, showPole, isDark, useCustomTexture]);

  if (!hasWebGL) {
    // Graceful CSS wave fallback
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="relative w-28 h-20 shadow-md overflow-hidden rounded-sm animate-pulse border border-slate-300">
          <div className="h-1/3 bg-[#FF9933]" />
          <div className="h-1/3 bg-white relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-[#000080] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#000080]" />
            </div>
          </div>
          <div className="h-1/3 bg-[#138808]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none select-none relative ${className}`}
      style={{ overflow: 'visible' }}
      aria-label="Indian National Tricolor Flag waving on flagpole"
      role="img"
    />
  );
}
