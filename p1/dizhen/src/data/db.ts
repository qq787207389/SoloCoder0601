import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'EarthquakeDB'
const DB_VERSION = 1
const STORE_NAME = 'earthquakes'

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('time', 'time', { unique: false })
        store.createIndex('magnitude', 'magnitude', { unique: false })
        store.createIndex('depth', 'depth', { unique: false })
        store.createIndex('significance', 'significance', { unique: false })
      }
    },
  })
  return dbInstance
}

export interface EarthquakeRecord {
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
  tsunami: number
  felt: number | null
  cdi: number | null
  mmi: number | null
  isNew: number
  lastUpdated: number
}

export async function getAllEarthquakes(): Promise<EarthquakeRecord[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function getEarthquakesByTimeRange(
  start: number,
  end: number
): Promise<EarthquakeRecord[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(start, end)
  return db.getAllFromIndex(STORE_NAME, 'time', range)
}

export async function putEarthquakes(
  records: EarthquakeRecord[]
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const record of records) {
    await tx.store.put(record)
  }
  await tx.done
}

export async function getExistingIds(): Promise<Set<string>> {
  const db = await getDB()
  const all = await db.getAllKeys(STORE_NAME)
  return new Set(all as string[])
}

export async function clearOldEarthquakes(cutoffTime: number): Promise<number> {
  const db = await getDB()
  const range = IDBKeyRange.upperBound(cutoffTime)
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const keys = await tx.store.index('time').getAllKeys(range)
  for (const key of keys) {
    await tx.store.delete(key)
  }
  await tx.done
  return keys.length
}

export async function getEarthquakeCount(): Promise<number> {
  const db = await getDB()
  return db.count(STORE_NAME)
}
