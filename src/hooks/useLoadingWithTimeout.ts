'use client'

import { useState, useEffect, useRef } from 'react'

interface LoadingTimeoutOptions {
  timeout?: number
  slowConnectionWarning?: number
  onTimeout?: (() => void) | undefined
  onSlowConnection?: (() => void) | undefined
}

export function useLoadingWithTimeout(
  isLoading: boolean,
  options: LoadingTimeoutOptions = {}
) {
  const {
    timeout = 15000, // 15 seconds
    slowConnectionWarning = 5000, // 5 seconds
    onTimeout,
    onSlowConnection
  } = options

  const [showSlowWarning, setShowSlowWarning] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const slowWarningRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (isLoading) {
      setHasTimedOut(false)
      setShowSlowWarning(false)

      // Set slow connection warning
      slowWarningRef.current = setTimeout(() => {
        setShowSlowWarning(true)
        if (onSlowConnection) {
          onSlowConnection()
        }
      }, slowConnectionWarning)

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true)
        if (onTimeout) {
          onTimeout()
        }
      }, timeout)
    } else {
      // Clear timeouts when loading stops
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (slowWarningRef.current) clearTimeout(slowWarningRef.current)
      setShowSlowWarning(false)
      setHasTimedOut(false)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (slowWarningRef.current) clearTimeout(slowWarningRef.current)
    }
  }, [isLoading, timeout, slowConnectionWarning, onTimeout, onSlowConnection])

  return {
    showSlowWarning,
    hasTimedOut,
    isLoadingWithTimeout: isLoading && !hasTimedOut
  }
}