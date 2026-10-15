# NammaSpace Project Glossary 📖
*A beginner-friendly guide to all technical terms, tools, and concepts used in this project.*

---

## 🏛️ Project & Competition Terms

- **Digital Twin**: A virtual, interactive 3D replica of a real-world physical object or space inside a computer.
  - *Analogy:* A detailed, life-sized LEGO model of your room inside a computer screen that you can walk through.
- **SOP (Standard Operating Procedure)**: A standardized, repeatable step-by-step checklist or recipe for doing a task consistently.
  - *Analogy:* A foolproof cookie recipe that ensures the cookies taste identical every time, no matter who bakes them.
- **Zero-Install**: Software that runs instantly in a regular web browser without downloading or installing anything.
  - *Analogy:* Watching a video on YouTube instead of having to install a media player app first.
- **POI (Point of Interest)**: A specific labeled landmark or notable location in a 3D space.
  - *Analogy:* A red pushpin dropped onto a map marking your desk or kitchen table.
- **Pathfinding**: The math a computer uses to calculate the best walking route between two points while avoiding obstacles.
  - *Analogy:* Google Maps plotting a route that stays on roads and avoids driving into buildings.
- **Collision Detection**: Rules in code that prevent the virtual camera or player from walking through solid objects.
  - *Analogy:* An invisible barrier that stops you from walking through a glass sliding door.

---

## 📷 3D Reconstruction & Computer Vision Terms

- **3D Reconstruction**: The process of taking a set of flat 2D photos or video and turning them into a 3D digital model.
  - *Analogy:* A sculptor carving a physical statue by examining 50 Polaroid photos taken from different angles.
- **Photogrammetry**: The mathematical science of extracting 3D measurements and shapes from photographs.
  - *Analogy:* Triangulating a lost hiker's location on a map using sightlines to two mountain peaks.
- **Frame**: A single still picture that makes up a video.
  - *Analogy:* A single page in a flipbook. When flipped fast, individual pictures create the illusion of smooth motion.
- **COLMAP**: A computer vision program that calculates camera positions and matches shared visual features across photos.
  - *Analogy:* A surveyor setting up a tripod and laser measuring tape to map out land boundaries.
- **Point Cloud**: A collection of thousands of tiny colored dots floating in 3D space outlining an object or room.
  - *Analogy:* A 3D sculpture made entirely of tiny glow-in-the-dark stars pinned on invisible wires.
- **3D Gaussian Splatting (3DGS)**: A modern 3D technique that represents scenes using millions of semi-transparent, colored fuzzy droplets (splats).
  - *Analogy:* An impressionist oil painting. Up close, it’s tiny dabs of paint; take a step back, and it forms a photo-realistic scene.
- **NeRF (Neural Radiance Fields)**: An AI method that learns how light bounces in a scene to synthesize views from any angle.
  - *Analogy:* An artist with photographic memory who can redraw a room from any angle you ask for on demand.
- **Postshot**: A visual Windows application that uses NVIDIA RTX graphics cards to turn videos into 3D Gaussian Splats with a simple graphical interface.
  - *Analogy:* A digital bread maker: you drop in the ingredients (video), press start, and out comes the finished loaf (3D model).

---

## 💻 Computer & Hardware Terms

- **CPU (Central Processing Unit)**: The main brain of your computer that handles general tasks step by step.
  - *Analogy:* A brilliant university professor solving one complex problem at a time in sequence.
- **GPU (Graphics Processing Unit)**: A specialized processor designed to do thousands of simple visual math calculations at the exact same time.
  - *Analogy:* A stadium full of 5,000 students all solving simple addition problems simultaneously.
- **VRAM (Video RAM)**: The dedicated high-speed short-term memory attached directly to the graphics card.
  - *Analogy:* The personal workbench of the GPU where calculations are laid out without needing to ask the rest of the computer for room.
- **Task Manager**: A Windows dashboard showing all running programs, memory usage, and hardware performance.
  - *Analogy:* A car's dashboard showing your speedometer, tachometer, and fuel levels.

---

## 🌐 Web Development & Software Engineering Terms

- **VS Code (Visual Studio Code)**: A free, lightweight code editor made by Microsoft.
  - *Analogy:* Microsoft Word, but customized with colored text and rulers specifically for writing code.
- **Node.js**: A software engine that lets your computer run JavaScript code directly on your machine.
  - *Analogy:* Taking the motor out of a boat (web browser) and using it to power a car on dry land.
- **npm (Node Package Manager)**: A tool bundled with Node.js to download and manage pre-built code packages.
  - *Analogy:* An "App Store" for developers where you can download ready-to-use software components.
- **LTS (Long Term Support)**: The most stable, thoroughly tested version of a software tool intended for long-term use.
  - *Analogy:* The classic, dependable family car model that has been tested for millions of miles.
- **Terminal / Console**: A text-only window where you type direct text commands to your computer instead of clicking buttons.
  - *Analogy:* Ordering food by speaking directly into a drive-thru microphone instead of tapping a touchscreen menu.
- **Git**: A software tool that records snapshots of all files in a project over time.
  - *Analogy:* A video game checkpoint or save-game system that lets you roll back if you make a mistake.
- **GitHub**: A website where developers store, share, and backup their Git projects online.
  - *Analogy:* Google Drive or Dropbox, but tailored specifically for code and revision history.
- **Commit**: A single recorded save point in Git, accompanied by a short note explaining what changed.
  - *Analogy:* A Polaroid photo of your desk right before starting a new step, labeled with the date and what you did.
- **WebGL**: A browser technology that allows 3D graphics to be drawn on your screen using your graphics card.
  - *Analogy:* A high-speed digital canvas inside Google Chrome designed for 3D video game graphics.
- **Three.js**: A JavaScript library that makes creating 3D scenes in WebGL simple and approachable.
  - *Analogy:* A set of pre-assembled LEGO blocks (lights, cameras, materials) instead of having to melt raw plastic yourself.
- **Vite**: A modern, super-fast tool for starting and running web projects locally while you build them.
  - *Analogy:* A microwave that heats up your food in 3 seconds, compared to an old conventional oven that takes 20 minutes to warm up.
- **Repository (Repo)**: A project folder tracked by Git.
  - *Analogy:* The master project binder holding every draft and version of your work.
- **Dependency / Package**: A piece of pre-made code that your project borrows and relies on.
  - *Analogy:* Buying ready-made flour and butter from a grocery store instead of having to mill grain on a farm.
- **Build**: Converting human-written source code into an optimized, runnable finished web application.
  - *Analogy:* Baking the raw batter in the oven to produce the finished, sliceable cake.
- **Frame Density**: The number of photographic viewpoints captured per second or square meter of an environment.
  - *Analogy:* Taking 200 detailed snapshots from every step in a room versus taking just 3 photos from the doorway. More density means no blind spots.
- **Needle Splats (Anisotropic Artifacts)**: Spiky, stretched-out splats that occur when an AI tries to guess 3D depth with too few photos.
  - *Analogy:* Pulling melted mozzarella cheese until it turns into long stringy needles across an empty gap because you didn't have enough cheese to cover the pizza.

---

## 🧭 Interactive 3D & Navigation Terms

- **Raycasting**: A technique where the computer shoots an invisible laser beam from your mouse click into the 3D world to see what object it hits.
  - *Analogy:* Pointing a laser pointer at a whiteboard to highlight a specific word.
- **Waypoint Pathfinding**: Calculating a smooth navigation route that connects predefined safe walking points while staying clear of obstacles.
  - *Analogy:* Following stepping stones across a pond to get to the other side without stepping into the water.
- **Catmull-Rom Spline**: A mathematical formula that rounds sharp, angular turns into a smooth, curved ribbon or path.
  - *Analogy:* A race track designer taking sharp 90-degree corners and smoothing them into gentle, flowing curves.
- **Billboard Sprite**: A 2D text label or icon in a 3D scene that automatically rotates to always face the viewer’s camera.
  - *Analogy:* The Mona Lisa’s eyes or a cardboard cutout that appears to watch you no matter where you stand in the room.
- **Glassmorphism**: A modern UI design style that gives menus and windows a frosted, translucent glass look with glowing borders.
  - *Analogy:* Looking at text written on frosted bathroom glass with warm room lights glowing gently behind it.
- **2D Floor Radar / Minimap**: A top-down circular radar in the corner of the screen that tracks your real-time position and landmarks.
  - *Analogy:* The GPS navigation screen on a car dashboard showing a bird's-eye view of your vehicle on the road.