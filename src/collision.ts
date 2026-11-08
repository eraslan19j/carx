import { terrainHeightAt, TERRAIN_RADIUS } from './terrain'
import * as THREE from 'three'

/**
 * Yükseklik alanı tabanlı yürüme çarpışması.
 * Gelecekte karakter merkezinin x/z konumu için kullanılır; ada dışında null döner.
 */
export interface GroundSample {
  height: number
  normal: THREE.Vector3
  walkable: boolean
}

export function sampleGround(x: number, z: number): GroundSample | null {
  const radialDistance = Math.hypot(x, z)
  if (radialDistance > TERRAIN_RADIUS * 1.04) return null

  const height = terrainHeightAt(x, z)
  if (height <= 0.08) return null

  const step = 0.5
  const dx = terrainHeightAt(x + step, z) - terrainHeightAt(x - step, z)
  const dz = terrainHeightAt(x, z + step) - terrainHeightAt(x, z - step)
  const normal = new THREE.Vector3(-dx / (2 * step), 1, -dz / (2 * step)).normalize()
  return { height, normal, walkable: normal.y > 0.55 }
}
