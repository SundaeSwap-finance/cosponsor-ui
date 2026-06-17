import { useSyncExternalStore } from 'react'
import { TriangleAlert } from 'lucide-react'
import { getUsingBackupData, subscribeUsingBackupData } from '@/lib/dataSourceStatus'

/**
 * Shown when the proposal list is being served from the local backup snapshot
 * because the live GovTools API was unreachable. Keeps users from mistaking a
 * stale cached list for the current state of governance.
 */
export const DataSourceBanner = () => {
  const usingBackup = useSyncExternalStore(
    subscribeUsingBackupData,
    getUsingBackupData,
    getUsingBackupData
  )

  if (!usingBackup) {
    return null
  }

  return (
    <div
      role="status"
      className={
        'sun-text-12-md flex items-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-900'
      }
    >
      <TriangleAlert className={'size-4 shrink-0'} />
      <span>
        Live proposal data is temporarily unavailable — showing a saved snapshot, which may be out
        of date.
      </span>
    </div>
  )
}
