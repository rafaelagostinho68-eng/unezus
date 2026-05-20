const dbName = 'unezus-academy-preview-media'
const storeName = 'lesson-videos'

type StoredVideoAsset = {
  id: string
  name: string
  type: string
  blob: Blob
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

async function runTransaction<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void) {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    handler(store, resolve, reject)
  })
}

export async function saveLessonVideoAsset(id: string, file: File) {
  await runTransaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.put({
      id,
      name: file.name,
      type: file.type || 'video/mp4',
      blob: file,
      updatedAt: Date.now(),
    } satisfies StoredVideoAsset)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getLessonVideoAsset(id: string) {
  return runTransaction<StoredVideoAsset | null>('readonly', (store, resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve((request.result as StoredVideoAsset | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteLessonVideoAsset(id: string) {
  await runTransaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
