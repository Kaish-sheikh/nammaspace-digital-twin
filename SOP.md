# Standard Operating Procedure (SOP): Monocular Spatial Capture 📱
**Project:** NammaSpace 3D Digital Twin Engine  
**Challenge:** IIT Bombay Techfest 2026–27 | NammaSpace Challenge  
**Target:** Monocular Smartphone Video Capture for Photorealistic 3D Gaussian Splatting  

---

## 1. Executive Summary & Scoring Weightage
The NammaSpace evaluation rubric allocates **20% of the total score to the Capture Standard Operating Procedure (SOP)**. The objective of this SOP is to provide a standardized, repeatable protocol enabling any individual with an ordinary smartphone—without LiDAR, depth cameras, or expensive sensor rigs—to produce dense, photorealistic 3D digital twins with zero floating artifacts, planar ground alignment, and robust feature tracking.

---

## 2. Pre-Capture Environmental Conditioning

To maximize feature detection in Structure-from-Motion (COLMAP) and avoid visual artifacts, the physical venue must adhere to the following protocol:

1. **Static Environment Enforcement:**
   * Dynamic objects (moving people, pets, rotating fans) must be minimized. Any moving element produces contradictory parallax vectors, generating distorted "ghost" floating splats in empty space.
   * *Competition Venue Handling:* In environments with passive pedestrian foot traffic, capture multiple passes at identical angles. The median photometric loss during 3DGS optimization naturally down-weights transient moving pedestrians.

2. **Illumination Stability:**
   * Activate all available indoor overhead lights to establish diffuse, uniform ambient illumination.
   * Close blinds or curtains if direct sunlight creates sharp, moving specular glare across floors or reflective tables.
   * *Mandatory Rule:* Never switch lamps, room lights, or flash units on or off during capture.

3. **Featureless Surface Mitigation:**
   * Monocular feature matchers require high-frequency texture contrast. Pure white, untextured walls lack mathematical interest points.
   * Place temporary non-destructive markers (textured sticky notes, small signs, or room numbers) on expansive blank walls to serve as visual tie-points.

4. **Reflective & Specular Surface Handling:**
   * Full-length mirrors and clear glass walls create virtual "inverted rooms" behind physical boundaries. Cover mirrors or shoot at oblique angles so the camera never faces mirrors perpendicularly.

---

## 3. Hardware & Camera Configuration

| Parameter | Specification | Engineering Rationale |
| :--- | :--- | :--- |
| **Device** | Standard Smartphone (iOS / Android) | Monocular setup without LiDAR (receives higher scoring priority). |
| **Resolution** | 4K UHD ($3840 \times 2160$) preferred; min 1080p | Higher resolution provides denser pixel gradient feedback during optimization. |
| **Frame Rate** | 60 FPS (or 30 FPS) | High frame rate reduces motion blur between adjacent temporal samples. |
| **Lens Choice** | Primary 1x Wide Lens (24–28mm equivalent) | Avoid 0.5x ultra-wide lenses due to extreme radial barrel distortion. |
| **Exposure / Focus** | **LOCKED (AE/AF Lock)** | **CRITICAL:** If exposure changes dynamically near windows or lamps, photogrammetry algorithms fail and generate chromatic noise. |
| **Shutter Speed** | $\ge 1/120\text{ s}$ | Eliminates motion blur. Motion-blurred frames turn directly into scattered needle splats. |
| **Stabilization** | Standard Electronic / Handheld Gimbal | Ensures smooth translational velocity without sudden rotational jerks. |

---

## 4. The Triple-Loop Trajectory (Capture Pattern)

To guarantee the required **$\ge 75\%$ inter-frame visual overlap**, the operator executes a 3-loop nested continuous trajectory:

```
┌────────────────────────────────────────────────────────┐
│ Loop 1: Outer Perimeter (0° Pitch, Facing Walls)       │
│       ┌────────────────────────────────────────┐       │
│       │ Loop 2: Inner Incline (30° Pitch Down) │       │
│       │      ┌──────────────────────────┐      │       │
│       │      │ Loop 3: Central Serpentine│     │       │
│       │      │  & 360° POI Detail Orbits│      │       │
│       │      └──────────────────────────┘      │       │
│       └────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
 [Start Point] ═════════════════════════════════► [Exact Loop Closure]
```

1. **Loop 1 — Outer Perimeter (Facing Walls, $0^\circ$ Pitch):**
   * Walk the outer perimeter ~1.0–1.5 meters from walls, keeping the camera oriented toward walls, doors, signage, and windows at eye level ($1.6\text{ m}$).
   * Use a steady "ninja walk" (bent knees, heel-to-toe progression) to eliminate vertical bobbing.

2. **Loop 2 — Inner Incline (Facing Room Center, $30^\circ$ Pitch Down):**
   * Retrace the perimeter, angling the phone $30^\circ$ downward toward the room center, furniture, seating, and floors.
   * *Purpose:* Anchors ground-plane coordinates and resolves chair legs, table surfaces, and baseboard boundaries.

3. **Loop 3 — Central Serpentine & POI Detail Orbits:**
   * Walk down central corridors and aisles.
   * For every notable landmark (reception desk, conference display, sofa, entrance), perform a continuous $360^\circ$ orbit at a radius of 1.5–2.0 meters.

4. **Mandatory Loop Closure:**
   * **The recording must finish at the exact physical coordinate where it started.**
   * *Purpose:* Loop closure allows bundle adjustment in COLMAP to bind the final camera trajectory back to the origin, mathematically eliminating spatial drift and ground plane tilt.

---

## 5. Reconstruction & Optimization Pipeline

### 5.1 Frame Extraction (FFmpeg)
Extract frames using scene-filtering to eliminate motion-blurred frames:
```bash
ffmpeg -i venue_capture.mp4 -qscale:v 1 -qmin 1 -vf "fps=7,mpdecimate" frames/%05d.png
```
*For a 60-second video, this yields ~420 sharp keyframes with >80% inter-frame visual overlap.*

### 5.2 Structure-from-Motion (COLMAP)
Run headless COLMAP with pinned camera parameters:
```bash
# 1. Feature Extraction
colmap feature_extractor --database_path colmap.db --image_path frames/ --ImageReader.camera_model OPENCV

# 2. Exhaustive Feature Matching
colmap exhaustive_matcher --database_path colmap.db

# 3. Sparse Triangulation & Bundle Adjustment
colmap mapper --database_path colmap.db --image_path frames/ --output_path sparse/
```

### 5.3 3D Gaussian Splatting Optimization
Train using modern open-source SOTA architectures (2DGS or Nerfstudio MCMC) on Linux GPU compute:
```bash
# Train with continuous floater culling and MCMC densification
ns-train splatfacto \
  --data path/to/colmap_output/ \
  --pipeline.model.cull-alpha-thresh 0.05 \
  --pipeline.model.continue-cull-post-densification True \
  --max-num-iterations 30000
```

---

## 6. Post-Processing & Floater Elimination

To ensure the exported asset does not exhibit scattered pixel noise or hazy artifacts:

1. **Alpha Threshold Pruning:** Prune any Gaussian primitive with opacity $\alpha < 0.05$.
2. **Scale Culling:** Remove any Gaussian whose radius exceeds $0.5\text{ m}$ in world space (eliminates oversized background haze).
3. **Bounding Box Spatial Crop:** Clip all Gaussians outside the physical room envelope:
   $$X \in [X_{\min}, X_{\max}], \quad Y \in [Y_{\min}, Y_{\max}], \quad Z \in [Z_{\min}, Z_{\max}]$$
4. **Binary Splat Quantization:** Convert the optimized `.ply` point cloud into `.splat` or 16-bit half-precision `.ksplat` format using `gaussian-splat-converter` for sub-second streaming into the WebGL client.
