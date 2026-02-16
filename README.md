# Zenith Grass

A high-performance, procedural 3D grass simulation built with React, Three.js, and custom GLSL shaders. This project demonstrates an efficient method for rendering vast, dynamic fields of grass that react to wind and user interaction in real-time.

## Key Features

-   **High-Performance Rendering**: Utilizes `THREE.InstancedMesh` to draw up to 100,000 grass blades in a single draw call.
-   **Procedural Generation**: Grass blades are generated and placed procedurally, with variations in height, rotation, and color.
-   **Interactive Wind System**: A dynamic wind effect, powered by simplex noise in the vertex shader, creates natural, flowing movement.
-   **Mouse Trail Interaction**: Users can "flatten" the grass by moving the mouse over it. This effect is achieved by rendering a persistent "trail map" to a `WebGLRenderTarget`, which is then sampled in the vertex shader to displace the grass blades.
-   **Dynamic Lighting**: Features a movable sun with soft, wrapped diffuse lighting and simulated subsurface scattering for a realistic, translucent appearance.
-   **Premium UI**: A sleek, glassmorphic control panel, built with Framer Motion, allows for real-time manipulation of all simulation parameters.
-   **Modern Tooling**: Developed with Vite for an incredibly fast and efficient development workflow.

## Tech Stack

-   **Framework**: React 18
-   **3D Rendering**: Three.js
-   **Shading Language**: GLSL
-   **UI & Animations**: Framer Motion
-   **Build Tool**: Vite
-   **Language**: TypeScript

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   npm, yarn, or pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/zenith-grass.git
    cd zenith-grass
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Build for Production

To create a production-ready build:

```bash
npm run build
```

This command bundles the application into the `dist/` directory, ready for deployment.

## Project Structure

The project follows a modular, component-based architecture.

```
.
├── public/              # Static assets (if any)
├── src/
│   ├── components/
│   │   ├── Grass/
│   │   │   ├── GrassEngine.ts   # Core Three.js class for managing the scene, renderer, and grass simulation
│   │   │   └── shaders.ts       # GLSL vertex and fragment shaders
│   │   └── UI/
│   │       └── Controls.tsx     # React component for the control panel UI
│   ├── utils/
│   │   └── math.ts          # Math helper functions
│   ├── App.tsx              # Main React application component
│   ├── index.tsx            # React entry point
│   └── types.ts             # TypeScript type definitions
├── index.html           # Main HTML entry file
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
