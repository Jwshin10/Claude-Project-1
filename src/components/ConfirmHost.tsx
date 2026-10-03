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
      className="m-auto w-[calc(100%-2rem)] max-w-[24rem] rounded-2xl border border-rule-strong bg-card p-6 text-ink shadow-paper"
    >
      <form method="dialog" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 id="confirm-title" className="font-display text-xl leading-snug">
            {request.title}
          </h2>
          {request.message && <p className="text-[14.5px] text-ink-2">{request.message}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button value="cancel" className="h-9 rounded-lg px-3.5 text-sm font-medium text-ink-2 hover:bg-hover hover:text-ink">
            Cancel
          </button>
          <button value="ok" autoFocus className="h-9 rounded-lg bg-danger px-3.5 text-sm font-semibold text-danger-ink hover:brightness-110">
            {request.confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
