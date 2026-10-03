import type { CSSProperties } from 'react'
import { GROUP_COLORS, type Group } from '../db/types'

/** The group's colour as CSS variables: --tab (solid) and --tab-soft (a tint on the page). */
export function tabStyle(group: Group): CSSProperties {
  const color = GROUP_COLORS[group.color]
  return { '--tab': color, '--tab-soft': `color-mix(in srgb, ${color} 18%, var(--paper))` } as CSSProperties
}
