import Dexie, { type EntityTable } from 'dexie'
import { seedData } from './seed'
import { COLOR_NAMES, type Group, type Item, type Plan } from './types'

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

// v2: plans get a colour, like lists in Reminders.
db.version(2)
  .stores({})
  .upgrade(async (tx) => {
    let i = 0
    await tx
      .table('plans')
      .toCollection()
      .modify((plan: Plan) => {
        plan.color ??= COLOR_NAMES[i++ % COLOR_NAMES.length]
      })
  })

// Runs once, when the database is first created on this device.
db.on('populate', async (tx) => {
  const { plans, groups, items } = seedData()
  await tx.table('plans').bulkAdd(plans)
  await tx.table('groups').bulkAdd(groups)
  await tx.table('items').bulkAdd(items)
})
