import { newId } from '../lib/id'
import type { Group, Item, Plan } from './types'

export function seedData(): { plans: Plan[]; groups: Group[]; items: Item[] } {
  const now = Date.now()
  const plan: Plan = {
    id: newId(),
    title: 'Welcome',
    icon: '👋',
    description: 'A quick tour. Delete this plan whenever you like.',
    view: 'list',
    hideDone: false,
    position: 1,
    createdAt: now,
    updatedAt: now,
  }
  const start: Group = { id: newId(), planId: plan.id, name: 'Getting started', color: 'blue', position: 1, createdAt: now }
  const later: Group = { id: newId(), planId: plan.id, name: 'Coming soon', color: 'purple', position: 2, createdAt: now }

  const item = (group: Group, position: number, title: string, extra: Partial<Item> = {}): Item => ({
    id: newId(),
    planId: plan.id,
    groupId: group.id,
    title,
    notes: '',
    status: 'todo',
    priority: 'none',
    dueDate: null,
    tags: [],
    checklist: [],
    position,
    createdAt: now,
    updatedAt: now,
    ...extra,
  })

  return {
    plans: [plan],
    groups: [start, later],
    items: [
      item(start, 1, 'Click an item to open its details', {
        notes: 'Add notes, a due date, priority, tags and a checklist.',
        priority: 'high',
      }),
      item(start, 2, 'Drag items to reorder them or move them between groups', { tags: ['tip'] }),
      item(start, 3, 'Switch to the Board view at the top of the page', { tags: ['tip'] }),
      item(start, 4, 'Tick the circle to mark something done', { status: 'done' }),
      item(later, 1, 'Voice input: speak and it lands in the right group', {
        checklist: [
          { id: newId(), text: 'Speech to text', done: false },
          { id: newId(), text: 'Preview before saving', done: false },
        ],
      }),
    ],
  }
}
