export interface Earthquake {
  id: string
  magnitude: number
  depth: number
  longitude: number
  latitude: number
  time: number
  place: string
  magType: string
  type: string
  significance: number
  tsunami: boolean
  felt: number | null
  cdi: number | null
  mmi: number | null
  isNew: boolean
}

export interface EarthquakeColor {
  r: number
  g: number
  b: number
}

export interface TimeWindow {
  start: number
  end: number
  isPlaying: boolean
  playSpeed: number
}

export interface PlateBoundary {
  name: string
  type: string
  coordinates: [number, number][]
}

export interface SeismicWaveState {
  earthquakeId: string
  startTime: number
  pWaveRadius: number
  sWaveRadius: number
  elapsedTime: number
  isActive: boolean
}

export type ScatterSelectionMode = 'none' | 'selecting' | 'selected'

export interface ScatterSelection {
  minDepth: number
  maxDepth: number
  minMag: number
  maxMag: number
}

export type ChartViewMode = 'scatter' | 'histogram'

export interface RegionCluster {
  centerLon: number
  centerLat: number
  earthquakes: Earthquake[]
}
