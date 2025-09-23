import { NextResponse } from 'next/server'
import { cacheMonitorService } from '@/lib/cache/cache-monitor.service'

export async function POST() {
  try {
    const startTime = Date.now()
    
    const performanceResults = await cacheMonitorService.performanceTest()
    
    const totalTestTime = Date.now() - startTime
    
    // Performance evaluation
    const getPerformanceGrade = (latency: number): string => {
      if (latency < 1) return 'Excellent'
      if (latency < 5) return 'Good'
      if (latency < 10) return 'Fair'
      if (latency < 50) return 'Poor'
      return 'Critical'
    }

    const getThroughputGrade = (ops: number): string => {
      if (ops > 10000) return 'Excellent'
      if (ops > 5000) return 'Good'
      if (ops > 1000) return 'Fair'
      if (ops > 100) return 'Poor'
      return 'Critical'
    }

    return NextResponse.json({
      testResults: {
        setLatencyMs: performanceResults.setLatency.toFixed(2),
        getLatencyMs: performanceResults.getLatency.toFixed(2),
        delLatencyMs: performanceResults.delLatency.toFixed(2),
        throughputOpsPerSec: Math.round(performanceResults.throughputOpsPerSec),
        totalTestTimeMs: totalTestTime
      },
      performance: {
        setPerformance: getPerformanceGrade(performanceResults.setLatency),
        getPerformance: getPerformanceGrade(performanceResults.getLatency),
        delPerformance: getPerformanceGrade(performanceResults.delLatency),
        throughputGrade: getThroughputGrade(performanceResults.throughputOpsPerSec)
      },
      benchmarks: {
        excellent: { latency: '< 1ms', throughput: '> 10k ops/sec' },
        good: { latency: '< 5ms', throughput: '> 5k ops/sec' },
        fair: { latency: '< 10ms', throughput: '> 1k ops/sec' },
        poor: { latency: '< 50ms', throughput: '> 100 ops/sec' }
      },
      recommendations: getPerformanceRecommendations(performanceResults),
      timestamp: Date.now(),
      testConfig: {
        iterations: 100,
        testPattern: 'SET -> GET -> DEL',
        dataSize: 'Small JSON object'
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Test-Duration': totalTestTime.toString(),
        'X-Throughput': Math.round(performanceResults.throughputOpsPerSec).toString()
      }
    })
  } catch (error) {
    console.error('Performance test error:', error)
    return NextResponse.json({
      error: 'Performance test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getPerformanceRecommendations(results: {
  setLatency: number
  getLatency: number
  delLatency: number
  throughputOpsPerSec: number
}): string[] {
  const recommendations: string[] = []

  if (results.setLatency > 10) {
    recommendations.push('SET operations are slow - check network latency and Redis memory')
  }

  if (results.getLatency > 5) {
    recommendations.push('GET operations are slow - verify Redis memory and CPU usage')
  }

  if (results.delLatency > 10) {
    recommendations.push('DEL operations are slow - check for memory fragmentation')
  }

  if (results.throughputOpsPerSec < 1000) {
    recommendations.push('Low throughput detected - consider Redis clustering or optimization')
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! No immediate optimizations needed.')
  }

  return recommendations
}