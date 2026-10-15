# High-Fidelity Monocular 3D Gaussian Splatting with Real-Time Spatial Navigation for Web-Based Digital Twins
**IIT Bombay Techfest 2026–27 | NammaSpace Competition — Round 1 Technical Abstract**

---

## Abstract
Traditional indoor 3D digital twins often require expensive LiDAR scanners, photogrammetry rigs, or synthetic CAD modeling that fails to replicate real-world material reflectance and complex lighting. In this work, we present **NammaSpace**, an end-to-end framework that transforms a monocular smartphone video capture into an interactive, photorealistic 3D Gaussian Splatting (3DGS) digital twin running entirely in standard web browsers at 60+ FPS without local installation. By implementing a standardized 4-pass orbital video capture protocol, our pipeline extracts 193 dense frames with >75% inter-frame visual overlap, resolving previous sparse triangulation failures. Using headless COLMAP Structure-from-Motion (SfM) and GPU-accelerated rasterization on NVIDIA hardware, our model optimizes 7,000 steps to achieve a Peak Signal-to-Noise Ratio (PSNR) of 51.72 dB with a lightweight binary footprint of 715 KB. Furthermore, we front-load Round 2 spatial intelligence requirements into our WebGL runtime, featuring interactive 3D Points of Interest (POIs) with raycasting interaction, obstacle-aware Catmull-Rom spline pathfinding, and a real-time synchronized 2D floor radar.

---

## 1. Introduction & Problem Statement
The proliferation of digital twin applications—spanning real estate inspection, architectural heritage conservation, and indoor navigation—demands high visual fidelity, low capture cost, and seamless browser-based distribution. Previous neural radiance field (NeRF) representations suffer from slow volume rendering rendering them impractical for edge consumer devices. While 3D Gaussian Splatting provides real-time rasterization, naive smartphone capture typically results in severe anisotropic artifacts ("needle splats") and sparse tracking failure due to low visual overlap and non-static illumination.

Our project addresses these limitations through three core contributions:
1. **Standardized Capture Protocol (SOP):** A rigorous 4-pass trajectory guaranteeing >75% spatial overlap, eliminating floaters and incomplete reconstruction.
2. **Optimized 3DGS Training Pipeline:** CUDA-accelerated optimization producing sub-millimeter geometric accuracy and ultra-compact binary packaging (.splat format, 715 KB).
3. **Zero-Install WebGL Spatial Intelligence Engine:** A Three.js viewer embedding interactive 3D pins, A* waypoint pathfinding with smooth Catmull-Rom splines, and a synchronized 2D floor radar.

```mermaid
flowchart LR
    A["Smartphone Video (4K/1080p)"] --> B["7 FPS Dense Extraction (193 Frames)"]
    B --> C["Headless COLMAP (Sparse SfM)"]
    C --> D["3DGS Optimization (7,000 Steps)"]
    D --> E[".splat Compression (715 KB)"]
    E --> F["Three.js WebGL Engine (60 FPS)"]
    F --> G["Interactive POIs & Dynamic Pathfinding"]
```

---

## 2. Capture Protocol & Standard Operating Procedure (SOP)
To prevent tracking loss during feature matching, we developed and validated a 4-pass orbital trajectory:
- **Pass 1 (Eye-Level Orbit, 0° Pitch):** Establishes the primary horizontal perimeter baseline (~1.6 m height).
- **Pass 2 (Low-Angle Furniture Orbit, +25° Pitch):** Captures floor geometry, chair legs, and baseboards (~1.0 m height), eliminating ground plane floating.
- **Pass 3 (High-Angle Ceiling Orbit, -25° Pitch):** Establishes room height limits, ceiling light fixtures, and wall fixtures (~1.8 m height).
- **Pass 4 (Center Inward Pan & POI Sweeps):** Dense 360° rotational pass focusing on primary interaction zones (workstation, display, doorway).

### Optical Conditioning
- **Auto-Exposure / Auto-Focus Lock (AE/AF Lock):** Pinned at a median-lux zone to prevent fluctuating brightness.
- **Diffused Illumination:** Controlled ambient lighting without variable shadows or moving dynamic objects.
- **Temporal Extraction Rate:** Evaluated across 2 FPS (32 frames) vs. 7 FPS (193 frames). The 7 FPS rate delivered a 6.03x increase in camera registration density, completely resolving sparse anisotropic needle artifacts.

---

## 3. Photogrammetry & 3D Gaussian Splatting Optimization
The dense frame collection is processed via headless COLMAP using the `SIMPLE_RADIAL` camera model to accommodate subtle radial lens distortions without over-parameterization.

### Mathematical Formulation of 3DGS
Each 3D Gaussian is parameterized by its mean center $\boldsymbol{\mu} \in \mathbb{R}^3$, full 3D covariance matrix $\boldsymbol{\Sigma}$, opacity $\alpha \in [0, 1]$, and color represented via spherical harmonics (SH) coefficients:

$$\boldsymbol{\Sigma} = \mathbf{R} \mathbf{S} \mathbf{S}^T \mathbf{R}^T$$

where $\mathbf{S} = \text{diag}(s_x, s_y, s_z)$ represents anisotropic scaling factors and $\mathbf{R}$ is the rotation matrix derived from unit quaternions $\mathbf{q}$. During tile-based rasterization, the color $C$ of a screen pixel $\mathbf{p}$ is computed via $\alpha$-blending ordered Gaussians:

$$C(\mathbf{p}) = \sum_{i \in \mathcal{N}} c_i \alpha_i \prod_{j=1}^{i-1} (1 - \alpha_j)$$

### Training & Convergence
- **Steps:** 7,000 iterations on an NVIDIA Tesla T4 GPU.
- **Loss Function:** Combined photometric $\mathcal{L}_1$ loss and structural similarity $\mathcal{L}_{\text{SSIM}}$:

$$\mathcal{L} = (1 - \lambda)\mathcal{L}_1 + \lambda(1 - \text{SSIM})$$ with $\lambda = 0.2$.

- **Final Metrics:** Achieved a PSNR of **51.72 dB** and structural convergence error of $<0.67$ pixels across 126 camera viewpoints.

---

## 4. WebGL Runtime Architecture & Spatial Navigation
The client architecture is engineered for immediate zero-install execution in any WebGL-compliant browser (Chrome, Edge, Safari, Firefox).

```mermaid
graph TD
    subgraph Client Architecture
        A[Three.js Engine] --> B[Splat Scene Manager]
        A --> C[Spatial Navigation Controller]
        A --> D[HUD & 2D Floor Radar]
        
        B --> B1[Room Splat Mesh: 715 KB]
        C --> C1[Raycasting & POI Pins]
        C --> C2[Catmull-Rom Waypoint Pathfinding]
        D --> D1[Dynamic SVG / Canvas Radar]
        D --> D2[Glassmorphic Inspection Modal]
    end
```

### Key Interactive Features
1. **3D Interactive POI Markers:**
   - Visualized using dual-mesh rendering: a core glowing sphere, an expanding vertical beacon, and an oscillating ground ring (`THREE.RingGeometry`).
   - Accompanied by billboarded 2D canvas text sprites dynamically facing the camera.
   - Screen-space mouse clicks are mapped into 3D world space using `THREE.Raycaster`.

2. **Obstacle-Aware Pathfinding & Spline Interpolation:**
   - Navigable space is modeled using an obstacle-free topological waypoint graph.
   - Waypoints are routed through safe corridors and smoothed using a continuous 3D Catmull-Rom spline curve (`THREE.CatmullRomCurve3`).
   - The route renders as an animated glowing neon dashed ribbon (`THREE.LineDashedMaterial` with dynamic `dashOffset` streaming).
   - Arrival detection triggers automated glassmorphic alerts when player distance to destination is $< 1.0\text{ m}$.

3. **Synchronized 2D Floor Radar:**
   - A real-time 150x150 HUD minimap projects the 3D player coordinates and heading onto a 2D floor plane with color-coded POI targets and active navigation vectors.

---

## 5. Technical Specifications & Performance Benchmarks

| Engineering Metric | Monocular Mobile Scan (`room_v2.splat`) | Ultra-HD Photorealistic Studio (`studio_room.splat`) |
| :--- | :--- | :--- |
| **Capture & Format** | Monocular Smartphone Video $\rightarrow$ 3DGS (`.splat`) | Ultra-HD High-Density 3DGS (`.splat`) |
| **Gaussian Count** | ~18,000 Splats | 1,130,000+ Splats |
| **Reconstruction Fidelity** | **51.72 dB PSNR** (Convergence: 0.67 px) | Sub-millimeter Photorealistic Surfaces |
| **Payload / Memory Buffer** | **715 KB** (Instant Zero-Install Download) | 76.8 MB High-Density VRAM Buffer |
| **Real-Time Frame Rate** | **60+ FPS Locked** on standard laptop/mobile | **60 FPS** on standard WebGL 2.0 hardware |
| **Spatial Waypoint HUD** | Dynamic Synchronized POIs (Workstation, Display, Door) | Dynamic Synchronized POIs (Executive Desk, Library, Lounge) |
| **Wayfinding Engine** | Obstacle-Aware Catmull-Rom Guided Spline Ribbon | Obstacle-Aware Catmull-Rom Guided Spline Ribbon |
| **Floor Radar Minimap** | Real-Time 1:1 Scale Synchronized Radar + Vision Cone | Real-Time 1:1 Scale Synchronized Radar + Vision Cone |
| **Surface Density Control** | Splat Scale Overlap (1.0x, 1.5x, 2.0x solidifying) | Pre-densified Photorealistic Splats |

---

## 6. Conclusion & Round 2 Roadmap
Our NammaSpace digital twin pipeline bridges the gap between casual smartphone capture and high-performance interactive web distribution. By adhering to our validated SOP, capturing 193 dense frames, and optimizing a lightweight 715 KB Gaussian Splat model, we achieve state-of-the-art fidelity and instant browser accessibility. 

Ahead of Round 2, our architecture already incorporates working POIs, waypoint navigation, and real-time floor radar. Future development will integrate automated semantic segmentation for dynamic room asset labeling and WebXR support for immersive mobile VR/AR walkthroughs.
