import type { Item } from '../db/types'

export type GroupCounts = Map<string, { total: number; done: number }>

export function countByGroup(items: Item[]): GroupCounts {
  const counts: GroupCounts = new Map()
  for (const item of items) {
    const c = counts.get(item.groupId) ?? { total: 0, done: 0 }
    c.total += 1
    if (item.status === 'done') c.done += 1
    counts.set(item.groupId, c)
  }
  return counts
}
