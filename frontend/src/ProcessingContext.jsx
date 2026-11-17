
import {
  createContext,
  useContext,
  useSyncExternalStore,
} from 'react'

export const ProcessingContext = createContext(null)

// Shared Color Studio result.
// This works with the existing App.jsx provider,
// so App.jsx does not need to be changed.

let colorResult = null

const listeners = new Set()

function subscribe(listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return colorResult
}

function setColorResult(value) {
  colorResult =
    typeof value === 'function'
      ? value(colorResult)
      : value

  listeners.forEach((listener) => listener())
}

export function useProcessing() {
  const context = useContext(ProcessingContext)

  const sharedColorResult = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  )

  if (!context) {
    throw new Error(
      'ProcessingContext provider is missing'
    )
  }

  return {
    ...context,
    colorResult: sharedColorResult,
    setColorResult,
  }
}
