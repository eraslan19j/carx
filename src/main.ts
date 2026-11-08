import * as THREE from 'three'
import { createTerrainGeometry, TERRAIN_RADIUS } from './terrain'
import { createWaterMaterial } from './water'
import { createStylizedSky } from './sky'
import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#world')
const status = document.querySelector<HTMLElement>('#scene-status')
const dayPhaseLabel = document.querySelector<HTMLElement>('#day-phase')
const waveButton = document.querySelector<HTMLButtonElement>('#wave-toggle')
const qualityTrigger = document.querySelector<HTMLButtonElement>('#quality-trigger')
const qualityMenu = document.querySelector<HTMLElement>('#quality-menu')
const qualitySelect = document.querySelector<HTMLSelectElement>('#quality-select')
const qualitySummary = document.querySelector<HTMLElement>('#quality-summary')
const qualityHint = document.querySelector<HTMLElement>('#quality-hint')
const errorMessage = document.querySelector<HTMLElement>('#scene-error')

if (!canvas || !status || !dayPhaseLabel || !waveButton || !qualityTrigger || !qualityMenu || !qualitySelect || !qualitySummary || !qualityHint || !errorMessage) {
  throw new Error('Sahne arayüzü için gereken HTML öğeleri bulunamadı.')
}

type QualityLevel = 'low' | 'medium' | 'high'
const DAY_CYCLE_SECONDS = 600
const qualityProfiles: Record<QualityLevel, {
  pixelRatio: number
  shadows: boolean
  shadowSize: number
  waterSegments: number
  cloudDetail: number
  cloudOpacity: number
  fogNear: number
  fogFar: number
}> = {
  low: { pixelRatio: 0.85, shadows: false, shadowSize: 512, waterSegments: 32, cloudDetail: 1, cloudOpacity: 0.72, fogNear: 260, fogFar: 650 },
  medium: { pixelRatio: 1.15, shadows: true, shadowSize: 1024, waterSegments: 64, cloudDetail: 2, cloudOpacity: 0.88, fogNear: 350, fogFar: 790 },
  high: { pixelRatio: 1.65, shadows: true, shadowSize: 1536, waterSegments: 96, cloudDetail: 3, cloudOpacity: 0.96, fogNear: 430, fogFar: 940 },
}
const qualityNames: Record<QualityLevel, string> = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' }
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

try {
  const scene = new THREE.Scene()
  const fallbackSky = new THREE.Color('#c5eee4')
  scene.background = fallbackSky
  const fog = new THREE.Fog(fallbackSky, 350, 790)
  scene.fog = fog

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
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const hemisphere = new THREE.HemisphereLight('#e9fff4', '#668f72', 1.6)
  scene.add(hemisphere)
  const sunlight = new THREE.DirectionalLight('#fff0c6', 2.3)
  sunlight.position.set(-90, 170, 85)
  sunlight.castShadow = true
  sunlight.shadow.mapSize.set(1024, 1024)
  sunlight.shadow.bias = -0.00025
  sunlight.shadow.normalBias = 0.035
  sunlight.shadow.radius = 3
  sunlight.shadow.autoUpdate = false
  const shadowCamera = sunlight.shadow.camera as THREE.OrthographicCamera
  shadowCamera.left = -155
  shadowCamera.right = 155
  shadowCamera.top = 155
  shadowCamera.bottom = -155
  shadowCamera.near = 1
  shadowCamera.far = 520
  shadowCamera.updateProjectionMatrix()
  scene.add(sunlight, sunlight.target)

  // Toon ramp: az sayıda ışık basamağı, boyalı arazi renkleriyle yumuşak çizgi-film hissi verir.
  const rampPixels = new Uint8Array([
    92, 92, 92, 255,
    145, 145, 145, 255,
    198, 198, 198, 255,
    255, 255, 255, 255,
  ])
  const toonRamp = new THREE.DataTexture(rampPixels, 4, 1, THREE.RGBAFormat)
  toonRamp.magFilter = THREE.NearestFilter
  toonRamp.minFilter = THREE.NearestFilter
  toonRamp.generateMipmaps = false
  toonRamp.needsUpdate = true
  const terrain = new THREE.Mesh(
    createTerrainGeometry(),
    new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp }),
  )
  terrain.name = 'Prosedürel toon/boyalı ada arazisi'
  terrain.receiveShadow = true
  terrain.castShadow = true
  scene.add(terrain)

  const { material: waterMaterial, uniforms: waterUniforms } = createWaterMaterial()
  let currentWaterSegments = 64
  const water = new THREE.Mesh(new THREE.PlaneGeometry(640, 640, currentWaterSegments, currentWaterSegments), waterMaterial)
  water.name = 'Yarı saydam, dalgalı su'
  water.rotation.x = -Math.PI / 2
  water.position.y = -0.16
  water.renderOrder = 1
  scene.add(water)

  const { dome: skyDome, uniforms: skyUniforms } = createStylizedSky(900)
  scene.add(skyDome)

  const nightFog = new THREE.Color('#26375c')
  const dayFog = new THREE.Color('#b8ddd0')
  const sunsetFog = new THREE.Color('#e9a17c')
  const nightSkyLight = new THREE.Color('#6073a5')
  const daySkyLight = new THREE.Color('#e9fff4')
  const nightGroundLight = new THREE.Color('#29324f')
  const dayGroundLight = new THREE.Color('#668f72')
  const moonLight = new THREE.Color('#9aafe4')
  const sunriseLight = new THREE.Color('#ffab79')
  const noonLight = new THREE.Color('#fff0c6')
  const nightDeepWater = new THREE.Color('#273d70')
  const dayDeepWater = new THREE.Color('#348eaa')
  const duskDeepWater = new THREE.Color('#926d87')
  const nightShallowWater = new THREE.Color('#758db8')
  const dayShallowWater = new THREE.Color('#c6eee0')
  const duskShallowWater = new THREE.Color('#f2b38e')
  const temporaryColor = new THREE.Color()
  const sunDirection = new THREE.Vector3()

  let wavesEnabled = true
  let quality: QualityLevel = 'medium'
  try {
    wavesEnabled = localStorage.getItem('kucuk-dunya-waves') !== 'off'
    const savedQuality = localStorage.getItem('kucuk-dunya-quality')
    if (savedQuality === 'low' || savedQuality === 'medium' || savedQuality === 'high') quality = savedQuality
  } catch { /* Depolama kapalıysa varsayılanlar kullanılır. */ }

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
  let frameCount = 0
  let previousDayLabel = ''
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

  const applyQuality = (level: QualityLevel) => {
    quality = level
    const profile = qualityProfiles[level]
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.pixelRatio))
    renderer.shadowMap.enabled = profile.shadows
    sunlight.castShadow = profile.shadows
    sunlight.shadow.mapSize.set(profile.shadowSize, profile.shadowSize)
    sunlight.shadow.needsUpdate = true
    skyUniforms.uCloudDetail.value = profile.cloudDetail
    skyUniforms.uCloudOpacity.value = profile.cloudOpacity
    fog.near = profile.fogNear
    fog.far = profile.fogFar
    if (currentWaterSegments !== profile.waterSegments) {
      water.geometry.dispose()
      water.geometry = new THREE.PlaneGeometry(640, 640, profile.waterSegments, profile.waterSegments)
      currentWaterSegments = profile.waterSegments
    }
    qualitySelect.value = level
    qualitySummary.textContent = qualityNames[level]
    qualityHint.textContent = level === 'low'
      ? 'Düşük çözünürlük · gölgeler kapalı'
      : level === 'medium'
        ? 'Yumuşak gölgeler · dengeli çözünürlük'
        : 'Daha net görüntü · daha ayrıntılı bulut ve gölgeler'
    resize()
    try { localStorage.setItem('kucuk-dunya-quality', level) } catch { /* İsteğe bağlı tercih. */ }
  }
  applyQuality(quality)

  qualityTrigger.addEventListener('click', () => {
    const expanded = qualityTrigger.getAttribute('aria-expanded') === 'true'
    qualityTrigger.setAttribute('aria-expanded', String(!expanded))
    qualityMenu.hidden = expanded
  })
  qualitySelect.addEventListener('change', () => {
    const selected = qualitySelect.value
    if (selected === 'low' || selected === 'medium' || selected === 'high') applyQuality(selected)
  })
  document.addEventListener('pointerdown', (event) => {
    if (!qualityMenu.contains(event.target as Node) && !qualityTrigger.contains(event.target as Node)) {
      qualityMenu.hidden = true
      qualityTrigger.setAttribute('aria-expanded', 'false')
    }
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      qualityMenu.hidden = true
      qualityTrigger.setAttribute('aria-expanded', 'false')
      qualityTrigger.focus()
    }
  })

  const clock = new THREE.Clock()
  const animate = () => {
    requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.05)
    const elapsed = clock.elapsedTime
    azimuth += delta * orbitSpeed
    frameCount++

    // Tam tur 600 saniye: doğuş, öğle, batış ve gece.
    const phase = (elapsed / DAY_CYCLE_SECONDS) % 1
    const angle = phase * Math.PI * 2
    sunDirection.set(Math.cos(angle), Math.sin(angle), 0.16).normalize()
    const daylight = smoothstep(-0.12, 0.24, sunDirection.y)
    const twilight = Math.exp(-Math.abs(sunDirection.y) * 10) * (1 - daylight * 0.45)

    skyUniforms.uTime.value = elapsed
    skyUniforms.uSunDirection.value.copy(sunDirection)
    sunlight.position.copy(sunDirection).multiplyScalar(230)
    hemisphere.color.copy(nightSkyLight).lerp(daySkyLight, daylight)
    hemisphere.groundColor.copy(nightGroundLight).lerp(dayGroundLight, daylight)
    hemisphere.intensity = 0.42 + daylight * 1.2
    sunlight.color.copy(moonLight).lerp(sunriseLight, twilight).lerp(noonLight, daylight)
    sunlight.intensity = 0.13 + daylight * 2.15
    fog.color.copy(nightFog).lerp(dayFog, daylight).lerp(sunsetFog, twilight * 0.78)
    temporaryColor.copy(nightDeepWater).lerp(dayDeepWater, daylight).lerp(duskDeepWater, twilight)
    waterUniforms.uDeep.value.copy(temporaryColor)
    temporaryColor.copy(nightShallowWater).lerp(dayShallowWater, daylight).lerp(duskShallowWater, twilight)
    waterUniforms.uShallow.value.copy(temporaryColor)
    waterUniforms.uTime.value = wavesEnabled ? elapsed : 0

    let dayLabel: string
    if (phase < 0.15 || phase >= 0.92) dayLabel = 'Gün doğumu'
    else if (phase < 0.39) dayLabel = 'Öğle'
    else if (phase < 0.59) dayLabel = 'Gün batımı'
    else dayLabel = 'Gece'
    if (dayLabel !== previousDayLabel) {
      dayPhaseLabel.textContent = `${dayLabel} · 10 dk döngü`
      previousDayLabel = dayLabel
    }

    // Portre telefonda adayı kadraja sığdırmak için kamera biraz uzaklaşır.
    const portraitFactor = Math.sqrt(Math.min(camera.aspect, 1))
    const radius = 282 / Math.max(0.62, portraitFactor)
    const height = radius * 0.58
    camera.position.set(Math.cos(azimuth) * radius, height, Math.sin(azimuth) * radius)
    camera.lookAt(aim)
    skyDome.position.copy(camera.position)

    // Güneş günde yavaşça ilerler; gölge haritası yaklaşık saniyede beş kez yenilenir.
    if (qualityProfiles[quality].shadows && frameCount % 12 === 0) sunlight.shadow.needsUpdate = true
    renderer.render(scene, camera)
  }
  resize()
  animate()
  const roundedDiameter = Math.round((TERRAIN_RADIUS * 2) / 10) * 10
  status.textContent = `Yaklaşık ${roundedDiameter} × ${roundedDiameter} m prosedürel ada`
} catch (error) {
  console.error('Küçük Dünya sahnesi başlatılamadı:', error)
  status.textContent = 'Sahne başlatılamadı'
  errorMessage.hidden = false
  errorMessage.textContent = 'Bu cihazda 3B sahne açılamadı. Lütfen WebView veya tarayıcıyı güncelleyip yeniden deneyin.'
}
