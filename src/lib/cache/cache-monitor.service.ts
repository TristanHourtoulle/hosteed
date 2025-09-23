/**
 * REDIS CACHE MONITORING SERVICE
 * Comprehensive monitoring, alerting, and health checking for Redis cache
 * Provides real-time metrics and automated alerting for production systems
 */

import { redisCache } from './redis-cache.service'

export interface CacheMetrics {
  // Connection health
  connected: boolean
  uptime: number
  
  // Memory usage
  memoryUsed: number
  memoryUsedHuman: string
  memoryPeak: number
  memoryFragmentationRatio: number
  
  // Performance metrics
  totalCommands: number
  instantaneousOpsPerSec: number
  hitRate: number
  missRate: number
  keyspaceHits: number
  keyspaceMisses: number
  
  // Key statistics
  totalKeys: number
  expiredKeys: number
  evictedKeys: number
  
  // Connection stats
  connectedClients: number
  blockedClients: number
  rejectedConnections: number
  
  // Persistence info
  lastSaveTime: number
  changesSinceLastSave: number
  
  // Error tracking
  totalErrors: number
  errorRate: number
  
  // Timestamp
  timestamp: number
}

export interface AlertThresholds {
  memoryUsagePercent: number      // Alert if memory usage > X%
  hitRatePercent: number          // Alert if hit rate < X%
  errorRatePercent: number        // Alert if error rate > X%
  responseTimeMs: number          // Alert if response time > X ms
  connectionCount: number         // Alert if connections > X
  evictionRate: number           // Alert if eviction rate > X per minute
}

export interface HealthCheckResult {
  healthy: boolean
  score: number // 0-100 health score
  issues: string[]
  warnings: string[]
  recommendations: string[]
  metrics: CacheMetrics
}

export class CacheMonitorService {
  private cache = redisCache
  private alertThresholds: AlertThresholds = {
    memoryUsagePercent: 80,
    hitRatePercent: 70,
    errorRatePercent: 5,
    responseTimeMs: 100,
    connectionCount: 100,
    evictionRate: 10
  }
  
  private lastMetrics: CacheMetrics | null = null
  private alertHistory: Array<{ type: string; message: string; timestamp: number }> = []

  /**
   * Get comprehensive cache metrics
   */
  async getMetrics(): Promise<CacheMetrics | null> {
    try {
      if (!this.cache.isRedisAvailable()) {
        return {
          connected: false,
          uptime: 0,
          memoryUsed: 0,
          memoryUsedHuman: '0B',
          memoryPeak: 0,
          memoryFragmentationRatio: 0,
          totalCommands: 0,
          instantaneousOpsPerSec: 0,
          hitRate: 0,
          missRate: 0,
          keyspaceHits: 0,
          keyspaceMisses: 0,
          totalKeys: 0,
          expiredKeys: 0,
          evictedKeys: 0,
          connectedClients: 0,
          blockedClients: 0,
          rejectedConnections: 0,
          lastSaveTime: 0,
          changesSinceLastSave: 0,
          totalErrors: 0,
          errorRate: 0,
          timestamp: Date.now()
        }
      }

      const client = this.cache.getClient()
      if (!client) return null

      const [infoMemory, infoStats, infoClients, infoPersistence] = await Promise.all([
        client.info('memory'),
        client.info('stats'),
        client.info('clients'),
        client.info('persistence')
      ])

      const dbSize = await client.dbsize()

      // Parse memory info
      const memoryUsed = Number(this.parseInfoValue(infoMemory, 'used_memory', parseInt)) || 0
      const memoryUsedHuman = String(this.parseInfoValue(infoMemory, 'used_memory_human') || '0B')
      const memoryPeak = Number(this.parseInfoValue(infoMemory, 'used_memory_peak', parseInt)) || 0
      const memoryFragmentationRatio = Number(this.parseInfoValue(infoMemory, 'mem_fragmentation_ratio', parseFloat)) || 0

      // Parse stats info
      const totalCommands = Number(this.parseInfoValue(infoStats, 'total_commands_processed', parseInt)) || 0
      const instantaneousOpsPerSec = Number(this.parseInfoValue(infoStats, 'instantaneous_ops_per_sec', parseInt)) || 0
      const keyspaceHits = Number(this.parseInfoValue(infoStats, 'keyspace_hits', parseInt)) || 0
      const keyspaceMisses = Number(this.parseInfoValue(infoStats, 'keyspace_misses', parseInt)) || 0
      const expiredKeys = Number(this.parseInfoValue(infoStats, 'expired_keys', parseInt)) || 0
      const evictedKeys = Number(this.parseInfoValue(infoStats, 'evicted_keys', parseInt)) || 0
      const uptime = Number(this.parseInfoValue(infoStats, 'uptime_in_seconds', parseInt)) || 0
      const rejectedConnections = Number(this.parseInfoValue(infoStats, 'rejected_connections', parseInt)) || 0

      // Parse client info
      const connectedClients = Number(this.parseInfoValue(infoClients, 'connected_clients', parseInt)) || 0
      const blockedClients = Number(this.parseInfoValue(infoClients, 'blocked_clients', parseInt)) || 0

      // Parse persistence info
      const lastSaveTime = Number(this.parseInfoValue(infoPersistence, 'last_save_time', parseInt)) || 0
      const changesSinceLastSave = Number(this.parseInfoValue(infoPersistence, 'changes_since_last_save', parseInt)) || 0

      // Calculate derived metrics
      const totalRequests = keyspaceHits + keyspaceMisses
      const hitRate = totalRequests > 0 ? (keyspaceHits / totalRequests) * 100 : 0
      const missRate = totalRequests > 0 ? (keyspaceMisses / totalRequests) * 100 : 0

      // Error tracking (simplified - would need more sophisticated tracking in production)
      const totalErrors = 0
      const errorRate = 0

      const metrics: CacheMetrics = {
        connected: true,
        uptime,
        memoryUsed,
        memoryUsedHuman,
        memoryPeak,
        memoryFragmentationRatio,
        totalCommands,
        instantaneousOpsPerSec,
        hitRate,
        missRate,
        keyspaceHits,
        keyspaceMisses,
        totalKeys: dbSize,
        expiredKeys,
        evictedKeys,
        connectedClients,
        blockedClients,
        rejectedConnections,
        lastSaveTime,
        changesSinceLastSave,
        totalErrors,
        errorRate,
        timestamp: Date.now()
      }

      this.lastMetrics = metrics
      return metrics

    } catch (error) {
      console.error('Failed to get cache metrics:', error)
      return null
    }
  }

  /**
   * Perform comprehensive health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const metrics = await this.getMetrics()
    
    if (!metrics || !metrics.connected) {
      return {
        healthy: false,
        score: 0,
        issues: ['Redis connection failed'],
        warnings: [],
        recommendations: ['Check Redis server status', 'Verify connection configuration'],
        metrics: metrics || {} as CacheMetrics
      }
    }

    const issues: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Check memory usage
    const memoryUsagePercent = (metrics.memoryUsed / (1024 * 1024 * 128)) * 100 // Assuming 128MB limit
    if (memoryUsagePercent > this.alertThresholds.memoryUsagePercent) {
      issues.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`)
      score -= 20
      recommendations.push('Consider increasing memory limit or implementing better eviction policies')
    } else if (memoryUsagePercent > this.alertThresholds.memoryUsagePercent * 0.7) {
      warnings.push(`Memory usage approaching limit: ${memoryUsagePercent.toFixed(1)}%`)
      score -= 5
    }

    // Check hit rate
    if (metrics.hitRate < this.alertThresholds.hitRatePercent) {
      if (metrics.hitRate < 50) {
        issues.push(`Very low cache hit rate: ${metrics.hitRate.toFixed(1)}%`)
        score -= 25
      } else {
        warnings.push(`Low cache hit rate: ${metrics.hitRate.toFixed(1)}%`)
        score -= 10
      }
      recommendations.push('Review caching strategy and TTL values')
    }

    // Check fragmentation
    if (metrics.memoryFragmentationRatio > 1.5) {
      warnings.push(`High memory fragmentation: ${metrics.memoryFragmentationRatio.toFixed(2)}`)
      score -= 5
      recommendations.push('Consider Redis restart during maintenance window')
    }

    // Check eviction rate
    if (this.lastMetrics) {
      const timeDiff = (metrics.timestamp - this.lastMetrics.timestamp) / 1000 / 60 // minutes
      const evictionRate = (metrics.evictedKeys - this.lastMetrics.evictedKeys) / timeDiff
      
      if (evictionRate > this.alertThresholds.evictionRate) {
        issues.push(`High eviction rate: ${evictionRate.toFixed(1)} keys/min`)
        score -= 15
        recommendations.push('Increase memory limit or review TTL settings')
      }
    }

    // Check connection count
    if (metrics.connectedClients > this.alertThresholds.connectionCount) {
      warnings.push(`High connection count: ${metrics.connectedClients}`)
      score -= 5
      recommendations.push('Monitor connection pooling and cleanup')
    }

    // Check for rejected connections
    if (metrics.rejectedConnections > 0) {
      issues.push(`Rejected connections detected: ${metrics.rejectedConnections}`)
      score -= 10
    }

    const healthy = issues.length === 0
    
    return {
      healthy,
      score: Math.max(0, score),
      issues,
      warnings,
      recommendations,
      metrics
    }
  }

  /**
   * Check for alerts based on thresholds
   */
  async checkAlerts(): Promise<Array<{ type: 'error' | 'warning'; message: string }>> {
    const healthCheck = await this.healthCheck()
    const alerts: Array<{ type: 'error' | 'warning'; message: string }> = []

    // Convert issues to error alerts
    healthCheck.issues.forEach(issue => {
      alerts.push({ type: 'error', message: issue })
    })

    // Convert warnings to warning alerts
    healthCheck.warnings.forEach(warning => {
      alerts.push({ type: 'warning', message: warning })
    })

    // Store alerts in history
    alerts.forEach(alert => {
      this.alertHistory.push({
        type: alert.type,
        message: alert.message,
        timestamp: Date.now()
      })
    })

    // Keep only last 100 alerts
    this.alertHistory = this.alertHistory.slice(-100)

    return alerts
  }

  /**
   * Get alert history
   */
  getAlertHistory(): Array<{ type: string; message: string; timestamp: number }> {
    return [...this.alertHistory]
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds }
  }

  /**
   * Get current alert thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.alertThresholds }
  }

  /**
   * Parse Redis INFO response values
   */
  private parseInfoValue(info: string, key: string, parser?: (value: string) => number): string | number | null {
    const regex = new RegExp(`${key}:(.+)`)
    const match = info.match(regex)
    if (!match) return null
    
    const value = match[1].trim()
    return parser ? parser(value) : value
  }

  /**
   * Test cache performance
   */
  async performanceTest(): Promise<{
    setLatency: number
    getLatency: number
    delLatency: number
    throughputOpsPerSec: number
  }> {
    if (!this.cache.isRedisAvailable()) {
      return {
        setLatency: -1,
        getLatency: -1,
        delLatency: -1,
        throughputOpsPerSec: 0
      }
    }

    const testKey = `perf_test:${Date.now()}`
    const testValue = { test: 'performance_test', timestamp: Date.now() }
    const iterations = 100

    try {
      // Test SET latency
      const setStart = Date.now()
      for (let i = 0; i < iterations; i++) {
        await this.cache.set(`${testKey}:${i}`, testValue, 60)
      }
      const setLatency = (Date.now() - setStart) / iterations

      // Test GET latency
      const getStart = Date.now()
      for (let i = 0; i < iterations; i++) {
        await this.cache.get(`${testKey}:${i}`)
      }
      const getLatency = (Date.now() - getStart) / iterations

      // Test DEL latency
      const delStart = Date.now()
      for (let i = 0; i < iterations; i++) {
        await this.cache.delete(`${testKey}:${i}`)
      }
      const delLatency = (Date.now() - delStart) / iterations

      // Calculate throughput
      const totalTime = (Date.now() - setStart) / 1000
      const throughputOpsPerSec = (iterations * 3) / totalTime

      return {
        setLatency,
        getLatency,
        delLatency,
        throughputOpsPerSec
      }

    } catch (error) {
      console.error('Performance test failed:', error)
      return {
        setLatency: -1,
        getLatency: -1,
        delLatency: -1,
        throughputOpsPerSec: 0
      }
    }
  }
}

// ================================
// MONITORING API ENDPOINTS DATA
// ================================

export interface MonitoringEndpoint {
  path: string
  method: string
  description: string
}

export const MONITORING_ENDPOINTS: MonitoringEndpoint[] = [
  {
    path: '/api/cache/health',
    method: 'GET',
    description: 'Get cache health status and metrics'
  },
  {
    path: '/api/cache/metrics',
    method: 'GET', 
    description: 'Get detailed cache performance metrics'
  },
  {
    path: '/api/cache/alerts',
    method: 'GET',
    description: 'Get current alerts and warnings'
  },
  {
    path: '/api/cache/performance',
    method: 'POST',
    description: 'Run performance test on cache'
  },
  {
    path: '/api/cache/stats',
    method: 'GET',
    description: 'Get cache statistics and usage info'
  }
]

// ================================
// SINGLETON INSTANCE
// ================================

export const cacheMonitorService = new CacheMonitorService()

export default cacheMonitorService