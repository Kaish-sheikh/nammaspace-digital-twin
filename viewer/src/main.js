import './style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

// ==========================================
// 1. SCENE & CANVAS SETUP
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080c);

const EYE_HEIGHT = 1.6;
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, EYE_HEIGHT, 5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '0';
document.body.appendChild(renderer.domElement);

// ==========================================
// 2. CONTROLS (Walk Mode vs Dollhouse Mode)
// ==========================================
let currentMode = 'walk';

const pointerControls = new PointerLockControls(camera, document.body);
scene.add(pointerControls.object);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.enabled = false;

// DOM Elements
const blocker = document.getElementById('blocker');
const btnEnter = document.getElementById('btn-enter');
const modeLabel = document.getElementById('mode-label');
const coordsLabel = document.getElementById('coords-label');
const headingLabel = document.getElementById('heading-label');
const btnWalk = document.getElementById('btn-walk');
const btnDollhouse = document.getElementById('btn-dollhouse');
const crosshair = document.getElementById('crosshair');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnHelp = document.getElementById('btn-help');
const helpModal = document.getElementById('help-modal');
const btnCloseHelp = document.getElementById('btn-close-help');
const btnTour = document.getElementById('btn-tour');
const btnStopTour = document.getElementById('btn-stop-tour');
const cinematicBanner = document.getElementById('cinematic-banner');

// Blocker / Click to Enter
if (btnEnter) {
  btnEnter.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentMode === 'walk') pointerControls.lock();
  });
}

if (blocker) {
  blocker.addEventListener('click', () => {
    if (currentMode === 'walk') pointerControls.lock();
  });
}

pointerControls.addEventListener('lock', () => {
  if (blocker) blocker.style.display = 'none';
  if (crosshair) crosshair.style.opacity = '1';
});

pointerControls.addEventListener('unlock', () => {
  if (currentMode === 'walk' && blocker) {
    blocker.style.display = 'flex';
  }
  if (crosshair) crosshair.style.opacity = '0';
});

function setMode(mode) {
  currentMode = mode;
  if (mode === 'dollhouse') {
    pointerControls.unlock();
    if (blocker) blocker.style.display = 'none';
    if (crosshair) crosshair.style.opacity = '0';
    orbitControls.enabled = true;

    camera.position.set(0, 6, 8);
    orbitControls.target.set(0, 1, 0);

    if (modeLabel) modeLabel.textContent = 'DOLLHOUSE (ORBIT)';
    if (btnDollhouse) btnDollhouse.classList.add('active');
    if (btnWalk) btnWalk.classList.remove('active');
  } else {
    orbitControls.enabled = false;
    if (crosshair) crosshair.style.opacity = '1';

    camera.position.set(0, EYE_HEIGHT, 5);
    camera.rotation.set(0, 0, 0);

    if (modeLabel) modeLabel.textContent = 'WALK (1ST PERSON)';
    if (btnWalk) btnWalk.classList.add('active');
    if (btnDollhouse) btnDollhouse.classList.remove('active');
    pointerControls.lock();
  }
}

if (btnWalk) btnWalk.addEventListener('click', () => setMode('walk'));
if (btnDollhouse) btnDollhouse.addEventListener('click', () => setMode('dollhouse'));

// Fullscreen Toggle
if (btnFullscreen) {
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// Help Modal
if (btnHelp && helpModal) {
  btnHelp.addEventListener('click', (e) => {
    e.stopPropagation();
    helpModal.style.display = 'flex';
  });
}
if (btnCloseHelp && helpModal) {
  btnCloseHelp.addEventListener('click', () => {
    helpModal.style.display = 'none';
  });
}
if (helpModal) {
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.style.display = 'none';
  });
}

// ==========================================
// 3. KEYBOARD INPUT TRACKING (GAME ENGINE PHYSICS)
// ==========================================
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false
};

document.addEventListener('keydown', (event) => {
  const key = event.key ? event.key.toLowerCase() : '';
  const code = event.code || '';

  if (code === 'KeyV' || key === 'v') {
    if (typeof stopCinematicTour === 'function' && isTourActive) stopCinematicTour();
    setMode(currentMode === 'walk' ? 'dollhouse' : 'walk');
    return;
  }
  if (code === 'KeyT' || key === 't') {
    if (typeof toggleCinematicTour === 'function') toggleCinematicTour();
    return;
  }
  if (code === 'KeyH' || key === 'h') {
    if (helpModal) {
      helpModal.style.display = helpModal.style.display === 'none' ? 'flex' : 'none';
    }
    return;
  }

  // If tour is playing and player touches movement keys, smoothly hand control back to game
  const isMoveKey = code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup' ||
                    code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown' ||
                    code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft' ||
                    code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright';

  if (typeof isTourActive !== 'undefined' && isTourActive && isMoveKey) {
    if (typeof stopCinematicTour === 'function') stopCinematicTour();
  }

  if (currentMode !== 'walk') return;

  if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') moveState.forward = true;
  if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') moveState.backward = true;
  if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') moveState.left = true;
  if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') moveState.right = true;
  if (event.shiftKey || code === 'ShiftLeft' || code === 'ShiftRight') moveState.sprint = true;
});

document.addEventListener('keyup', (event) => {
  const key = event.key ? event.key.toLowerCase() : '';
  const code = event.code || '';

  if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') moveState.forward = false;
  if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') moveState.backward = false;
  if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') moveState.left = false;
  if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') moveState.right = false;
  if (!event.shiftKey && (code === 'ShiftLeft' || code === 'ShiftRight')) moveState.sprint = false;
});

// ==========================================
// 3.5 🖱️ MOUSE SCROLL WHEEL CLICK (RELEASE / LOCK CURSOR)
// ==========================================
window.addEventListener('mousedown', (event) => {
  // Middle click (mouse scroll wheel button is button 1)
  if (event.button === 1) {
    event.preventDefault();
    if (pointerControls.isLocked) {
      pointerControls.unlock();
    } else if (currentMode === 'walk') {
      pointerControls.lock();
    }
  }
});

window.addEventListener('auxclick', (event) => {
  // Prevent browser autoscroll icon when clicking mouse wheel
  if (event.button === 1) {
    event.preventDefault();
  }
});

// ==========================================
// 4. 🔥 DUAL-ENVIRONMENT SPATIAL ENGINE
// ==========================================
const ROOM_SIZE = 20;

// Grounding dark obsidian floor plane
const floorGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x07080c,
  roughness: 0.35,
  metalness: 0.6
});
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -0.01;
scene.add(floorMesh);

// Floor Grid & Lighting
const gridHelper = new THREE.GridHelper(ROOM_SIZE, 20, 0x3b82f6, 0x1e293b);
gridHelper.position.y = 0;
scene.add(gridHelper);

scene.add(new THREE.AmbientLight(0xffffff, 1.0));

// ==========================================
// 🌌 INSTANT HOLOGRAPHIC SCANNER (0ms Fast Boot)
// ==========================================
const hologramGroup = new THREE.Group();

const holoGeo = new THREE.BoxGeometry(7, 3.2, 7);
const holoEdges = new THREE.EdgesGeometry(holoGeo);
const holoMat = new THREE.LineBasicMaterial({
  color: 0x3b82f6,
  transparent: true,
  opacity: 0.35
});
const holoWireframe = new THREE.LineSegments(holoEdges, holoMat);
holoWireframe.position.set(0, 1.6, 0);
hologramGroup.add(holoWireframe);

const scanPlaneGeo = new THREE.PlaneGeometry(6.8, 6.8);
const scanPlaneMat = new THREE.MeshBasicMaterial({
  color: 0x60a5fa,
  transparent: true,
  opacity: 0.12,
  side: THREE.DoubleSide
});
const scanPlane = new THREE.Mesh(scanPlaneGeo, scanPlaneMat);
scanPlane.rotation.x = -Math.PI / 2;
scanPlane.position.y = 0.05;
hologramGroup.add(scanPlane);

scene.add(hologramGroup);

let splatViewer = null;
let currentEnv = 'studio';
let currentSplatScale = 1.0;
let streamInterval = null;
let currentProgress = 15;

const ENV_CONFIGS = {
  studio: {
    name: 'Ultra-HD Studio',
    path: '/studio_room.splat',
    size: '1.13M Splats',
    splatCount: '1,130,000+ Splats',
    fidelity: 'Ultra-HD Photorealism',
    rotation: { x: Math.PI, y: 0, z: 0 },
    position: { x: 0, y: 1.4, z: 0 },
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    splatScale: 1.0,
    cameraPos: { x: 0, y: EYE_HEIGHT, z: 3.2 }
  },
  atrium: {
    name: 'Commercial Atrium',
    path: '/atrium.splat',
    size: '1.73M Splats',
    splatCount: '1,734,000+ Splats',
    fidelity: 'Grand Commercial Complex',
    rotation: { x: Math.PI, y: 0, z: 0 },
    position: { x: 1.4, y: 1.9, z: -0.5 },
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    splatScale: 1.0,
    cameraPos: { x: 0, y: EYE_HEIGHT, z: 2.8 }
  },
  garden: {
    name: 'Spatial Courtyard',
    path: '/garden.ksplat',
    size: '3.14M Splats',
    splatCount: '3,135,000+ Splats',
    fidelity: 'Outdoor Photorealism',
    rotation: { x: Math.PI - 0.5092, y: 0, z: 0 },
    position: { x: 0.45, y: 3.2, z: -0.3 },
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    splatScale: 1.0,
    cameraPos: { x: 0.2, y: EYE_HEIGHT, z: 3.5 }
  }
};

// ==========================================
// 📍 ENVIRONMENT-SPECIFIC 3D WAYPOINTS (POIS)
// ==========================================
const ENV_POIS = {
  garden: [
    {
      id: 'workstation',
      title: 'Exhibition Booth 24 (Quad)',
      badge: 'LARGE EVENTS',
      desc: 'Central convention exhibition booth on the open-air campus quad with live telemetry.',
      pos: new THREE.Vector3(0.2, 0.8, -0.1),
      color: 0xea4335,
      icon: '🎪'
    },
    {
      id: 'display',
      title: 'Botanical Pergola Seating',
      badge: 'RELAXATION ZONE',
      desc: 'Shaded floral canopy terrace with living botanical climbing vines and garden benches.',
      pos: new THREE.Vector3(-2.2, 0.8, -1.5),
      color: 0x10b981,
      icon: '🌿'
    },
    {
      id: 'door',
      title: 'Meeting Point Archway',
      badge: 'CAMPUS GATE',
      desc: 'Historic masonry portal connecting the botanical grounds to the main campus quad.',
      pos: new THREE.Vector3(1.8, 0.8, 2.0),
      color: 0x3b82f6,
      icon: '⛩️'
    }
  ],
  atrium: [
    {
      id: 'workstation',
      title: 'Exhibition Booth 24',
      badge: 'LARGE EVENTS',
      desc: 'Central exhibition showcase booth with high-density foot traffic and live telemetry.',
      pos: new THREE.Vector3(0.1, 0.75, 0.0),
      color: 0xea4335,
      icon: '🎪'
    },
    {
      id: 'display',
      title: '3-Seater Sofa (IKEA Showcase)',
      badge: 'RETAIL STORES',
      desc: 'Curated home furniture retail display showcasing modular 3-seater sofa arrangements.',
      pos: new THREE.Vector3(-1.8, 0.7, -1.5),
      color: 0xf59e0b,
      icon: '🛋️'
    },
    {
      id: 'door',
      title: 'Meeting Room A (Concourse)',
      badge: 'OFFICE SPACES',
      desc: 'Tenant conference suite and mezzanine transit concourse.',
      pos: new THREE.Vector3(1.6, 0.7, 1.4),
      color: 0x3b82f6,
      icon: '🏢'
    }
  ],
  studio: [
    {
      id: 'workstation',
      title: 'Meeting Room 4',
      badge: 'OFFICE SPACES',
      desc: 'Collaborative executive meeting room with dual conferencing displays and spatial acoustics.',
      pos: new THREE.Vector3(0.05, 0.75, -0.2),
      color: 0xea4335,
      icon: '🏢'
    },
    {
      id: 'display',
      title: '3-Seater Sofa & Lounge',
      badge: 'RETAIL & RECEPTION',
      desc: 'Ergonomic 3-seater modular sofa and discussion zone for informal syncs.',
      pos: new THREE.Vector3(-1.3, 0.65, -1.4),
      color: 0xf59e0b,
      icon: '🛋️'
    },
    {
      id: 'door',
      title: 'Meeting Room A',
      badge: 'EXECUTIVE SUITE',
      desc: 'Executive boardroom and primary transition corridor for team presentations.',
      pos: new THREE.Vector3(1.1, 0.5, 1.2),
      color: 0x3b82f6,
      icon: '🚪'
    }
  ]
};

// Master pin visibility flag (default: OFF for clean, unencumbered photorealism)
let pinsVisible = false;
const poiGroups = [];
const poiClickableMeshes = [];

// ==========================================
// 📍 GOOGLE MAPS INDOOR 3D PIN GENERATOR
// ==========================================
function createGoogleMapsPinTexture(title, badge, icon = '📍', pinColor = '#EA4335') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Floating Label Capsule Badge (Top)
  c.font = '700 20px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const labelText = `${icon}  ${title}`;
  const textWidth = c.measureText(labelText).width;
  const badgeWidth = Math.max(240, textWidth + 50);
  const badgeHeight = 54;
  const badgeX = (512 - badgeWidth) / 2;
  const badgeY = 16;

  // Badge Drop Shadow
  c.shadowColor = 'rgba(0, 0, 0, 0.55)';
  c.shadowBlur = 14;
  c.shadowOffsetY = 4;

  // Badge Capsule Fill (Dark Obsidian with vibrant border)
  c.fillStyle = 'rgba(12, 16, 26, 0.95)';
  c.beginPath();
  c.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 27);
  c.fill();

  c.shadowColor = 'transparent';
  c.strokeStyle = pinColor;
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 27);
  c.stroke();

  // Category Sub-label
  c.fillStyle = '#FBBC04';
  c.font = '800 10px "JetBrains Mono", monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(badge.toUpperCase(), 256, badgeY + 17);

  // Main Place Title Text
  c.fillStyle = '#FFFFFF';
  c.font = '700 18px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  c.fillText(labelText, 256, badgeY + 37);

  // Stem connecting badge to pin
  c.strokeStyle = pinColor;
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(256, badgeY + badgeHeight);
  c.lineTo(256, 126);
  c.stroke();

  // 2. Iconic Google Maps Teardrop Marker
  // Pin Dome Center: (256, 175), Radius = 44
  // Needle Tip: (256, 295)
  const cx = 256;
  const cy = 175;
  const r = 44;
  const tipY = 295;

  // Pin Drop Shadow
  c.shadowColor = 'rgba(0, 0, 0, 0.65)';
  c.shadowBlur = 18;
  c.shadowOffsetY = 6;

  c.beginPath();
  c.moveTo(cx, tipY);
  // Curve up along left flank
  c.bezierCurveTo(cx - r * 0.95, cy + r * 1.1, cx - r, cy + r * 0.5, cx - r, cy);
  // Arc over top circular dome
  c.arc(cx, cy, r, Math.PI, 0, false);
  // Curve down along right flank to tip
  c.bezierCurveTo(cx + r, cy + r * 0.5, cx + r * 0.95, cy + r * 1.1, cx, tipY);
  c.closePath();

  // Vibrant Gradient Fill
  const pinGrad = c.createLinearGradient(cx, cy - r, cx, tipY);
  pinGrad.addColorStop(0, '#FF5722');
  pinGrad.addColorStop(1, '#D93025');
  c.fillStyle = pinGrad;
  c.fill();

  // Crisp White Outer Outline
  c.shadowColor = 'transparent';
  c.strokeStyle = '#FFFFFF';
  c.lineWidth = 4.5;
  c.stroke();

  // 3. Iconic Center Circular Aperture (White ring with inner dark dot)
  c.beginPath();
  c.arc(cx, cy, 18, 0, Math.PI * 2);
  c.fillStyle = '#FFFFFF';
  c.fill();

  c.beginPath();
  c.arc(cx, cy, 9, 0, Math.PI * 2);
  c.fillStyle = '#D93025';
  c.fill();

  return canvas;
}

// Dynamically rebuild 3D POI markers for the active room geometry
function rebuildPois(envKey) {
  // Clear any existing POI groups from scene
  poiGroups.forEach((group) => {
    scene.remove(group);
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
  });
  poiGroups.length = 0;
  poiClickableMeshes.length = 0;

  const activePois = ENV_POIS[envKey] || ENV_POIS.studio;

  activePois.forEach((poi, index) => {
    const group = new THREE.Group();
    group.position.copy(poi.pos);

    // 1. Google Maps Billboard Canvas Sprite
    const pinCanvas = createGoogleMapsPinTexture(poi.title, poi.badge, poi.icon, `#${poi.color.toString(16).padStart(6, '0')}`);
    const texture = new THREE.CanvasTexture(pinCanvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const pinSprite = new THREE.Sprite(spriteMat);
    pinSprite.scale.set(1.65, 1.1, 1);
    // Anchor pin needle tip exactly at (0.5, 0.132) corresponding to (256, 295) of 340 height
    pinSprite.center.set(0.5, 0.132);
    pinSprite.position.y = 0.05;
    group.add(pinSprite);

    // 2. Invisible 3D Click Hitbox (Ensures clicking anywhere on the pin selects it)
    const hitGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.y = 0.6;
    hitMesh.userData = { poiId: poi.id };
    group.add(hitMesh);
    poiClickableMeshes.push(hitMesh);

    // 3. Vertical Light Beacon Guideline to Floor
    const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, poi.pos.y, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: poi.color,
      transparent: true,
      opacity: 0.65
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -poi.pos.y / 2;
    group.add(beam);

    // 4. Pulsing Google Maps Floor Target Halo
    const ringGeo = new THREE.RingGeometry(0.22, 0.42, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: poi.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -poi.pos.y + 0.02;
    group.add(ring);

    group.userData = { poi, ring, sprite: pinSprite, baseY: 0.05, index };
    // Visible by default
    group.visible = pinsVisible;
    scene.add(group);
    poiGroups.push(group);
  });
}

// Dynamically synchronize the left Waypoint Dock titles, tags and icons
function updateDockWaypoints(envKey) {
  const activePois = ENV_POIS[envKey] || ENV_POIS.studio;
  activePois.forEach((poi) => {
    const card = document.querySelector(`.waypoint-card[data-poi="${poi.id}"]`);
    if (card) {
      const iconEl = card.querySelector('.wp-icon');
      const titleEl = card.querySelector('.wp-title');
      const tagEl = card.querySelector('.wp-tag');
      if (iconEl) iconEl.textContent = poi.icon;
      if (titleEl) titleEl.textContent = poi.title;
      if (tagEl) tagEl.textContent = poi.badge.split(' ')[0];
    }
  });
}

// Scene Transition Loading Screen Controller
const sceneLoader = document.getElementById('scene-loader');
const loaderTitle = document.getElementById('loader-title');
const loaderSub = document.getElementById('loader-sub');
const loaderBadge = document.getElementById('loader-badge');
const loaderProgressFill = document.getElementById('loader-progress-fill');
const loaderStatusText = document.getElementById('loader-status-text');
const loaderPercentage = document.getElementById('loader-percentage');
const loaderChipSize = document.getElementById('loader-chip-size');
const loaderChipSplats = document.getElementById('loader-chip-splats');

let loaderTimer = null;
let loaderStartTime = 0;
const MIN_LOADER_DURATION_MS = 1500; // Guaranteed minimum display for cinematic clarity

function showSceneLoader(envKey) {
  const config = ENV_CONFIGS[envKey];
  if (!sceneLoader || !config) return;

  loaderStartTime = Date.now();
  if (loaderTimer) clearInterval(loaderTimer);

  sceneLoader.classList.remove('fade-out');
  sceneLoader.style.display = 'flex';
  sceneLoader.style.opacity = '1';

  if (loaderTitle) loaderTitle.textContent = envKey === 'studio' ? 'STREAMING ULTRA-HD SPATIAL TWIN' : 'STREAMING SPATIAL COURTYARD TWIN';
  if (loaderSub) loaderSub.textContent = envKey === 'studio' ? 'Decompressing 1,130,000+ photorealistic Gaussians & allocating WebGL VRAM...' : 'Decompressing 3,135,000+ outdoor Gaussian splats & volumetric foliage...';
  if (loaderBadge) loaderBadge.textContent = envKey === 'studio' ? '1.13M SPLATS BUFFER' : '3.14M SPLATS BUFFER';
  if (loaderChipSize) loaderChipSize.textContent = config.size;
  if (loaderChipSplats) loaderChipSplats.textContent = config.splatCount;

  let progress = 10;
  if (loaderProgressFill) loaderProgressFill.style.width = '10%';
  if (loaderPercentage) loaderPercentage.textContent = '10%';
  if (loaderStatusText) loaderStatusText.textContent = 'Allocating WebGL memory buffers...';

  loaderTimer = setInterval(() => {
    if (progress < 90) {
      progress += Math.floor(Math.random() * 8) + 6;
      if (progress > 90) progress = 90;
      if (loaderProgressFill) loaderProgressFill.style.width = `${progress}%`;
      if (loaderPercentage) loaderPercentage.textContent = `${progress}%`;

      if (progress > 25 && progress < 60) {
        if (loaderStatusText) loaderStatusText.textContent = 'Decompressing 3D covariance & spherical harmonics...';
      } else if (progress >= 60) {
        if (loaderStatusText) loaderStatusText.textContent = 'Binding tile rasterizer & spatial waypoints...';
      }
    }
  }, 80);
}

function hideSceneLoader() {
  const elapsed = Date.now() - loaderStartTime;
  const remainingDelay = Math.max(0, MIN_LOADER_DURATION_MS - elapsed);

  setTimeout(() => {
    if (loaderTimer) clearInterval(loaderTimer);
    if (loaderProgressFill) loaderProgressFill.style.width = '100%';
    if (loaderPercentage) loaderPercentage.textContent = '100%';
    if (loaderStatusText) loaderStatusText.textContent = 'Spatial Twin Ready!';

    setTimeout(() => {
      if (sceneLoader) {
        sceneLoader.classList.add('fade-out');
        setTimeout(() => {
          sceneLoader.style.display = 'none';
        }, 400);
      }
    }, 350);
  }, remainingDelay);
}

function applySplatScale(scale) {
  currentSplatScale = scale;
  if (splatViewer && splatViewer.viewer && splatViewer.viewer.splatMesh) {
    splatViewer.viewer.splatMesh.setSplatScale(scale);
  }
}

function loadEnvironment(envKey, isInitial = false) {
  const config = ENV_CONFIGS[envKey];
  if (!config) return;
  currentEnv = envKey;

  // Trigger high-tech loading screen
  if (!isInitial) {
    showSceneLoader(envKey);
  }

  // Remove previous splat viewer if present
  if (splatViewer) {
    scene.remove(splatViewer);
    if (splatViewer.dispose) splatViewer.dispose();
    splatViewer = null;
  }

  // Reactivate hologram while loading new environment
  if (hologramGroup) {
    hologramGroup.visible = true;
  }

  // Create fresh DropInViewer
  splatViewer = new GaussianSplats3D.DropInViewer({
    gpuAcceleratedSort: false,
    sharedMemoryForWorkers: false
  });

  splatViewer.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
  splatViewer.position.set(config.position.x, config.position.y, config.position.z);
  splatViewer.scale.set(config.scale.x, config.scale.y, config.scale.z);

  // Reset stream progress UI
  const heroFill = document.getElementById('hero-stream-fill');
  const heroPct = document.getElementById('hero-stream-pct');
  const heroStatus = document.getElementById('hero-stream-status');
  if (heroFill) heroFill.style.width = '15%';
  if (heroPct) heroPct.textContent = '15%';
  if (heroStatus) {
    heroStatus.classList.remove('ready');
    heroStatus.innerHTML = '<span class="status-dot"></span> STREAMING ULTRA-HD SPATIAL TWIN';
  }

  // Smooth simulated progress increment to guarantee responsive visual feedback
  if (streamInterval) clearInterval(streamInterval);
  currentProgress = 15;
  streamInterval = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += (90 - currentProgress) * 0.12 + 0.8;
      const p = Math.min(90, Math.round(currentProgress));
      if (heroFill) heroFill.style.width = `${p}%`;
      if (heroPct) heroPct.textContent = `${p}%`;
    }
  }, 250);

  splatViewer.addSplatScene(config.path, {
    splatAlphaRemovalThreshold: 1,
    showLoadingUI: false,
    onProgress: (percent, percentText) => {
      if (typeof percent === 'number' && !isNaN(percent) && percent > currentProgress) {
        currentProgress = percent;
        const p = Math.min(95, Math.round(percent));
        if (heroFill) heroFill.style.width = `${p}%`;
        if (heroPct) heroPct.textContent = `${p}%`;
      }
    }
  }).then(() => {
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
    applySplatScale(config.splatScale);
    updateDensityButtons(config.splatScale);
    if (!isInitial) hideSceneLoader();
    if (hologramGroup) hologramGroup.visible = false;
    if (heroFill) heroFill.style.width = '100%';
    if (heroPct) heroPct.textContent = '100%';
    if (heroStatus) {
      heroStatus.innerHTML = '<span class="status-dot" style="background:#10b981;box-shadow:0 0 10px #10b981;"></span> SPATIAL ENGINE READY • 60 FPS';
      heroStatus.classList.add('ready');
    }
  }).catch((err) => {
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
    console.error('Error loading splat scene:', err);
    if (!isInitial) hideSceneLoader();
  });

  scene.add(splatViewer);

  // Update UI Telemetry
  const statusFidelity = document.getElementById('status-fidelity');
  if (statusFidelity) {
    statusFidelity.textContent = `${config.size} • ${config.fidelity}`;
  }

  // Update Environment Button States
  const btnGarden = document.getElementById('btn-env-garden') || document.getElementById('btn-env-mobile');
  const btnStudio = document.getElementById('btn-env-studio');
  const btnAtrium = document.getElementById('btn-env-atrium');
  if (btnGarden) btnGarden.classList.toggle('active', envKey === 'garden');
  if (btnStudio) btnStudio.classList.toggle('active', envKey === 'studio');
  if (btnAtrium) btnAtrium.classList.toggle('active', envKey === 'atrium');

  // Reposition camera
  camera.position.set(config.cameraPos.x, config.cameraPos.y, config.cameraPos.z);

  // Synchronize POIs to active environment
  if (typeof rebuildPois === 'function') {
    rebuildPois(envKey);
  }
  if (typeof updateDockWaypoints === 'function') {
    updateDockWaypoints(envKey);
  }
}


// Environment Switcher Buttons
const btnEnvGarden = document.getElementById('btn-env-garden') || document.getElementById('btn-env-mobile');
const btnEnvStudio = document.getElementById('btn-env-studio');
const btnEnvAtrium = document.getElementById('btn-env-atrium');

if (btnEnvGarden) {
  btnEnvGarden.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentEnv !== 'garden') loadEnvironment('garden');
  });
}

if (btnEnvStudio) {
  btnEnvStudio.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentEnv !== 'studio') loadEnvironment('studio');
  });
}

if (btnEnvAtrium) {
  btnEnvAtrium.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentEnv !== 'atrium') loadEnvironment('atrium');
  });
}

// Initial Environment Load (Starts with Ultra-HD Studio by default)
loadEnvironment('studio', true);


// ==========================================
// 5. 🛠️ COLLAPSIBLE ROOM CALIBRATION DRAWER
// ==========================================
const calibDrawer = document.getElementById('calib-drawer');
const btnCalibToggle = document.getElementById('btn-calib-toggle');
const btnCalibReset = document.getElementById('btn-calib-reset');

if (btnCalibToggle && calibDrawer) {
  btnCalibToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    calibDrawer.classList.toggle('collapsed');
  });
}

// Density Overlap Buttons
const btnDensity1 = document.getElementById('btn-density-1');
const btnDensity15 = document.getElementById('btn-density-15');
const btnDensity2 = document.getElementById('btn-density-2');

function updateDensityButtons(scale) {
  [btnDensity1, btnDensity15, btnDensity2].forEach(b => b && b.classList.remove('active-density'));
  if (scale <= 1.1 && btnDensity1) btnDensity1.classList.add('active-density');
  else if (scale <= 1.6 && btnDensity15) btnDensity15.classList.add('active-density');
  else if (btnDensity2) btnDensity2.classList.add('active-density');
}

if (btnDensity1) btnDensity1.addEventListener('click', (e) => { e.stopPropagation(); applySplatScale(1.0); updateDensityButtons(1.0); });
if (btnDensity15) btnDensity15.addEventListener('click', (e) => { e.stopPropagation(); applySplatScale(1.5); updateDensityButtons(1.5); });
if (btnDensity2) btnDensity2.addEventListener('click', (e) => { e.stopPropagation(); applySplatScale(2.0); updateDensityButtons(2.0); });

// Calibration Rotation, Height & Scale Buttons
const btnRotX = document.getElementById('btn-rot-x');
const btnRotY = document.getElementById('btn-rot-y');
const btnRotZ = document.getElementById('btn-rot-z');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnBigger = document.getElementById('btn-bigger');
const btnSmaller = document.getElementById('btn-smaller');

if (btnRotX) btnRotX.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.rotation.x += Math.PI / 2; });
if (btnRotY) btnRotY.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.rotation.y += Math.PI / 2; });
if (btnRotZ) btnRotZ.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.rotation.z += Math.PI / 2; });
if (btnUp) btnUp.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.position.y += 0.3; });
if (btnDown) btnDown.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.position.y -= 0.3; });
if (btnBigger) btnBigger.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.scale.multiplyScalar(1.2); });
if (btnSmaller) btnSmaller.addEventListener('click', (e) => { e.stopPropagation(); if (splatViewer) splatViewer.scale.multiplyScalar(0.8); });

if (btnCalibReset) {
  btnCalibReset.addEventListener('click', (e) => {
    e.stopPropagation();
    const config = ENV_CONFIGS[currentEnv];
    if (splatViewer && config) {
      splatViewer.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
      splatViewer.position.set(config.position.x, config.position.y, config.position.z);
      splatViewer.scale.set(config.scale.x, config.scale.y, config.scale.z);
      applySplatScale(config.splatScale);
      updateDensityButtons(config.splatScale);
    }
  });
}

// ==========================================
// 6. 📍 WAYPOINT DOCK & 3D PIN CONTROLS
// ==========================================
const btnTogglePins = document.getElementById('btn-toggle-pins');
if (btnTogglePins) {
  btnTogglePins.addEventListener('click', (e) => {
    e.stopPropagation();
    pinsVisible = !pinsVisible;
    btnTogglePins.textContent = pinsVisible ? '📍 Pins: ON' : '📍 Pins: OFF';
    btnTogglePins.classList.toggle('active', pinsVisible);

    poiGroups.forEach((g) => {
      // Keep target pin visible if actively navigating, otherwise follow pinsVisible
      if (activeTargetPoi && g.userData?.poi?.id === activeTargetPoi.id) {
        g.visible = true;
      } else {
        g.visible = pinsVisible;
      }
    });
  });
}

// ==========================================
// 7. 🧭 INDOOR WAYFINDING & PATHFINDING
// ==========================================
let activeTargetPoi = null;
let navPathLine = null;

function updateNavigationPath() {
  if (navPathLine) {
    scene.remove(navPathLine);
    navPathLine.geometry.dispose();
    navPathLine.material.dispose();
    navPathLine = null;
  }

  if (!activeTargetPoi) return;

  const start = new THREE.Vector3(camera.position.x, 0.05, camera.position.z);
  const target = new THREE.Vector3(activeTargetPoi.pos.x, 0.05, activeTargetPoi.pos.z);

  // Obstacle-aware waypoint corridors
  const points = [start];
  const midX = (start.x + target.x) / 2;
  const midZ = (start.z + target.z) / 2;

  if (Math.abs(midX) < 1.0 && Math.abs(midZ) < 1.0) {
    const doglegZ = midZ > 0 ? midZ + 1.2 : midZ - 1.2;
    points.push(new THREE.Vector3(start.x, 0.05, doglegZ));
    points.push(new THREE.Vector3(target.x, 0.05, doglegZ));
  } else {
    points.push(new THREE.Vector3(start.x, 0.05, target.z));
  }
  points.push(target);

  const curve = new THREE.CatmullRomCurve3(points);
  const smoothPoints = curve.getPoints(50);

  const pathGeo = new THREE.BufferGeometry().setFromPoints(smoothPoints);
  const pathMat = new THREE.LineDashedMaterial({
    color: activeTargetPoi.color,
    dashSize: 0.35,
    gapSize: 0.2,
    linewidth: 3,
    transparent: true,
    opacity: 0.95
  });

  navPathLine = new THREE.Line(pathGeo, pathMat);
  navPathLine.computeLineDistances();
  scene.add(navPathLine);
}

// UI Elements for POI & Dock
const poiModal = document.getElementById('poi-modal');
const poiTitle = document.getElementById('poi-title');
const poiDesc = document.getElementById('poi-desc');
const poiBadge = document.getElementById('poi-badge');
const poiCoords = document.getElementById('poi-coords');
const poiDist = document.getElementById('poi-dist');
const poiWalkTime = document.getElementById('poi-walk-time');
const poiCloseBtn = document.getElementById('poi-close-btn');
const btnPoiNav = document.getElementById('btn-poi-navigate');
const activeRouteBanner = document.getElementById('active-route-banner');
const routeTargetName = document.getElementById('route-target-name');
const btnClearRoute = document.getElementById('btn-clear-route');
const navToast = document.getElementById('nav-toast');
const waypointCards = document.querySelectorAll('.waypoint-card');

function selectPoi(poiId) {
  const activePois = ENV_POIS[currentEnv] || ENV_POIS.studio;
  const poi = activePois.find((p) => p.id === poiId);
  if (!poi) return;

  activeTargetPoi = poi;
  if (poiTitle) poiTitle.textContent = poi.title;
  if (poiDesc) poiDesc.textContent = poi.desc;
  if (poiBadge) poiBadge.textContent = poi.badge;
  if (poiCoords) poiCoords.textContent = `X: ${poi.pos.x.toFixed(1)}, Z: ${poi.pos.z.toFixed(1)}`;

  const dist = camera.position.distanceTo(poi.pos);
  if (poiDist) poiDist.textContent = `${dist.toFixed(1)}m`;
  if (poiWalkTime) {
    const walkSecs = Math.max(3, Math.ceil(dist / 1.1));
    poiWalkTime.textContent = `~${walkSecs} sec`;
  }

  if (poiModal) poiModal.style.display = 'block';

  // Highlight active pin: ensure target pin is illuminated while navigating
  poiGroups.forEach((g) => {
    if (g.userData && g.userData.poi && g.userData.poi.id === poiId) {
      g.visible = true;
    } else if (!pinsVisible) {
      g.visible = false;
    }
  });

  // Update Left Dock Active Card
  waypointCards.forEach((card) => {
    if (card.getAttribute('data-poi') === poiId) {
      card.classList.add('active-target');
    } else {
      card.classList.remove('active-target');
    }
  });

  if (activeRouteBanner) {
    activeRouteBanner.style.display = 'flex';
    if (routeTargetName) routeTargetName.textContent = poi.title;
  }

  updateNavigationPath();
}

function clearNavigation() {
  activeTargetPoi = null;
  if (navPathLine) {
    scene.remove(navPathLine);
    if (navPathLine.geometry) navPathLine.geometry.dispose();
    if (navPathLine.material) navPathLine.material.dispose();
    navPathLine = null;
  }
  if (poiModal) poiModal.style.display = 'none';
  if (activeRouteBanner) activeRouteBanner.style.display = 'none';
  if (navToast) navToast.style.display = 'none';

  waypointCards.forEach((card) => card.classList.remove('active-target'));

  // Reset pin visibility to match master toggle state
  poiGroups.forEach((g) => {
    g.visible = pinsVisible;
  });
}

// Left Dock Click Listeners
waypointCards.forEach((card) => {
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    const poiId = card.getAttribute('data-poi');
    if (poiId) selectPoi(poiId);
  });
});

// Google Maps Indoor Search Controller (Slide 3: Search for a room or item)
const mapsSearchInput = document.getElementById('maps-search-input');
const btnClearSearch = document.getElementById('btn-clear-search');

function filterWaypoints(query) {
  const q = (query || '').trim().toLowerCase();
  if (btnClearSearch) btnClearSearch.style.display = q ? 'block' : 'none';

  let firstMatchId = null;

  waypointCards.forEach((card) => {
    const title = (card.querySelector('.wp-title')?.textContent || '').toLowerCase();
    const tag = (card.querySelector('.wp-tag')?.textContent || '').toLowerCase();
    const poiId = card.getAttribute('data-poi') || '';
    const match = !q || title.includes(q) || tag.includes(q) || poiId.includes(q);
    card.classList.toggle('search-hidden', !match);
    if (match && !firstMatchId) firstMatchId = poiId;
  });

  // Dynamically filter 3D pin markers in the 3D scene
  poiGroups.forEach((g) => {
    const poi = g.userData?.poi;
    if (!poi) return;
    const title = (poi.title || '').toLowerCase();
    const badge = (poi.badge || '').toLowerCase();
    const match = !q || title.includes(q) || badge.includes(q) || poi.id.includes(q);
    if (activeTargetPoi && poi.id === activeTargetPoi.id) {
      g.visible = true;
    } else {
      g.visible = pinsVisible && match;
    }
  });

  return firstMatchId;
}

if (mapsSearchInput) {
  mapsSearchInput.addEventListener('input', (e) => {
    filterWaypoints(e.target.value);
  });

  mapsSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstId = filterWaypoints(mapsSearchInput.value);
      if (firstId) {
        selectPoi(firstId);
        const activePois = ENV_POIS[currentEnv] || ENV_POIS.studio;
        const p = activePois.find((x) => x.id === firstId);
        if (p) camera.lookAt(p.pos.x, EYE_HEIGHT, p.pos.z);
      }
    }
  });
}

if (btnClearSearch) {
  btnClearSearch.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mapsSearchInput) {
      mapsSearchInput.value = '';
      filterWaypoints('');
      mapsSearchInput.focus();
    }
  });
}

if (btnClearRoute) {
  btnClearRoute.addEventListener('click', (e) => {
    e.stopPropagation();
    clearNavigation();
  });
}

if (poiCloseBtn) {
  poiCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (poiModal) poiModal.style.display = 'none';
  });
}

if (btnPoiNav) {
  btnPoiNav.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!activeTargetPoi) return;
    updateNavigationPath();
    camera.lookAt(activeTargetPoi.pos.x, EYE_HEIGHT, activeTargetPoi.pos.z);
    if (poiModal) poiModal.style.display = 'none';
  });
}

// Raycaster for Clicking 3D Pins in World (Active when pins are visible)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  if (pointerControls.isLocked) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const visibleClickables = poiClickableMeshes.filter((m) => m.parent && m.parent.visible);
  const intersects = raycaster.intersectObjects(visibleClickables);

  if (intersects.length > 0) {
    const poiId = intersects[0].object.userData.poiId;
    if (poiId) selectPoi(poiId);
  }
});

// ==========================================
// 8. 📡 HOLOGRAPHIC 2D MINIMAP RADAR
// ==========================================
const minimapCanvas = document.getElementById('minimap');
const ctx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
const radarStatusEl = document.querySelector('.radar-scale');
const MM_SIZE = 180;
const MM_SCALE = MM_SIZE / ROOM_SIZE;
let radarPulsePhase = 0;

function updateMinimap() {
  if (!ctx) return;
  ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);

  radarPulsePhase += 0.035;

  // 1. Deep Obsidian Tactical Radar Background
  const bgGrad = ctx.createRadialGradient(MM_SIZE / 2, MM_SIZE / 2, 8, MM_SIZE / 2, MM_SIZE / 2, MM_SIZE / 2);
  bgGrad.addColorStop(0, '#0c101d');
  bgGrad.addColorStop(0.7, '#070912');
  bgGrad.addColorStop(1, '#030408');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);

  // 2. Subtle Tactical Grid Crosshatch
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
  ctx.lineWidth = 1;
  const gridStep = 30;
  for (let x = gridStep; x < MM_SIZE; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, MM_SIZE);
    ctx.stroke();
  }
  for (let y = gridStep; y < MM_SIZE; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(MM_SIZE, y);
    ctx.stroke();
  }

  // 3. Concentric Metric Range Rings (1.5m, 3.0m, 4.5m)
  const ringDistances = [
    { r: 27, label: '1.5M' },
    { r: 54, label: '3.0M' },
    { r: 81, label: '4.5M' }
  ];

  ringDistances.forEach((ring) => {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(MM_SIZE / 2, MM_SIZE / 2, ring.r, 0, Math.PI * 2);
    ctx.stroke();

    // Metric Distance Callout
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.font = '600 7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ring.label, MM_SIZE / 2, (MM_SIZE / 2) - ring.r + 5);
  });

  // 4. Center Crosshair Lines
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.beginPath();
  ctx.moveTo(MM_SIZE / 2, 0); ctx.lineTo(MM_SIZE / 2, MM_SIZE);
  ctx.moveTo(0, MM_SIZE / 2); ctx.lineTo(MM_SIZE, MM_SIZE / 2);
  ctx.stroke();

  // 5. Compass Cardinal Ticks (N, S, E, W)
  ctx.font = '700 8px "JetBrains Mono", monospace';
  ctx.fillStyle = '#60a5fa';
  ctx.textAlign = 'center';
  ctx.fillText('N', MM_SIZE / 2, 9);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillText('S', MM_SIZE / 2, MM_SIZE - 4);
  ctx.fillText('W', 7, MM_SIZE / 2 + 3);
  ctx.fillText('E', MM_SIZE - 7, MM_SIZE / 2 + 3);

  // 6. Tactical Room Perimeter Boundary Box & Corner Brackets
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
  ctx.lineWidth = 1;
  const pad = 10;
  ctx.strokeRect(pad, pad, MM_SIZE - pad * 2, MM_SIZE - pad * 2);

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  const clen = 8;
  // Top-left
  ctx.beginPath(); ctx.moveTo(pad, pad + clen); ctx.lineTo(pad, pad); ctx.lineTo(pad + clen, pad); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(MM_SIZE - pad - clen, pad); ctx.lineTo(MM_SIZE - pad, pad); ctx.lineTo(MM_SIZE - pad, pad + clen); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(pad, MM_SIZE - pad - clen); ctx.lineTo(pad, MM_SIZE - pad); ctx.lineTo(pad + clen, MM_SIZE - pad); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(MM_SIZE - pad - clen, MM_SIZE - pad); ctx.lineTo(MM_SIZE - pad, MM_SIZE - pad); ctx.lineTo(MM_SIZE - pad, MM_SIZE - pad - clen); ctx.stroke();

  // 7. POI BLIPS (RULE: HIDDEN WHEN PINS ARE OFF, UNLESS IT IS THE ACTIVE TARGET)
  const activePois = ENV_POIS[currentEnv] || ENV_POIS.studio;
  activePois.forEach((poi) => {
    const isTarget = activeTargetPoi && activeTargetPoi.id === poi.id;
    // Strict requirement: If pins are OFF and this is NOT active target, do NOT draw it!
    if (!pinsVisible && !isTarget) return;

    const lx = (poi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
    const lz = (poi.pos.z + ROOM_SIZE / 2) * MM_SCALE;
    const colorHex = `#${poi.color.toString(16).padStart(6, '0')}`;

    if (isTarget) {
      // Pulsing animated Target Lock reticle
      const targetPulse = Math.sin(radarPulsePhase * 3) * 2;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lx, lz, 8 + targetPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Outer targeting brackets
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(lx, lz, 13 + targetPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Core Target Dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(lx, lz, 4, 0, Math.PI * 2);
      ctx.fill();

      // Micro Distance Callout Tag
      const dist = camera.position.distanceTo(poi.pos);
      ctx.fillStyle = 'rgba(7, 10, 18, 0.9)';
      ctx.fillRect(lx - 20, lz - 17, 40, 11);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - 20, lz - 17, 40, 11);

      ctx.fillStyle = '#10b981';
      ctx.font = '700 7px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dist.toFixed(1)}m`, lx, lz - 12);
    } else {
      // Standard POI Diamond (Rendered ONLY when pins are toggled ON)
      ctx.save();
      ctx.translate(lx, lz);
      ctx.rotate(Math.PI / 4);

      ctx.fillStyle = colorHex;
      ctx.shadowColor = colorHex;
      ctx.shadowBlur = 6;
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();

      // Micro Tag above blip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '700 6.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(poi.id.toUpperCase(), lx, lz - 7);
    }
  });

  const px = (camera.position.x + ROOM_SIZE / 2) * MM_SCALE;
  const pz = (camera.position.z + ROOM_SIZE / 2) * MM_SCALE;

  // 8. Animated Active Navigation Route on Minimap
  if (activeTargetPoi) {
    const tx = (activeTargetPoi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
    const tz = (activeTargetPoi.pos.z + ROOM_SIZE / 2) * MM_SCALE;

    // Glowing Neon Dashed Route
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -radarPulsePhase * 15;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(tx, tz);
    ctx.stroke();
    ctx.setLineDash([]);

    // Traveling Energy Pulse Particle along line
    const travelT = (radarPulsePhase * 0.8) % 1;
    const pulseX = px + (tx - px) * travelT;
    const pulseY = pz + (tz - pz) * travelT;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 9. Player Realistic FOV Vision Cone
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const angle = Math.atan2(dir.x, dir.z);

  const fovRadius = 32;
  const fovSpread = 0.52; // ~60 degree viewing cone
  const coneGrad = ctx.createRadialGradient(px, pz, 2, px, pz, fovRadius);
  coneGrad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
  coneGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
  coneGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(px, pz);
  ctx.arc(px, pz, fovRadius, angle - Math.PI / 2 - fovSpread, angle - Math.PI / 2 + fovSpread);
  ctx.closePath();
  ctx.fill();

  // Fine Peripheral Sightline Rays
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, pz);
  ctx.lineTo(px + Math.cos(angle - Math.PI / 2 - fovSpread) * fovRadius, pz + Math.sin(angle - Math.PI / 2 - fovSpread) * fovRadius);
  ctx.moveTo(px, pz);
  ctx.lineTo(px + Math.cos(angle - Math.PI / 2 + fovSpread) * fovRadius, pz + Math.sin(angle - Math.PI / 2 + fovSpread) * fovRadius);
  ctx.stroke();

  // 10. Player Delta Fighter Chevron (Rotates with Player Heading)
  ctx.save();
  ctx.translate(px, pz);
  ctx.rotate(angle);

  // Outer Delta Chevron
  ctx.fillStyle = '#3b82f6';
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, 7); // nose pointing in forward local orientation
  ctx.lineTo(-4.5, -5);
  ctx.lineTo(0, -2.5);
  ctx.lineTo(4.5, -5);
  ctx.closePath();
  ctx.fill();

  // Inner White Core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 11. Dynamic Radar Header Status Text
  if (radarStatusEl) {
    if (activeTargetPoi) {
      radarStatusEl.innerHTML = `<span style="color:#10b981;font-weight:800;">LOCK: ${activeTargetPoi.title.substring(0, 9).toUpperCase()}</span>`;
    } else if (pinsVisible) {
      radarStatusEl.innerHTML = `<span style="color:#60a5fa;font-weight:700;">PINS: ACTIVE</span>`;
    } else {
      radarStatusEl.innerHTML = `<span style="color:var(--text-dim);">STEALTH 1:1</span>`;
    }
  }
}

// Interactive Clickable Minimap: Click on Radar to Select Waypoints
if (minimapCanvas) {
  minimapCanvas.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = minimapCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const activePois = ENV_POIS[currentEnv] || ENV_POIS.mobile;
    for (const poi of activePois) {
      const lx = (poi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
      const lz = (poi.pos.z + ROOM_SIZE / 2) * MM_SCALE;
      const dist = Math.hypot(clickX - lx, clickY - lz);
      if (dist < 18) {
        selectPoi(poi.id);
        return;
      }
    }
  });
}

// ==========================================
// 8.5 🎬 CINEMATIC DRONE TOUR SYSTEM
// ==========================================
let isTourActive = false;
let tourProgress = 0;
let tourCurve = null;

const TOUR_PATHS = {
  studio: [
    new THREE.Vector3(0, 1.8, 3.8),
    new THREE.Vector3(1.5, 1.7, 2.2),
    new THREE.Vector3(1.0, 1.3, 0.4),
    new THREE.Vector3(0.0, 1.4, -0.4),
    new THREE.Vector3(-1.4, 1.6, -0.8),
    new THREE.Vector3(-1.6, 2.0, 1.5),
    new THREE.Vector3(-0.6, 2.2, 3.2),
    new THREE.Vector3(0, 1.8, 3.8)
  ],
  atrium: [
    new THREE.Vector3(0, 2.2, 3.6),
    new THREE.Vector3(2.2, 2.0, 1.8),
    new THREE.Vector3(1.6, 1.5, -0.4),
    new THREE.Vector3(0.0, 1.3, -1.5),
    new THREE.Vector3(-2.0, 1.7, -0.6),
    new THREE.Vector3(-2.2, 2.2, 1.8),
    new THREE.Vector3(-0.5, 2.6, 3.2),
    new THREE.Vector3(0, 2.2, 3.6)
  ],
  garden: [
    new THREE.Vector3(0.2, 2.4, 3.8),
    new THREE.Vector3(2.0, 2.0, 2.0),
    new THREE.Vector3(1.5, 1.6, 0.2),
    new THREE.Vector3(0.2, 1.4, -0.5),
    new THREE.Vector3(-2.0, 1.7, -1.2),
    new THREE.Vector3(-1.8, 2.2, 1.5),
    new THREE.Vector3(-0.2, 2.6, 3.2),
    new THREE.Vector3(0.2, 2.4, 3.8)
  ]
};

function getTourCurveForEnv(envKey) {
  const points = TOUR_PATHS[envKey] || TOUR_PATHS.studio;
  return new THREE.CatmullRomCurve3(points, true, 'centripetal');
}

function startCinematicTour() {
  isTourActive = true;
  tourProgress = 0;
  tourCurve = getTourCurveForEnv(currentEnv);

  if (cinematicBanner) cinematicBanner.style.display = 'flex';
  if (btnTour) btnTour.classList.add('active');
  if (modeLabel) modeLabel.textContent = 'CINEMATIC DRONE TOUR';

  pointerControls.unlock();
  if (blocker) blocker.style.display = 'none';
  if (crosshair) crosshair.style.opacity = '0';
  orbitControls.enabled = false;
}

function stopCinematicTour() {
  if (!isTourActive) return;
  isTourActive = false;
  if (cinematicBanner) cinematicBanner.style.display = 'none';
  if (btnTour) btnTour.classList.remove('active');
  if (modeLabel) modeLabel.textContent = currentMode === 'dollhouse' ? 'DOLLHOUSE (ORBIT)' : 'WALK (1ST PERSON)';

  if (currentMode === 'walk') {
    if (crosshair) crosshair.style.opacity = '1';
    pointerControls.lock();
  } else {
    orbitControls.enabled = true;
  }
}

function toggleCinematicTour() {
  if (isTourActive) {
    stopCinematicTour();
  } else {
    startCinematicTour();
  }
}

if (btnTour) {
  btnTour.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCinematicTour();
  });
}

if (btnStopTour) {
  btnStopTour.addEventListener('click', (e) => {
    e.stopPropagation();
    stopCinematicTour();
  });
}

// ==========================================
// 9. ANIMATION LOOP & LIVE TELEMETRY
// ==========================================
const clock = new THREE.Clock();
const walkSpeed = 3.5;
const smoothVelocity = new THREE.Vector2(0, 0);
let bobTimer = 0;
let pulseTimer = 0;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  pulseTimer += delta * 2.5;

  // Animate Holographic Laser Scan Plane if active
  if (hologramGroup && hologramGroup.visible && scanPlane) {
    scanPlane.position.y = 0.2 + (Math.sin(pulseTimer * 1.2) + 1) * 1.3;
  }

  // Pulse POI Target Rings & Gentle Floating Bob on 3D Google Maps Pins
  poiGroups.forEach((g) => {
    if (g.visible) {
      if (g.userData.ring) {
        const scale = 1 + Math.sin(pulseTimer) * 0.15;
        g.userData.ring.scale.set(scale, scale, 1);
      }
      if (g.userData.sprite) {
        const idx = g.userData.index || 0;
        const bob = Math.sin(pulseTimer * 1.8 + idx) * 0.04;
        g.userData.sprite.position.y = (g.userData.baseY || 0.05) + bob;
      }
    }
  });

  // Update Dynamic Distances in Waypoint Dock
  const currentPois = ENV_POIS[currentEnv] || ENV_POIS.studio;
  currentPois.forEach((poi) => {
    const distEl = document.querySelector(`[data-dist="${poi.id}"]`);
    if (distEl) {
      const d = camera.position.distanceTo(poi.pos);
      distEl.textContent = `${d.toFixed(1)}m`;
    }
  });

  // Animate Navigation Path
  if (navPathLine && navPathLine.material) {
    navPathLine.material.dashOffset -= delta * 1.5;
    updateNavigationPath();

    if (activeTargetPoi) {
      const dist = camera.position.distanceTo(activeTargetPoi.pos);
      if (poiDist) poiDist.textContent = `${dist.toFixed(1)}m`;
      if (poiWalkTime) {
        const walkSecs = Math.max(3, Math.ceil(dist / 1.1));
        poiWalkTime.textContent = `~${walkSecs} sec`;
      }

      if (dist < 1.0) {
        if (navToast) navToast.style.display = 'block';
      } else {
        if (navToast) navToast.style.display = 'none';
      }
    }
  }

  // Cinematic Drone Flythrough vs Game-Engine Character Movement
  if (isTourActive && tourCurve) {
    tourProgress += delta * 0.035; // ~28s continuous scenic loop
    const t = tourProgress % 1.0;
    const currentPoint = tourCurve.getPoint(t);
    const lookAheadPoint = tourCurve.getPoint((t + 0.03) % 1.0);

    camera.position.copy(currentPoint);
    camera.lookAt(lookAheadPoint);

    // Dynamic FOV for sweeping drone cinematography
    camera.fov += (72 - camera.fov) * (1 - Math.exp(-6 * delta));
    camera.updateProjectionMatrix();
  } else if (currentMode === 'walk' && pointerControls.isLocked) {
    const isMoving = moveState.forward || moveState.backward || moveState.left || moveState.right;
    const currentSpeed = moveState.sprint ? 6.8 : walkSpeed;

    // Direct, responsive character displacement
    let forwardInput = 0;
    if (moveState.forward) forwardInput += 1;
    if (moveState.backward) forwardInput -= 1;

    let strafeInput = 0;
    if (moveState.right) strafeInput += 1;
    if (moveState.left) strafeInput -= 1;

    const inputLen = Math.hypot(forwardInput, strafeInput);
    let targetForward = 0;
    let targetStrafe = 0;
    if (inputLen > 0) {
      targetForward = (forwardInput / inputLen) * currentSpeed;
      targetStrafe = (strafeInput / inputLen) * currentSpeed;
    }

    // Smooth momentum velocity (x: strafe, y: forward)
    const accelFactor = 1 - Math.exp(-15 * delta);
    smoothVelocity.x += (targetStrafe - smoothVelocity.x) * accelFactor;
    smoothVelocity.y += (targetForward - smoothVelocity.y) * accelFactor;

    // Apply movement to Three.js PointerLockControls
    if (Math.abs(smoothVelocity.y) > 0.001) {
      pointerControls.moveForward(smoothVelocity.y * delta);
    }
    if (Math.abs(smoothVelocity.x) > 0.001) {
      pointerControls.moveRight(smoothVelocity.x * delta);
    }

    // Natural head-bobbing when moving
    const activeSpeed = Math.hypot(smoothVelocity.x, smoothVelocity.y);
    if (activeSpeed > 0.2) {
      const bobFreq = moveState.sprint ? 13 : 9;
      bobTimer += delta * bobFreq;
      const bobAmp = moveState.sprint ? 0.04 : 0.022;
      camera.position.y = EYE_HEIGHT + Math.sin(bobTimer) * bobAmp;
    } else {
      camera.position.y += (EYE_HEIGHT - camera.position.y) * 0.15;
    }

    // Dynamic FOV Warp (75° base, 83° sprint warp speed)
    const targetFOV = (moveState.sprint && isMoving) ? 83 : 75;
    camera.fov += (targetFOV - camera.fov) * (1 - Math.exp(-8 * delta));
    camera.updateProjectionMatrix();

    // Boundary constraints
    const LIMIT = (ROOM_SIZE / 2) - 0.5;
    camera.position.x = Math.max(-LIMIT, Math.min(LIMIT, camera.position.x));
    camera.position.z = Math.max(-LIMIT, Math.min(LIMIT, camera.position.z));
  } else if (currentMode === 'dollhouse') {
    orbitControls.update();
  }

  // Update Telemetry Display
  if (coordsLabel) coordsLabel.textContent = `X: ${camera.position.x.toFixed(1)}, Z: ${camera.position.z.toFixed(1)}`;
  if (headingLabel) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const degrees = Math.round(((Math.atan2(dir.x, -dir.z) * 180 / Math.PI) + 360) % 360);
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    const index = Math.round(degrees / 45) % 8;
    headingLabel.textContent = `${degrees}° ${cardinals[index]}`;
  }

  updateMinimap();

  if (splatViewer && splatViewer.update) {
    splatViewer.update();
  }

  renderer.render(scene, camera);
}

animate();