import * as THREE from 'three'

export const TERRAIN_SIZE = 220
export const TERRAIN_RADIUS = 98
export const TERRAIN_SEGMENTS = 112

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function hash(ix: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7 + 19.19) * 43758.5453
  return n - Math.floor(n)
}
function valueNoise(x: number, z: number): number {
  const x0 = Math.floor(x), z0 = Math.floor(z)
  const fx = x - x0, fz = z - z0
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz)
  const a = THREE.MathUtils.lerp(hash(x0, z0), hash(x0 + 1, z0), sx)
  const b = THREE.MathUtils.lerp(hash(x0, z0 + 1), hash(x0 + 1, z0 + 1), sx)
  return THREE.MathUtils.lerp(a, b, sz)
}
function fbm(x: number, z: number): number {
  let amplitude = .52, frequency = 1, sum = 0, normalizer = 0
  for (let octave = 0; octave < 5; octave++) {
    sum += valueNoise(x * frequency, z * frequency) * amplitude
    normalizer += amplitude
    amplitude *= .5
    frequency *= 2.03
  }
  return sum / normalizer
}

/** Sabit tohumlu arazi; karakter çarpışması bu aynı yükseklik alanını örnekler. */
export function terrainHeightAt(x: number, z: number): number {
  const distance = Math.hypot(x, z)
  const coast = 1 - smooth(.79, 1.055, distance / TERRAIN_RADIUS)
  if (coast <= 0) return -1.2

  const broadHills = fbm(x * .016 + 13.2, z * .016 - 8.4)
  const softDetail = fbm(x * .047 - 24.1, z * .047 + 5.8)
  const valleyCenter = 13 * Math.sin(x * .014) + x * .13 - 5
  const valley = Math.exp(-((z - valleyCenter) ** 2) / 520)
  const elevation = 2.2 + broadHills * 24 + softDetail * 3.2 - valley * 5.8
  return Math.max(0, elevation) * Math.pow(coast, .82)
}

const palette = {
  sand: new THREE.Color('#f1d28a'),
  meadow: new THREE.Color('#79c58d'),
  leaf: new THREE.Color('#42ae79'),
  hill: new THREE.Color('#2f936d'),
  summit: new THREE.Color('#9bc77d'),
}

export function createTerrainGeometry(): THREE.BufferGeometry {
  const segments = TERRAIN_SEGMENTS
  const side = segments + 1
  const positions = new Float32Array(side * side * 3)
  const colors = new Float32Array(side * side * 3)
  const indices: number[] = []
  const scratch = new THREE.Color()

  for (let iz = 0; iz <= segments; iz++) {
    const z = (iz / segments - .5) * TERRAIN_SIZE
    for (let ix = 0; ix <= segments; ix++) {
      const x = (ix / segments - .5) * TERRAIN_SIZE
      const index = iz * side + ix
      const height = terrainHeightAt(x, z)
      const p = index * 3
      positions[p] = x; positions[p + 1] = height; positions[p + 2] = z

      if (height < 1.5) scratch.copy(palette.sand).lerp(palette.meadow, smooth(.12, 1.65, height))
      else if (height < 7) scratch.copy(palette.meadow).lerp(palette.leaf, smooth(1.5, 7, height))
      else if (height < 18) scratch.copy(palette.leaf).lerp(palette.hill, smooth(7, 18, height))
      else scratch.copy(palette.hill).lerp(palette.summit, smooth(18, 25, height))
      colors[p] = scratch.r; colors[p + 1] = scratch.g; colors[p + 2] = scratch.b
    }
  }

  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = iz * side + ix, b = a + 1, c = a + side, d = c + 1
      // Üçgenlerin normalleri yukarı bakar.
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.userData.collisionReady = true
  geometry.userData.terrainSize = TERRAIN_SIZE
  geometry.userData.segments = TERRAIN_SEGMENTS
  return geometry
}
