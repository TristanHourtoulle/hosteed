'use client'

import { useEffect } from 'react'
import { initializePerformanceMonitoring } from '@/lib/monitoring/performance-monitor.service'

/**
 * PERFORMANCE MONITOR COMPONENT
 * Integrates performance monitoring into the application
 */

interface PerformanceMonitorProps {
  enabled?: boolean
  debug?: boolean
  userId?: string
}

export function PerformanceMonitor({
  enabled = true,
  debug = false,
  userId,
}: PerformanceMonitorProps) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let monitor: ReturnType<typeof initializePerformanceMonitoring>

    try {
      monitor = initializePerformanceMonitoring()

      if (userId) {
        // Set user ID for better analytics
        localStorage.setItem('userId', userId)
      }

      if (debug) {
        // Log metrics to console in debug mode
        const logMetrics = () => {
          const metrics = monitor.getMetrics()
          const alerts = monitor.getAlerts()

          console.group('🔍 Performance Metrics Debug')
          console.table(metrics)
          if (alerts.length > 0) {
            console.group('⚠️ Performance Alerts')
            console.table(alerts)
            console.groupEnd()
          }
          console.groupEnd()
        }

        // Log metrics after page load
        window.addEventListener('load', () => {
          setTimeout(logMetrics, 2000) // Wait for metrics to be collected
        })
      }
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error)
    }

    return () => {
      if (monitor && monitor.destroy) {
        monitor.destroy()
      }
    }
  }, [enabled, debug, userId])

  // This component doesn't render anything
  return null
}

/**
 * HOC to wrap components with performance monitoring
 */
export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  monitoringOptions: PerformanceMonitorProps = {}
) {
  return function MonitoredComponent(props: T) {
    return (
      <>
        <PerformanceMonitor {...monitoringOptions} />
        <WrappedComponent {...props} />
      </>
    )
  }
}

/**
 * Hook to use performance monitoring in components
 */
export function usePerformanceMonitoring(options: { trackComponentLoad?: boolean } = {}) {
  useEffect(() => {
    if (options.trackComponentLoad) {
      const startTime = performance.now()

      return () => {
        const endTime = performance.now()
        const loadTime = endTime - startTime

        // Track component load time
        if (loadTime > 100) {
          // Only track if > 100ms
          console.log(`🐌 Slow component load: ${loadTime.toFixed(2)}ms`)
        }
      }
    }
  }, [options.trackComponentLoad])

  return {
    trackEvent: (eventName: string) => {
      // Track custom performance events
      performance.mark(`${eventName}-start`)

      return {
        end: () => {
          performance.mark(`${eventName}-end`)
          performance.measure(eventName, `${eventName}-start`, `${eventName}-end`)

          const measure = performance.getEntriesByName(eventName)[0]
          if (measure && measure.duration > 50) {
            console.log(`📊 ${eventName}: ${measure.duration.toFixed(2)}ms`)
          }
        },
      }
    },
  }
}

export default PerformanceMonitor
