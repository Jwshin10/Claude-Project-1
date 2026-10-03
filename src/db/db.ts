import Dexie, { type EntityTable } from 'dexie'
import { seedData } from './seed'
import type { Group, Item, Plan } from './types'

export const db = new Dexie('planvoice') as Dexie & {
  plans: EntityTable<Plan, 'id'>
  groups: EntityTable<Group, 'id'>
  items: EntityTable<Item, 'id'>
}

db.version(1).stores({
  plans: 'id, position',
  groups: 'id, planId',
  items: 'id, planId, groupId',
})

// v2 was used briefly by a design that added a colour to plans. The schema is
// unchanged; declaring it lets browsers that already upgraded keep opening the database.
db.version(2).stores({})

// Runs once, when the database is first created on this device.
db.on('populate', async (tx) => {
  const { plans, groups, items } = seedData()
  await tx.table('plans').bulkAdd(plans)
  await tx.table('groups').bulkAdd(groups)
  await tx.table('items').bulkAdd(items)
})
