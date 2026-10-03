import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getConfirm, subscribeConfirm, type ConfirmRequest } from '../lib/confirm'

export function ConfirmHost() {
  const request = useSyncExternalStore(subscribeConfirm, getConfirm)
  return request ? <Alert key={request.title + request.message} request={request} /> : null
}

/** An Apple alert: title, short message, Cancel and the destructive action side by side. */
function Alert({ request }: { request: ConfirmRequest }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={() => request.resolve(ref.current?.returnValue === 'ok')}
      aria-labelledby="alert-title"
      aria-describedby={request.message ? 'alert-message' : undefined}
      className="anim-alert m-auto bg-[var(--alert)] backdrop-blur-xl w-[17rem] overflow-hidden rounded-[14px] p-0 text-label shadow-float"
    >
      <form method="dialog">
        <div className="flex flex-col gap-1 px-4 pt-[19px] pb-[17px] text-center">
          <h2 id="alert-title" className="text-[17px] leading-snug font-semibold">
            {request.title}
          </h2>
          {request.message && (
            <p id="alert-message" className="text-[13px] leading-[1.35]">
              {request.message}
            </p>
          )}
        </div>
        {/* No default button, so people read before choosing. */}
        <div className="grid grid-cols-2 border-t border-separator text-[17px]">
          <button value="cancel" className="h-11 border-r border-separator text-tint hover:bg-fill-4">
            Cancel
          </button>
          <button value="ok" className="h-11 font-semibold text-red hover:bg-fill-4">
            {request.confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
