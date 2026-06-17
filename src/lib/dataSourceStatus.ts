/**
 * Tracks whether proposal data is currently being served from the local backup
 * snapshot (`src/data/govtools-proposals-backup.json`) because the GovTools API
 * was unreachable. The data layer is made of plain module functions, so this is
 * a tiny pub/sub the React tree can subscribe to (via useSyncExternalStore)
 * without prop-drilling a status flag through every fetch.
 */

type TListener = () => void

let usingBackup = false
const listeners = new Set<TListener>()

export const setUsingBackupData = (value: boolean): void => {
  if (usingBackup === value) {
    return
  }
  usingBackup = value
  listeners.forEach((listener) => listener())
}

export const getUsingBackupData = (): boolean => usingBackup

export const subscribeUsingBackupData = (listener: TListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
