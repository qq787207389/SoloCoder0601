import { Earthquake } from '../types/earthquake'

interface WorkerMessage {
  type: 'fetchAndParse'
  existingIds: string[]
  apiUrl: string
}

interface WorkerResponse {
  type: 'parsed'
  earthquakes: Earthquake[]
  newCount: number
}

interface WorkerErrorResponse {
  type: 'error'
  message: string
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, existingIds, apiUrl } = e.data

  if (type === 'fetchAndParse') {
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      const idSet = new Set(existingIds)
      const earthquakes: Earthquake[] = []
      let newCount = 0

      for (const feature of data.features) {
        const props = feature.properties
        if (!feature.geometry?.coordinates) continue
        if (props.mag == null || isNaN(props.mag)) continue

        const id = feature.id || `${props.net}${props.code}`
        const isNew = !idSet.has(id)
        if (isNew) newCount++

        earthquakes.push({
          id,
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
        })
      }

      const resp: WorkerResponse = { type: 'parsed', earthquakes, newCount }
      self.postMessage(resp)
    } catch (err) {
      const resp: WorkerErrorResponse = {
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      }
      self.postMessage(resp)
    }
  }
}
