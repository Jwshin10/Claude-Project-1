import { beforeEach, describe, expect, it } from 'vitest'
import { addItem, createGroup, createPlan, deleteGroup, deletePlan, moveGroup, moveItem, toggleItemDone } from './actions'
import { exportBackup, parseBackup, restoreBackup } from './backup'
import { db } from './db'

async function itemTitles(groupId: string) {
  return (await db.items.where('groupId').equals(groupId).sortBy('position')).map((i) => i.title)
}

beforeEach(async () => {
  await db.open()
  await Promise.all([db.plans.clear(), db.groups.clear(), db.items.clear()])
})

describe('plans and groups', () => {
  it('creates a plan with its default groups', async () => {
    const planId = await createPlan({ title: 'Japan trip', groups: ['Flights', 'Hotels'] })
    const groups = await db.groups.where('planId').equals(planId).sortBy('position')
    expect(groups.map((g) => g.name)).toEqual(['Flights', 'Hotels'])
    expect(groups[0].color).not.toBe(groups[1].color)
  })

  it('appends new plans after existing ones', async () => {
    await createPlan({ title: 'A' })
    await createPlan({ title: 'B' })
    expect((await db.plans.orderBy('position').toArray()).map((p) => p.title)).toEqual(['A', 'B'])
  })

  it('deleting a plan removes its groups and items', async () => {
    const planId = await createPlan()
    const [group] = await db.groups.where('planId').equals(planId).toArray()
    await addItem(group.id, { title: 'x' })
    await deletePlan(planId)
    expect(await db.groups.count()).toBe(0)
    expect(await db.items.count()).toBe(0)
  })

  it('deleting a group removes only its items', async () => {
    const planId = await createPlan({ groups: ['A', 'B'] })
    const [a, b] = await db.groups.where('planId').equals(planId).sortBy('position')
    await addItem(a.id, { title: 'in a' })
    await addItem(b.id, { title: 'in b' })
    await deleteGroup(a.id)
    expect((await db.items.toArray()).map((i) => i.title)).toEqual(['in b'])
  })

  it('reorders groups', async () => {
    const planId = await createPlan({ groups: ['A', 'B'] })
    const c = await createGroup(planId, 'C')
    await moveGroup(c, 0)
    expect((await db.groups.where('planId').equals(planId).sortBy('position')).map((g) => g.name)).toEqual(['C', 'A', 'B'])
  })
})

describe('items', () => {
  let a: string
  let b: string

  beforeEach(async () => {
    const planId = await createPlan({ groups: ['A', 'B'] })
    ;[a, b] = (await db.groups.where('planId').equals(planId).sortBy('position')).map((g) => g.id)
  })

  it('adds items to the end of a group with defaults', async () => {
    await addItem(a, { title: 'one' })
    const id = await addItem(a, { title: 'two', priority: 'high' })
    expect(await itemTitles(a)).toEqual(['one', 'two'])
    expect(await db.items.get(id)).toMatchObject({ status: 'todo', priority: 'high', dueDate: null, tags: [] })
  })

  it('rejects items for a missing group', async () => {
    await expect(addItem('nope', { title: 'x' })).rejects.toThrow()
  })

  it('moves an item before another item in the same group', async () => {
    await addItem(a, { title: 'one' })
    const two = await addItem(a, { title: 'two' })
    const three = await addItem(a, { title: 'three' })
    await moveItem(three, a, two)
    expect(await itemTitles(a)).toEqual(['one', 'three', 'two'])
  })

  it('moves an item to the end of another group', async () => {
    const one = await addItem(a, { title: 'one' })
    await addItem(b, { title: 'b1' })
    await moveItem(one, b, null)
    expect(await itemTitles(a)).toEqual([])
    expect(await itemTitles(b)).toEqual(['b1', 'one'])
  })

  it('toggles done', async () => {
    const id = await addItem(a, { title: 'x' })
    await toggleItemDone({ id, status: 'todo' })
    expect((await db.items.get(id))?.status).toBe('done')
    await toggleItemDone({ id, status: 'done' })
    expect((await db.items.get(id))?.status).toBe('todo')
  })
})

describe('backup', () => {
  it('round-trips through export and restore', async () => {
    const planId = await createPlan({ title: 'Keep me' })
    const [group] = await db.groups.where('planId').equals(planId).toArray()
    await addItem(group.id, { title: 'item', tags: ['x'] })
    const text = JSON.stringify(await exportBackup())

    await deletePlan(planId)
    await restoreBackup(parseBackup(text))

    expect((await db.plans.toArray()).map((p) => p.title)).toEqual(['Keep me'])
    expect((await db.items.toArray())[0]).toMatchObject({ title: 'item', tags: ['x'] })
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow('not valid JSON')
    expect(() => parseBackup('{"foo":1}')).toThrow('not a Planvoice backup')
  })
})

describe('plan colours', () => {
  it('gives new plans a colour, cycling through the palette', async () => {
    const a = await createPlan()
    const b = await createPlan()
    const [pa, pb] = [await db.plans.get(a), await db.plans.get(b)]
    expect(pa?.color).toBeTruthy()
    expect(pa?.color).not.toBe(pb?.color)
  })

  it('fills in a colour when restoring a backup from before plans had colours', async () => {
    const planId = await createPlan({ title: 'Old' })
    const backup = await exportBackup()
    const legacy = { ...backup, plans: backup.plans.map(({ color: _color, ...rest }) => rest) }
    await deletePlan(planId)
    await restoreBackup(parseBackup(JSON.stringify(legacy)))
    expect((await db.plans.toArray())[0].color).toBeTruthy()
  })
})
