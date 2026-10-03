import { db } from './db'
import { COLOR_NAMES, type Group, type Item, type Plan } from './types'

export interface Backup {
  app: 'planvoice'
  version: 1
  exportedAt: string
  plans: Plan[]
  groups: Group[]
  items: Item[]
}

export async function exportBackup(): Promise<Backup> {
  const [plans, groups, items] = await Promise.all([db.plans.toArray(), db.groups.toArray(), db.items.toArray()])
  return { app: 'planvoice', version: 1, exportedAt: new Date().toISOString(), plans, groups, items }
}

export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const b = data as Partial<Backup>
  if (b?.app !== 'planvoice' || b.version !== 1 || ![b.plans, b.groups, b.items].every(Array.isArray)) {
    throw new Error('That file is not a Planvoice backup.')
  }
  return b as Backup
}

/** Replaces everything on this device with the backup's contents. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.plans, db.groups, db.items, async () => {
    await Promise.all([db.plans.clear(), db.groups.clear(), db.items.clear()])
    // Backups made before plans had colours get one.
    await db.plans.bulkAdd(backup.plans.map((p, i) => ({ ...p, color: p.color ?? COLOR_NAMES[i % COLOR_NAMES.length] })))
    await db.groups.bulkAdd(backup.groups)
    await db.items.bulkAdd(backup.items)
  })
}

export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.plans, db.groups, db.items, async () => {
    await Promise.all([db.plans.clear(), db.groups.clear(), db.items.clear()])
  })
}
