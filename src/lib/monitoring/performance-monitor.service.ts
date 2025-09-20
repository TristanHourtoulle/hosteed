/**
 * PERFORMANCE MONITORING SERVICE
 * Real User Monitoring (RUM) and Core Web Vitals tracking
 * Measures impact of optimizations from performance audit
 */

'use client'

// import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP, Metric } from 'web-vitals'

// ================================
// PERFORMANCE METRICS INTERFACES
// ================================

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
}

interface ResourceTimingEntry extends PerformanceEntry {
  initiatorType: string
  transferSize?: number
  duration: number
}

interface NavigatorConnection {
  effectiveType?: string
  deviceMemory?: number
}

interface ExtendedNavigator extends Navigator {
  connection?: NavigatorConnection
  deviceMemory?: number
}

export interface CoreWebVitalsData {
  // Core Web Vitals (Google ranking factors)
  lcp?: number          // Largest Contentful Paint
  fid?: number          // First Input Delay (being replaced by INP)
  inp?: number          // Interaction to Next Paint (new 2024 metric)
  cls?: number          // Cumulative Layout Shift
  
  // Other important metrics
  fcp?: number          // First Contentful Paint
  ttfb?: number         // Time to First Byte
  
  // Metadata
  url: string
  userAgent: string
  timestamp: number
  sessionId: string
  userId?: string
  connectionType?: string
  deviceMemory?: number
}

export interface CustomPerformanceMetrics {
  // Page-specific metrics
  pageLoadTime: number
  domContentLoaded: number
  imagesLoaded: number
  scriptsLoaded: number
  
  // User interaction metrics
  timeToInteractive: number
  firstInteraction: number
  
  // Bundle performance
  bundleSize: number
  initialBundleSize: number
  
  // Database/API metrics
  apiResponseTime: number
  databaseQueryTime: number
  
  // Image optimization metrics
  imageOptimizationRatio: number  // % of optimized vs base64 images
  imageLoadTime: number
  
  // Cache performance
  cacheHitRatio: number
  cacheResponseTime: number
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical'
  metric: string
  value: number
  threshold: number
  message: string
  url: string
  timestamp: number
  suggestions: string[]
}

// ================================
// CORE WEB VITALS MONITORING
// ================================

export class PerformanceMonitor {
  private sessionId: string
  private userId?: string
  private metrics: Partial<CoreWebVitalsData> = {}
  private customMetrics: Partial<CustomPerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private isInitialized = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initialize() {
    if (this.isInitialized) return
    
    try {
      this.setupCoreWebVitals()
      this.setupCustomMetrics()
      this.setupPerformanceObservers()
      this.setupNavigationTiming()
      this.setupResourceTiming()
      this.isInitialized = true
      
      console.log('🚀 Performance monitoring initialized')
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error)
    }
  }

  /**
   * Setup Core Web Vitals tracking
   */
  private setupCoreWebVitals() {
    // Core Web Vitals disabled due to missing web-vitals package
    console.log('Core Web Vitals tracking disabled - web-vitals package not available')
    
    /* // Largest Contentful Paint
    getLCP((metric: Metric) => {
      this.metrics.lcp = metric.value
      this.reportMetric('LCP', metric.value, { threshold: 2500, good: 2500, poor: 4000 })
    })

    // First Input Delay (legacy)
    getFID((metric: Metric) => {
      this.metrics.fid = metric.value
      this.reportMetric('FID', metric.value, { threshold: 100, good: 100, poor: 300 })
    })

    // Interaction to Next Paint (new 2024 metric)
    getINP((metric: Metric) => {
      this.metrics.inp = metric.value
      this.reportMetric('INP', metric.value, { threshold: 200, good: 200, poor: 500 })
    })

    // Cumulative Layout Shift
    getCLS((metric: Metric) => {
      this.metrics.cls = metric.value
      this.reportMetric('CLS', metric.value, { threshold: 0.1, good: 0.1, poor: 0.25 })
    })

    // First Contentful Paint
    getFCP((metric: Metric) => {
      this.metrics.fcp = metric.value
      this.reportMetric('FCP', metric.value, { threshold: 1800, good: 1800, poor: 3000 })
    })

    // Time to First Byte
    getTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value
      this.reportMetric('TTFB', metric.value, { threshold: 800, good: 800, poor: 1800 })
    }) */
  }

  /**
   * Setup custom application metrics
   */
  private setupCustomMetrics() {
    // Page load timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.customMetrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
        this.customMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
        this.customMetrics.timeToInteractive = this.calculateTimeToInteractive()
      }
    })

    // Track first user interaction
    const interactionEvents = ['click', 'keydown', 'touchstart', 'scroll']
    const trackFirstInteraction = () => {
      this.customMetrics.firstInteraction = performance.now()
      interactionEvents.forEach(event => {
        document.removeEventListener(event, trackFirstInteraction)
      })
    }
    
    interactionEvents.forEach(event => {
      document.addEventListener(event, trackFirstInteraction)
    })

    // Bundle size monitoring
    this.measureBundleSize()
  }

  /**
   * Setup Performance Observers for advanced metrics
   */
  private setupPerformanceObservers() {
    // Long Tasks API - detect blocking tasks
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const longTasks = list.getEntries()
        longTasks.forEach(task => {
          if (task.duration > 50) { // > 50ms is considered blocking
            this.reportAlert({
              type: 'warning',
              metric: 'Long Task',
              value: task.duration,
              threshold: 50,
              message: `Blocking task detected: ${task.duration.toFixed(2)}ms`,
              url: window.location.href,
              timestamp: Date.now(),
              suggestions: [
                'Consider code splitting to reduce JavaScript bundle size',
                'Use dynamic imports for non-critical code',
                'Optimize heavy computations with Web Workers'
              ]
            })
          }
        })
      })
      
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    }

    // Layout Shift monitoring
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
      const clsObserver = new PerformanceObserver((list) => {
        const layoutShifts = list.getEntries() as LayoutShiftEntry[]
        layoutShifts.forEach((shift: LayoutShiftEntry) => {
          if (shift.value > 0.1) {
            this.reportAlert({
              type: 'warning',
              metric: 'Layout Shift',
              value: shift.value,
              threshold: 0.1,
              message: `Significant layout shift detected: ${shift.value.toFixed(3)}`,
              url: window.location.href,
              timestamp: Date.now(),
              suggestions: [
                'Add explicit width/height to images',
                'Reserve space for dynamic content',
                'Use CSS transforms instead of changing layout properties'
              ]
            })
          }
        })
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    }
  }

  /**
   * Monitor Navigation Timing API
   */
  private setupNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        // DNS lookup time
        const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart
        if (dnsTime > 200) {
          this.reportAlert({
            type: 'warning',
            metric: 'DNS Lookup',
            value: dnsTime,
            threshold: 200,
            message: `Slow DNS lookup: ${dnsTime.toFixed(2)}ms`,
            url: window.location.href,
            timestamp: Date.now(),
            suggestions: ['Consider using DNS prefetch hints', 'Optimize DNS provider']
          })
        }

        // SSL negotiation time
        const sslTime = navigation.connectEnd - navigation.secureConnectionStart
        if (sslTime > 300) {
          this.reportAlert({
            type: 'warning',
            metric: 'SSL Negotiation',
            value: sslTime,
            threshold: 300,
            message: `Slow SSL negotiation: ${sslTime.toFixed(2)}ms`,
            url: window.location.href,
            timestamp: Date.now(),
            suggestions: ['Optimize SSL certificate chain', 'Enable HTTP/2 push']
          })
        }
      }
    })
  }

  /**
   * Monitor Resource Timing for assets
   */
  private setupResourceTiming() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as ResourceTimingEntry[]
      
      // Check for slow images
      resources.forEach((resource: ResourceTimingEntry) => {
        if (resource.initiatorType === 'img' && resource.duration > 1000) {
          this.reportAlert({
            type: 'warning',
            metric: 'Slow Image',
            value: resource.duration,
            threshold: 1000,
            message: `Slow image loading: ${resource.name} (${resource.duration.toFixed(2)}ms)`,
            url: window.location.href,
            timestamp: Date.now(),
            suggestions: [
              'Optimize image formats (WebP, AVIF)',
              'Implement responsive images',
              'Use CDN for image delivery',
              'Add preload hints for critical images'
            ]
          })
        }
        
        // Check for large JavaScript bundles
        if (resource.initiatorType === 'script' && (resource.transferSize ?? 0) > 250000) { // > 250KB
          this.reportAlert({
            type: 'error',
            metric: 'Large Bundle',
            value: resource.transferSize ?? 0,
            threshold: 250000,
            message: `Large JavaScript bundle: ${resource.name} (${((resource.transferSize ?? 0) / 1024).toFixed(2)}KB)`,
            url: window.location.href,
            timestamp: Date.now(),
            suggestions: [
              'Implement code splitting',
              'Use dynamic imports',
              'Remove unused dependencies',
              'Enable tree shaking'
            ]
          })
        }
      })
    })
  }

  /**
   * Calculate Time to Interactive
   */
  private calculateTimeToInteractive(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return 0

    // Simplified TTI calculation
    // In production, use a proper TTI polyfill
    return navigation.domInteractive - navigation.fetchStart
  }

  /**
   * Measure bundle size impact
   */
  private measureBundleSize() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as ResourceTimingEntry[]
      let totalBundleSize = 0
      let initialBundleSize = 0

      resources.forEach((resource: ResourceTimingEntry) => {
        if (resource.initiatorType === 'script') {
          totalBundleSize += resource.transferSize || 0
          if (resource.name.includes('_app') || resource.name.includes('index')) {
            initialBundleSize += resource.transferSize || 0
          }
        }
      })

      this.customMetrics.bundleSize = totalBundleSize
      this.customMetrics.initialBundleSize = initialBundleSize

      // Alert for bundle size issues
      if (initialBundleSize > 250000) { // > 250KB
        this.reportAlert({
          type: 'critical',
          metric: 'Initial Bundle Size',
          value: initialBundleSize,
          threshold: 250000,
          message: `Initial bundle too large: ${(initialBundleSize / 1024).toFixed(2)}KB`,
          url: window.location.href,
          timestamp: Date.now(),
          suggestions: [
            'Implement route-based code splitting',
            'Use dynamic imports for large libraries',
            'Remove unused dependencies',
            'Optimize third-party scripts'
          ]
        })
      }
    })
  }

  /**
   * Report metric with threshold checking
   */
  private reportMetric(
    name: string, 
    value: number, 
    thresholds: { threshold: number; good: number; poor: number }
  ) {
    const rating = value <= thresholds.good ? 'good' : value <= thresholds.poor ? 'needs-improvement' : 'poor'
    
    console.log(`📊 ${name}: ${value.toFixed(2)}ms (${rating})`)
    
    if (rating === 'poor') {
      this.reportAlert({
        type: rating === 'poor' ? 'critical' : 'warning',
        metric: name,
        value,
        threshold: thresholds.threshold,
        message: `Poor ${name}: ${value.toFixed(2)}ms (threshold: ${thresholds.threshold}ms)`,
        url: window.location.href,
        timestamp: Date.now(),
        suggestions: this.getSuggestions(name)
      })
    }

    // Send to analytics
    this.sendMetricToAnalytics(name, value, rating)
  }

  /**
   * Report performance alert
   */
  private reportAlert(alert: PerformanceAlert) {
    console.warn('🚨 Performance Alert:', alert)
    
    // Send to monitoring service (Sentry, DataDog, etc.)
    this.sendAlertToMonitoring(alert)
    
    // Store locally for debugging
    const alerts = this.getStoredAlerts()
    alerts.push(alert)
    localStorage.setItem('performance-alerts', JSON.stringify(alerts.slice(-50))) // Keep last 50
  }

  /**
   * Get performance suggestions based on metric
   */
  private getSuggestions(metric: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'LCP': [
        'Optimize server response time (TTFB)',
        'Remove render-blocking resources',
        'Optimize images with WebP/AVIF',
        'Use preload for critical resources'
      ],
      'FID': [
        'Reduce JavaScript execution time',
        'Break up long tasks',
        'Use code splitting',
        'Defer non-critical JavaScript'
      ],
      'INP': [
        'Optimize event handlers',
        'Reduce main thread blocking',
        'Use Web Workers for heavy computations',
        'Implement virtual scrolling for long lists'
      ],
      'CLS': [
        'Add size attributes to images',
        'Reserve space for dynamic content',
        'Use CSS transforms instead of layout changes',
        'Avoid inserting content above existing content'
      ],
      'TTFB': [
        'Optimize server performance',
        'Use CDN for static assets',
        'Implement server-side caching',
        'Reduce database query time'
      ]
    }

    return suggestions[metric] || ['Review and optimize the affected component']
  }

  /**
   * Send metric to analytics service
   */
  private async sendMetricToAnalytics(name: string, value: number, rating: string) {
    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value,
          rating,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          userId: this.userId,
          ...this.getDeviceInfo()
        })
      })
    } catch (error) {
      console.error('Failed to send metric to analytics:', error)
    }
  }

  /**
   * Send alert to monitoring service
   */
  private async sendAlertToMonitoring(alert: PerformanceAlert) {
    try {
      await fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })
    } catch (error) {
      console.error('Failed to send alert to monitoring:', error)
    }
  }

  /**
   * Get device and connection information
   */
  private getDeviceInfo(): Partial<CoreWebVitalsData> {
    return {
      connectionType: (navigator as ExtendedNavigator).connection?.effectiveType,
      deviceMemory: (navigator as ExtendedNavigator).deviceMemory,
      userAgent: navigator.userAgent
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get user ID from session/auth
   */
  private getUserId(): string | undefined {
    // Implement based on your auth system
    return localStorage.getItem('userId') || undefined
  }

  /**
   * Get stored alerts
   */
  private getStoredAlerts(): PerformanceAlert[] {
    try {
      const stored = localStorage.getItem('performance-alerts')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Public API methods
   */
  public getMetrics(): CoreWebVitalsData & CustomPerformanceMetrics {
    return {
      ...this.metrics,
      ...this.customMetrics,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...this.getDeviceInfo()
    } as CoreWebVitalsData & CustomPerformanceMetrics
  }

  public getAlerts(): PerformanceAlert[] {
    return this.getStoredAlerts()
  }

  /**
   * Clean up observers
   */
  public destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.isInitialized = false
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

let performanceMonitor: PerformanceMonitor

export function initializePerformanceMonitoring(): PerformanceMonitor {
  if (typeof window === 'undefined') {
    return {} as PerformanceMonitor // SSR fallback
  }

  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }

  return performanceMonitor
}

export { performanceMonitor }
export default PerformanceMonitor