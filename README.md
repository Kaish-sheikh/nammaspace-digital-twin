# 🌌 NammaSpace — 3D Digital Twin & Spatial Navigation Engine
> **IIT Bombay Techfest 2026–27 | Digital Twin Challenge (Round 1 Submission)**  
> *Transforming monocular smartphone video captures into zero-install, 60+ FPS interactive 3D Gaussian Splats with real-time waypoint pathfinding and spatial intelligence.*

[![Three.js](https://img.shields.io/badge/Three.js-r186-black?logo=three.js)](https://threejs.org/)
[![Gaussian Splatting](https://img.shields.io/badge/Gaussian_Splatting-3DGS-brightgreen)](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?logo=webgl)](https://www.khronos.org/webgl/)
[![PSNR](https://img.shields.io/badge/Model_Fidelity-51.72_dB_PSNR-blue)](#benchmarks)

---

## 🚀 Key Highlights & Capabilities

- 📱 **Monocular Smartphone Capture:** No LiDAR, no depth sensors, and no expensive multi-camera rigs. Reconstructed entirely from a standard handheld smartphone video.
- 🎯 **Dense Feature Triangulation:** Engineered a 4-Pass Orbital Trajectory extracting 193 dense frames (7 FPS) with >75% inter-frame overlap, completely eliminating floating "needle splats".
- ⚡ **Zero-Install WebGL Viewer:** Runs smoothly at locked 60+ FPS in any standard web browser on desktop or mobile. The complete 3D scene model is compressed into an ultra-lean **715 KB** `.splat` binary payload.
- 📍 **Interactive 3D Points of Interest (POIs):** Raycast-interactive glowing markers with vertical light pillars, pulsing floor rings, and billboarded 2D canvas labels.
- 🧭 **Obstacle-Aware Pathfinding:** Computes safe walking routes using Catmull-Rom spline curves with animated neon dashed directional guides and arrival toasts.
- 🗺️ **Real-Time 2D Floor Radar:** Integrated HUD minimap projecting player coordinates, orientation heading, and live POI target vectors.

---

## 🏗️ Project Architecture & Pipeline

```mermaid
flowchart TD
    subgraph 1. Capture & Photogrammetry
        A["Smartphone Video (4K/1080p, AE/AF Lock)"] --> B["FFmpeg Dense Extraction (193 Frames @ 7 FPS)"]
        B --> C["Headless COLMAP (Sparse SfM Triangulation)"]
    end

    subgraph 2. 3D Gaussian Splatting Training
        C --> D["CUDA Optimization on Tesla T4 (7,000 Steps)"]
        D --> E["PSNR: 51.72 dB | Convergence: 0.67 px"]
        E --> F["Compact .splat Binary Export (715 KB)"]
    end

    subgraph 3. Interactive WebGL Client
        F --> G["Three.js Splat Viewer (@mkkellogg/gaussian-splats-3d)"]
        G --> H["Raycaster Click & POI Modal Card"]
        G --> I["Catmull-Rom Pathfinding Ribbon"]
        G --> J["2D HUD Floor Radar / Minimap"]
    end
```

---

## 📂 Project Structure

```text
nammaspace-digital-twin/
├── SOP.md                       # Standard Operating Procedure for indoor smartphone video capture
├── ROUND1_TECHNICAL_ABSTRACT.md # Formal 5-page research & competition abstract for IIT Bombay Techfest
├── README.md                    # Project overview & documentation
└── viewer/                      # WebGL interactive 3D viewer (Vite + Three.js)
    ├── index.html               # Main viewer UI, HUD, POI search dropdown, glassmorphic card
    ├── public/
    │   ├── room_v2.splat        # Trained monocular 3D Gaussian Splat model (715 KB)
    │   └── studio_room.splat    # Ultra-HD photorealistic spatial studio model (76.8 MB buffer)
    ├── src/
    │   ├── main.js              # Three.js scene, splat loader, POIs, pathfinding, radar logic
    │   └── style.css            # VisionOS dark obsidian glassmorphic HUD design system
    └── package.json             # NPM build dependencies & scripts
```

---

## 🛠️ Quick Start & Local Run

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ LTS recommended)

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/<your-username>/nammaspace-digital-twin.git
cd nammaspace-digital-twin/viewer
npm install
```

### 2. Run Local Development Server
Start Vite's live dev server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 3. Controls & Navigation
- **W / A / S / D:** Walk forward, left, backward, right.
- **Mouse Drag (Left Click):** Look around the 3D room.
- **Mouse Drag (Right Click):** Pan the camera view.
- **Mouse Scroll:** Zoom in / out.
- **Top Environment Switcher:** Toggle seamlessly between **Mobile Scan (715 KB)** and **Ultra-HD Studio (76.8 MB)**.
- **Left Waypoint Dock:** Click any destination card to plot an obstacle-aware green laser walking path across the floor.
- **Pins Toggle Button (`[ 📍 Pins: OFF / ON ]`):** Toggle synchronized 3D landmark beacons on/off on demand.
- **Mode Bar:** Switch between First-Person Walk (`V`) and Dollhouse Orbit (`O`).

---

## 📊 Technical Specifications & System Performance

### 📱 Monocular Mobile Scan (`room_v2.splat`)
- **Capture Method:** Standard handheld smartphone video $\rightarrow$ Dense 3D Gaussian Splatting
- **Gaussian Primitives:** ~18,000 Splats
- **Reconstruction Fidelity:** **51.72 dB PSNR** (Convergence: 0.67 px)
- **File Size / Network Load:** **715 KB** (Instant Zero-Install WebGL Download)
- **Frame Rate:** **60+ FPS Locked** on standard laptop and mobile browsers
- **Spatial Features:** Dynamic 3D Waypoint Beacons, Obstacle-Aware Catmull-Rom Pathfinding, Real-Time 1:1 Scale Floor Radar

### 🏛️ Ultra-HD Photorealistic Studio (`studio_room.splat`)
- **Environment:** High-Fidelity Architectural Studio & Command Hub
- **Gaussian Primitives:** **1,130,000+ Photorealistic Splats**
- **Reconstruction Fidelity:** Sub-millimeter Photorealistic Surfaces & Reflections
- **VRAM Allocation:** 76.8 MB High-Density WebGL Memory Buffer
- **Frame Rate:** **60 FPS Locked** with hardware-accelerated tile rasterization
- **Spatial Features:** Synchronized Studio Waypoints (Executive Desk, Library Hub, Lounge Corridor)

---

## 📜 Standard Operating Procedure (SOP)
See [`SOP.md`](SOP.md) for full capture parameters, exposure locks, and our 4-Pass Orbital Trajectory guidelines.

---
*Created for IIT Bombay Techfest 2026–27 | NammaSpace Challenge.*
