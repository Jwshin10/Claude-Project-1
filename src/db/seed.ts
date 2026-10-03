import { toISODate } from '../lib/dates'
import { newId } from '../lib/id'
import type { Group, GroupColor, Item, Plan } from './types'

/** First-run content: a short tour, and a realistic example plan to poke at. */
export function seedData(today: Date = new Date()): { plans: Plan[]; groups: Group[]; items: Item[] } {
  const now = Date.now()
  const inDays = (n: number) => toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n))
  const plans: Plan[] = []
  const groups: Group[] = []
  const items: Item[] = []

  const plan = (title: string, icon: string, description: string) => {
    const p: Plan = { id: newId(), title, icon, description, view: 'list', hideDone: false, position: plans.length + 1, createdAt: now, updatedAt: now }
    plans.push(p)
    return p
  }
  const group = (p: Plan, name: string, color: GroupColor) => {
    const g: Group = { id: newId(), planId: p.id, name, color, position: groups.filter((x) => x.planId === p.id).length + 1, createdAt: now }
    groups.push(g)
    return g
  }
  const item = (g: Group, title: string, extra: Partial<Item> = {}) => {
    items.push({
      id: newId(),
      planId: g.planId,
      groupId: g.id,
      title,
      notes: '',
      status: 'todo',
      priority: 'none',
      dueDate: null,
      tags: [],
      checklist: [],
      position: items.filter((x) => x.groupId === g.id).length + 1,
      createdAt: now,
      updatedAt: now,
      ...extra,
    })
  }
  const steps = (...texts: [string, boolean][]) => texts.map(([text, done]) => ({ id: newId(), text, done }))

  const lisbon = plan('Lisbon long weekend', '🧳', 'Four days in Lisbon with Sam. Flying out Thursday evening.')
  const travel = group(lisbon, 'Flights & stay', 'blue')
  item(travel, 'Book flights', { status: 'done', notes: 'Evening flight out, Monday afternoon back.' })
  item(travel, 'Pick an apartment in Alfama or Graça', {
    status: 'doing',
    priority: 'high',
    dueDate: inDays(0),
    checklist: steps(['Shortlist three places', true], ['Check reviews for street noise', false], ['Book and pay deposit', false]),
  })
  item(travel, 'Check passport expiry dates', { dueDate: inDays(2) })
  const todo = group(lisbon, 'Things to do', 'orange')
  item(todo, 'Ride tram 28 early, before the queues', { tags: ['morning'] })
  item(todo, 'Sunset at Miradouro da Senhora do Monte', { tags: ['evening'] })
  item(todo, 'Day trip to Sintra', { priority: 'medium', dueDate: inDays(9), notes: 'Train from Rossio, about 40 minutes. Go on a weekday.' })
  item(todo, 'Pastéis de nata in Belém', { tags: ['food'] })
  const packing = group(lisbon, 'Packing', 'green')
  item(packing, 'Comfortable walking shoes')
  item(packing, 'Travel adapter (type F)', { status: 'done' })
  item(packing, 'Light rain jacket')

  const welcome = plan('How Planvoice works', '👋', 'A two-minute tour. Delete this plan whenever you like.')
  const basics = group(welcome, 'The basics', 'purple')
  item(basics, 'Open an item to add a due date, priority, steps or notes', { priority: 'high' })
  item(basics, 'Drag items to reorder them or move them to another group', { tags: ['tip'] })
  item(basics, 'Switch between List and Board at the top of a plan', { tags: ['tip'] })
  item(basics, 'Tick the box when something is done', { status: 'done' })
  const soon = group(welcome, 'Coming soon', 'gray')
  item(soon, 'Voice input: say it, and it lands in the right group', {
    checklist: steps(['Speech to text', false], ['Preview before saving', false]),
  })

  return { plans, groups, items }
}
