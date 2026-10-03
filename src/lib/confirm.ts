// Promise-based confirmation, shown by <ConfirmHost />. Used instead of
// window.confirm, which some embedded browsers (and the claude.ai preview) block.

export interface ConfirmRequest {
  title: string
  message?: string
  confirmLabel: string
  resolve: (ok: boolean) => void
}

let current: ConfirmRequest | null = null
const listeners = new Set<() => void>()

export function subscribeConfirm(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getConfirm(): ConfirmRequest | null {
  return current
}

function set(next: ConfirmRequest | null) {
  current = next
  listeners.forEach((l) => l())
}

export function confirmAction(options: { title: string; message?: string; confirmLabel?: string }): Promise<boolean> {
  current?.resolve(false)
  return new Promise((resolve) => {
    set({
      confirmLabel: 'Delete',
      ...options,
      resolve: (ok) => {
        set(null)
        resolve(ok)
      },
    })
  })
}
