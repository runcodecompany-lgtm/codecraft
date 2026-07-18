// app/api/health/route.ts
// Simple health check endpoint for monitoring services (e.g., UptimeRobot, K8s, Docker)

import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic' // Always fresh for health checks

export async function GET() {
    const start = Date.now()
    const checks: Record<string, 'ok' | 'error'> = {}
    let status = 200

    // 1. Check database connectivity
    try {
        await prisma.$queryRaw`SELECT 1`
        checks['database'] = 'ok'
    } catch {
        checks['database'] = 'error'
        status = 503
    }

    // 2. Check memory usage
    const memory = process.memoryUsage()
    const memoryMB = Math.round(memory.heapUsed / 1024 / 1024)
    const memoryOk = memoryMB < 512 // Alert if heap > 512MB
    checks['memory'] = memoryOk ? 'ok' : 'error'
    if (!memoryOk) status = 503

    const duration = Date.now() - start

    return Response.json(
        {
            status: status === 200 ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            checks,
            metrics: {
                responseTimeMs: duration,
                memoryUsageMB: memoryMB,
            },
        },
        {
            status,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        }
    )
}