import { Earthquake, EarthquakeColor } from '../types/earthquake'

const USGS_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'

interface USGSProperties {
  mag: number
  place: string
  time: number
  updated: number
  felt: number | null
  cdi: number | null
  mmi: number | null
  tsunami: number
  sig: number
  net: string
  code: string
  magType: string
  type: string
  title: string
}

interface USGSFeature {
  id: string
  properties: USGSProperties
  geometry: {
    type: string
    coordinates: [number, number, number]
  }
}

interface USGSResponse {
  features: USGSFeature[]
  metadata: {
    generated: number
    count: number
  }
}

export function depthToColor(depth: number): EarthquakeColor {
  const maxDepth = 700
  const t = Math.min(depth / maxDepth, 1)
  if (t < 0.33) {
    const s = t / 0.33
    return { r: 0.13 + s * 0.0, g: 1.0 - s * 0.4, b: 0.4 - s * 0.2 }
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    return { r: 0.13 + s * 0.7, g: 0.6 - s * 0.2, b: 0.2 - s * 0.1 }
  } else {
    const s = (t - 0.66) / 0.34
    return { r: 0.83 + s * 0.17, g: 0.4 - s * 0.35, b: 0.1 - s * 0.1 }
  }
}

export function magnitudeToPillarHeight(magnitude: number): number {
  if (magnitude < 2) return 0.02
  if (magnitude > 9) return 0.5
  const t = (magnitude - 2) / 7
  return 0.02 + t * t * 0.48
}

function parseFeature(feature: USGSFeature, isNew: boolean): Earthquake | null {
  const props = feature.properties
  if (!feature.geometry || !feature.geometry.coordinates) return null
  if (props.mag == null || isNaN(props.mag)) return null

  return {
    id: feature.id || `${props.net}${props.code}`,
    magnitude: props.mag,
    depth: feature.geometry.coordinates[2] || 0,
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
    time: props.time,
    place: props.place || 'Unknown',
    magType: props.magType || '',
    type: props.type || 'earthquake',
    significance: props.sig || 0,
    tsunami: props.tsunami === 1,
    felt: props.felt,
    cdi: props.cdi,
    mmi: props.mmi,
    isNew,
  }
}

export async function fetchEarthquakes(
  existingIds: Set<string>
): Promise<{ earthquakes: Earthquake[]; newCount: number }> {
  try {
    const response = await fetch(USGS_API)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data: USGSResponse = await response.json()

    const earthquakes: Earthquake[] = []
    let newCount = 0

    for (const feature of data.features) {
      const id = feature.id || `${feature.properties.net}${feature.properties.code}`
      const isNew = !existingIds.has(id)
      if (isNew) newCount++
      const eq = parseFeature(feature, isNew)
      if (eq) earthquakes.push(eq)
    }

    return { earthquakes, newCount }
  } catch (error) {
    console.error('Failed to fetch USGS data:', error)
    return { earthquakes: [], newCount: 0 }
  }
}

export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return [x, y, z]
}

export function vector3ToLatLon(
  x: number,
  y: number,
  z: number
): { lat: number; lon: number } {
  const radius = Math.sqrt(x * x + y * y + z * z)
  const lat = 90 - Math.acos(y / radius) * (180 / Math.PI)
  const lon = -(Math.atan2(z, -x) * (180 / Math.PI)) - 180
  return { lat, lon: lon < -180 ? lon + 360 : lon }
}

export function computeRegionLabel(lat: number, lon: number): string {
  if (lat >= 15 && lat <= 65 && lon >= 100 && lon <= 180) return '环太平洋西带'
  if (lat >= -60 && lat <= 60 && lon >= -180 && lon <= -100) return '环太平洋东带'
  if (lat >= 20 && lat <= 45 && lon >= 60 && lon <= 100) return '喜马拉雅-地中海带'
  if (lat >= -10 && lat <= 30 && lon >= -30 && lon <= 60) return '非洲-大西洋中脊'
  if (lat <= -10 && lon >= 150 && lon <= 180) return '环太平洋西南带'
  return '其他区域'
}
