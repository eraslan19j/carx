import * as THREE from 'three'
import { createTerrainGeometry, TERRAIN_RADIUS } from './terrain'
import { createWaterMaterial } from './water'
import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#world')
const status = document.querySelector<HTMLElement>('#scene-status')
const waveButton = document.querySelector<HTMLButtonElement>('#wave-toggle')
const errorMessage = document.querySelector<HTMLElement>('#scene-error')

if (!canvas || !status || !waveButton || !errorMessage) {
  throw new Error('Sahne arayüzü için gereken HTML öğeleri bulunamadı.')
}

try {
  const scene = new THREE.Scene()
  const sky = new THREE.Color('#c5eee4')
  scene.background = sky
  scene.fog = new THREE.Fog(sky, 390, 820)

  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 1100)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4))
  renderer.setClearColor(sky)

  scene.add(new THREE.HemisphereLight('#e9fff4', '#668f72', 2.05))
  const sunlight = new THREE.DirectionalLight('#fff0c6', 2.4)
  sunlight.position.set(-90, 170, 85)
  scene.add(sunlight)

  const terrain = new THREE.Mesh(
    createTerrainGeometry(),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 }),
  )
  terrain.name = 'Prosedürel ada arazisi'
  terrain.receiveShadow = false
  terrain.castShadow = false
  scene.add(terrain)

  const { material: waterMaterial, uniforms: waterUniforms } = createWaterMaterial()
  const water = new THREE.Mesh(new THREE.PlaneGeometry(640, 640, 96, 96), waterMaterial)
  water.name = 'Yarı saydam, dalgalı su'
  water.rotation.x = -Math.PI / 2
  water.position.y = -0.16
  water.renderOrder = 1
  scene.add(water)

  let wavesEnabled = true
  try {
    wavesEnabled = localStorage.getItem('kucuk-dunya-waves') !== 'off'
  } catch { /* Depolama kapalıysa varsayılan açık kalır. */ }
  const updateWaveButton = () => {
    waterUniforms.uWaves.value = wavesEnabled ? 1 : 0
    waveButton.setAttribute('aria-pressed', String(wavesEnabled))
    waveButton.textContent = wavesEnabled ? 'Su dalgaları: açık' : 'Su dalgaları: kapalı'
  }
  updateWaveButton()
  waveButton.addEventListener('click', () => {
    wavesEnabled = !wavesEnabled
    updateWaveButton()
    try { localStorage.setItem('kucuk-dunya-waves', wavesEnabled ? 'on' : 'off') } catch { /* İsteğe bağlı tercih. */ }
  })

  let azimuth = 0.62
  const orbitSpeed = 0.075
  const aim = new THREE.Vector3(0, 7, 0)
  const resize = () => {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }
  window.addEventListener('resize', resize, { passive: true })
  resize()

  const clock = new THREE.Clock()
  const animate = () => {
    requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.05)
    azimuth += delta * orbitSpeed
    waterUniforms.uTime.value = wavesEnabled ? clock.elapsedTime : 0

    // Portre telefonda adayı kadraja sığdırmak için kamera biraz uzaklaşır.
    const portraitFactor = Math.sqrt(Math.min(camera.aspect, 1))
    const radius = 282 / Math.max(0.62, portraitFactor)
    const height = radius * 0.58
    camera.position.set(Math.cos(azimuth) * radius, height, Math.sin(azimuth) * radius)
    camera.lookAt(aim)
    renderer.render(scene, camera)
  }
  animate()
  const roundedDiameter = Math.round((TERRAIN_RADIUS * 2) / 10) * 10
  status.textContent = `Yaklaşık ${roundedDiameter} × ${roundedDiameter} m prosedürel ada`
} catch (error) {
  console.error('Küçük Dünya sahnesi başlatılamadı:', error)
  status.textContent = 'Sahne başlatılamadı'
  errorMessage.hidden = false
  errorMessage.textContent = 'Bu cihazda 3B sahne açılamadı. Lütfen WebView veya tarayıcıyı güncelleyip yeniden deneyin.'
}
