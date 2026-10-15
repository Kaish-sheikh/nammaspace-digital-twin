# Standard Operating Procedure (SOP): Indoor Spatial Capture 📱
**Project:** NammaSpace Digital Twin Engine  
**Target:** Monocular Smartphone Indoor Video & Photogrammetric Capture  
**Purpose:** High-Fidelity 3D Gaussian Splatting & Dense Reconstruction

---

## 1. Pre-Capture Environment Preparation
To ensure clean point-cloud feature matching and avoid visual artifacts, the physical environment must be conditioned according to the following rules:

1. **Illumination Consistency:**
   - Turn on all overhead artificial lights to provide even, diffuse lighting across the entire space.
   - Close window blinds if direct sunlight is casting harsh, moving glare or extreme dark shadows.
   - *Strict Rule:* Never switch lamps on or off during recording.

2. **Static Space Enforcement:**
   - The room must be completely frozen in time.
   - Remove pets, turn off rotating ceiling fans, and ensure no people walk through the frame.
   - Any moving object tricks the triangulation algorithm into generating distorted "ghost" floating points.

3. **Featureless Surface Mitigation (The Blank Wall Problem):**
   - Pure, featureless white walls lack high-contrast mathematical interest points.
   - Temporarily place sticky notes, small posters, or textured items on blank walls to give the feature matcher anchor points.

4. **Specular & Reflective Surfaces:**
   - Close or cover full-length mirrors and reflective glass panes.
   - Reflections create virtual "inverted rooms" behind walls that corrupt depth estimation.

---

## 2. Hardware & Camera Configuration

- **Device:** Standard Smartphone (iOS or Android)
- **Resolution:** 4K UHD (3840x2160) preferred; minimum 1080p FHD (1920x1080)
- **Frame Rate:** 30 FPS or 60 FPS
- **Lens Selection:** Primary Wide lens (1x). *Avoid ultra-wide/fisheye (0.5x) due to heavy optical barrel distortion.*
- **Exposure / Focus Lock (Mandatory):**
  - Point the camera at a medium-lit spot in the center of the room.
  - Long-press the screen until **AE/AF LOCK** (Auto-Exposure / Auto-Focus Lock) appears.
  - *Why:* Prevents the phone from dynamically brightening and dimming as you turn towards a lamp or window.

---

## 3. The 4-Pass Orbital Trajectory (The Capture Pattern)

To achieve the mandatory **>70-80% frame overlap** required for 3D reconstruction, data collection follows a four-pass continuous path:

1. **Pass 1 — Eye-Level Perimeter Orbit (0° Pitch):**
   - Walk slowly around the outer perimeter of the room, keeping the camera at eye level (~1.6 m) facing slightly inward towards the room center.
   - Maintain a steady "ninja walk" (heel-to-toe, bent knees) to minimize vertical bouncing.

2. **Pass 2 — Low-Angle Floor & Furniture Orbit (+20° to +30° Pitch):**
   - Walk the perimeter at chest or waist level (~1.0 m), angling the phone slightly downward towards the floor, desk surfaces, chair legs, and baseboards.
   - *Why:* Prevents ground-plane floating and anchors floor coordinate grids.

3. **Pass 3 — High-Angle Ceiling & Overhead Light Orbit (-20° to -30° Pitch):**
   - Raise the phone above shoulder level (~1.8 m), angling upwards towards the ceiling fixtures, wall decor, and upper corners.
   - *Why:* Reconstructs room height boundaries and overhead light geometry.

4. **Pass 4 — Center Cross & Key Asset Close-ups (Inward Sweep):**
   - Step into the center of the room and perform a slow 360° pan, followed by a slow semi-circle around primary Points of Interest (desk, main screen, entrance doorway).
   - *Why:* Provides micro-detail feature density for interactive POI targets.

---

## 4. Extraction & Reconstruction Pipeline Guidelines

1. **Frame Extraction Rate:**
   - Extract at **7 to 10 FPS** using FFmpeg (`ffmpeg -i input.mp4 -vf "fps=7,scale=1920:-1" frames/%05d.png`).
   - For a typical 25–30 second recording, this yields **180–220 dense frames**, ensuring sub-pixel feature matching in COLMAP without generating blurry transition gaps.

2. **Reconstruction & Training Parameters:**
   - **Feature Extractor:** Headless COLMAP with OpenCV pinned intrinsics (`SIMPLE_RADIAL` camera model).
   - **Gaussian Splatting Iterations:** 7,000 steps minimum (optimal for real-time mobile/browser VRAM footprint while reaching >50 dB PSNR).
   - **Output Format:** Convert trained `.ply` point cloud directly to `.splat` binary format (~700 KB – 1.2 MB) for instant zero-install browser streaming.