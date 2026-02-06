
// Simplex Noise
const noiseCommon = `
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

export const vertexShader = `
  uniform float uTime;
  uniform float uWindSpeed;
  uniform float uWindStrength;
  uniform sampler2D uTrailTexture;
  
  attribute vec3 aOffset;
  attribute float aScale;
  attribute float aRotation;
  attribute float aSeed;
  
  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vDisplacement; // For debug/color

  ${noiseCommon}

  void main() {
    vUv = uv;
    vHeight = aScale;
    vSeed = aSeed;
    
    // 1. Initial Geometry Transform
    vec3 transformed = position;
    transformed.y *= aScale; // Height scale
    
    // 2. Rotation
    float c = cos(aRotation);
    float s = sin(aRotation);
    mat3 rotateY = mat3(c, 0, s, 0, 1, 0, -s, 0, c);
    transformed = rotateY * transformed;
    
    // Calculate world position for noise/trail *before* displacement
    vec3 worldPos = transformed + aOffset;

    // 3. Trail Interaction (Physical Displacement)
    // Map world XZ (-25 to 25) to UV (0 to 1)
    vec2 trailUV = (worldPos.xz / 50.0) + 0.5; 
    vec4 trailSample = texture2D(uTrailTexture, trailUV);
    float trailForce = trailSample.r; // Use Red channel for intensity
    
    vDisplacement = trailForce;

    // Apply trail squash: Push vertices down and out
    // Only affects top of blade more than bottom
    float pushDown = trailForce * 0.8 * uv.y; 
    transformed.y *= (1.0 - pushDown);
    // Slight horizontal push can be added if we had direction, 
    // for now we just flatten
    
    // 4. Wind Animation
    // Double octave noise for organic feel
    float noise1 = snoise(vec2(aOffset.x * 0.1 + uTime * uWindSpeed, aOffset.z * 0.1 + uTime * uWindSpeed * 0.8));
    float noise2 = snoise(vec2(aOffset.x * 0.5 + uTime * uWindSpeed * 2.0, aOffset.z * 0.5));
    float combinedWind = (noise1 * 0.7 + noise2 * 0.3) * uWindStrength;
    
    // Height mask: roots don't move, tips move a lot
    float windFactor = pow(uv.y, 2.0) * combinedWind;
    
    transformed.x += windFactor;
    transformed.z += windFactor * 0.5;

    // 5. Final Position
    vec3 finalPos = transformed + aOffset;
    vWorldPosition = finalPos;

    // Normal recalculation approximation for bent geometry
    // Rotate normal same as position
    vNormal = rotateY * normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
  }
`;

export const fragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uTipColor;
  uniform sampler2D uMap;
  uniform vec3 uSunPosition;
  uniform vec3 uCameraPosition;
  
  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vDisplacement;

  void main() {
    vec4 texColor = texture2D(uMap, vUv);
    
    // Alpha Test
    if (texColor.a < 0.4) discard;

    // 1. Color Variation
    // Mix fresh green with a bit of "dry" yellow based on seed
    vec3 dryColor = vec3(0.7, 0.6, 0.3);
    vec3 localBase = uBaseColor;
    
    // 30% of blades are slightly dryer
    if (vSeed > 0.7) {
        localBase = mix(uBaseColor, dryColor, (vSeed - 0.7) * 1.5);
    }
    
    // Root decay (darker bottom)
    vec3 rootColor = vec3(0.05, 0.05, 0.02);
    vec3 baseMix = mix(rootColor, localBase, smoothstep(0.0, 0.3, vUv.y));
    
    vec3 gradientColor = mix(baseMix, uTipColor, vUv.y);
    vec3 albedo = gradientColor * texColor.rgb;

    // 2. Lighting Setup
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    // Double sided normal correction
    if (!gl_FrontFacing) normal = -normal;
    vec3 lightDir = normalize(uSunPosition);

    // 3. Wrapped Diffuse (Soft lighting)
    float NdotL = dot(normal, lightDir);
    float wrap = 0.5;
    float diffuse = max((NdotL + wrap) / (1.0 + wrap), 0.0);
    
    // 4. Subsurface Scattering (Translucency)
    // Light passing through the blade from behind
    float backLight = max(0.0, dot(viewDir, -lightDir));
    // Stronger at tips, thinner geometry
    float sss = pow(backLight, 3.0) * (0.2 + 0.8 * vUv.y);
    vec3 sssColor = uTipColor * sss * 1.5;

    // 5. Specular (Sheen & Glint)
    vec3 H = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, H));
    
    // Soft broad sheen
    float sheen = pow(NdotH, 4.0) * 0.2; 
    
    // Sharp glint (sun reflection on waxy surface)
    float glint = pow(NdotH, 32.0) * 0.5;

    // Trail wetness/flattening increases specular
    float specPower = mix(1.0, 2.0, vDisplacement);

    // 6. Final Composition
    vec3 lighting = albedo * (diffuse + 0.2) + sssColor + (sheen + glint) * specPower;
    
    // Shadows (Simple multiplier assumption as we don't have shadow coord passed yet in custom shader without includes)
    // For high performance custom shader, we often skip complex shadow map sampling or use Three's includes.
    // Let's approximate self-occlusion with height
    float ao = smoothstep(0.0, 0.4, vUv.y);
    lighting *= (0.3 + 0.7 * ao);

    gl_FragColor = vec4(lighting, 1.0);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;