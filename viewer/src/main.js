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

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
// 3. KEYBOARD INPUT TRACKING
// ==========================================
const moveState = { forward: false, backward: false, left: false, right: false };

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyV') {
    setMode(currentMode === 'walk' ? 'dollhouse' : 'walk');
    return;
  }
  if (event.code === 'KeyH') {
    if (helpModal) {
      helpModal.style.display = helpModal.style.display === 'none' ? 'flex' : 'none';
    }
    return;
  }
  if (currentMode !== 'walk') return;

  switch (event.code) {
    case 'KeyW': case 'ArrowUp': moveState.forward = true; break;
    case 'KeyS': case 'ArrowDown': moveState.backward = true; break;
    case 'KeyA': case 'ArrowLeft': moveState.left = true; break;
    case 'KeyD': case 'ArrowRight': moveState.right = true; break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': case 'ArrowUp': moveState.forward = false; break;
    case 'KeyS': case 'ArrowDown': moveState.backward = false; break;
    case 'KeyA': case 'ArrowLeft': moveState.left = false; break;
    case 'KeyD': case 'ArrowRight': moveState.right = false; break;
  }
});

// ==========================================
// 4. 🔥 3D ROOM GAUSSIAN SPLAT SCENE
// ==========================================
const splatViewer = new GaussianSplats3D.DropInViewer({
  gpuAcceleratedSort: false,
  sharedMemoryForWorkers: false
});

// Default calibrated orientation
splatViewer.rotation.x = Math.PI;
splatViewer.rotation.z = Math.PI / 2;
splatViewer.position.set(0, 1.0, 0);
splatViewer.scale.set(1.5, 1.5, 1.5);

splatViewer.addSplatScene('/room_v2.splat', {
  splatAlphaRemovalThreshold: 1,
  showLoadingUI: true
});

scene.add(splatViewer);

// Floor Grid & Lighting
const ROOM_SIZE = 20;
const gridHelper = new THREE.GridHelper(ROOM_SIZE, 20, 0x00d2ff, 0x1e293b);
gridHelper.position.y = 0;
scene.add(gridHelper);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));

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

const btnRotX = document.getElementById('btn-rot-x');
const btnRotY = document.getElementById('btn-rot-y');
const btnRotZ = document.getElementById('btn-rot-z');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnBigger = document.getElementById('btn-bigger');
const btnSmaller = document.getElementById('btn-smaller');

if (btnRotX) btnRotX.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.rotation.x += Math.PI / 2; });
if (btnRotY) btnRotY.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.rotation.y += Math.PI / 2; });
if (btnRotZ) btnRotZ.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.rotation.z += Math.PI / 2; });
if (btnUp) btnUp.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.position.y += 0.3; });
if (btnDown) btnDown.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.position.y -= 0.3; });
if (btnBigger) btnBigger.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.scale.multiplyScalar(1.2); });
if (btnSmaller) btnSmaller.addEventListener('click', (e) => { e.stopPropagation(); splatViewer.scale.multiplyScalar(0.8); });

if (btnCalibReset) {
  btnCalibReset.addEventListener('click', (e) => {
    e.stopPropagation();
    splatViewer.rotation.set(Math.PI, 0, Math.PI / 2);
    splatViewer.position.set(0, 1.0, 0);
    splatViewer.scale.set(1.5, 1.5, 1.5);
  });
}

// ==========================================
// 6. 📍 3D POINTS OF INTEREST (POIS)
// ==========================================
const POI_DATA = [
  {
    id: 'workstation',
    title: 'Workstation Alpha',
    badge: 'HARDWARE LAB',
    desc: 'Primary dual-monitor engineering workspace with high-performance computing unit.',
    pos: new THREE.Vector3(1.8, 0.9, -1.2),
    color: 0x00d2ff,
    icon: '🖥️'
  },
  {
    id: 'display',
    title: 'Main Display Hub',
    badge: 'MEDIA CENTER',
    desc: 'Wall-mounted 4K visual panel for real-time telemetry streaming and presentations.',
    pos: new THREE.Vector3(-2.2, 1.2, 0.2),
    color: 0xf43f5e,
    icon: '📺'
  },
  {
    id: 'door',
    title: 'Room Access Door',
    badge: 'EGRESS / EXIT',
    desc: 'Primary entry and egress corridor threshold with magnetic access controls.',
    pos: new THREE.Vector3(0.0, 1.0, 4.0),
    color: 0x10b981,
    icon: '🚪'
  }
];

// 2D Text Billboard Sprite
function createTextSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const c = canvas.getContext('2d');

  c.fillStyle = 'rgba(13, 17, 28, 0.88)';
  c.strokeStyle = colorHex;
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(4, 4, 248, 56, 12);
  c.fill();
  c.stroke();

  c.fillStyle = '#ffffff';
  c.font = 'bold 22px -apple-system, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.2, 0.3, 1);
  return sprite;
}

const poiGroups = [];
const poiClickableMeshes = [];

POI_DATA.forEach((poi) => {
  const group = new THREE.Group();
  group.position.copy(poi.pos);

  // Glowing Core Sphere
  const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: poi.color,
    emissive: poi.color,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.userData = { poiId: poi.id };
  group.add(sphere);
  poiClickableMeshes.push(sphere);

  // Vertical Light Beacon to Floor
  const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, poi.pos.y, 8);
  const beamMat = new THREE.MeshBasicMaterial({
    color: poi.color,
    transparent: true,
    opacity: 0.6
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -poi.pos.y / 2;
  group.add(beam);

  // Pulsing Floor Target Ring
  const ringGeo = new THREE.RingGeometry(0.2, 0.35, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: poi.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -poi.pos.y + 0.02;
  group.add(ring);

  // Floating Text Badge
  const labelSprite = createTextSprite(`${poi.icon} ${poi.title}`, `#${poi.color.toString(16).padStart(6, '0')}`);
  labelSprite.position.y = 0.32;
  group.add(labelSprite);

  group.userData = { poi, ring };
  scene.add(group);
  poiGroups.push(group);
});

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
const poiCloseBtn = document.getElementById('poi-close-btn');
const btnPoiNav = document.getElementById('btn-poi-navigate');
const activeRouteBanner = document.getElementById('active-route-banner');
const routeTargetName = document.getElementById('route-target-name');
const btnClearRoute = document.getElementById('btn-clear-route');
const navToast = document.getElementById('nav-toast');
const waypointCards = document.querySelectorAll('.waypoint-card');

function selectPoi(poiId) {
  const poi = POI_DATA.find((p) => p.id === poiId);
  if (!poi) return;

  activeTargetPoi = poi;
  if (poiTitle) poiTitle.textContent = poi.title;
  if (poiDesc) poiDesc.textContent = poi.desc;
  if (poiBadge) poiBadge.textContent = poi.badge;
  if (poiCoords) poiCoords.textContent = `X: ${poi.pos.x.toFixed(1)}, Z: ${poi.pos.z.toFixed(1)}`;

  const dist = camera.position.distanceTo(poi.pos);
  if (poiDist) poiDist.textContent = `${dist.toFixed(1)}m`;

  if (poiModal) poiModal.style.display = 'block';

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
    navPathLine = null;
  }
  if (poiModal) poiModal.style.display = 'none';
  if (activeRouteBanner) activeRouteBanner.style.display = 'none';
  if (navToast) navToast.style.display = 'none';

  waypointCards.forEach((card) => card.classList.remove('active-target'));
}

// Left Dock Click Listeners
waypointCards.forEach((card) => {
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    const poiId = card.getAttribute('data-poi');
    if (poiId) selectPoi(poiId);
  });
});

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

// Raycaster for Clicking 3D Pins in World
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  if (pointerControls.isLocked) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(poiClickableMeshes);

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
const MM_SIZE = 180;
const MM_SCALE = MM_SIZE / ROOM_SIZE;

function updateMinimap() {
  if (!ctx) return;
  ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);

  // Dark obsidian grid
  ctx.fillStyle = '#090a10';
  ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);

  // Concentric Range Rings
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
  ctx.lineWidth = 1;
  [30, 60, 85].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(MM_SIZE / 2, MM_SIZE / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Crosshair Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.beginPath();
  ctx.moveTo(MM_SIZE / 2, 0); ctx.lineTo(MM_SIZE / 2, MM_SIZE);
  ctx.moveTo(0, MM_SIZE / 2); ctx.lineTo(MM_SIZE, MM_SIZE / 2);
  ctx.stroke();

  // POI Blips
  POI_DATA.forEach((poi) => {
    const lx = (poi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
    const lz = (poi.pos.z + ROOM_SIZE / 2) * MM_SCALE;

    ctx.fillStyle = `#${poi.color.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(lx, lz, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pulse ring around target
    if (activeTargetPoi && activeTargetPoi.id === poi.id) {
      ctx.strokeStyle = `#${poi.color.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lx, lz, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const px = (camera.position.x + ROOM_SIZE / 2) * MM_SCALE;
  const pz = (camera.position.z + ROOM_SIZE / 2) * MM_SCALE;

  // Active Navigation Route Line on Radar
  if (activeTargetPoi) {
    const tx = (activeTargetPoi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
    const tz = (activeTargetPoi.pos.z + ROOM_SIZE / 2) * MM_SCALE;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(tx, tz);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Player Vision Cone (FOV)
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const angle = Math.atan2(dir.x, dir.z);

  ctx.fillStyle = 'rgba(0, 210, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(px, pz);
  ctx.arc(px, pz, 22, angle - Math.PI / 2 - 0.45, angle - Math.PI / 2 + 0.45);
  ctx.closePath();
  ctx.fill();

  // Player Dot
  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.arc(px, pz, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ==========================================
// 9. ANIMATION LOOP & LIVE TELEMETRY
// ==========================================
const clock = new THREE.Clock();
const walkSpeed = 3.5;
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

  // Pulse POI Target Rings
  poiGroups.forEach((g) => {
    if (g.userData.ring) {
      const scale = 1 + Math.sin(pulseTimer) * 0.15;
      g.userData.ring.scale.set(scale, scale, 1);
    }
  });

  // Update Dynamic Distances in Waypoint Dock
  POI_DATA.forEach((poi) => {
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

      if (dist < 1.0) {
        if (navToast) navToast.style.display = 'block';
      } else {
        if (navToast) navToast.style.display = 'none';
      }
    }
  }

  // Walk Movement
  if (currentMode === 'walk' && pointerControls.isLocked) {
    const isMoving = moveState.forward || moveState.backward || moveState.left || moveState.right;

    if (moveState.forward) pointerControls.moveForward(walkSpeed * delta);
    if (moveState.backward) pointerControls.moveForward(-walkSpeed * delta);
    if (moveState.right) pointerControls.moveRight(walkSpeed * delta);
    if (moveState.left) pointerControls.moveRight(-walkSpeed * delta);

    if (isMoving) {
      bobTimer += delta * 10;
      camera.position.y = EYE_HEIGHT + Math.sin(bobTimer) * 0.03;
    } else {
      camera.position.y += (EYE_HEIGHT - camera.position.y) * 0.1;
    }

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