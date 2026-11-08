import * as THREE from 'three'

export function createWaterMaterial() {
  const uniforms = {
    uTime: { value: 0 },
    uWaves: { value: 1 },
    uDeep: { value: new THREE.Color('#53bbbd') },
    uShallow: { value: new THREE.Color('#c6eee0') },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uWaves;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vRipple;
      void main() {
        vec3 p = position;
        float waveA = sin(p.x * 0.045 + uTime * 0.62);
        float waveB = cos(p.y * 0.061 - uTime * 0.43);
        float waveC = sin((p.x + p.y) * 0.031 + uTime * 0.31);
        float height = (waveA * 0.22 + waveB * 0.13 + waveC * 0.10) * uWaves;
        p.z += height;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vec4 viewPosition = viewMatrix * world;
        gl_Position = projectionMatrix * viewPosition;
        vWorldPosition = world.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * vec3(-waveA * 0.008, -waveB * 0.007, 1.0));
        vRipple = height;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vRipple;
      void main() {
        float distanceFromIsland = length(vWorldPosition.xz);
        float shoreTint = 1.0 - smoothstep(96.0, 116.0, distanceFromIsland);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.0);
        float shallows = clamp(shoreTint * 0.74 + fresnel * 0.26, 0.0, 1.0);
        vec3 color = mix(uDeep, uShallow, shallows);
        float glimmer = pow(max(0.0, sin(vWorldPosition.x * 0.035 + vWorldPosition.z * 0.027 + uTime * 0.22)), 18.0);
        color += glimmer * 0.055;
        gl_FragColor = vec4(color, 0.86 + fresnel * 0.08);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  return { material, uniforms }
}
