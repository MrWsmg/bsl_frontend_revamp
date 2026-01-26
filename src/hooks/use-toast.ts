"use client";

import * as React from "react"

type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type State = {
  toasts: Toast[]
}

let memoryState: State = { toasts: [] }

function toast(props: Omit<Toast, 'id'>) {
  const id = Date.now().toString()
  const t: Toast = { ...props, id, open: true, onOpenChange: (open) => {
    if (!open) {
      memoryState.toasts = memoryState.toasts.filter(t => t.id !== id)
    }
  } }
  memoryState.toasts.push(t)
  return { id, dismiss: () => {
    memoryState.toasts = memoryState.toasts.filter(t => t.id !== id)
  }, update: () => {} }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    const interval = setInterval(() => setState({ ...memoryState }), 100)
    return () => clearInterval(interval)
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        memoryState.toasts = memoryState.toasts.filter(t => t.id !== toastId)
      }
    },
  }
}

export { useToast, toast }