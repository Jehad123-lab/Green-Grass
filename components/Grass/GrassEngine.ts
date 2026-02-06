import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GrassConfig } from '../../types';
import { vertexShader, fragmentShader } from './shaders';
import { randomRange } from '../../utils/math';

export class GrassEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private sunLight: THREE.DirectionalLight;
  private rimLight: THREE.SpotLight;
  
  // Mesh & Materials
  private grassMesh: THREE.InstancedMesh | null = null;
  private grassMaterial: THREE.ShaderMaterial | null = null;
  private bladeTexture: THREE.CanvasTexture;
  
  // Optimization: Pooling
  private maxInstances = 100000;
  private offsets: Float32Array;
  private scales: Float32Array;
  private rotations: Float32Array;
  private seeds: Float32Array; // For color variation

  // Interactive Trail System
  private trailScene: THREE.Scene;
  private trailCamera: THREE.OrthographicCamera;
  private trailTarget: THREE.WebGLRenderTarget;
  private trailBrush: THREE.Mesh;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private groundPlane: THREE.Mesh; // Invisible plane for raycasting

  private frameId: number | null = null;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, config: GrassConfig) {
    this.container = container;
    this.initAttributes();

    // 1. Setup Main Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#050505'); 
    this.scene.fog = new THREE.Fog('#050505', 8, 30); // Dense, dark fog

    // 2. Setup Camera
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 4, 12);

    // 3. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.autoClear = false; // Important for trail persistence
    container.appendChild(this.renderer.domElement);

    // 4. Trail System Setup
    this.initTrailSystem();

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; 
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 40; 
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.6; 

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048; 
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 50;
    this.sunLight.shadow.bias = -0.0001;
    // Cover the field area
    const d = 25;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.SpotLight(0xffddaa, 5.0);
    this.rimLight.position.set(0, 8, -15);
    this.rimLight.penumbra = 0.5;
    this.scene.add(this.rimLight);

    // 7. Ground (Visual + Raycast Target)
    const groundGeo = new THREE.CircleGeometry(45, 64);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: '#030303', 
        roughness: 0.9, 
        metalness: 0.1 
    });
    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.05;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // 8. Resources
    this.clock = new THREE.Clock();
    this.bladeTexture = this.generateBladeTexture();

    // 9. Build
    this.buildGrass(config);
    this.updateSun(config);

    // 10. Interaction & Resize
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(999, 999); // Offscreen default

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(container);
    window.addEventListener('pointermove', this.onPointerMove);

    this.animate();
  }

  private initTrailSystem() {
    // 512x512 Interactive texture
    this.trailTarget = new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    this.trailScene = new THREE.Scene();
    // 45 units corresponds to our ground size radius approx
    this.trailCamera = new THREE.OrthographicCamera(-25, 25, 25, -25, 0.1, 100);
    this.trailCamera.position.y = 10;
    this.trailCamera.lookAt(0, 0, 0);

    // 1. Fade Plane (Decay)
    // Draws a low opacity black plane over everything to fade trails over time
    const fadeGeo = new THREE.PlaneGeometry(50, 50);
    const fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.04, // Decay speed
    });
    const fadePlane = new THREE.Mesh(fadeGeo, fadeMat);
    fadePlane.rotation.x = -Math.PI / 2;
    fadePlane.position.y = -0.1; // Below brush
    this.trailScene.add(fadePlane);

    // 2. Brush (Cursor Interaction)
    const brushGeo = new THREE.PlaneGeometry(4, 4);
    // Radial gradient texture for smooth brush
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        const grad = ctx.createRadialGradient(32,32,0, 32,32,32);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,64,64);
    }
    const brushTex = new THREE.CanvasTexture(canvas);
    
    const brushMat = new THREE.MeshBasicMaterial({
      map: brushTex,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending, // Additive to build up displacement
    });
    this.trailBrush = new THREE.Mesh(brushGeo, brushMat);
    this.trailBrush.rotation.x = -Math.PI / 2;
    this.trailScene.add(this.trailBrush);
  }

  private initAttributes() {
    const groundSize = 35; 
    this.offsets = new Float32Array(this.maxInstances * 3);
    this.scales = new Float32Array(this.maxInstances);
    this.rotations = new Float32Array(this.maxInstances);
    this.seeds = new Float32Array(this.maxInstances); // For color var

    for (let i = 0; i < this.maxInstances; i++) {
      this.offsets[i * 3] = randomRange(-groundSize / 2, groundSize / 2);
      this.offsets[i * 3 + 1] = 0;
      this.offsets[i * 3 + 2] = randomRange(-groundSize / 2, groundSize / 2);
      
      this.scales[i] = randomRange(0.7, 1.3);
      this.rotations[i] = randomRange(0, Math.PI * 2);
      this.seeds[i] = Math.random();
    }
  }

  private generateBladeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background (Alpha mask)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0,0,512,512);
      
      // Blade shape
      ctx.beginPath();
      ctx.moveTo(256, 512); // Base center
      ctx.lineTo(0, 512);   // Base left
      ctx.bezierCurveTo(0, 200, 256, 0, 256, 0); // Left edge to tip
      ctx.bezierCurveTo(256, 0, 512, 200, 512, 512); // Tip to right edge
      ctx.lineTo(256, 512); // Back to base
      
      // Gradient fill
      const grad = ctx.createLinearGradient(0, 512, 0, 0);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#cccccc');
      ctx.fillStyle = grad;
      ctx.fill();

      // Fibers/Veins
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 4;
      for(let i=0; i<12; i++) {
          const x = 50 + Math.random() * 412;
          ctx.beginPath();
          ctx.moveTo(x, 512);
          ctx.quadraticCurveTo(256, 100, 256, 0);
          ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // Create curved, volumetric blade geometry
  private createBladeGeometry(width: number, height: number): THREE.BufferGeometry {
    const segments = 5; // Vertical segments
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const v = i / segments;
      const t = v; 
      // Taper width towards top
      const w = width * (1.0 - t * 0.7);
      
      // Parabolic curve depth (simulating blade cross-section)
      // Center is pushed forward (z+) relative to edges
      const depth = w * 0.3;

      // Left Vertex
      positions.push(-w / 2, height * v, 0);
      uvs.push(0, v);
      
      // Center Vertex (Spine)
      positions.push(0, height * v, depth);
      uvs.push(0.5, v);
      
      // Right Vertex
      positions.push(w / 2, height * v, 0);
      uvs.push(1, v);
    }

    // Indices for quads (2 triangles each, 2 quads per segment row)
    for (let i = 0; i < segments; i++) {
      const row = i * 3;
      const nextRow = (i + 1) * 3;
      
      // Left Quad (Left -> Center)
      indices.push(row, row + 1, nextRow);
      indices.push(nextRow, row + 1, nextRow + 1);
      
      // Right Quad (Center -> Right)
      indices.push(row + 1, row + 2, nextRow + 1);
      indices.push(nextRow + 1, row + 2, nextRow + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  private buildGrass(config: GrassConfig) {
    if (this.grassMesh) {
      this.scene.remove(this.grassMesh);
      this.grassMesh.geometry.dispose();
    }

    // Use custom volumetric geometry
    const geometry = this.createBladeGeometry(config.bladeWidth, config.bladeHeight);
    
    const instancedGeo = new THREE.InstancedBufferGeometry();
    instancedGeo.index = geometry.index;
    instancedGeo.attributes.position = geometry.attributes.position;
    instancedGeo.attributes.uv = geometry.attributes.uv;
    instancedGeo.attributes.normal = geometry.attributes.normal; // Important for lighting

    instancedGeo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(this.offsets, 3));
    instancedGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(this.scales, 1));
    instancedGeo.setAttribute('aRotation', new THREE.InstancedBufferAttribute(this.rotations, 1));
    instancedGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(this.seeds, 1));

    if (!this.grassMaterial) {
      this.grassMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uWindSpeed: { value: config.windSpeed },
          uWindStrength: { value: config.windStrength },
          uBaseColor: { value: new THREE.Color(config.baseColor) },
          uTipColor: { value: new THREE.Color(config.tipColor) },
          uMap: { value: this.bladeTexture },
          uTrailTexture: { value: this.trailTarget.texture },
          uSunPosition: { value: new THREE.Vector3() },
          uCameraPosition: { value: new THREE.Vector3() }
        },
        side: THREE.DoubleSide,
        transparent: false,
        alphaTest: 0.1, // Softer alpha test
      });
    } else {
        this.updateUniforms(config);
    }

    this.grassMesh = new THREE.InstancedMesh(instancedGeo, this.grassMaterial, this.maxInstances);
    this.grassMesh.count = Math.min(config.bladeCount, this.maxInstances);
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;
    this.grassMesh.frustumCulled = false;

    this.scene.add(this.grassMesh);
  }

  private updateUniforms(config: GrassConfig) {
    if (!this.grassMaterial) return;
    this.grassMaterial.uniforms.uWindSpeed.value = config.windSpeed;
    this.grassMaterial.uniforms.uWindStrength.value = config.windStrength;
    this.grassMaterial.uniforms.uBaseColor.value.set(config.baseColor);
    this.grassMaterial.uniforms.uTipColor.value.set(config.tipColor);
  }

  public updateConfig(config: GrassConfig, prevConfig?: GrassConfig) {
    if (!this.grassMaterial || !this.grassMesh) return;
    this.updateUniforms(config);
    this.updateSun(config);

    if (prevConfig) {
        if (prevConfig.bladeWidth !== config.bladeWidth || prevConfig.bladeHeight !== config.bladeHeight) {
            this.buildGrass(config);
        } else if (prevConfig.bladeCount !== config.bladeCount) {
            this.grassMesh.count = Math.min(config.bladeCount, this.maxInstances);
        }
    }
  }

  private updateSun(config: GrassConfig) {
    const distance = 50;
    const elevationRad = THREE.MathUtils.degToRad(config.sunElevation);
    const azimuthRad = THREE.MathUtils.degToRad(config.sunAzimuth);

    const y = distance * Math.sin(elevationRad);
    const r = distance * Math.cos(elevationRad);
    const x = r * Math.sin(azimuthRad);
    const z = r * Math.cos(azimuthRad);

    this.sunLight.position.set(x, y, z);
    if(this.grassMaterial) {
        this.grassMaterial.uniforms.uSunPosition.value.copy(this.sunLight.position);
    }
    
    // Dynamic rim light opposite to sun
    this.rimLight.position.set(-x * 0.6, 10, -z * 0.6);
  }

  private onPointerMove = (e: PointerEvent) => {
    // Normalize pointer -1 to 1
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    // 1. Update Interactions
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) {
        // Move brush to intersection point
        const pt = intersects[0].point;
        this.trailBrush.position.set(pt.x, 0.1, pt.z);
        this.trailBrush.visible = true;
    } else {
        this.trailBrush.visible = false;
    }

    // 2. Render Trail Map (Persistence)
    this.renderer.setRenderTarget(this.trailTarget);
    this.renderer.render(this.trailScene, this.trailCamera);
    this.renderer.setRenderTarget(null);

    // 3. Render Main Scene
    if (this.grassMaterial) {
      this.grassMaterial.uniforms.uTime.value = time;
      this.grassMaterial.uniforms.uCameraPosition.value.copy(this.camera.position);
    }
    this.controls.update();
    this.renderer.clear(); // Clear color buffer manually before main render
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('pointermove', this.onPointerMove);
    this.resizeObserver.disconnect();
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.renderer.dispose();
    this.controls.dispose();
    this.trailTarget.dispose();
    if (this.grassMesh) {
        this.grassMesh.geometry.dispose();
    }
    this.scene.clear();
  }
}