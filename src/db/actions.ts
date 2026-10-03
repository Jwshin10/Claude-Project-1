import { newId } from '../lib/id'
import { db } from './db'
import { COLOR_NAMES, type ColorName, type Group, type Item, type ItemFields, type Plan } from './types'

// Every mutation in the app goes through this module so that voice commands
// (phase 2) can reuse exactly the same operations as the UI.

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

export async function createPlan(input: { title?: string; color?: ColorName; groups?: string[] } = {}): Promise<string> {
  const id = newId()
  const now = Date.now()
  await db.transaction('rw', db.plans, db.groups, async () => {
    const last = await db.plans.orderBy('position').last()
    const count = await db.plans.count()
    await db.plans.add({
      id,
      title: input.title ?? 'New Plan',
      color: input.color ?? COLOR_NAMES[count % COLOR_NAMES.length],
      icon: '',
      description: '',
      view: 'list',
      hideDone: false,
      position: (last?.position ?? 0) + 1,
      createdAt: now,
      updatedAt: now,
    })
    const names = input.groups ?? ['General']
    await db.groups.bulkAdd(
      names.map((name, i) => ({
        id: newId(),
        planId: id,
        name,
        color: COLOR_NAMES[i % COLOR_NAMES.length],
        position: i + 1,
        createdAt: now,
      })),
    )
  })
  return id
}

export async function updatePlan(id: string, patch: Partial<Omit<Plan, 'id' | 'createdAt'>>): Promise<void> {
  await db.plans.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deletePlan(id: string): Promise<void> {
  await db.transaction('rw', db.plans, db.groups, db.items, async () => {
    await db.items.where('planId').equals(id).delete()
    await db.groups.where('planId').equals(id).delete()
    await db.plans.delete(id)
  })
}

export async function createGroup(planId: string, name: string, color?: ColorName): Promise<string> {
  const id = newId()
  await db.transaction('rw', db.groups, async () => {
    const siblings = await db.groups.where('planId').equals(planId).toArray()
    const maxPosition = Math.max(0, ...siblings.map((g) => g.position))
    await db.groups.add({
      id,
      planId,
      name,
      color: color ?? COLOR_NAMES[siblings.length % COLOR_NAMES.length],
      position: maxPosition + 1,
      createdAt: Date.now(),
    })
  })
  return id
}

export async function updateGroup(id: string, patch: Partial<Pick<Group, 'name' | 'color'>>): Promise<void> {
  await db.groups.update(id, patch)
}

export async function deleteGroup(id: string): Promise<void> {
  await db.transaction('rw', db.groups, db.items, async () => {
    await db.items.where('groupId').equals(id).delete()
    await db.groups.delete(id)
  })
}

/** Moves a group to `toIndex` among its plan's groups (clamped to the valid range). */
export async function moveGroup(id: string, toIndex: number): Promise<void> {
  await db.transaction('rw', db.groups, async () => {
    const group = await db.groups.get(id)
    if (!group) return
    const siblings = (await db.groups.where('planId').equals(group.planId).toArray()).sort(byPosition)
    const rest = siblings.filter((g) => g.id !== id)
    const index = Math.max(0, Math.min(toIndex, rest.length))
    rest.splice(index, 0, group)
    await Promise.all(rest.map((g, i) => db.groups.update(g.id, { position: i + 1 })))
  })
}

export async function addItem(groupId: string, fields: Partial<ItemFields> & { title: string }): Promise<string> {
  const id = newId()
  await db.transaction('rw', db.groups, db.items, async () => {
    const group = await db.groups.get(groupId)
    if (!group) throw new Error(`Group ${groupId} does not exist`)
    const siblings = await db.items.where('groupId').equals(groupId).toArray()
    const now = Date.now()
    await db.items.add({
      id,
      planId: group.planId,
      groupId,
      notes: '',
      status: 'todo',
      priority: 'none',
      dueDate: null,
      tags: [],
      checklist: [],
      ...fields,
      position: Math.max(0, ...siblings.map((i) => i.position)) + 1,
      createdAt: now,
      updatedAt: now,
    })
  })
  return id
}

export async function updateItem(id: string, patch: Partial<ItemFields>): Promise<void> {
  await db.items.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id)
}

/**
 * Moves an item into `toGroupId`, directly before `beforeItemId`, or to the end
 * of the group when `beforeItemId` is null or not in that group. Anchoring on a
 * neighbour (rather than an index) keeps moves correct while done items are hidden.
 */
export async function moveItem(id: string, toGroupId: string, beforeItemId: string | null): Promise<void> {
  await db.transaction('rw', db.groups, db.items, async () => {
    const item = await db.items.get(id)
    const group = await db.groups.get(toGroupId)
    if (!item || !group || group.planId !== item.planId) return
    const siblings = (await db.items.where('groupId').equals(toGroupId).toArray())
      .filter((i) => i.id !== id)
      .sort(byPosition)
    const anchor = beforeItemId ? siblings.findIndex((i) => i.id === beforeItemId) : -1
    const ordered: Item[] = [...siblings]
    ordered.splice(anchor === -1 ? ordered.length : anchor, 0, item)
    await Promise.all(
      ordered.map((i, index) =>
        db.items.update(i.id, i.id === id ? { groupId: toGroupId, position: index + 1, updatedAt: Date.now() } : { position: index + 1 }),
      ),
    )
  })
}

export async function toggleItemDone(item: Pick<Item, 'id' | 'status'>): Promise<void> {
  await updateItem(item.id, { status: item.status === 'done' ? 'todo' : 'done' })
}
