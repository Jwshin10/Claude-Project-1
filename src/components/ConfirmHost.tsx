import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getConfirm, subscribeConfirm, type ConfirmRequest } from '../lib/confirm'

export function ConfirmHost() {
  const request = useSyncExternalStore(subscribeConfirm, getConfirm)
  return request ? <ConfirmDialog key={request.title + request.message} request={request} /> : null
}

function ConfirmDialog({ request }: { request: ConfirmRequest }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={() => request.resolve(ref.current?.returnValue === 'ok')}
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-surface p-5 text-text shadow-2xl"
    >
      <form method="dialog" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 id="confirm-title" className="font-semibold text-balance">
            {request.title}
          </h2>
          {request.message && <p className="text-sm text-muted">{request.message}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button value="cancel" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-hover">
            Cancel
          </button>
          <button value="ok" autoFocus className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90">
            {request.confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
