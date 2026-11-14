// src/lib/services/offline-debts.service.ts
'use client'

const OFFLINE_QUEUE_KEY = 'qd_offline_debts_queue'

export interface OfflineDebtItem {
  id: string
  payload: Record<string, unknown>
  createdAt: string
}

export function getOfflineDebtsQueue(): OfflineDebtItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function enqueueOfflineDebt(payload: Record<string, unknown>): OfflineDebtItem {
  const queue = getOfflineDebtsQueue()
  const item: OfflineDebtItem = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    payload,
    createdAt: new Date().toISOString(),
  }
  queue.push(item)
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.error('Failed to save offline debt queue:', e)
  }
  return item
}

export function removeOfflineDebt(id: string) {
  const queue = getOfflineDebtsQueue().filter((item) => item.id !== id)
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.error('Failed to remove item from offline queue:', e)
  }
}

export async function syncOfflineDebtsQueue(
  onSynced?: (count: number) => void
): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const queue = getOfflineDebtsQueue()
  if (queue.length === 0) {
    return { synced: 0, failed: 0 }
  }

  console.log(`📡 Syncing ${queue.length} offline debts with server...`)
  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })

      if (res.ok) {
        removeOfflineDebt(item.id)
        synced += 1
      } else {
        failed += 1
      }
    } catch {
      failed += 1
      break // network still unavailable, stop syncing for now
    }
  }

  if (synced > 0 && onSynced) {
    onSynced(synced)
  }

  return { synced, failed }
}
