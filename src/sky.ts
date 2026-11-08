import * as THREE from 'three'

export function createStylizedSky(radius: number) {
  const uniforms = {
    uTime: { value: 0 },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uCloudOpacity: { value: 0.9 },
    uCloudDetail: { value: 2 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    vertexShader: /* glsl */`
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform float uCloudOpacity;
      uniform float uCloudDetail;
      uniform vec3 uSunDirection;
      varying vec3 vDirection;

      float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      void main() {
        vec3 direction = normalize(vDirection);
        vec3 sunDir = normalize(uSunDirection);
        float daylight = smoothstep(-0.12, 0.24, sunDir.y);
        float twilight = exp(-abs(sunDir.y) * 10.0);
        float height = smoothstep(-0.12, 0.88, direction.y);

        vec3 topDay = vec3(0.22, 0.58, 0.77);
        vec3 horizonDay = vec3(0.69, 0.87, 0.80);
        vec3 topNight = vec3(0.035, 0.075, 0.19);
        vec3 horizonNight = vec3(0.13, 0.20, 0.34);
        vec3 sunset = vec3(1.0, 0.52, 0.34);
        vec3 skyTop = mix(topNight, topDay, daylight);
        vec3 skyHorizon = mix(horizonNight, horizonDay, daylight);
        skyHorizon = mix(skyHorizon, sunset, twilight * 0.82);
        vec3 skyColor = mix(skyHorizon, skyTop, height);

        vec2 skyUv = vec2(atan(direction.z, direction.x) * 0.15915494 + 0.5,
                          asin(clamp(direction.y, -1.0, 1.0)) * 0.31830989 + 0.5);
        vec2 drift = vec2(uTime * 0.00075, uTime * 0.00012);
        float cloud = noise2(skyUv * vec2(5.0, 15.0) + drift);
        if (uCloudDetail > 1.5) {
          cloud = cloud * 0.72 + noise2(skyUv * vec2(11.0, 29.0) - drift * 1.7) * 0.28;
        }
        if (uCloudDetail > 2.5) {
          cloud = cloud * 0.88 + noise2(skyUv * vec2(23.0, 49.0) + drift * 2.4) * 0.12;
        }
        float cloudBand = smoothstep(-0.10, 0.08, direction.y) * (1.0 - smoothstep(0.30, 0.57, direction.y));
        float cloudMask = smoothstep(0.49, 0.68, cloud) * cloudBand * uCloudOpacity;
        vec3 cloudColor = mix(vec3(0.60, 0.69, 0.84), vec3(1.0, 0.96, 0.84), daylight);
        cloudColor = mix(cloudColor, vec3(1.0, 0.68, 0.53), twilight * 0.72);
        skyColor = mix(skyColor, cloudColor, cloudMask);

        float sunDot = max(dot(direction, sunDir), 0.0);
        float sunDisk = smoothstep(0.9990, 0.99958, sunDot) * smoothstep(-0.18, 0.04, sunDir.y);
        float sunGlow = pow(sunDot, 18.0) * 0.24 + pow(sunDot, 5.0) * twilight * 0.12;
        vec3 sunColor = mix(vec3(1.0, 0.55, 0.36), vec3(1.0, 0.91, 0.67), daylight);
        skyColor += sunColor * (sunDisk * 0.9 + sunGlow);

        float night = 1.0 - smoothstep(-0.30, 0.02, sunDir.y);
        float moonDot = max(dot(direction, -sunDir), 0.0);
        float moonDisk = smoothstep(0.99935, 0.99972, moonDot) * night;
        vec2 starGrid = skyUv * vec2(170.0, 82.0);
        vec2 starCell = fract(starGrid) - 0.5;
        float starSeed = hash21(floor(starGrid));
        float star = step(0.997, starSeed) * (1.0 - smoothstep(0.018, 0.075, length(starCell))) * night;
        skyColor += vec3(0.67, 0.82, 1.0) * (moonDisk * 0.8 + star * 0.95);

        gl_FragColor = vec4(skyColor, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })

  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), material)
  dome.name = 'Hareketli bulutlu stilize gökyüzü'
  dome.scale.setScalar(radius)
  dome.renderOrder = -100
  dome.frustumCulled = false
  return { dome, uniforms }
}
