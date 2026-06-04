import { create } from 'zustand'
import {
  Earthquake,
  TimeWindow,
  SeismicWaveState,
  ScatterSelection,
  ChartViewMode,
} from '../types/earthquake'
import { getAllEarthquakes, putEarthquakes, getExistingIds, EarthquakeRecord } from '../data/db'
import { fetchEarthquakes } from '../data/earthquakeService'

interface EarthquakeState {
  earthquakes: Earthquake[]
  filteredEarthquakes: Earthquake[]
  timeWindow: TimeWindow
  selectedEarthquake: Earthquake | null
  hoveredEarthquake: Earthquake | null
  seismicWave: SeismicWaveState | null
  scatterSelection: ScatterSelection | null
  chartViewMode: ChartViewMode
  showPlateBoundaries: boolean
  showSeismicWave: boolean
  isLoading: boolean
  lastUpdated: number | null
  totalCount: number
  maxMagnitude: number
  newCount: number

  setTimeWindow: (tw: Partial<TimeWindow>) => void
  setSelectedEarthquake: (eq: Earthquake | null) => void
  setHoveredEarthquake: (eq: Earthquake | null) => void
  setSeismicWave: (wave: SeismicWaveState | null) => void
  setScatterSelection: (sel: ScatterSelection | null) => void
  setChartViewMode: (mode: ChartViewMode) => void
  togglePlateBoundaries: () => void
  toggleSeismicWave: () => void
  loadFromDB: () => Promise<void>
  refreshData: () => Promise<void>
  filterByTimeWindow: () => void
  filterByScatterSelection: () => void
}

const now = Date.now()
const thirtyDays = 30 * 24 * 60 * 60 * 1000

function recordToEq(r: EarthquakeRecord): Earthquake {
  return {
    id: r.id,
    magnitude: r.magnitude,
    depth: r.depth,
    longitude: r.longitude,
    latitude: r.latitude,
    time: r.time,
    place: r.place,
    magType: r.magType,
    type: r.type,
    significance: r.significance,
    tsunami: r.tsunami === 1,
    felt: r.felt,
    cdi: r.cdi,
    mmi: r.mmi,
    isNew: r.isNew === 1,
  }
}

function eqToRecord(eq: Earthquake): EarthquakeRecord {
  return {
    id: eq.id,
    magnitude: eq.magnitude,
    depth: eq.depth,
    longitude: eq.longitude,
    latitude: eq.latitude,
    time: eq.time,
    place: eq.place,
    magType: eq.magType,
    type: eq.type,
    significance: eq.significance,
    tsunami: eq.tsunami ? 1 : 0,
    felt: eq.felt,
    cdi: eq.cdi,
    mmi: eq.mmi,
    isNew: eq.isNew ? 1 : 0,
    lastUpdated: Date.now(),
  }
}

function applyTimeFilter(
  earthquakes: Earthquake[],
  tw: TimeWindow
): Earthquake[] {
  return earthquakes.filter((eq) => eq.time >= tw.start && eq.time <= tw.end)
}

function computeStats(earthquakes: Earthquake[]) {
  const totalCount = earthquakes.length
  const maxMagnitude = earthquakes.reduce(
    (max, eq) => Math.max(max, eq.magnitude),
    0
  )
  return { totalCount, maxMagnitude }
}

export const useEarthquakeStore = create<EarthquakeState>((set, get) => ({
  earthquakes: [],
  filteredEarthquakes: [],
  timeWindow: {
    start: now - thirtyDays,
    end: now,
    isPlaying: false,
    playSpeed: 1,
  },
  selectedEarthquake: null,
  hoveredEarthquake: null,
  seismicWave: null,
  scatterSelection: null,
  chartViewMode: 'scatter',
  showPlateBoundaries: false,
  showSeismicWave: false,
  isLoading: true,
  lastUpdated: null,
  totalCount: 0,
  maxMagnitude: 0,
  newCount: 0,

  setTimeWindow: (tw) => {
    set((state) => {
      const newTW = { ...state.timeWindow, ...tw }
      const filtered = applyTimeFilter(state.earthquakes, newTW)
      return { timeWindow: newTW, filteredEarthquakes: filtered }
    })
  },

  setSelectedEarthquake: (eq) => set({ selectedEarthquake: eq }),
  setHoveredEarthquake: (eq) => set({ hoveredEarthquake: eq }),
  setSeismicWave: (wave) => set({ seismicWave: wave }),
  setScatterSelection: (sel) => set({ scatterSelection: sel }),
  setChartViewMode: (mode) => set({ chartViewMode: mode }),
  togglePlateBoundaries: () =>
    set((s) => ({ showPlateBoundaries: !s.showPlateBoundaries })),
  toggleSeismicWave: () =>
    set((s) => ({ showSeismicWave: !s.showSeismicWave })),

  loadFromDB: async () => {
    try {
      const records = await getAllEarthquakes()
      const earthquakes = records.map(recordToEq)
      const { totalCount, maxMagnitude } = computeStats(earthquakes)
      const tw = get().timeWindow
      const filtered = applyTimeFilter(earthquakes, tw)
      set({
        earthquakes,
        filteredEarthquakes: filtered,
        totalCount,
        maxMagnitude,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  refreshData: async () => {
    try {
      const existingIds = await getExistingIds()
      const { earthquakes: newEqs, newCount } = await fetchEarthquakes(
        existingIds
      )
      if (newEqs.length > 0) {
        const records = newEqs.map(eqToRecord)
        await putEarthquakes(records)
      }
      const allRecords = await getAllEarthquakes()
      const allEqs = allRecords.map(recordToEq)
      const { totalCount, maxMagnitude } = computeStats(allEqs)
      const tw = get().timeWindow
      const filtered = applyTimeFilter(allEqs, tw)
      set({
        earthquakes: allEqs,
        filteredEarthquakes: filtered,
        totalCount,
        maxMagnitude,
        newCount,
        lastUpdated: Date.now(),
      })
    } catch (err) {
      console.error('Refresh failed:', err)
    }
  },

  filterByTimeWindow: () => {
    const { earthquakes, timeWindow } = get()
    const filtered = applyTimeFilter(earthquakes, timeWindow)
    set({ filteredEarthquakes: filtered })
  },

  filterByScatterSelection: () => {
    const { earthquakes, scatterSelection, timeWindow } = get()
    let filtered = applyTimeFilter(earthquakes, timeWindow)
    if (scatterSelection) {
      filtered = filtered.filter(
        (eq) =>
          eq.depth >= scatterSelection.minDepth &&
          eq.depth <= scatterSelection.maxDepth &&
          eq.magnitude >= scatterSelection.minMag &&
          eq.magnitude <= scatterSelection.maxMag
      )
    }
    set({ filteredEarthquakes: filtered })
  },
}))
