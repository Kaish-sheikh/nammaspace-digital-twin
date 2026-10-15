import './style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

// ==========================================
// 1. SCENE SETUP
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

// ==========================================
// 2. CAMERA (Standing at 1.6m eye height)
// ==========================================
const EYE_HEIGHT = 1.6;
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(0, EYE_HEIGHT, 5);

// ==========================================
// 3. RENDERER (Layer 0 Background)
// ==========================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '0';
document.body.appendChild(renderer.domElement);

// ==========================================
// 4. CONTROLS (Walk Mode vs Dollhouse Mode)
// ==========================================
let currentMode = 'walk';

const pointerControls = new PointerLockControls(camera, document.body);
scene.add(pointerControls.object);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.enabled = false;

// HUD Elements
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const modeLabel = document.getElementById('mode-label');
const coordsLabel = document.getElementById('coords-label');
const headingLabel = document.getElementById('heading-label');
const btnWalk = document.getElementById('btn-walk');
const btnDollhouse = document.getElementById('btn-dollhouse');
const crosshair = document.getElementById('crosshair');

if (instructions) {
  instructions.addEventListener('click', () => {
    if (currentMode === 'walk') pointerControls.lock();
  });
}

pointerControls.addEventListener('lock', () => {
  if (blocker) blocker.style.display = 'none';
});

pointerControls.addEventListener('unlock', () => {
  if (currentMode === 'walk' && blocker) blocker.style.display = 'flex';
});

function setMode(mode) {
  currentMode = mode;
  if (mode === 'dollhouse') {
    pointerControls.unlock();
    if (blocker) blocker.style.display = 'none';
    if (crosshair) crosshair.style.display = 'none';
    orbitControls.enabled = true;

    camera.position.set(0, 6, 8);
    orbitControls.target.set(0, 1, 0);

    if (modeLabel) modeLabel.textContent = 'DOLLHOUSE (ORBIT)';
    if (btnDollhouse) btnDollhouse.classList.add('active');
    if (btnWalk) btnWalk.classList.remove('active');
  } else {
    orbitControls.enabled = false;
    if (crosshair) crosshair.style.display = 'block';

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

// ==========================================
// 5. INPUT TRACKING
// ==========================================
const moveState = { forward: false, backward: false, left: false, right: false };

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyV') {
    setMode(currentMode === 'walk' ? 'dollhouse' : 'walk');
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
// 6. 🔥 3D ROOM SPLAT SCENE
// ==========================================
const splatViewer = new GaussianSplats3D.DropInViewer({
  gpuAcceleratedSort: false,
  sharedMemoryForWorkers: false
});

// Initial orientation (Flipped right-side up)
splatViewer.rotation.x = Math.PI;
splatViewer.rotation.z = Math.PI / 2; // Compensate for phone portrait tilt
splatViewer.position.set(0, 1.0, 0);
splatViewer.scale.set(1.5, 1.5, 1.5);

splatViewer.addSplatScene('/room_v2.splat', {
  splatAlphaRemovalThreshold: 1, // Cleans out low-opacity fuzzy floaters
  showLoadingUI: true
});

scene.add(splatViewer);

// Floor Grid
const ROOM_SIZE = 20;
const gridHelper = new THREE.GridHelper(ROOM_SIZE, 20, 0x00d2ff, 0x1f2937);
gridHelper.position.y = 0;
scene.add(gridHelper);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// ==========================================
// 7. 🛠️ INTERACTIVE ROOM CALIBRATION TOOLBAR
// ==========================================
const calibPanel = document.createElement('div');
calibPanel.id = 'calib-panel';
calibPanel.style.cssText = `
  position: fixed;
  bottom: 80px;
  left: 20px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(0, 210, 255, 0.3);
  padding: 12px;
  border-radius: 12px;
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #fff;
  user-select: none;
`;

calibPanel.innerHTML = `
  <strong style="color: #00d2ff; letter-spacing: 1px;">📐 ROOM ALIGNMENT</strong>
  <div style="display: flex; gap: 6px;">
    <button id="btn-rot-x" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">Rotate X (90°)</button>
    <button id="btn-rot-y" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">Rotate Y (90°)</button>
    <button id="btn-rot-z" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">Rotate Z (90°)</button>
  </div>
  <div style="display: flex; gap: 6px;">
    <button id="btn-up" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">⬆ Higher</button>
    <button id="btn-down" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">⬇ Lower</button>
    <button id="btn-bigger" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">➕ Bigger</button>
    <button id="btn-smaller" style="padding: 4px 8px; border-radius: 4px; cursor: pointer;">➖ Smaller</button>
  </div>
`;

document.body.appendChild(calibPanel);

// Calibration Button Listeners
document.getElementById('btn-rot-x').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.rotation.x += Math.PI / 2;
  console.log("Current Rotation X:", splatViewer.rotation.x);
});
document.getElementById('btn-rot-y').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.rotation.y += Math.PI / 2;
  console.log("Current Rotation Y:", splatViewer.rotation.y);
});
document.getElementById('btn-rot-z').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.rotation.z += Math.PI / 2;
  console.log("Current Rotation Z:", splatViewer.rotation.z);
});
document.getElementById('btn-up').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.position.y += 0.3;
});
document.getElementById('btn-down').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.position.y -= 0.3;
});
document.getElementById('btn-bigger').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.scale.multiplyScalar(1.2);
});
document.getElementById('btn-smaller').addEventListener('click', (e) => {
  e.stopPropagation();
  splatViewer.scale.multiplyScalar(0.8);
});

// ==========================================
// 8. 📍 INTERACTIVE 3D POI PINS & INDOOR NAVIGATION
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
    color: 0xff007f,
    icon: '📺'
  },
  {
    id: 'door',
    title: 'Room Access Door',
    badge: 'EGRESS / EXIT',
    desc: 'Primary entry and egress corridor threshold with magnetic access controls.',
    pos: new THREE.Vector3(0.0, 1.0, 4.0),
    color: 0x00df89,
    icon: '🚪'
  }
];

// Helper to create glowing text billboard sprite
function createTextSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const c = canvas.getContext('2d');

  c.fillStyle = 'rgba(15, 23, 42, 0.85)';
  c.strokeStyle = colorHex;
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(4, 4, 248, 56, 12);
  c.fill();
  c.stroke();

  c.fillStyle = '#ffffff';
  c.font = 'bold 22px sans-serif';
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

  // 1. Glowing Core Sphere
  const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: poi.color,
    emissive: poi.color,
    emissiveIntensity: 0.8,
    roughness: 0.2
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.userData = { poiId: poi.id };
  group.add(sphere);
  poiClickableMeshes.push(sphere);

  // 2. Vertical Light Beacon to Floor
  const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, poi.pos.y, 8);
  const beamMat = new THREE.MeshBasicMaterial({
    color: poi.color,
    transparent: true,
    opacity: 0.6
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -poi.pos.y / 2;
  group.add(beam);

  // 3. Pulsing Floor Target Ring
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

  // 4. Floating Text Badge
  const labelSprite = createTextSprite(`${poi.icon} ${poi.title}`, `#${poi.color.toString(16).padStart(6, '0')}`);
  labelSprite.position.y = 0.32;
  group.add(labelSprite);

  group.userData = { poi, ring };
  scene.add(group);
  poiGroups.push(group);
});

// Navigation State & Dynamic Path Line
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

  // Obstacle-aware waypoint path planning
  const points = [start];
  const midX = (start.x + target.x) / 2;
  const midZ = (start.z + target.z) / 2;

  // If path intersects room center, route along open perimeter corridor
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

// UI Elements for POI & Wayfinding
const poiModal = document.getElementById('poi-modal');
const poiTitle = document.getElementById('poi-title');
const poiDesc = document.getElementById('poi-desc');
const poiBadge = document.getElementById('poi-badge');
const poiCoords = document.getElementById('poi-coords');
const poiDist = document.getElementById('poi-dist');
const poiCloseBtn = document.getElementById('poi-close-btn');
const btnPoiNav = document.getElementById('btn-poi-navigate');
const poiSelect = document.getElementById('poi-select');
const btnClearNav = document.getElementById('btn-clear-nav');
const navToast = document.getElementById('nav-toast');

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
  if (poiSelect) poiSelect.value = poi.id;
  if (btnClearNav) btnClearNav.style.display = 'inline-block';

  updateNavigationPath();
}

function clearNavigation() {
  activeTargetPoi = null;
  if (navPathLine) {
    scene.remove(navPathLine);
    navPathLine = null;
  }
  if (poiModal) poiModal.style.display = 'none';
  if (poiSelect) poiSelect.value = '';
  if (btnClearNav) btnClearNav.style.display = 'none';
  if (navToast) navToast.style.display = 'none';
}

if (poiSelect) {
  poiSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      selectPoi(e.target.value);
    } else {
      clearNavigation();
    }
  });
}

if (btnClearNav) btnClearNav.addEventListener('click', clearNavigation);
if (poiCloseBtn) poiCloseBtn.addEventListener('click', () => {
  if (poiModal) poiModal.style.display = 'none';
});

if (btnPoiNav) {
  btnPoiNav.addEventListener('click', () => {
    if (!activeTargetPoi) return;
    updateNavigationPath();
    camera.lookAt(activeTargetPoi.pos.x, EYE_HEIGHT, activeTargetPoi.pos.z);
    if (poiModal) poiModal.style.display = 'none';
  });
}

// Raycaster for Clicking 3D Pins
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
// 9. 2D MINIMAP RADAR
// ==========================================
const minimapCanvas = document.getElementById('minimap');
const ctx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
const MM_SIZE = 180;
const MM_SCALE = MM_SIZE / ROOM_SIZE;

function updateMinimap() {
  if (!ctx) return;
  ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);

  ctx.fillStyle = '#090a0f';
  ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);

  ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < MM_SIZE; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, MM_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(MM_SIZE, i); ctx.stroke();
  }

  // Draw POI Landmark Dots on Radar
  POI_DATA.forEach((poi) => {
    const lx = (poi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
    const lz = (poi.pos.z + ROOM_SIZE / 2) * MM_SCALE;

    ctx.fillStyle = `#${poi.color.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(lx, lz, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const px = (camera.position.x + ROOM_SIZE / 2) * MM_SCALE;
  const pz = (camera.position.z + ROOM_SIZE / 2) * MM_SCALE;

  // Draw Navigation Route on Radar
  if (activeTargetPoi) {
    const tx = (activeTargetPoi.pos.x + ROOM_SIZE / 2) * MM_SCALE;
    const tz = (activeTargetPoi.pos.z + ROOM_SIZE / 2) * MM_SCALE;

    ctx.strokeStyle = '#00df89';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(tx, tz);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const angle = Math.atan2(dir.x, dir.z);

  ctx.fillStyle = 'rgba(0, 210, 255, 0.25)';
  ctx.beginPath();
  ctx.moveTo(px, pz);
  ctx.arc(px, pz, 20, angle - Math.PI / 2 - 0.5, angle - Math.PI / 2 + 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#00d2ff';
  ctx.beginPath();
  ctx.arc(px, pz, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ==========================================
// 10. ANIMATION LOOP & WAYFINDING LOGIC
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

  if (coordsLabel) coordsLabel.textContent = `X: ${camera.position.x.toFixed(1)}, Z: ${camera.position.z.toFixed(1)}`;
  if (headingLabel) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const degrees = Math.round(((Math.atan2(dir.x, -dir.z) * 180 / Math.PI) + 360) % 360);
    headingLabel.textContent = `${degrees}°`;
  }

  updateMinimap();

  if (splatViewer && splatViewer.update) {
    splatViewer.update();
  }

  renderer.render(scene, camera);
}

animate();